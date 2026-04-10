import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { formatPara, siparisNoUret, firmaAcikMi } from "../../utils/helpers";
import KonumButon from "../../components/KonumButon";

export default function Sepet({
  sepet,
  sepetFirmaId,
  sepetFirmaAdi,
  sepetToplam,
  sepetAdet,
  sepettenCikar,
  sepeteEkle,
  sepetiTemizle,
  toastGoster,
}) {
  const navigate = useNavigate();
  const [musteriAd, setMusteriAd] = useState("");
  const [musteriTel, setMusteriTel] = useState("");
  const [ilce, setIlce] = useState("");
  const [mahalle, setMahalle] = useState("");
  const [konum, setKonum] = useState(null);
  const [adresText, setAdresText] = useState("");
  const [adresNot, setAdresNot] = useState("");
  const [siparisNot, setSiparisNot] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [minSiparis, setMinSiparis] = useState(0);
  const [firmaKapali, setFirmaKapali] = useState(false);

  // Firma bilgilerini çek
  useEffect(() => {
    if (!sepetFirmaId) return;
    getDoc(doc(db, "firmalar", sepetFirmaId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMinSiparis(data.minSiparis || 0);
        setFirmaKapali(!firmaAcikMi(data.calismaSaatleri));
      }
    }).catch(() => {});
  }, [sepetFirmaId]);

  const minSiparisAlti = minSiparis > 0 && sepetToplam < minSiparis;

  const siparisVer = async () => {
    // Validasyonlar
    if (firmaKapali) {
      toastGoster("İşletme şu an kapalı, sipariş verilemez", "hata");
      return;
    }
    if (!musteriAd.trim()) {
      toastGoster("Lütfen adınızı girin", "hata");
      return;
    }
    if (!musteriTel.trim() || musteriTel.length < 10) {
      toastGoster("Lütfen geçerli bir telefon girin", "hata");
      return;
    }
    if (!ilce) {
      toastGoster("Lütfen ilçe seçin", "hata");
      return;
    }
    if (!mahalle.trim()) {
      toastGoster("Lütfen mahalle/semt girin", "hata");
      return;
    }
    if (sepet.length === 0) {
      toastGoster("Sepetiniz boş", "hata");
      return;
    }
    if (minSiparisAlti) {
      toastGoster(`Minimum sipariş tutarı ${formatPara(minSiparis)}`, "hata");
      return;
    }

    setGonderiliyor(true);

    try {
      const siparisData = {
        firmaId: sepetFirmaId,
        firmaAdi: sepetFirmaAdi,
        musteriAd: musteriAd.trim(),
        musteriTel: musteriTel.trim(),
        ilce: ilce,
        mahalle: mahalle.trim(),
        konum: konum || null,
        adresText: adresText.trim() || null,
        adresNot: adresNot.trim() || null,
        urunler: sepet.map((u) => ({
          id: u.id,
          ad: u.ad,
          fiyat: u.fiyat,
          adet: u.adet,
          foto: u.foto || null,
        })),
        toplam: sepetToplam,
        not: siparisNot.trim() || null,
        durum: "beklemede",
        odeme: "kapida",
        kuryeId: null,
        kuryeAd: null,
        kuryeHavuzZaman: null,
        kuryeAlmaZaman: null,
        kuryeTeslimZaman: null,
        musteriTeslimOnay: false,
        musteriTeslimZaman: null,
        siparisNo: siparisNoUret(),
        olusturma: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "siparisler"), siparisData);

      sepetiTemizle();
      toastGoster("Siparişiniz alındı!", "basari");
      navigate(`/takip/${docRef.id}`);
    } catch (err) {
      console.error("Sipariş gönderilemedi:", err);
      toastGoster("Sipariş gönderilemedi, tekrar deneyin", "hata");
    } finally {
      setGonderiliyor(false);
    }
  };

  if (sepet.length === 0) {
    return (
      <div>
        <header className="header">
          <button
            onClick={() => navigate(-1)}
            style={{ color: "var(--renk-bakir)", fontSize: "1.25rem", padding: "4px 8px" }}
          >
            ←
          </button>
          <div className="font-bold" style={{ marginLeft: 8 }}>
            Sepet
          </div>
        </header>
        <div className="sayfa">
          <div className="bos-durum">
            <div className="bos-durum-ikon">🛒</div>
            <div className="bos-durum-mesaj">Sepetiniz boş</div>
            <button
              className="btn btn-birincil mt-16"
              onClick={() => navigate("/")}
            >
              Yemek Seç
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <button
          onClick={() => navigate(-1)}
          style={{ color: "var(--renk-bakir)", fontSize: "1.25rem", padding: "4px 8px" }}
        >
          ←
        </button>
        <div style={{ flex: 1, marginLeft: 8 }}>
          <div className="font-bold">Sepet</div>
          <div className="text-xs" style={{ opacity: 0.8 }}>
            {sepetFirmaAdi}
          </div>
        </div>
        <button
          onClick={sepetiTemizle}
          className="text-xs"
          style={{ color: "var(--renk-gri-400)" }}
        >
          Temizle
        </button>
      </header>

      <div className="sayfa" style={{ paddingBottom: 100 }}>
        {/* Ürünler */}
        <div className="kart" style={{ marginBottom: 16 }}>
          {sepet.map((urun) => (
            <div
              key={urun.id}
              className="flex items-center justify-between"
              style={{
                padding: "10px 0",
                borderBottom: "1px solid var(--renk-gri-100)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div className="font-bold text-sm">{urun.ad}</div>
                <div className="text-xs text-muted">
                  {formatPara(urun.fiyat)} / adet
                </div>
              </div>

              {/* Adet kontrol */}
              <div className="flex items-center gap-8">
                <button
                  onClick={() => sepettenCikar(urun.id)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "var(--renk-gri-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  −
                </button>
                <span style={{ fontWeight: 700, minWidth: 20, textAlign: "center" }}>
                  {urun.adet}
                </span>
                <button
                  onClick={() =>
                    sepeteEkle(urun, sepetFirmaId, sepetFirmaAdi)
                  }
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "var(--renk-birincil)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  +
                </button>
              </div>

              <div
                style={{
                  fontWeight: 800,
                  color: "var(--renk-birincil)",
                  marginLeft: 12,
                  minWidth: 60,
                  textAlign: "right",
                }}
              >
                {formatPara(urun.fiyat * urun.adet)}
              </div>
            </div>
          ))}

          {/* Toplam */}
          <div
            className="flex justify-between"
            style={{
              paddingTop: 12,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: "1.0625rem", fontWeight: 800 }}>
              Toplam
            </span>
            <span
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "var(--renk-birincil)",
              }}
            >
              {formatPara(sepetToplam)}
            </span>
          </div>

          {/* Min sipariş uyarısı */}
          {minSiparisAlti && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "var(--renk-uyari-acik)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--renk-bakir)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ⚠️ Minimum sipariş tutarı {formatPara(minSiparis)} — {formatPara(minSiparis - sepetToplam)} daha eklemelisiniz
            </div>
          )}

          {/* Firma kapalı uyarısı */}
          {firmaKapali && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "var(--renk-tehlike-acik)",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#991b1b",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🔒 İşletme şu an kapalı — sipariş verilemez
            </div>
          )}
        </div>

        {/* Sipariş notu */}
        <div className="form-grup">
          <label className="form-etiket">Sipariş Notu (opsiyonel)</label>
          <textarea
            className="form-input"
            placeholder="Acılı olsun, sos ekstra..."
            value={siparisNot}
            onChange={(e) => setSiparisNot(e.target.value)}
            rows={2}
          />
        </div>

        {/* Müşteri bilgileri */}
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 800,
            marginBottom: 12,
            marginTop: 20,
          }}
        >
          Teslimat Bilgileri
        </h3>

        <div className="form-grup">
          <label className="form-etiket">Ad Soyad *</label>
          <input
            className="form-input"
            placeholder="Adınız Soyadınız"
            value={musteriAd}
            onChange={(e) => setMusteriAd(e.target.value)}
          />
        </div>

        <div className="form-grup">
          <label className="form-etiket">Telefon *</label>
          <input
            className="form-input"
            type="tel"
            placeholder="05XX XXX XX XX"
            value={musteriTel}
            onChange={(e) => setMusteriTel(e.target.value)}
          />
        </div>

        {/* İlçe */}
        <div className="form-grup">
          <label className="form-etiket">İlçe *</label>
          <select
            className="form-input"
            value={ilce}
            onChange={(e) => setIlce(e.target.value)}
          >
            <option value="">İlçe seçin</option>
            <option value="Şahinbey">Şahinbey</option>
            <option value="Şehitkamil">Şehitkamil</option>
            <option value="Oğuzeli">Oğuzeli</option>
            <option value="Nizip">Nizip</option>
            <option value="Araban">Araban</option>
            <option value="İslahiye">İslahiye</option>
            <option value="Nurdağı">Nurdağı</option>
            <option value="Karkamış">Karkamış</option>
            <option value="Yavuzeli">Yavuzeli</option>
          </select>
        </div>

        {/* Mahalle / Semt */}
        <div className="form-grup">
          <label className="form-etiket">Mahalle / Semt *</label>
          <input
            className="form-input"
            placeholder="Örn: Karataş Mah., Güneykent, Binevler..."
            value={mahalle}
            onChange={(e) => setMahalle(e.target.value)}
          />
        </div>

        {/* Konum */}
        <div className="form-grup">
          <label className="form-etiket">Konum (opsiyonel ama önerilir)</label>
          <KonumButon
            konum={konum}
            setKonum={setKonum}
            setAdresText={setAdresText}
          />
          {!konum && (
            <textarea
              className="form-input"
              placeholder="Konum izni veremediyseniz açık adresinizi yazın..."
              value={adresText}
              onChange={(e) => setAdresText(e.target.value)}
              rows={2}
              style={{ marginTop: 8 }}
            />
          )}
        </div>

        <div className="form-grup">
          <label className="form-etiket">Adres Notu (opsiyonel)</label>
          <input
            className="form-input"
            placeholder="Mavi bina, 3. kat, kapı kodu: 27"
            value={adresNot}
            onChange={(e) => setAdresNot(e.target.value)}
          />
        </div>

        {/* Ödeme bilgisi */}
        <div
          className="kart"
          style={{
            background: "var(--renk-bakir-acik)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: "1.25rem" }}>💵</span>
          <div>
            <div className="font-bold text-sm">Kapıda Ödeme</div>
            <div className="text-xs text-muted">
              Nakit veya kart ile kurye/işletmeye ödeme
            </div>
          </div>
        </div>

        {/* Sipariş ver butonu */}
        <button
          onClick={siparisVer}
          disabled={gonderiliyor || minSiparisAlti || firmaKapali}
          className="btn btn-birincil btn-tam btn-buyuk"
        >
          {gonderiliyor ? (
            <>
              <span
                className="spinner"
                style={{ width: 20, height: 20, borderWidth: 2 }}
              />
              Gönderiliyor...
            </>
          ) : (
            `Sipariş Ver — ${formatPara(sepetToplam)}`
          )}
        </button>
      </div>
    </div>
  );
}
