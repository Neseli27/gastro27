import { formatPara } from "../utils/helpers";

export default function UrunKart({ urun, onEkle }) {
  return (
    <div
      className="kart"
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: 12,
      }}
    >
      {/* Ürün fotoğrafı */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "var(--radius-sm)",
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--renk-gri-100)",
        }}
      >
        {urun.foto ? (
          <img
            src={urun.foto}
            alt={urun.ad}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2rem",
              color: "var(--renk-gri-300)",
            }}
          >
            🍽️
          </div>
        )}
      </div>

      {/* Bilgi */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.9375rem",
            color: "var(--renk-gri-900)",
            marginBottom: 2,
          }}
          className="truncate"
        >
          {urun.ad}
        </div>
        {urun.aciklama && (
          <div
            className="text-xs text-muted truncate"
            style={{ marginBottom: 4 }}
          >
            {urun.aciklama}
          </div>
        )}
        <div
          style={{
            fontWeight: 800,
            color: "var(--renk-birincil)",
            fontSize: "1rem",
          }}
        >
          {formatPara(urun.fiyat)}
        </div>
      </div>

      {/* Ekle butonu */}
      <button
        onClick={() => onEkle(urun)}
        style={{
          width: 40,
          height: 40,
          borderRadius: "var(--radius-full)",
          background: "var(--renk-birincil)",
          color: "#fff",
          fontSize: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "var(--golge-sm)",
          transition: "transform var(--gecis-hizli)",
        }}
      >
        +
      </button>
    </div>
  );
}
