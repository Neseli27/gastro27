import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { normalizeArama, formatPara } from "../../utils/helpers";
import SepetBar from "../../components/SepetBar";
import BottomNav from "../../components/BottomNav";

export default function Arama({ sepetAdet, sepetToplam, sepeteEkle, sepetFirmaId }) {
  const navigate = useNavigate();
  const [aranan, setAranan] = useState("");
  const [sonuclar, setSonuclar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [tumUrunler, setTumUrunler] = useState([]);
  const [firmalar, setFirmalar] = useState({});
  const inputRef = useRef();
  const yuklendi = useRef(false);

  // İlk yüklemede tüm aktif firmaların ürünlerini çek
  useEffect(() => {
    if (yuklendi.current) return;
    yuklendi.current = true;
    tumVerileriGetir();
  }, []);

  const tumVerileriGetir = async () => {
    setYukleniyor(true);
    try {
      // Aktif firmalar
      const firmaSnap = await getDocs(
        query(collection(db, "firmalar"), where("durum", "==", "aktif"))
      );
      const firmaMap = {};
      const urunListesi = [];

      for (const firmaDoc of firmaSnap.docs) {
        const firmaData = { id: firmaDoc.id, ...firmaDoc.data() };
        firmaMap[firmaDoc.id] = firmaData;

        // Her firmanın ürünlerini çek
        const urunSnap = await getDocs(
          query(
            collection(db, "firmalar", firmaDoc.id, "urunler"),
            where("aktif", "==", true)
          )
        );
        urunSnap.docs.forEach((uDoc) => {
          urunListesi.push({
            id: uDoc.id,
            firmaId: firmaDoc.id,
            firmaAdi: firmaData.ad,
            ...uDoc.data(),
          });
        });
      }

      setFirmalar(firmaMap);
      setTumUrunler(urunListesi);
    } catch (err) {
      console.error("Arama verileri yüklenemedi:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  // Arama filtreleme (client-side)
  useEffect(() => {
    if (!aranan.trim()) {
      setSonuclar([]);
      return;
    }

    const norm = normalizeArama(aranan);
    const eslesenler = tumUrunler.filter((u) => {
      const adNorm = normalizeArama(u.ad);
      const acikNorm = normalizeArama(u.aciklama || "");
      const firmaNorm = normalizeArama(u.firmaAdi);
      const anahtarlar = (u.aramaAnahtar || [])
        .map((a) => normalizeArama(a))
        .join(" ");

      return (
        adNorm.includes(norm) ||
        acikNorm.includes(norm) ||
        firmaNorm.includes(norm) ||
        anahtarlar.includes(norm)
      );
    });

    setSonuclar(eslesenler);
  }, [aranan, tumUrunler]);

  // Otofokus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div>
      <header className="header">
        <button
          onClick={() => navigate(-1)}
          style={{ color: "#fff", fontSize: "1.25rem", padding: "4px 8px" }}
        >
          ←
        </button>
        <div style={{ flex: 1, marginLeft: 8 }}>
          <input
            ref={inputRef}
            type="text"
            value={aranan}
            onChange={(e) => setAranan(e.target.value)}
            placeholder="Yemek veya restoran ara..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "var(--radius-full)",
              border: "none",
              fontSize: "0.9375rem",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              outline: "none",
            }}
          />
        </div>
      </header>

      <div className="sayfa">
        {yukleniyor ? (
          <div className="yukleniyor">
            <div className="spinner" />
          </div>
        ) : !aranan.trim() ? (
          <div className="bos-durum">
            <div className="bos-durum-ikon">🔍</div>
            <div className="bos-durum-mesaj">
              Lahmacun, kebap veya restoran adı yazın
            </div>
          </div>
        ) : sonuclar.length === 0 ? (
          <div className="bos-durum">
            <div className="bos-durum-ikon">😔</div>
            <div className="bos-durum-mesaj">
              "{aranan}" için sonuç bulunamadı
            </div>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted mb-16">
              {sonuclar.length} sonuç bulundu
            </div>
            {sonuclar.map((urun) => (
              <div
                key={`${urun.firmaId}-${urun.id}`}
                className="kart"
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  padding: 12,
                }}
              >
                {/* Fotoğraf */}
                <div
                  onClick={() => navigate(`/firma/${urun.firmaId}`)}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "var(--radius-sm)",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "var(--renk-gri-100)",
                    cursor: "pointer",
                  }}
                >
                  {urun.foto ? (
                    <img
                      src={urun.foto}
                      alt={urun.ad}
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
                        fontSize: "1.75rem",
                      }}
                    >
                      🍽️
                    </div>
                  )}
                </div>

                {/* Bilgi */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold truncate">{urun.ad}</div>
                  <div
                    className="text-xs"
                    style={{
                      color: "var(--renk-ikincil)",
                      marginTop: 2,
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/firma/${urun.firmaId}`)}
                  >
                    {urun.firmaAdi}
                  </div>
                  <div
                    style={{
                      fontWeight: 800,
                      color: "var(--renk-birincil)",
                      marginTop: 4,
                    }}
                  >
                    {formatPara(urun.fiyat)}
                  </div>
                </div>

                {/* Ekle */}
                <button
                  onClick={() =>
                    sepeteEkle(urun, urun.firmaId, urun.firmaAdi)
                  }
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--renk-birincil)",
                    color: "#fff",
                    fontSize: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  +
                </button>
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
