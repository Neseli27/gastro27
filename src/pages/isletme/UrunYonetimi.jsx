import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../firebase";
import { formatPara, VARSAYILAN_KATEGORILER } from "../../utils/helpers";
import FotoYukle from "../../components/FotoYukle";

export default function UrunYonetimi({ firmaId, toastGoster }) {
  const [urunler, setUrunler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [formAcik, setFormAcik] = useState(false);
  const [duzenle, setDuzenle] = useState(null);

  // Form state
  const [ad, setAd] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [fiyat, setFiyat] = useState("");
  const [kategori, setKategori] = useState("");
  const [foto, setFoto] = useState("");
  const [fotoDosya, setFotoDosya] = useState(null);
  const [kaydediyor, setKaydediyor] = useState(false);

  useEffect(() => {
    urunleriGetir();
  }, [firmaId]);

  const urunleriGetir = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "firmalar", firmaId, "urunler"), orderBy("sira", "asc"))
      );
      setUrunler(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Ürünler yüklenemedi:", err);
    } finally {
      setYukleniyor(false);
    }
  };

  const formuSifirla = () => {
    setAd("");
    setAciklama("");
    setFiyat("");
    setKategori("");
    setFoto("");
    setFotoDosya(null);
    setDuzenle(null);
    setFormAcik(false);
  };

  const duzenleAc = (urun) => {
    setAd(urun.ad || "");
    setAciklama(urun.aciklama || "");
    setFiyat(urun.fiyat?.toString() || "");
    setKategori(urun.kategori || "");
    setFoto(urun.foto || "");
    setFotoDosya(null);
    setDuzenle(urun);
    setFormAcik(true);
  };

  const kaydet = async () => {
    if (!ad.trim()) {
      toastGoster("Ürün adı girin", "hata");
      return;
    }
    if (!fiyat || isNaN(fiyat) || Number(fiyat) <= 0) {
      toastGoster("Geçerli bir fiyat girin", "hata");
      return;
    }

    setKaydediyor(true);
    try {
      let fotoUrl = foto;

      // Fotoğraf yükleme
      if (fotoDosya) {
        const dosyaAdi = `urunler/${firmaId}/${Date.now()}.jpg`;
        const storageRef = ref(storage, dosyaAdi);
        await uploadBytes(storageRef, fotoDosya);
        fotoUrl = await getDownloadURL(storageRef);
      }

      // Arama anahtarları
      const anahtarlar = [
        ad.toLowerCase(),
        ...ad.toLowerCase().split(" "),
        aciklama?.toLowerCase(),
        kategori?.toLowerCase(),
      ].filter(Boolean);

      const data = {
        ad: ad.trim(),
        aciklama: aciklama.trim(),
        fiyat: Number(fiyat),
        kategori: kategori || "Diğer",
        foto: fotoUrl,
        aramaAnahtar: anahtarlar,
        aktif: true,
        sira: duzenle?.sira ?? urunler.length,
      };

      if (duzenle) {
        await updateDoc(doc(db, "firmalar", firmaId, "urunler", duzenle.id), data);
        toastGoster("Ürün güncellendi", "basari");
      } else {
        await addDoc(collection(db, "firmalar", firmaId, "urunler"), data);
        toastGoster("Ürün eklendi", "basari");
      }

      formuSifirla();
      urunleriGetir();
    } catch (err) {
      console.error("Kayıt hatası:", err);
      toastGoster("Kayıt başarısız", "hata");
    } finally {
      setKaydediyor(false);
    }
  };

  const aktifToggle = async (urun) => {
    try {
      await updateDoc(doc(db, "firmalar", firmaId, "urunler", urun.id), {
        aktif: !urun.aktif,
      });
      urunleriGetir();
      toastGoster(urun.aktif ? "Ürün pasife alındı" : "Ürün aktif edildi", "bilgi");
    } catch {
      toastGoster("İşlem başarısız", "hata");
    }
  };

  const sil = async (urunId) => {
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "firmalar", firmaId, "urunler", urunId));
      toastGoster("Ürün silindi", "bilgi");
      urunleriGetir();
    } catch {
      toastGoster("Silme başarısız", "hata");
    }
  };

  if (yukleniyor) {
    return (
      <div className="yukleniyor">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Form */}
      {formAcik ? (
        <div className="kart" style={{ marginBottom: 16 }}>
          <h3 className="kart-baslik">
            {duzenle ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
          </h3>

          <FotoYukle foto={foto} setFoto={setFoto} setFotoDosya={setFotoDosya} />

          <div className="form-grup" style={{ marginTop: 12 }}>
            <label className="form-etiket">Ürün Adı *</label>
            <input
              className="form-input"
              placeholder="Lahmacun"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
            />
          </div>

          <div className="form-grup">
            <label className="form-etiket">Açıklama</label>
            <input
              className="form-input"
              placeholder="El açması, kıymalı"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
            />
          </div>

          <div className="form-grup">
            <label className="form-etiket">Fiyat (₺) *</label>
            <input
              className="form-input"
              type="number"
              placeholder="45"
              value={fiyat}
              onChange={(e) => setFiyat(e.target.value)}
            />
          </div>

          <div className="form-grup">
            <label className="form-etiket">Kategori</label>
            <select
              className="form-input"
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
            >
              <option value="">Kategori Seçin</option>
              {VARSAYILAN_KATEGORILER.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          <div className="flex gap-8">
            <button
              onClick={kaydet}
              disabled={kaydediyor}
              className="btn btn-birincil btn-tam"
            >
              {kaydediyor ? "Kaydediliyor..." : duzenle ? "Güncelle" : "Ekle"}
            </button>
            <button onClick={formuSifirla} className="btn btn-ikincil">
              İptal
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setFormAcik(true)}
          className="btn btn-birincil btn-tam mb-16"
        >
          + Yeni Ürün Ekle
        </button>
      )}

      {/* Ürün listesi */}
      {urunler.length === 0 ? (
        <div className="bos-durum">
          <div className="bos-durum-ikon">🍽️</div>
          <div className="bos-durum-mesaj">Henüz ürün eklenmemiş</div>
        </div>
      ) : (
        urunler.map((urun) => (
          <div
            key={urun.id}
            className="kart"
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              opacity: urun.aktif ? 1 : 0.5,
            }}
          >
            {urun.foto && (
              <img
                src={urun.foto}
                alt={urun.ad}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-xs)",
                  objectFit: "cover",
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-bold text-sm truncate">{urun.ad}</div>
              <div className="text-xs text-muted">
                {urun.kategori} · {formatPara(urun.fiyat)}
              </div>
            </div>
            <div className="flex gap-8">
              <button
                onClick={() => aktifToggle(urun)}
                className="btn btn-kucuk"
                style={{
                  background: urun.aktif
                    ? "var(--renk-basari-acik)"
                    : "var(--renk-gri-100)",
                  color: urun.aktif ? "var(--renk-basari)" : "var(--renk-gri-500)",
                }}
              >
                {urun.aktif ? "Aktif" : "Pasif"}
              </button>
              <button
                onClick={() => duzenleAc(urun)}
                className="btn btn-kucuk"
                style={{
                  background: "var(--renk-bilgi-acik)",
                  color: "var(--renk-bilgi)",
                }}
              >
                ✏️
              </button>
              <button
                onClick={() => sil(urun.id)}
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
    </div>
  );
}
