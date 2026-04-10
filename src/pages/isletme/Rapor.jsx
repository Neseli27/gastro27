import { useState, useMemo } from "react";
import { formatPara, formatTarih, SIPARIS_DURUMLARI } from "../../utils/helpers";

export default function Rapor({ firmaId, siparisler }) {
  const [baslangic, setBaslangic] = useState("");
  const [bitis, setBitis] = useState("");

  const filtreli = useMemo(() => {
    return siparisler.filter((s) => {
      if (!s.olusturma) return false;
      const tarih = s.olusturma.toDate ? s.olusturma.toDate() : new Date(s.olusturma);

      if (baslangic) {
        const bas = new Date(baslangic);
        bas.setHours(0, 0, 0, 0);
        if (tarih < bas) return false;
      }
      if (bitis) {
        const bit = new Date(bitis);
        bit.setHours(23, 59, 59, 999);
        if (tarih > bit) return false;
      }
      return true;
    });
  }, [siparisler, baslangic, bitis]);

  const tamamlanan = filtreli.filter((s) => s.durum === "tamamlandi");
  const toplamCiro = tamamlanan.reduce((t, s) => t + (s.toplam || 0), 0);
  const toplamSiparis = filtreli.length;
  const tamamlananSayi = tamamlanan.length;
  const iptalSayi = filtreli.filter(
    (s) => s.durum === "iptal_isletme" || s.durum === "iptal_musteri" || s.durum === "reddedildi"
  ).length;

  return (
    <div>
      {/* Tarih filtresi */}
      <div className="flex gap-8 mb-16">
        <div style={{ flex: 1 }}>
          <label className="form-etiket">Başlangıç</label>
          <input
            type="date"
            className="form-input"
            value={baslangic}
            onChange={(e) => setBaslangic(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-etiket">Bitiş</label>
          <input
            type="date"
            className="form-input"
            value={bitis}
            onChange={(e) => setBitis(e.target.value)}
          />
        </div>
      </div>

      {/* İstatistik kartları */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div className="kart text-center">
          <div className="text-xs text-muted">Toplam Ciro</div>
          <div
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--renk-basari)",
            }}
          >
            {formatPara(toplamCiro)}
          </div>
        </div>
        <div className="kart text-center">
          <div className="text-xs text-muted">Toplam Sipariş</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>
            {toplamSiparis}
          </div>
        </div>
        <div className="kart text-center">
          <div className="text-xs text-muted">Tamamlanan</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--renk-basari)" }}>
            {tamamlananSayi}
          </div>
        </div>
        <div className="kart text-center">
          <div className="text-xs text-muted">İptal/Ret</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--renk-tehlike)" }}>
            {iptalSayi}
          </div>
        </div>
      </div>

      {/* Sipariş geçmişi */}
      <h3 style={{ fontSize: "0.9375rem", fontWeight: 700, marginBottom: 8 }}>
        Sipariş Geçmişi
      </h3>

      {filtreli.length === 0 ? (
        <div className="bos-durum">
          <div className="bos-durum-ikon">📊</div>
          <div className="bos-durum-mesaj">Bu tarih aralığında sipariş yok</div>
        </div>
      ) : (
        filtreli.map((s) => {
          const durum = SIPARIS_DURUMLARI[s.durum];
          return (
            <div key={s.id} className="kart" style={{ padding: 12 }}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-sm">{s.musteriAd}</span>
                  <span
                    className="badge"
                    style={{
                      marginLeft: 8,
                      background: (durum?.renk || "#999") + "20",
                      color: durum?.renk || "#999",
                    }}
                  >
                    {durum?.etiket || s.durum}
                  </span>
                </div>
                <span className="font-bold" style={{ color: "var(--renk-birincil)" }}>
                  {formatPara(s.toplam)}
                </span>
              </div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                {formatTarih(s.olusturma)} · {s.urunler?.length || 0} ürün
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
