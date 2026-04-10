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
      <div style={{ display: "flex", justifyContent: "center", background: "var(--renk-beyaz)", borderBottom: "1.5px solid var(--renk-bal-acik)", position: "sticky", top: 0, zIndex: 100 }}>
        <header style={{ width: "100%", maxWidth: "var(--max-genislik)", padding: "0 16px", height: "var(--nav-yukseklik)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="header-logo" style={{ fontSize: "1rem" }}>
              {oturum.firmaAdi}
            </div>
            <div className="text-xs text-muted">
              İşletme Paneli
            </div>
          </div>
          <button
            onClick={cikisYap}
            className="text-xs"
            style={{ color: "var(--renk-gri-400)" }}
          >
            Çıkış
          </button>
        </header>
      </div>

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
                        <div style={{ display: "flex", gap: 8, width: "100%", flexWrap: "wrap" }}>
                          <button
                            className="btn btn-birincil btn-kucuk"
                            style={{ flex: 1 }}
                            onClick={() => durumGuncelle(s.id, "hazirlaniyor")}
                          >
                            👨‍🍳 Hazırlanıyor
                          </button>
                          <button
                            className="btn btn-tehlike btn-kucuk"
                            onClick={() => {
                              if (window.confirm("Siparişi iptal etmek istediğinize emin misiniz?"))
                                durumGuncelle(s.id, "iptal_isletme");
                            }}
                          >
                            İptal
                          </button>
                        </div>
                      )}
                      {s.durum === "hazirlaniyor" && (
                        <div style={{ display: "flex", gap: 8, width: "100%", flexWrap: "wrap" }}>
                          <button
                            className="btn btn-uyari btn-kucuk"
                            style={{ flex: 1 }}
                            onClick={() =>
                              durumGuncelle(s.id, "kurye_bekliyor", {
                                kuryeHavuzZaman: serverTimestamp(),
                              })
                            }
                          >
                            📦 Kuryeye Gönder
                          </button>
                          <button
                            className="btn btn-kucuk"
                            style={{
                              background: "#25D366",
                              color: "#fff",
                            }}
                            onClick={() => {
                              // İlk aktif kuryeyi bul ve WhatsApp gönder
                              const kuryeRef = collection(db, "firmalar", oturum.id, "kuryeler");
                              getDocs(kuryeRef).then((snap) => {
                                const aktifKuryeler = snap.docs
                                  .map((d) => d.data())
                                  .filter((k) => k.aktif);
                                if (aktifKuryeler.length === 0) {
                                  toastGoster("Aktif kurye bulunamadı", "hata");
                                  return;
                                }
                                if (aktifKuryeler.length === 1) {
                                  whatsappGonder(s, aktifKuryeler[0].telefon);
                                } else {
                                  // Birden fazla kurye varsa ilkini seç (basit çözüm)
                                  const secim = aktifKuryeler.map((k, i) => `${i + 1}. ${k.ad}`).join("\n");
                                  const no = prompt(`Kurye seçin:\n${secim}\n\nNumara girin:`);
                                  const idx = parseInt(no) - 1;
                                  if (idx >= 0 && idx < aktifKuryeler.length) {
                                    whatsappGonder(s, aktifKuryeler[idx].telefon);
                                  }
                                }
                              });
                            }}
                          >
                            📱 WhatsApp
                          </button>
                        </div>
                      )}
                      {s.durum === "kurye_bekliyor" && (
                        <div className="flex items-center justify-between" style={{ width: "100%" }}>
                          <div className="text-sm text-muted">
                            ⏳ Kurye bekleniyor...
                          </div>
                          <button
                            className="btn btn-tehlike btn-kucuk"
                            onClick={() => {
                              if (window.confirm("Siparişi iptal etmek istediğinize emin misiniz?"))
                                durumGuncelle(s.id, "iptal_isletme");
                            }}
                          >
                            İptal
                          </button>
                        </div>
                      )}
                      {s.durum === "yolda" && (
                        <div className="text-sm" style={{ color: "var(--renk-bilgi)" }}>
                          🛵 Kurye: {s.kuryeAd || "Yolda"}
                        </div>
                      )}
                      {s.durum === "teslim_edildi" && (
                        <div className="text-sm" style={{ color: "var(--renk-basari)" }}>
                          ✅ Teslim edildi, müşteri onayı bekleniyor
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
