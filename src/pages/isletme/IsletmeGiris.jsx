import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { hashSifre, oturumKaydet, oturumKontrol } from "../../utils/auth";

export default function IsletmeGiris({ toastGoster }) {
  const navigate = useNavigate();
  const [firmaAd, setFirmaAd] = useState("");
  const [sifre, setSifre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    const oturum = oturumKontrol("isletme");
    if (oturum) navigate("/isletme/panel", { replace: true });
  }, [navigate]);

  const girisYap = async (e) => {
    e.preventDefault();
    if (!firmaAd.trim() || !sifre.trim()) {
      toastGoster("Firma adı ve şifre girin", "hata");
      return;
    }
    setYukleniyor(true);
    try {
      const hash = await hashSifre(sifre);
      const q = query(
        collection(db, "firmalar"),
        where("ad", "==", firmaAd.trim()),
        where("sifreHash", "==", hash)
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        toastGoster("Firma adı veya şifre hatalı", "hata");
        setYukleniyor(false);
        return;
      }
      const firma = snap.docs[0];
      const firmaData = firma.data();
      if (firmaData.durum === "askida") {
        toastGoster("Hesabınız askıya alınmış.", "hata");
        setYukleniyor(false);
        return;
      }
      oturumKaydet("isletme", firma.id, { firmaAdi: firmaData.ad });
      toastGoster(`Hoş geldin, ${firmaData.ad}!`, "basari");
      navigate("/isletme/panel", { replace: true });
    } catch (err) {
      console.error("Giriş hatası:", err);
      toastGoster("Bir hata oluştu", "hata");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="giris-sayfa">
      <div className="giris-kutu">
        <div className="text-center mb-16">
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🏪</div>
          <h1 style={{ fontFamily: "var(--font-baslik)", fontSize: "1.5rem", fontWeight: 800, color: "var(--renk-bakir)" }}>
            İşletme Girişi
          </h1>
          <p className="text-sm text-muted">GASTRO27 işletme paneli</p>
        </div>
        <form onSubmit={girisYap}>
          <div className="form-grup">
            <label className="form-etiket">Firma Adı</label>
            <input className="form-input" placeholder="Firma adınızı girin" value={firmaAd} onChange={(e) => setFirmaAd(e.target.value)} autoFocus />
          </div>
          <div className="form-grup">
            <label className="form-etiket">Şifre</label>
            <input className="form-input" type="password" placeholder="Şifrenizi girin" value={sifre} onChange={(e) => setSifre(e.target.value)} />
          </div>
          <button type="submit" disabled={yukleniyor} className="btn btn-birincil btn-tam btn-buyuk" style={{ marginTop: 8 }}>
            {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
        <div className="text-center mt-16">
          <button className="text-sm" style={{ color: "var(--renk-gri-400)" }} onClick={() => navigate("/")}>
            ← Ana sayfaya dön
          </button>
        </div>
      </div>
    </div>
  );
}
