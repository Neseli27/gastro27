import { useNavigate } from "react-router-dom";
import { formatPara } from "../utils/helpers";

export default function SepetBar({ sepetAdet, sepetToplam }) {
  const navigate = useNavigate();

  if (!sepetAdet) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        background: "linear-gradient(135deg, var(--renk-koyu-1), var(--renk-koyu-2), var(--renk-koyu-3))",
        borderTop: "2px solid var(--renk-bal)",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "var(--max-genislik)",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        {/* Sol: ürün sayısı ve toplam */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background: "var(--renk-bal)",
              color: "var(--renk-koyu-2)",
              width: 28,
              height: 28,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8125rem",
              fontWeight: 800,
            }}
          >
            {sepetAdet}
          </div>
          <div>
            <div style={{ color: "var(--renk-bakir-acik)", fontSize: "0.6875rem", fontWeight: 500 }}>
              Toplam
            </div>
            <div style={{ color: "#fff", fontSize: "1.125rem", fontWeight: 800 }}>
              {formatPara(sepetToplam)}
            </div>
          </div>
        </div>

        {/* Sağ: Sipariş Ver butonu */}
        <button
          onClick={() => navigate("/sepet")}
          style={{
            background: "var(--renk-birincil)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 24px",
            fontSize: "0.9375rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "transform 150ms ease",
          }}
        >
          Sipariş Ver →
        </button>
      </div>
    </div>
  );
}
