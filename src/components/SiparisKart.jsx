import { formatPara, gecenSure, SIPARIS_DURUMLARI, haritaLink } from "../utils/helpers";

export default function SiparisKart({ siparis, butonlar, gosterKurye }) {
  const durum = SIPARIS_DURUMLARI[siparis.durum] || {
    etiket: siparis.durum,
    renk: "#6b7280",
    ikon: "📋",
  };

  return (
    <div className="kart" style={{ borderLeft: `4px solid ${durum.renk}` }}>
      {/* Üst satır */}
      <div className="flex items-center justify-between mb-8">
        <span
          className="badge"
          style={{ background: durum.renk + "20", color: durum.renk }}
        >
          {durum.ikon} {durum.etiket}
        </span>
        <span className="text-xs text-muted">
          {gecenSure(siparis.olusturma)}
        </span>
      </div>

      {/* Müşteri bilgisi */}
      <div style={{ marginBottom: 8 }}>
        <div className="font-bold">{siparis.musteriAd}</div>
        <div className="text-sm text-muted">{siparis.musteriTel}</div>
      </div>

      {/* İlçe / Mahalle — belirgin gösterim */}
      {(siparis.ilce || siparis.mahalle) && (
        <div
          style={{
            background: "var(--renk-bilgi-acik)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: "1.125rem" }}>📍</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--renk-gri-900)" }}>
              {siparis.ilce}{siparis.mahalle ? ` — ${siparis.mahalle}` : ""}
            </div>
            {siparis.adresNot && (
              <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                {siparis.adresNot}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ürünler */}
      <div
        style={{
          background: "var(--renk-gri-50)",
          borderRadius: "var(--radius-sm)",
          padding: 10,
          marginBottom: 8,
        }}
      >
        {siparis.urunler?.map((u, i) => (
          <div key={i} className="flex justify-between text-sm" style={{ marginBottom: 2 }}>
            <span>
              {u.adet}x {u.ad}
            </span>
            <span className="font-bold">{formatPara(u.fiyat * u.adet)}</span>
          </div>
        ))}
        <div
          className="flex justify-between font-bold"
          style={{
            borderTop: "1px solid var(--renk-gri-200)",
            paddingTop: 6,
            marginTop: 6,
          }}
        >
          <span>Toplam</span>
          <span style={{ color: "var(--renk-birincil)" }}>
            {formatPara(siparis.toplam)}
          </span>
        </div>
      </div>

      {/* Sipariş notu */}
      {siparis.not && (
        <div
          className="text-sm"
          style={{
            background: "var(--renk-uyari-acik)",
            padding: "6px 10px",
            borderRadius: "var(--radius-xs)",
            marginBottom: 8,
          }}
        >
          📝 {siparis.not}
        </div>
      )}

      {/* Konum */}
      {siparis.konum && (
        <a
          href={haritaLink(siparis.konum.lat, siparis.konum.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            color: "var(--renk-bilgi)",
            marginBottom: 8,
          }}
        >
          📍 Haritada Aç
        </a>
      )}

      {/* Adres notu (ilçe/mahalle yoksa eski format) */}
      {!siparis.ilce && siparis.adresNot && (
        <div className="text-sm text-muted mb-8">🏠 {siparis.adresNot}</div>
      )}

      {/* Kurye bilgisi */}
      {gosterKurye && siparis.kuryeAd && (
        <div
          className="text-sm"
          style={{
            background: "var(--renk-bilgi-acik)",
            padding: "6px 10px",
            borderRadius: "var(--radius-xs)",
            marginBottom: 8,
          }}
        >
          🛵 Kurye: <strong>{siparis.kuryeAd}</strong>
        </div>
      )}

      {/* Butonlar */}
      {butonlar && (
        <div className="flex gap-8" style={{ marginTop: 8 }}>
          {butonlar}
        </div>
      )}
    </div>
  );
}
