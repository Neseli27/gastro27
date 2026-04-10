import { useState, useEffect } from "react";
import {
  collection, addDoc, updateDoc, deleteDoc, doc, getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { hashSifre } from "../../utils/auth";

export default function KuryeYonetimi({ firmaId, toastGoster, siparisler, onWhatsapp }) {
  const [kuryeler, setKuryeler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [formAcik, setFormAcik] = useState(false);

  const [ad, setAd] = useState("");
  const [telefon, setTelefon] = useState("");
  const [sifre, setSifre] = useState("");
  const [kaydediyor, setKaydediyor] = useState(false);

  useEffect(() => {
    kuryeGetir();
  }, [firmaId]);

  const kuryeGetir = async () => {
    try {
      const snap = await getDocs(collection(db, "firmalar", firmaId, "kuryeler"));
      setKuryeler(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      // silent
    } finally {
      setYukleniyor(false);
    }
  };

  const kaydet = async () => {
    if (!ad.trim() || !telefon.trim() || !sifre.trim()) {
      toastGoster("Tüm alanları doldurun", "hata");
      return;
    }

    setKaydediyor(true);
    try {
      const hash = await hashSifre(sifre);
      await addDoc(collection(db, "firmalar", firmaId, "kuryeler"), {
        ad: ad.trim(),
        telefon: telefon.trim(),
        sifreHash: hash,
        aktif: true,
        olusturma: new Date(),
      });
      toastGoster("Kurye eklendi", "basari");
      setAd("");
      setTelefon("");
      setSifre("");
      setFormAcik(false);
      kuryeGetir();
    } catch {
      toastGoster("Ekleme başarısız", "hata");
    } finally {
      setKaydediyor(false);
    }
  };

  const aktifToggle = async (kurye) => {
    try {
      await updateDoc(doc(db, "firmalar", firmaId, "kuryeler", kurye.id), {
        aktif: !kurye.aktif,
      });
      kuryeGetir();
    } catch {
      toastGoster("İşlem başarısız", "hata");
    }
  };

  const sil = async (id) => {
    if (!window.confirm("Kuryeyi silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, "firmalar", firmaId, "kuryeler", id));
      toastGoster("Kurye silindi", "bilgi");
      kuryeGetir();
    } catch {
      toastGoster("Silme başarısız", "hata");
    }
  };

  // Kurye bekleyen siparişler (WhatsApp fallback için)
  const kuryeBekleyen = siparisler?.filter((s) => s.durum === "kurye_bekliyor") || [];

  if (yukleniyor) {
    return <div className="yukleniyor"><div className="spinner" /></div>;
  }

  return (
    <div>
      {/* WhatsApp ile gönder bölümü */}
      {kuryeBekleyen.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: 8 }}>
            📦 Kurye Bekleyen Siparişler
          </h3>
          {kuryeBekleyen.map((s) => (
            <div key={s.id} className="kart" style={{ padding: 12 }}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm">{s.musteriAd}</div>
                  <div className="text-xs text-muted">
                    {s.urunler?.map((u) => `${u.adet}x ${u.ad}`).join(", ")}
                  </div>
                </div>
                <div className="flex gap-8">
                  {kuryeler
                    .filter((k) => k.aktif)
                    .map((k) => (
                      <button
                        key={k.id}
                        onClick={() => onWhatsapp(s, k.telefon)}
                        className="btn btn-kucuk"
                        style={{
                          background: "#25D366",
                          color: "#fff",
                          fontSize: "0.6875rem",
                        }}
                      >
                        📱 {k.ad}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kurye ekleme */}
      {formAcik ? (
        <div className="kart" style={{ marginBottom: 16 }}>
          <h3 className="kart-baslik">Yeni Kurye Ekle</h3>

          <div className="form-grup">
            <label className="form-etiket">Ad *</label>
            <input
              className="form-input"
              placeholder="Ahmet"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
            />
          </div>

          <div className="form-grup">
            <label className="form-etiket">Telefon *</label>
            <input
              className="form-input"
              type="tel"
              placeholder="05XX XXX XX XX"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
            />
          </div>

          <div className="form-grup">
            <label className="form-etiket">Şifre *</label>
            <input
              className="form-input"
              type="password"
              placeholder="Kurye giriş şifresi"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
            />
          </div>

          <div className="flex gap-8">
            <button onClick={kaydet} disabled={kaydediyor} className="btn btn-birincil btn-tam">
              {kaydediyor ? "Ekleniyor..." : "Ekle"}
            </button>
            <button onClick={() => setFormAcik(false)} className="btn btn-ikincil">
              İptal
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setFormAcik(true)} className="btn btn-birincil btn-tam mb-16">
          + Yeni Kurye Ekle
        </button>
      )}

      {/* Kurye listesi */}
      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: 8 }}>
        Kayıtlı Kuryeler
      </h3>

      {kuryeler.length === 0 ? (
        <div className="bos-durum">
          <div className="bos-durum-ikon">🛵</div>
          <div className="bos-durum-mesaj">Henüz kurye eklenmemiş</div>
        </div>
      ) : (
        kuryeler.map((k) => (
          <div
            key={k.id}
            className="kart flex items-center justify-between"
            style={{ opacity: k.aktif ? 1 : 0.5 }}
          >
            <div>
              <div className="font-bold">{k.ad}</div>
              <div className="text-xs text-muted">{k.telefon}</div>
            </div>
            <div className="flex gap-8">
              <button
                onClick={() => aktifToggle(k)}
                className="btn btn-kucuk"
                style={{
                  background: k.aktif ? "var(--renk-basari-acik)" : "var(--renk-gri-100)",
                  color: k.aktif ? "var(--renk-basari)" : "var(--renk-gri-500)",
                }}
              >
                {k.aktif ? "Aktif" : "Pasif"}
              </button>
              <button
                onClick={() => sil(k.id)}
                className="btn btn-kucuk"
                style={{ background: "var(--renk-tehlike-acik)", color: "var(--renk-tehlike)" }}
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
