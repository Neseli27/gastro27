import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { formatPara, formatTarih, SIPARIS_DURUMLARI } from "../../utils/helpers";

const ADIMLAR = [
  "beklemede",
  "onaylandi",
  "hazirlaniyor",
  "kurye_bekliyor",
  "yolda",
  "teslim_edildi",
  "tamamlandi",
];

export default function SiparisTakip() {
  const { siparisId } = useParams();
  const navigate = useNavigate();
  const [siparis, setSiparis] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "siparisler", siparisId),
      (snap) => {
        if (snap.exists()) {
          setSiparis({ id: snap.id, ...snap.data() });
        }
        setYukleniyor(false);
      },
      (err) => {
        console.error("Sipariş takip hatası:", err);
        setYukleniyor(false);
      }
    );
    return unsub;
  }, [siparisId]);

  // 10dk sonra otomatik tamamlanma (client-side hatırlatma)
  useEffect(() => {
    if (siparis?.durum !== "teslim_edildi") return;

    const timer = setTimeout(async () => {
      try {
        await updateDoc(doc(db, "siparisler", siparisId), {
          durum: "tamamlandi",
          musteriTeslimOnay: true,
          musteriTeslimZaman: serverTimestamp(),
        });
      } catch {}
    }, 10 * 60 * 1000); // 10 dakika

    return () => clearTimeout(timer);
  }, [siparis?.durum, siparisId]);

  const teslimAldim = async () => {
    try {
      await updateDoc(doc(db, "siparisler", siparisId), {
        durum: "tamamlandi",
        musteriTeslimOnay: true,
        musteriTeslimZaman: serverTimestamp(),
      });
    } catch (err) {
      console.error("Teslim onay hatası:", err);
    }
  };

  const siparisiIptalEt = async () => {
    if (!window.confirm("Siparişi iptal etmek istediğinize emin misiniz?")) return;
    try {
      await updateDoc(doc(db, "siparisler", siparisId), {
        durum: "iptal_musteri",
      });
    } catch (err) {
      console.error("İptal hatası:", err);
    }
  };

  if (yukleniyor) {
    return (
      <div className="yukleniyor" style={{ minHeight: "100dvh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!siparis) {
    return (
      <div className="sayfa text-center" style={{ paddingTop: 64 }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🤷</div>
        <h2>Sipariş bulunamadı</h2>
        <button className="btn btn-birincil mt-16" onClick={() => navigate("/")}>
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  const mevcutAdim = ADIMLAR.indexOf(siparis.durum);
  const iptalMi =
    siparis.durum === "iptal_isletme" ||
    siparis.durum === "iptal_musteri" ||
    siparis.durum === "reddedildi";

  return (
    <div>
      <header className="header">
        <button
          onClick={() => navigate("/")}
          style={{ color: "#fff", fontSize: "1.25rem", padding: "4px 8px" }}
        >
          ←
        </button>
        <div className="font-bold" style={{ marginLeft: 8 }}>
          Sipariş Takip
        </div>
      </header>

      <div className="sayfa">
        {/* Sipariş no */}
        <div className="text-center mb-16">
          <div className="text-xs text-muted">Sipariş No</div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              letterSpacing: 2,
              color: "var(--renk-birincil)",
            }}
          >
            #{siparis.siparisNo || siparisId.slice(0, 6).toUpperCase()}
          </div>
          <div className="text-xs text-muted">{siparis.firmaAdi}</div>
        </div>

        {/* İptal durumu */}
        {iptalMi ? (
          <div
            className="kart"
            style={{
              background: "var(--renk-tehlike-acik)",
              textAlign: "center",
              padding: 24,
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>❌</div>
            <div className="font-bold" style={{ color: "var(--renk-tehlike)" }}>
              {SIPARIS_DURUMLARI[siparis.durum]?.etiket || "İptal"}
            </div>
          </div>
        ) : (
          <>
            {/* Durum adımları */}
            <div className="kart" style={{ padding: 20, marginBottom: 16 }}>
              {ADIMLAR.map((adim, i) => {
                const info = SIPARIS_DURUMLARI[adim];
                const gecmis = i <= mevcutAdim;
                const aktifAdim = i === mevcutAdim;

                return (
                  <div
                    key={adim}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      marginBottom: i < ADIMLAR.length - 1 ? 0 : 0,
                    }}
                  >
                    {/* Sol çizgi ve nokta */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        width: 24,
                      }}
                    >
                      <div
                        style={{
                          width: aktifAdim ? 28 : 20,
                          height: aktifAdim ? 28 : 20,
                          borderRadius: "50%",
                          background: gecmis ? info.renk : "var(--renk-gri-200)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: aktifAdim ? "0.875rem" : "0.6875rem",
                          transition: "all 0.3s ease",
                          boxShadow: aktifAdim
                            ? `0 0 0 4px ${info.renk}30`
                            : "none",
                        }}
                      >
                        {gecmis ? info.ikon : ""}
                      </div>
                      {i < ADIMLAR.length - 1 && (
                        <div
                          style={{
                            width: 2,
                            height: 24,
                            background: gecmis
                              ? info.renk
                              : "var(--renk-gri-200)",
                          }}
                        />
                      )}
                    </div>

                    {/* Metin */}
                    <div style={{ paddingBottom: 16, paddingTop: 1 }}>
                      <div
                        style={{
                          fontWeight: aktifAdim ? 800 : 600,
                          fontSize: aktifAdim ? "0.9375rem" : "0.8125rem",
                          color: gecmis
                            ? "var(--renk-gri-800)"
                            : "var(--renk-gri-400)",
                        }}
                      >
                        {info.etiket}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Teslim Aldım butonu */}
            {siparis.durum === "teslim_edildi" && (
              <button
                onClick={teslimAldim}
                className="btn btn-basari btn-tam btn-buyuk mb-16"
              >
                ✅ Teslim Aldım
              </button>
            )}

            {/* Müşteri iptal butonu (sadece beklemede veya onaylandı durumunda) */}
            {(siparis.durum === "beklemede" || siparis.durum === "onaylandi") && (
              <button
                onClick={siparisiIptalEt}
                className="btn btn-tehlike btn-tam mb-16"
                style={{ opacity: 0.8 }}
              >
                Siparişi İptal Et
              </button>
            )}

            {/* Tamamlandı mesajı */}
            {siparis.durum === "tamamlandi" && (
              <div
                className="kart text-center"
                style={{
                  background: "var(--renk-basari-acik)",
                  padding: 24,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🎉</div>
                <div className="font-bold" style={{ color: "var(--renk-basari)" }}>
                  Afiyet olsun!
                </div>
              </div>
            )}
          </>
        )}

        {/* Sipariş detayı */}
        <div className="kart">
          <h3 className="kart-baslik">Sipariş Detayı</h3>
          {siparis.urunler?.map((u, i) => (
            <div
              key={i}
              className="flex justify-between text-sm"
              style={{ marginBottom: 4 }}
            >
              <span>
                {u.adet}x {u.ad}
              </span>
              <span className="font-bold">
                {formatPara(u.fiyat * u.adet)}
              </span>
            </div>
          ))}
          <div
            className="flex justify-between font-bold"
            style={{
              borderTop: "2px solid var(--renk-gri-100)",
              paddingTop: 8,
              marginTop: 8,
              fontSize: "1.0625rem",
            }}
          >
            <span>Toplam</span>
            <span style={{ color: "var(--renk-birincil)" }}>
              {formatPara(siparis.toplam)}
            </span>
          </div>
        </div>

        {/* Yeni sipariş */}
        <button
          className="btn btn-ikincil btn-tam mt-16"
          onClick={() => navigate("/")}
        >
          Yeni Sipariş Ver
        </button>
      </div>
    </div>
  );
}
