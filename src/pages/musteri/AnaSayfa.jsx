import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { VARSAYILAN_KATEGORILER, firmaAcikMi, formatPara } from "../../utils/helpers";
import SepetBar from "../../components/SepetBar";
import BottomNav from "../../components/BottomNav";

export default function AnaSayfa({ sepetAdet, sepetToplam, ...props }) {
  const navigate = useNavigate();
  const [firmalar, setFirmalar] = useState([]);
  const [kategoriler, setKategoriler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliKategori, setSeciliKategori] = useState(null);

  useEffect(() => {
    firmalariGetir();
    kategorileriGetir();
  }, []);

  const firmalariGetir = async () => {
    try {
      const q = query(collection(db, "firmalar"), where("durum", "==", "aktif"));
      const snap = await getDocs(q);
      setFirmalar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Firmalar yüklenemedi:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  const kategorileriGetir = async () => {
    try {
      const adminDoc = await getDoc(doc(db, "sistem", "admin"));
      if (adminDoc.exists() && adminDoc.data().kategoriler?.length > 0) {
        setKategoriler(adminDoc.data().kategoriler);
      } else {
        setKategoriler(VARSAYILAN_KATEGORILER);
      }
    } catch {
      setKategoriler(VARSAYILAN_KATEGORILER);
    }
  };

  const filtreliFirmalar = seciliKategori
    ? firmalar.filter((f) => f.kategoriler?.includes(seciliKategori))
    : firmalar;

  const sirali = [...filtreliFirmalar].sort((a, b) => {
    const aAcik = firmaAcikMi(a.calismaSaatleri);
    const bAcik = firmaAcikMi(b.calismaSaatleri);
    if (aAcik && !bAcik) return -1;
    if (!aAcik && bAcik) return 1;
    return 0;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "center", background: "var(--renk-beyaz)", borderBottom: "1.5px solid var(--renk-bal-acik)", position: "sticky", top: 0, zIndex: 100 }}>
        <header style={{ width: "100%", maxWidth: "var(--max-genislik)", padding: "0 16px", height: "var(--nav-yukseklik)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="header-logo">
            <span>G</span>ASTRO27
          </div>
          <div style={{ fontSize: "0.625rem", color: "var(--renk-bakir)", fontWeight: 500 }}>
            Gaziantep'in Lezzeti
          </div>
        </header>
      </div>

      {/* Hero Chip Bar — centered */}
      <div style={{ display: "flex", justifyContent: "center", background: "linear-gradient(135deg, var(--renk-koyu-1), var(--renk-koyu-2), var(--renk-koyu-3))", borderTop: "2px solid var(--renk-bal)", borderBottom: "2px solid var(--renk-bal)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -10, top: -10, width: 120, height: 120, background: "radial-gradient(circle, rgba(253,224,71,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ width: "100%", maxWidth: "var(--max-genislik)", padding: "14px 16px" }}>
          <div className="chip-wrap" style={{ position: "relative", zIndex: 2 }}>
            <button
              className={`chip chip-hero ${!seciliKategori ? "aktif" : ""}`}
              onClick={() => setSeciliKategori(null)}
            >
              Tümü
            </button>
            {kategoriler.map((k) => (
              <button
                key={k}
                className={`chip chip-hero ${seciliKategori === k ? "aktif" : ""}`}
                onClick={() => setSeciliKategori(seciliKategori === k ? null : k)}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sayfa">
        {/* Arama */}
        <div
          onClick={() => navigate("/ara")}
          style={{
            background: "var(--renk-beyaz)",
            borderRadius: "var(--radius-md)",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            border: "2px solid var(--renk-bal-acik)",
            cursor: "pointer",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--renk-bal)",
              flexShrink: 0,
            }}
          />
          <span style={{ color: "var(--renk-gri-400)", fontSize: "0.8125rem" }}>
            Yemek veya restoran ara...
          </span>
        </div>

        {/* Bölüm Başlığı */}
        <div className="bolum-baslik">
          {seciliKategori || "Restoranlar"}
        </div>

        {/* Firma Listesi */}
        {yukleniyor ? (
          <div className="yukleniyor">
            <div className="spinner" />
          </div>
        ) : sirali.length === 0 ? (
          <div className="bos-durum">
            <div className="bos-durum-ikon">🍽️</div>
            <div className="bos-durum-mesaj">
              {seciliKategori
                ? "Bu kategoride restoran bulunamadı"
                : "Henüz restoran eklenmemiş"}
            </div>
          </div>
        ) : (
          sirali.map((firma) => {
            const acik = firmaAcikMi(firma.calismaSaatleri);
            return (
              <div
                key={firma.id}
                className={`kart ${!acik ? "kart-kapali" : ""}`}
                onClick={() => navigate(`/firma/${firma.id}`)}
                style={{ display: "flex", gap: 12, cursor: "pointer", position: "relative" }}
              >
                {/* Logo */}
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "linear-gradient(135deg, #fffbeb, #fef2f2)",
                    border: "1px solid var(--renk-bakir-acik)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {firma.logo ? (
                    <img
                      src={firma.logo}
                      alt={firma.ad}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      loading="lazy"
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: "1.5rem",
                        color: "var(--renk-bakir)",
                        fontFamily: "var(--font-baslik)",
                        fontWeight: 800,
                      }}
                    >
                      {firma.ad?.[0] || "?"}
                    </span>
                  )}
                </div>

                {/* Bilgi */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.9375rem",
                        color: "var(--renk-gri-900)",
                      }}
                      className="truncate"
                    >
                      {firma.ad}
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: acik ? "var(--renk-bakir-acik)" : "var(--renk-tehlike-acik)",
                        color: acik ? "var(--renk-bakir)" : "#991b1b",
                      }}
                    >
                      {acik ? "Açık" : "Kapalı"}
                    </span>
                  </div>
                  <div
                    className="text-xs text-muted"
                    style={{ marginTop: 4, display: "flex", gap: 10 }}
                  >
                    {firma.teslimatSuresi && <span>🕐 {firma.teslimatSuresi}</span>}
                    {firma.minSiparis > 0 && <span>Min. {formatPara(firma.minSiparis)}</span>}
                  </div>
                  {firma.kategoriler && (
                    <div
                      className="text-xs truncate"
                      style={{ marginTop: 3, color: "var(--renk-gri-500)" }}
                    >
                      {firma.kategoriler.slice(0, 3).join(" · ")}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <SepetBar sepetAdet={sepetAdet} sepetToplam={sepetToplam} />
      <BottomNav sepetAdet={sepetAdet} />
    </div>
  );
}
