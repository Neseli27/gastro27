import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { hashSifre, oturumKaydet, oturumKontrol } from "../../utils/auth";

export default function KuryeGiris({ toastGoster }) {
  const navigate = useNavigate();
  const [telefon, setTelefon] = useState("");
  const [sifre, setSifre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    const oturum = oturumKontrol("kurye");
    if (oturum) navigate("/kurye/panel", { replace: true });
  }, [navigate]);

  const girisYap = async (e) => {
    e.preventDefault();
    if (!telefon.trim() || !sifre.trim()) {
      toastGoster("Telefon ve şifre girin", "hata");
      return;
    }

    setYukleniyor(true);
    try {
      const hash = await hashSifre(sifre);

      // Tüm firmaların kuryelerini tara
      const firmaSnap = await getDocs(
        query(collection(db, "firmalar"), where("durum", "==", "aktif"))
      );

      let bulundu = false;
      for (const firmaDoc of firmaSnap.docs) {
        const kuryeSnap = await getDocs(
          query(
            collection(db, "firmalar", firmaDoc.id, "kuryeler"),
            where("telefon", "==", telefon.trim()),
            where("sifreHash", "==", hash)
          )
        );

        if (!kuryeSnap.empty) {
          const kurye = kuryeSnap.docs[0];
          const kuryeData = kurye.data();

          if (!kuryeData.aktif) {
            toastGoster("Hesabınız pasif durumda", "hata");
            setYukleniyor(false);
            return;
          }

          oturumKaydet("kurye", kurye.id, {
            kuryeAdi: kuryeData.ad,
            firmaId: firmaDoc.id,
            firmaAdi: firmaDoc.data().ad,
          });

          toastGoster(`Hoş geldin, ${kuryeData.ad}!`, "basari");
          navigate("/kurye/panel", { replace: true });
          bulundu = true;
          break;
        }
      }

      if (!bulundu) {
        toastGoster("Telefon veya şifre hatalı", "hata");
      }
    } catch (err) {
      console.error("Giriş hatası:", err);
      toastGoster("Bir hata oluştu", "hata");
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--renk-beyaz)",
          borderRadius: "var(--radius-xl)",
          padding: 32,
          boxShadow: "var(--golge-xl)",
        }}
      >
        <div className="text-center mb-16">
          <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🛵</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Kurye Girişi</h1>
          <p className="text-sm text-muted">GASTRO27 kurye paneli</p>
        </div>

        <form onSubmit={girisYap}>
          <div className="form-grup">
            <label className="form-etiket">Telefon</label>
            <input
              className="form-input"
              type="tel"
              placeholder="05XX XXX XX XX"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-grup">
            <label className="form-etiket">Şifre</label>
            <input
              className="form-input"
              type="password"
              placeholder="Şifrenizi girin"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={yukleniyor}
            className="btn btn-tam btn-buyuk"
            style={{
              marginTop: 8,
              background: "#06b6d4",
              color: "#fff",
            }}
          >
            {yukleniyor ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="text-center mt-16">
          <button
            className="text-sm"
            style={{ color: "var(--renk-gri-400)" }}
            onClick={() => navigate("/")}
          >
            ← Ana sayfaya dön
          </button>
        </div>
      </div>
    </div>
  );
}
