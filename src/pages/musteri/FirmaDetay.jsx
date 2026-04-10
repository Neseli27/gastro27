import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { firmaAcikMi, formatPara } from "../../utils/helpers";
import UrunKart from "../../components/UrunKart";
import SepetBar from "../../components/SepetBar";

export default function FirmaDetay({ sepetAdet, sepetToplam, sepeteEkle }) {
  const { firmaId } = useParams();
  const navigate = useNavigate();
  const [firma, setFirma] = useState(null);
  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliKategori, setSeciliKategori] = useState(null);

  useEffect(() => { firmaGetir(); }, [firmaId]);

  const firmaGetir = async () => {
    try {
      const firmaDoc = await getDoc(doc(db, "firmalar", firmaId));
      if (!firmaDoc.exists()) { navigate("/"); return; }
      setFirma({ id: firmaDoc.id, ...firmaDoc.data() });
      const urunSnap = await getDocs(query(collection(db, "firmalar", firmaId, "urunler"), where("aktif", "==", true)));
      setUrunler(urunSnap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (a.sira || 0) - (b.sira || 0)));
    } catch (err) { console.error("Firma yüklenemedi:", err); } finally { setYukleniyor(false); }
  };

  if (yukleniyor) return <div className="yukleniyor" style={{ minHeight: "100dvh" }}><div className="spinner" /></div>;
  if (!firma) return null;

  const acik = firmaAcikMi(firma.calismaSaatleri);
  const kategoriler = [...new Set(urunler.map((u) => u.kategori || "Diğer"))];
  const filtreliUrunler = seciliKategori ? urunler.filter((u) => (u.kategori || "Diğer") === seciliKategori) : urunler;
  const gruplu = {};
  filtreliUrunler.forEach((u) => { const kat = u.kategori || "Diğer"; if (!gruplu[kat]) gruplu[kat] = []; gruplu[kat].push(u); });

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "center", background: "var(--renk-beyaz)", borderBottom: "1.5px solid var(--renk-bal-acik)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ width: "100%", maxWidth: "var(--max-genislik)", padding: "0 16px", height: "var(--nav-yukseklik)", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ color: "var(--renk-bakir)", fontSize: "1.25rem", padding: "4px" }}>←</button>
          <div style={{ flex: 1 }}>
            <div className="font-bold truncate" style={{ color: "var(--renk-gri-900)" }}>{firma.ad}</div>
          </div>
          {!acik && <span className="badge badge-tehlike">Kapalı</span>}
        </div>
      </div>

      <div className="sayfa">
        {/* Firma bilgi kartı */}
        <div className="kart" style={{ marginBottom: 14 }}>
          <div className="flex gap-12 items-center">
            {firma.logo && (
              <img src={firma.logo} alt={firma.ad} style={{ width: 52, height: 52, borderRadius: "var(--radius-md)", objectFit: "cover", border: "1px solid var(--renk-bakir-acik)" }} />
            )}
            <div>
              <h1 style={{ fontFamily: "var(--font-baslik)", fontSize: "1.125rem", fontWeight: 800, color: "var(--renk-gri-900)" }}>{firma.ad}</h1>
              <div className="text-xs text-muted flex gap-12" style={{ marginTop: 4 }}>
                {firma.teslimatSuresi && <span>🕐 {firma.teslimatSuresi}</span>}
                {firma.minSiparis > 0 && <span>Min. {formatPara(firma.minSiparis)}</span>}
              </div>
            </div>
          </div>
          {firma.teslimatBolgeleri?.length > 0 && (
            <div className="text-xs text-muted" style={{ marginTop: 8 }}>📍 {firma.teslimatBolgeleri.join(", ")}</div>
          )}
        </div>

        {/* Kategori filtreleri */}
        {kategoriler.length > 1 && (
          <div className="chip-wrap" style={{ marginBottom: 14 }}>
            <button className={`chip chip-acik ${!seciliKategori ? "aktif" : ""}`} onClick={() => setSeciliKategori(null)}>Tümü</button>
            {kategoriler.map((k) => (
              <button key={k} className={`chip chip-acik ${seciliKategori === k ? "aktif" : ""}`} onClick={() => setSeciliKategori(seciliKategori === k ? null : k)}>{k}</button>
            ))}
          </div>
        )}

        {/* Ürün listesi */}
        {urunler.length === 0 ? (
          <div className="bos-durum">
            <div className="bos-durum-ikon">📋</div>
            <div className="bos-durum-mesaj">Henüz menüye ürün eklenmemiş</div>
          </div>
        ) : (
          Object.entries(gruplu).map(([kat, katUrunler]) => (
            <div key={kat} style={{ marginBottom: 18 }}>
              <div className="bolum-baslik">{kat}</div>
              {katUrunler.map((urun) => (
                <UrunKart key={urun.id} urun={urun} onEkle={(u) => sepeteEkle(u, firmaId, firma.ad)} />
              ))}
            </div>
          ))
        )}
      </div>
      <SepetBar sepetAdet={sepetAdet} sepetToplam={sepetToplam} />
    </div>
  );
}
