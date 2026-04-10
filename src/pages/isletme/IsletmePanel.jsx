import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { oturumKontrol, oturumSil } from "../../utils/auth";
import UrunYonetimi from "./UrunYonetimi";
import KuryeYonetimi from "./KuryeYonetimi";
import Rapor from "./Rapor";
import Ayarlar from "./Ayarlar";

// Sipariş yönetimi inline
import {
  collection, query, where, orderBy, onSnapshot, doc, updateDoc,
  serverTimestamp, getDocs
} from "firebase/firestore";
import { db } from "../../firebase";
import SiparisKart from "../../components/SiparisKart";
import BildirimModal from "../../components/BildirimModal";

const SEKMELER = [
  { id: "siparisler", etiket: "Siparişler", ikon: "📋" },
  { id: "menu", etiket: "Menü", ikon: "🍽️" },
  { id: "kuryeler", etiket: "Kuryeler", ikon: "🛵" },
  { id: "rapor", etiket: "Rapor", ikon: "📊" },
  { id: "ayar", etiket: "Ayarlar", ikon: "⚙️" },
];

export default function IsletmePanel({ toastGoster }) {
  const navigate = useNavigate();
  const [oturum, setOturum] = useState(null);
  const [sekme, setSekme] = useState("siparisler");
  const [siparisler, setSiparisler] = useState([]);
  const [bildirim, setBildirim] = useState(false);
  const [oncekiSayi, setOncekiSayi] = useState(0);

  useEffect(() => {
    const o = oturumKontrol("isletme");
    if (!o) {
      navigate("/isletme", { replace: true });
      return;
    }
    setOturum(o);
  }, [navigate]);

  // Gerçek zamanlı sipariş dinleme
  useEffect(() => {
    if (!oturum?.id) return;

    const q = query(
      collection(db, "siparisler"),
      where("firmaId", "==", oturum.id),
      orderBy("olusturma", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const liste = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSiparisler(liste);

      // Yeni sipariş bildirimi
      const bekleyenler = liste.filter((s) => s.durum === "beklemede").length;
      if (bekleyenler > oncekiSayi && oncekiSayi > 0) {
        setBildirim(true);
      }
      setOncekiSayi(bekleyenler);
    });

    return unsub;
  }, [oturum?.id]);

  const durumGuncelle = async (siparisId, yeniDurum, ekstra = {}) => {
    try {
      await updateDoc(doc(db, "siparisler", siparisId), {
        durum: yeniDurum,
        ...ekstra,
      });
      toastGoster("Sipariş güncellendi", "basari");
    } catch (err) {
      console.error("Durum güncelleme hatası:", err);
      toastGoster("Güncelleme başarısız", "hata");
    }
  };

  const whatsappGonder = (siparis, kuryeTel) => {
    const mesaj = encodeURIComponent(
      `📦 Yeni Teslimat\n` +
      `Müşteri: ${siparis.musteriAd}\n` +
      `Tel: ${siparis.musteriTel}\n` +
      `Ürünler: ${siparis.urunler.map(u => `${u.adet}x ${u.ad}`).join(', ')}\n` +
      `Toplam: ${siparis.toplam} ₺\n` +
      (siparis.konum
        ? `Konum: https://maps.google.com/?q=${siparis.konum.lat},${siparis.konum.lng}\n`
        : "") +
      (siparis.adresNot ? `Adres Notu: ${siparis.adresNot}\n` : "") +
      (siparis.not ? `Not: ${siparis.not}` : "")
    );
    window.open(`https://wa.me/${kuryeTel}?text=${mesaj}`, "_blank");
  };

  const cikisYap = () => {
    oturumSil();
    navigate("/isletme", { replace: true });
  };

  if (!oturum) return null;

  // Aktif siparişler (iptal/tamamlanmış dışında)
  const aktifSiparisler = siparisler.filter(
    (s) =>
      !["tamamlandi", "iptal_isletme", "iptal_musteri", "reddedildi"].includes(
        s.durum
      )
  );

  return (
    <div>
      <BildirimModal aktif={bildirim} onKapat={() => setBildirim(false)} />

      {/* Header */}
      <header className="header">
        <div>
          <div className="header-logo" style={{ fontSize: "1rem" }}>
            {oturum.firmaAdi}
          </div>
          <div className="text-xs" style={{ opacity: 0.7 }}>
            İşletme Paneli
          </div>
        </div>
        <button
          onClick={cikisYap}
          className="text-xs"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Çıkış
        </button>
      </header>

      {/* Tab Bar */}
      <div style={{ padding: "12px 16px 0", maxWidth: "var(--max-genislik)", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            gap: 2,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {SEKMELER.map((s) => (
            <button
              key={s.id}
              onClick={() => setSekme(s.id)}
              style={{
                flex: 1,
                padding: "10px 4px",
                borderRadius: "var(--radius-sm) var(--radius-sm) 0 0",
                fontSize: "0.6875rem",
                fontWeight: sekme === s.id ? 700 : 400,
                color: sekme === s.id ? "var(--renk-birincil)" : "var(--renk-gri-400)",
                background: sekme === s.id ? "var(--renk-beyaz)" : "transparent",
                borderBottom: sekme === s.id ? "2px solid var(--renk-birincil)" : "2px solid transparent",
                whiteSpace: "nowrap",
                textAlign: "center",
              }}
            >
              <div>{s.ikon}</div>
              {s.etiket}
              {s.id === "siparisler" && aktifSiparisler.length > 0 && (
                <span
                  style={{
                    marginLeft: 4,
                    background: "var(--renk-birincil)",
                    color: "#fff",
                    fontSize: "0.625rem",
                    fontWeight: 800,
                    padding: "1px 6px",
                    borderRadius: "var(--radius-full)",
                  }}
                >
                  {aktifSiparisler.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sekme İçeriği */}
      <div className="sayfa" style={{ paddingTop: 8 }}>
        {sekme === "siparisler" && (
          <>
            {aktifSiparisler.length === 0 ? (
              <div className="bos-durum">
                <div className="bos-durum-ikon">📋</div>
                <div className="bos-durum-mesaj">Aktif sipariş yok</div>
              </div>
            ) : (
              aktifSiparisler.map((s) => (
                <SiparisKart
                  key={s.id}
                  siparis={s}
                  gosterKurye
                  butonlar={
                    <>
                      {s.durum === "beklemede" && (
                        <>
                          <button
                            className="btn btn-basari btn-kucuk"
                            style={{ flex: 1 }}
                            onClick={() => durumGuncelle(s.id, "onaylandi")}
                          >
                            ✅ Onayla
                          </button>
                          <button
                            className="btn btn-tehlike btn-kucuk"
                            onClick={() => durumGuncelle(s.id, "reddedildi")}
                          >
                            Reddet
                          </button>
                        </>
                      )}
                      {s.durum === "onaylandi" && (
                        <button
                          className="btn btn-birincil btn-kucuk btn-tam"
                          onClick={() => durumGuncelle(s.id, "hazirlaniyor")}
                        >
                          👨‍🍳 Hazırlanıyor
                        </button>
                      )}
                      {s.durum === "hazirlaniyor" && (
                        <button
                          className="btn btn-uyari btn-kucuk btn-tam"
                          onClick={() =>
                            durumGuncelle(s.id, "kurye_bekliyor", {
                              kuryeHavuzZaman: serverTimestamp(),
                            })
                          }
                        >
                          📦 Kuryeye Gönder
                        </button>
                      )}
                      {s.durum === "kurye_bekliyor" && (
                        <div className="text-sm text-muted" style={{ flex: 1 }}>
                          ⏳ Kurye bekleniyor...
                        </div>
                      )}
                      {s.durum === "yolda" && (
                        <div className="text-sm" style={{ color: "var(--renk-bilgi)" }}>
                          🛵 Kurye yolda
                        </div>
                      )}
                    </>
                  }
                />
              ))
            )}
          </>
        )}

        {sekme === "menu" && (
          <UrunYonetimi firmaId={oturum.id} toastGoster={toastGoster} />
        )}

        {sekme === "kuryeler" && (
          <KuryeYonetimi
            firmaId={oturum.id}
            toastGoster={toastGoster}
            siparisler={siparisler}
            onWhatsapp={whatsappGonder}
          />
        )}

        {sekme === "rapor" && (
          <Rapor firmaId={oturum.id} siparisler={siparisler} />
        )}

        {sekme === "ayar" && (
          <Ayarlar firmaId={oturum.id} toastGoster={toastGoster} />
        )}
      </div>
    </div>
  );
}
