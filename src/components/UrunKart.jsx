import { formatPara } from "../utils/helpers";

export default function UrunKart({ urun, onEkle }) {
  return (
    <div className="kart" style={{ display: "flex", gap: 12, alignItems: "center", padding: 12 }}>
      {/* Ürün fotoğrafı */}
      <div
        style={{
          width: 68, height: 68, borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0,
          background: "linear-gradient(135deg, #fffbeb, #fef2f2)", border: "1px solid var(--renk-bakir-acik)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {urun.foto ? (
          <img src={urun.foto} alt={urun.ad} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
        ) : (
          <span style={{ fontSize: "1.75rem", color: "var(--renk-gri-300)" }}>🍽️</span>
        )}
      </div>

      {/* Bilgi */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--renk-gri-900)" }} className="truncate">{urun.ad}</div>
        {urun.aciklama && <div className="text-xs text-muted truncate" style={{ marginTop: 2 }}>{urun.aciklama}</div>}
        <div style={{ fontWeight: 800, color: "var(--renk-birincil)", fontSize: "1rem", marginTop: 4 }}>{formatPara(urun.fiyat)}</div>
      </div>

      {/* Ekle butonu */}
      <button
        onClick={() => onEkle(urun)}
        style={{
          width: 36, height: 36, borderRadius: 10, background: "var(--renk-birincil)", color: "#fff",
          fontSize: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          transition: "transform var(--gecis-hizli)",
        }}
      >+</button>
    </div>
  );
}
