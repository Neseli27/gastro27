import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { firmaAcikMi, formatPara } from "../../utils/helpers";
import UrunKart from "../../components/UrunKart";
import SepetBar from "../../components/SepetBar";

export default function FirmaDetay({
  sepetAdet,
  sepetToplam,
  sepeteEkle,
  ...props
}) {
  const { firmaId } = useParams();
  const navigate = useNavigate();
  const [firma, setFirma] = useState(null);
  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliKategori, setSeciliKategori] = useState(null);

  useEffect(() => {
    firmaGetir();
  }, [firmaId]);

  const firmaGetir = async () => {
    try {
      const firmaDoc = await getDoc(doc(db, "firmalar", firmaId));
      if (!firmaDoc.exists()) {
        navigate("/");
        return;
      }
      setFirma({ id: firmaDoc.id, ...firmaDoc.data() });

      // Ürünleri çek
      const urunSnap = await getDocs(
        query(
          collection(db, "firmalar", firmaId, "urunler"),
          where("aktif", "==", true)
        )
      );
      const liste = urunSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.sira || 0) - (b.sira || 0));
      setUrunler(liste);
    } catch (err) {
      console.error("Firma yüklenemedi:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  if (yukleniyor) {
    return (
      <div className="yukleniyor" style={{ minHeight: "100dvh" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!firma) return null;

  const acik = firmaAcikMi(firma.calismaSaatleri);

  // Kategorilere göre grupla
  const kategoriler = [...new Set(urunler.map((u) => u.kategori || "Diğer"))];

  const filtreliUrunler = seciliKategori
    ? urunler.filter((u) => (u.kategori || "Diğer") === seciliKategori)
    : urunler;

  // Kategoriye göre grupla
  const gruplu = {};
  filtreliUrunler.forEach((u) => {
    const kat = u.kategori || "Diğer";
    if (!gruplu[kat]) gruplu[kat] = [];
    gruplu[kat].push(u);
  });

  return (
    <div>
      {/* Header with back button */}
      <header className="header">
        <button
          onClick={() => navigate(-1)}
          style={{ color: "#fff", fontSize: "1.25rem", padding: "4px 8px" }}
        >
          ←
        </button>
        <div style={{ flex: 1, marginLeft: 8 }}>
          <div className="font-bold truncate">{firma.ad}</div>
        </div>
        {!acik && <span className="badge badge-tehlike">Kapalı</span>}
      </header>

      <div className="sayfa">
        {/* Firma bilgi kartı */}
        <div className="kart" style={{ marginBottom: 16 }}>
          <div className="flex gap-12 items-center">
            {firma.logo && (
              <img
                src={firma.logo}
                alt={firma.ad}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "var(--radius-sm)",
                  objectFit: "cover",
                }}
              />
            )}
            <div>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 800 }}>
                {firma.ad}
              </h1>
              <div
                className="text-sm text-muted flex gap-12"
                style={{ marginTop: 4 }}
              >
                {firma.teslimatSuresi && <span>🕐 {firma.teslimatSuresi}</span>}
                {firma.minSiparis > 0 && (
                  <span>Min. {formatPara(firma.minSiparis)}</span>
                )}
              </div>
            </div>
          </div>

          {firma.teslimatBolgeleri?.length > 0 && (
            <div className="text-xs text-muted" style={{ marginTop: 8 }}>
              📍 {firma.teslimatBolgeleri.join(", ")}
            </div>
          )}
        </div>

        {/* Kategori filtreleri */}
        {kategoriler.length > 1 && (
          <div className="chip-wrap" style={{ marginBottom: 16 }}>
            <button
              className={`chip ${!seciliKategori ? "aktif" : ""}`}
              onClick={() => setSeciliKategori(null)}
            >
              Tümü
            </button>
            {kategoriler.map((k) => (
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
        )}

        {/* Ürün listesi - kategoriye göre gruplu */}
        {urunler.length === 0 ? (
          <div className="bos-durum">
            <div className="bos-durum-ikon">📋</div>
            <div className="bos-durum-mesaj">Henüz menüye ürün eklenmemiş</div>
          </div>
        ) : (
          Object.entries(gruplu).map(([kat, katUrunler]) => (
            <div key={kat} style={{ marginBottom: 20 }}>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--renk-gri-700)",
                  marginBottom: 8,
                  paddingBottom: 4,
                  borderBottom: "2px solid var(--renk-gri-100)",
                }}
              >
                {kat}
              </h3>
              {katUrunler.map((urun) => (
                <UrunKart
                  key={urun.id}
                  urun={urun}
                  onEkle={(u) => sepeteEkle(u, firmaId, firma.ad)}
                />
              ))}
            </div>
          ))
        )}
      </div>

      <SepetBar sepetAdet={sepetAdet} sepetToplam={sepetToplam} />
    </div>
  );
}
