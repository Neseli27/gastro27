import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";
import { hashSifre } from "../../utils/auth";
import { HAFTANIN_GUNLERI, GUN_ETIKETLERI } from "../../utils/helpers";
import FotoYukle from "../../components/FotoYukle";

export default function Ayarlar({ firmaId, toastGoster }) {
  const [firma, setFirma] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediyor, setKaydediyor] = useState(false);

  // Editable fields
  const [telefon, setTelefon] = useState("");
  const [adres, setAdres] = useState("");
  const [minSiparis, setMinSiparis] = useState("");
  const [teslimatSuresi, setTeslimatSuresi] = useState("");
  const [teslimatBolgeleri, setTeslimatBolgeleri] = useState("");
  const [saatler, setSaatler] = useState({});
  const [logoDosya, setLogoDosya] = useState(null);
  const [logo, setLogo] = useState("");
  const [yeniSifre, setYeniSifre] = useState("");

  useEffect(() => {
    firmaGetir();
  }, [firmaId]);

  const firmaGetir = async () => {
    try {
      const snap = await getDoc(doc(db, "firmalar", firmaId));
      if (snap.exists()) {
        const data = snap.data();
        setFirma(data);
        setTelefon(data.telefon || "");
        setAdres(data.adres || "");
        setMinSiparis(data.minSiparis?.toString() || "0");
        setTeslimatSuresi(data.teslimatSuresi || "");
        setTeslimatBolgeleri(data.teslimatBolgeleri?.join(", ") || "");
        setLogo(data.logo || "");
        setSaatler(data.calismaSaatleri || {});
      }
    } catch (err) {
      console.error("Firma bilgisi yüklenemedi:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  const saatGuncelle = (gun, alan, deger) => {
    setSaatler((prev) => ({
      ...prev,
      [gun]: {
        ...(prev[gun] || {}),
        [alan]: deger,
      },
    }));
  };

  const kaydet = async () => {
    setKaydediyor(true);
    try {
      let logoUrl = logo;

      if (logoDosya) {
        const dosyaAdi = `logolar/${firmaId}/${Date.now()}.jpg`;
        const storageRef = ref(storage, dosyaAdi);
        await uploadBytes(storageRef, logoDosya);
        logoUrl = await getDownloadURL(storageRef);
      }

      const guncelleme = {
        telefon: telefon.trim(),
        adres: adres.trim(),
        minSiparis: Number(minSiparis) || 0,
        teslimatSuresi: teslimatSuresi.trim(),
        teslimatBolgeleri: teslimatBolgeleri
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean),
        calismaSaatleri: saatler,
        logo: logoUrl,
      };

      if (yeniSifre.trim()) {
        guncelleme.sifreHash = await hashSifre(yeniSifre.trim());
      }

      await updateDoc(doc(db, "firmalar", firmaId), guncelleme);
      setYeniSifre("");
      toastGoster("Ayarlar kaydedildi", "basari");
    } catch (err) {
      console.error("Kayıt hatası:", err);
      toastGoster("Kayıt başarısız", "hata");
    } finally {
      setKaydediyor(false);
    }
  };

  if (yukleniyor) {
    return <div className="yukleniyor"><div className="spinner" /></div>;
  }

  return (
    <div>
      <h3 className="sayfa-baslik" style={{ fontSize: "1.125rem" }}>
        İşletme Ayarları
      </h3>

      {/* Logo */}
      <div className="form-grup">
        <label className="form-etiket">Logo</label>
        <FotoYukle foto={logo} setFoto={setLogo} setFotoDosya={setLogoDosya} />
      </div>

      <div className="form-grup">
        <label className="form-etiket">Telefon</label>
        <input
          className="form-input"
          type="tel"
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
        />
      </div>

      <div className="form-grup">
        <label className="form-etiket">Adres</label>
        <textarea
          className="form-input"
          value={adres}
          onChange={(e) => setAdres(e.target.value)}
          rows={2}
        />
      </div>

      <div className="form-grup">
        <label className="form-etiket">Minimum Sipariş (₺)</label>
        <input
          className="form-input"
          type="number"
          value={minSiparis}
          onChange={(e) => setMinSiparis(e.target.value)}
        />
      </div>

      <div className="form-grup">
        <label className="form-etiket">Teslimat Süresi</label>
        <input
          className="form-input"
          placeholder="30-45 dk"
          value={teslimatSuresi}
          onChange={(e) => setTeslimatSuresi(e.target.value)}
        />
      </div>

      <div className="form-grup">
        <label className="form-etiket">Teslimat Bölgeleri (virgülle ayırın)</label>
        <input
          className="form-input"
          placeholder="Şahinbey, Şehitkamil"
          value={teslimatBolgeleri}
          onChange={(e) => setTeslimatBolgeleri(e.target.value)}
        />
      </div>

      {/* Çalışma saatleri */}
      <div className="form-grup">
        <label className="form-etiket">Çalışma Saatleri</label>
        {HAFTANIN_GUNLERI.map((gun) => {
          const gs = saatler[gun] || {};
          return (
            <div
              key={gun}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                fontSize: "0.8125rem",
              }}
            >
              <label style={{ width: 80, fontWeight: 600 }}>
                {GUN_ETIKETLERI[gun]}
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input
                  type="checkbox"
                  checked={!!gs.kapali}
                  onChange={(e) => saatGuncelle(gun, "kapali", e.target.checked)}
                />
                Kapalı
              </label>
              {!gs.kapali && (
                <>
                  <input
                    type="time"
                    value={gs.acilis || "09:00"}
                    onChange={(e) => saatGuncelle(gun, "acilis", e.target.value)}
                    style={{
                      padding: "4px 8px",
                      border: "1px solid var(--renk-gri-200)",
                      borderRadius: "var(--radius-xs)",
                    }}
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={gs.kapanis || "22:00"}
                    onChange={(e) => saatGuncelle(gun, "kapanis", e.target.value)}
                    style={{
                      padding: "4px 8px",
                      border: "1px solid var(--renk-gri-200)",
                      borderRadius: "var(--radius-xs)",
                    }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Şifre değiştirme */}
      <div className="form-grup">
        <label className="form-etiket">Yeni Şifre (değiştirmek isterseniz)</label>
        <input
          className="form-input"
          type="password"
          placeholder="Boş bırakırsanız değişmez"
          value={yeniSifre}
          onChange={(e) => setYeniSifre(e.target.value)}
        />
      </div>

      <button
        onClick={kaydet}
        disabled={kaydediyor}
        className="btn btn-birincil btn-tam btn-buyuk"
      >
        {kaydediyor ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </div>
  );
}
