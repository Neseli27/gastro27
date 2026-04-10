import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { VARSAYILAN_KATEGORILER, firmaAcikMi } from "../../utils/helpers";
import SepetBar from "../../components/SepetBar";
import BottomNav from "../../components/BottomNav";

export default function AnaSayfa({ sepetAdet, sepetToplam, ...props }) {
  const navigate = useNavigate();
  const [firmalar, setFirmalar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliKategori, setSeciliKategori] = useState(null);

  useEffect(() => {
    firmalariGetir();
  }, []);

  const firmalariGetir = async () => {
    try {
      const q = query(
        collection(db, "firmalar"),
        where("durum", "==", "aktif")
      );
      const snap = await getDocs(q);
      const liste = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setFirmalar(liste);
    } catch (err) {
      console.error("Firmalar yüklenemedi:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  // Kategoriye göre filtrele
  const filtreliFirmalar = seciliKategori
    ? firmalar.filter((f) => f.kategoriler?.includes(seciliKategori))
    : firmalar;

  // Açık olanları üste
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
      <header className="header">
        <div className="header-logo">
          GASTRO<span>27</span>
        </div>
        <div className="text-xs" style={{ opacity: 0.85 }}>
          Gaziantep'in Lezzeti Kapında
        </div>
      </header>

      <div className="sayfa">
        {/* Arama */}
        <div
          onClick={() => navigate("/ara")}
          style={{
            background: "var(--renk-beyaz)",
            borderRadius: "var(--radius-lg)",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "var(--golge-sm)",
            cursor: "pointer",
            marginBottom: 16,
            border: "2px solid var(--renk-gri-100)",
          }}
        >
          <span style={{ fontSize: "1.125rem", color: "var(--renk-gri-400)" }}>
            🔍
          </span>
          <span className="text-muted">Yemek veya restoran ara...</span>
        </div>

        {/* Kategoriler */}
        <div className="chip-wrap" style={{ marginBottom: 20 }}>
          <button
            className={`chip ${!seciliKategori ? "aktif" : ""}`}
            onClick={() => setSeciliKategori(null)}
          >
            Tümü
          </button>
          {VARSAYILAN_KATEGORILER.map((k) => (
            <button
              key={k}
              className={`chip ${seciliKategori === k ? "aktif" : ""}`}
              onClick={() =>
                setSeciliKategori(seciliKategori === k ? null : k)
              }
            >
              {k}
            </button>
          ))}
        </div>

        {/* Firma Listesi */}
        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: 800,
            marginBottom: 12,
            color: "var(--renk-gri-800)",
          }}
        >
          {seciliKategori ? seciliKategori : "Restoranlar"}
        </h2>

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
                className="kart"
                onClick={() => navigate(`/firma/${firma.id}`)}
                style={{
                  display: "flex",
                  gap: 12,
                  cursor: "pointer",
                  opacity: acik ? 1 : 0.55,
                }}
              >
                {/* Logo */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "var(--renk-gri-100)",
                  }}
                >
                  {firma.logo ? (
                    <img
                      src={firma.logo}
                      alt={firma.ad}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        color: "var(--renk-gri-300)",
                        fontWeight: 800,
                      }}
                    >
                      {firma.ad?.[0] || "?"}
                    </div>
                  )}
                </div>

                {/* Bilgi */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-8">
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "var(--renk-gri-900)",
                      }}
                      className="truncate"
                    >
                      {firma.ad}
                    </span>
                    {!acik && (
                      <span className="badge badge-tehlike">Kapalı</span>
                    )}
                  </div>
                  <div
                    className="text-xs text-muted"
                    style={{ marginTop: 4, display: "flex", gap: 12 }}
                  >
                    {firma.teslimatSuresi && (
                      <span>🕐 {firma.teslimatSuresi}</span>
                    )}
                    {firma.minSiparis > 0 && (
                      <span>Min. {firma.minSiparis} ₺</span>
                    )}
                  </div>
                  {firma.kategoriler && (
                    <div
                      className="text-xs text-muted truncate"
                      style={{ marginTop: 2 }}
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
