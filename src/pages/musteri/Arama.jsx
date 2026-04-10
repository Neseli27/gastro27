import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { normalizeArama, formatPara } from "../../utils/helpers";
import SepetBar from "../../components/SepetBar";
import BottomNav from "../../components/BottomNav";

export default function Arama({ sepetAdet, sepetToplam, sepeteEkle }) {
  const navigate = useNavigate();
  const [aranan, setAranan] = useState("");
  const [sonuclar, setSonuclar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [tumUrunler, setTumUrunler] = useState([]);
  const inputRef = useRef();
  const yuklendi = useRef(false);

  useEffect(() => {
    if (yuklendi.current) return;
    yuklendi.current = true;
    tumVerileriGetir();
  }, []);

  const tumVerileriGetir = async () => {
    setYukleniyor(true);
    try {
      const firmaSnap = await getDocs(query(collection(db, "firmalar"), where("durum", "==", "aktif")));
      const urunListesi = [];
      for (const firmaDoc of firmaSnap.docs) {
        const firmaData = { id: firmaDoc.id, ...firmaDoc.data() };
        const urunSnap = await getDocs(query(collection(db, "firmalar", firmaDoc.id, "urunler"), where("aktif", "==", true)));
        urunSnap.docs.forEach((uDoc) => {
          urunListesi.push({ id: uDoc.id, firmaId: firmaDoc.id, firmaAdi: firmaData.ad, ...uDoc.data() });
        });
      }
      setTumUrunler(urunListesi);
    } catch (err) {
      console.error("Arama verileri yüklenemedi:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => {
    if (!aranan.trim()) { setSonuclar([]); return; }
    const norm = normalizeArama(aranan);
    const eslesenler = tumUrunler.filter((u) => {
      const adNorm = normalizeArama(u.ad);
      const acikNorm = normalizeArama(u.aciklama || "");
      const firmaNorm = normalizeArama(u.firmaAdi);
      const anahtarlar = (u.aramaAnahtar || []).map((a) => normalizeArama(a)).join(" ");
      return adNorm.includes(norm) || acikNorm.includes(norm) || firmaNorm.includes(norm) || anahtarlar.includes(norm);
    });
    setSonuclar(eslesenler);
  }, [aranan, tumUrunler]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "center", background: "linear-gradient(135deg, var(--renk-koyu-1), var(--renk-koyu-2), var(--renk-koyu-3))", borderBottom: "2px solid var(--renk-bal)" }}>
        <div style={{ width: "100%", maxWidth: "var(--max-genislik)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate(-1)} style={{ color: "var(--renk-bakir-acik)", fontSize: "1.25rem", padding: "4px" }}>←</button>
          <input
            ref={inputRef}
            type="text"
            value={aranan}
            onChange={(e) => setAranan(e.target.value)}
            placeholder="Yemek veya restoran ara..."
            style={{
              flex: 1, padding: "10px 14px", borderRadius: "10px", border: "2px solid var(--renk-bal)",
              fontSize: "0.875rem", background: "rgba(255,255,255,0.1)", color: "#fef3c7", outline: "none",
            }}
          />
        </div>
      </div>

      <div className="sayfa">
        {yukleniyor ? (
          <div className="yukleniyor"><div className="spinner" /></div>
        ) : !aranan.trim() ? (
          <div className="bos-durum">
            <div className="bos-durum-ikon">🔍</div>
            <div className="bos-durum-mesaj">Lahmacun, kebap veya restoran adı yazın</div>
          </div>
        ) : sonuclar.length === 0 ? (
          <div className="bos-durum">
            <div className="bos-durum-ikon">😔</div>
            <div className="bos-durum-mesaj">"{aranan}" için sonuç bulunamadı</div>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted mb-14">{sonuclar.length} sonuç bulundu</div>
            {sonuclar.map((urun) => (
              <div key={`${urun.firmaId}-${urun.id}`} className="kart" style={{ display: "flex", gap: 12, alignItems: "center", padding: 12 }}>
                <div
                  onClick={() => navigate(`/firma/${urun.firmaId}`)}
                  style={{ width: 56, height: 56, borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg, #fffbeb, #fef2f2)", border: "1px solid var(--renk-bakir-acik)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", cursor: "pointer" }}
                >
                  {urun.foto ? <img src={urun.foto} alt={urun.ad} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" /> : "🍽️"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold truncate" style={{ fontSize: "0.9375rem" }}>{urun.ad}</div>
                  <div className="text-xs" style={{ color: "var(--renk-bakir)", marginTop: 2, cursor: "pointer" }} onClick={() => navigate(`/firma/${urun.firmaId}`)}>{urun.firmaAdi}</div>
                  <div style={{ fontWeight: 800, color: "var(--renk-birincil)", marginTop: 4, fontSize: "0.9375rem" }}>{formatPara(urun.fiyat)}</div>
                </div>
                <button
                  onClick={() => sepeteEkle(urun, urun.firmaId, urun.firmaAdi)}
                  style={{ width: 34, height: 34, borderRadius: 10, background: "var(--renk-birincil)", color: "#fff", fontSize: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                >+</button>
              </div>
            ))}
          </>
        )}
      </div>
      <SepetBar sepetAdet={sepetAdet} sepetToplam={sepetToplam} />
      <BottomNav sepetAdet={sepetAdet} />
    </div>
  );
}
