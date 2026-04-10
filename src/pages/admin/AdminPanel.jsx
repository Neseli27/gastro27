import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs, getDoc,
  setDoc, query, where, orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import { hashSifre, oturumKaydet, oturumKontrol, oturumSil } from "../../utils/auth";
import { VARSAYILAN_KATEGORILER, formatPara, formatTarih } from "../../utils/helpers";

export default function AdminPanel({ toastGoster }) {
  const navigate = useNavigate();
  const [girisYapildi, setGirisYapildi] = useState(false);
  const [sifre, setSifre] = useState("");
  const [sekme, setSekme] = useState("firmalar");

  // Firma
  const [firmalar, setFirmalar] = useState([]);
  const [firmaFormAcik, setFirmaFormAcik] = useState(false);
  const [fAd, setFAd] = useState("");
  const [fTelefon, setFTelefon] = useState("");
  const [fAdres, setFAdres] = useState("");
  const [fSifre, setFSifre] = useState("");
  const [kaydediyor, setKaydediyor] = useState(false);

  // Kategoriler
  const [kategoriler, setKategoriler] = useState([]);
  const [yeniKat, setYeniKat] = useState("");

  // Stats
  const [toplamSiparis, setToplamSiparis] = useState(0);
  const [toplamCiro, setToplamCiro] = useState(0);

  useEffect(() => {
    const oturum = oturumKontrol("admin");
    if (oturum) {
      setGirisYapildi(true);
      verileriGetir();
    }
  }, []);

  const girisYap = async (e) => {
    e.preventDefault();
    try {
      const hash = await hashSifre(sifre);
      const adminDoc = await getDoc(doc(db, "sistem", "admin"));

      if (!adminDoc.exists()) {
        // İlk giriş: admin dokümanı oluştur
        await setDoc(doc(db, "sistem", "admin"), {
          sifreHash: hash,
          kategoriler: VARSAYILAN_KATEGORILER,
        });
        oturumKaydet("admin", "admin");
        setGirisYapildi(true);
        verileriGetir();
        toastGoster("Admin hesabı oluşturuldu!", "basari");
        return;
      }

      if (adminDoc.data().sifreHash !== hash) {
        toastGoster("Şifre hatalı", "hata");
        return;
      }

      oturumKaydet("admin", "admin");
      setGirisYapildi(true);
      verileriGetir();
      toastGoster("Hoş geldin, Admin!", "basari");
    } catch (err) {
      console.error("Admin giriş hatası:", err);
      toastGoster("Giriş hatası", "hata");
    }
  };

  const verileriGetir = async () => {
    try {
      // Firmalar
      const firmaSnap = await getDocs(collection(db, "firmalar"));
      setFirmalar(firmaSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Kategoriler
      const adminDoc = await getDoc(doc(db, "sistem", "admin"));
      if (adminDoc.exists()) {
        setKategoriler(adminDoc.data().kategoriler || VARSAYILAN_KATEGORILER);
      }

      // İstatistikler
      const siparisSnap = await getDocs(collection(db, "siparisler"));
      const siparisler = siparisSnap.docs.map((d) => d.data());
      setToplamSiparis(siparisler.length);
      setToplamCiro(
        siparisler
          .filter((s) => s.durum === "tamamlandi")
          .reduce((t, s) => t + (s.toplam || 0), 0)
      );
    } catch (err) {
      console.error("Veri yükleme hatası:", err);
    }
  };

  const firmaEkle = async () => {
    if (!fAd.trim() || !fSifre.trim()) {
      toastGoster("Firma adı ve şifre zorunlu", "hata");
      return;
    }
    setKaydediyor(true);
    try {
      const hash = await hashSifre(fSifre);
      await addDoc(collection(db, "firmalar"), {
        ad: fAd.trim(),
        telefon: fTelefon.trim(),
        adres: fAdres.trim(),
        sehir: "Gaziantep",
        sifreHash: hash,
        logo: "",
        acik: true,
        calismaSaatleri: {},
        minSiparis: 0,
        teslimatSuresi: "30-45 dk",
        teslimatBolgeleri: ["Şahinbey", "Şehitkamil"],
        kategoriler: [],
        durum: "aktif",
        olusturma: new Date(),
      });
      toastGoster(`${fAd} eklendi!`, "basari");
      setFAd("");
      setFTelefon("");
      setFAdres("");
      setFSifre("");
      setFirmaFormAcik(false);
      verileriGetir();
    } catch {
      toastGoster("Firma eklenemedi", "hata");
    } finally {
      setKaydediyor(false);
    }
  };

  const firmaDurumGuncelle = async (firmaId, durum) => {
    try {
      await updateDoc(doc(db, "firmalar", firmaId), { durum });
      toastGoster(`Firma ${durum === "aktif" ? "aktif edildi" : "askıya alındı"}`, "bilgi");
      verileriGetir();
    } catch {
      toastGoster("İşlem başarısız", "hata");
    }
  };

  const firmaSil = async (firmaId) => {
    if (!window.confirm("Bu firmayı silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "firmalar", firmaId));
      toastGoster("Firma silindi", "bilgi");
      verileriGetir();
    } catch {
      toastGoster("Silme başarısız", "hata");
    }
  };

  const kategoriEkle = async () => {
    if (!yeniKat.trim()) return;
    const yeniListe = [...kategoriler, yeniKat.trim()];
    try {
      await updateDoc(doc(db, "sistem", "admin"), { kategoriler: yeniListe });
      setKategoriler(yeniListe);
      setYeniKat("");
      toastGoster("Kategori eklendi", "basari");
    } catch {
      toastGoster("Eklenemedi", "hata");
    }
  };

  const kategoriSil = async (kat) => {
    const yeniListe = kategoriler.filter((k) => k !== kat);
    try {
      await updateDoc(doc(db, "sistem", "admin"), { kategoriler: yeniListe });
      setKategoriler(yeniListe);
      toastGoster("Kategori silindi", "bilgi");
    } catch {
      toastGoster("Silinemedi", "hata");
    }
  };

  const cikisYap = () => {
    oturumSil();
    setGirisYapildi(false);
  };

  // Giriş ekranı
  if (!girisYapildi) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "linear-gradient(135deg, var(--renk-gri-800) 0%, var(--renk-gri-900) 100%)",
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
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>🔐</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Süper Admin</h1>
            <p className="text-sm text-muted">GASTRO27 yönetim paneli</p>
          </div>

          <form onSubmit={girisYap}>
            <div className="form-grup">
              <label className="form-etiket">Admin Şifresi</label>
              <input
                className="form-input"
                type="password"
                placeholder="Şifrenizi girin"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-birincil btn-tam btn-buyuk">
              Giriş Yap
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

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "center", background: "var(--renk-beyaz)", borderBottom: "1.5px solid var(--renk-bal-acik)", position: "sticky", top: 0, zIndex: 100 }}>
        <header style={{ width: "100%", maxWidth: "var(--max-genislik)", padding: "0 16px", height: "var(--nav-yukseklik)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="header-logo" style={{ fontSize: "1rem" }}>
            <span>G</span>ASTRO27 Admin
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
        <div className="tab-bar">
          {[
            { id: "firmalar", etiket: "🏪 Firmalar" },
            { id: "kategoriler", etiket: "📂 Kategoriler" },
            { id: "istatistik", etiket: "📊 İstatistik" },
          ].map((s) => (
            <button
              key={s.id}
              className={`tab-bar-btn ${sekme === s.id ? "aktif" : ""}`}
              onClick={() => setSekme(s.id)}
              style={
                sekme === s.id
                  ? { background: "var(--renk-bakir)", color: "var(--renk-bakir-acik)" }
                  : {}
              }
            >
              {s.etiket}
            </button>
          ))}
        </div>
      </div>

      <div className="sayfa" style={{ paddingTop: 8 }}>
        {/* ── Firmalar ── */}
        {sekme === "firmalar" && (
          <>
            {firmaFormAcik ? (
              <div className="kart" style={{ marginBottom: 16 }}>
                <h3 className="kart-baslik">Yeni Firma Ekle</h3>
                <div className="form-grup">
                  <label className="form-etiket">Firma Adı *</label>
                  <input className="form-input" value={fAd} onChange={(e) => setFAd(e.target.value)} />
                </div>
                <div className="form-grup">
                  <label className="form-etiket">Telefon</label>
                  <input className="form-input" value={fTelefon} onChange={(e) => setFTelefon(e.target.value)} />
                </div>
                <div className="form-grup">
                  <label className="form-etiket">Adres</label>
                  <input className="form-input" value={fAdres} onChange={(e) => setFAdres(e.target.value)} />
                </div>
                <div className="form-grup">
                  <label className="form-etiket">Şifre *</label>
                  <input className="form-input" type="password" value={fSifre} onChange={(e) => setFSifre(e.target.value)} />
                </div>
                <div className="flex gap-8">
                  <button onClick={firmaEkle} disabled={kaydediyor} className="btn btn-birincil btn-tam">
                    {kaydediyor ? "Ekleniyor..." : "Ekle"}
                  </button>
                  <button onClick={() => setFirmaFormAcik(false)} className="btn btn-ikincil">
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setFirmaFormAcik(true)} className="btn btn-birincil btn-tam mb-16">
                + Yeni Firma Ekle
              </button>
            )}

            {firmalar.length === 0 ? (
              <div className="bos-durum">
                <div className="bos-durum-ikon">🏪</div>
                <div className="bos-durum-mesaj">Henüz firma eklenmemiş</div>
              </div>
            ) : (
              firmalar.map((f) => (
                <div key={f.id} className="kart">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold">{f.ad}</div>
                      <div className="text-xs text-muted">
                        {f.telefon || "Tel yok"} · {f.adres || "Adres yok"}
                      </div>
                      <div className="text-xs" style={{ marginTop: 2 }}>
                        <span
                          className="badge"
                          style={{
                            background: f.durum === "aktif" ? "var(--renk-basari-acik)" : "var(--renk-tehlike-acik)",
                            color: f.durum === "aktif" ? "var(--renk-basari)" : "var(--renk-tehlike)",
                          }}
                        >
                          {f.durum}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-8" style={{ marginTop: 10, flexWrap: "wrap" }}>
                    <button
                      onClick={() =>
                        firmaDurumGuncelle(
                          f.id,
                          f.durum === "aktif" ? "askida" : "aktif"
                        )
                      }
                      className="btn btn-kucuk"
                      style={{
                        background:
                          f.durum === "aktif"
                            ? "var(--renk-uyari-acik)"
                            : "var(--renk-basari-acik)",
                        color:
                          f.durum === "aktif"
                            ? "var(--renk-uyari)"
                            : "var(--renk-basari)",
                      }}
                    >
                      {f.durum === "aktif" ? "Askıya Al" : "Aktif Et"}
                    </button>
                    <button
                      onClick={async () => {
                        const yeni = prompt("Yeni şifre girin:");
                        if (!yeni || !yeni.trim()) return;
                        try {
                          const hash = await hashSifre(yeni.trim());
                          await updateDoc(doc(db, "firmalar", f.id), { sifreHash: hash });
                          toastGoster(`${f.ad} şifresi güncellendi`, "basari");
                        } catch {
                          toastGoster("Şifre güncellenemedi", "hata");
                        }
                      }}
                      className="btn btn-kucuk"
                      style={{
                        background: "var(--renk-bilgi-acik)",
                        color: "var(--renk-bilgi)",
                      }}
                    >
                      🔑 Şifre
                    </button>
                    <button
                      onClick={() => firmaSil(f.id)}
                      className="btn btn-kucuk"
                      style={{
                        background: "var(--renk-tehlike-acik)",
                        color: "var(--renk-tehlike)",
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ── Kategoriler ── */}
        {sekme === "kategoriler" && (
          <>
            <div className="flex gap-8 mb-16">
              <input
                className="form-input"
                placeholder="Yeni kategori adı"
                value={yeniKat}
                onChange={(e) => setYeniKat(e.target.value)}
                style={{ flex: 1 }}
              />
              <button onClick={kategoriEkle} className="btn btn-birincil">
                Ekle
              </button>
            </div>

            {kategoriler.map((k, i) => (
              <div key={i} className="kart flex items-center justify-between">
                <span className="font-bold">{k}</span>
                <button
                  onClick={() => kategoriSil(k)}
                  className="btn btn-kucuk"
                  style={{
                    background: "var(--renk-tehlike-acik)",
                    color: "var(--renk-tehlike)",
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </>
        )}

        {/* ── İstatistikler ── */}
        {sekme === "istatistik" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div className="kart text-center">
              <div className="text-xs text-muted">Toplam Firma</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                {firmalar.length}
              </div>
            </div>
            <div className="kart text-center">
              <div className="text-xs text-muted">Toplam Sipariş</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                {toplamSiparis}
              </div>
            </div>
            <div
              className="kart text-center"
              style={{ gridColumn: "1 / -1" }}
            >
              <div className="text-xs text-muted">Toplam Ciro (Tamamlanan)</div>
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "var(--renk-basari)",
                }}
              >
                {formatPara(toplamCiro)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
