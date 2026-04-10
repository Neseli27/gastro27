import { useNavigate } from "react-router-dom";
import { formatPara } from "../utils/helpers";

export default function SepetBar({ sepetAdet, sepetToplam }) {
  const navigate = useNavigate();

  if (!sepetAdet) return null;

  return (
    <div
      onClick={() => navigate("/sepet")}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "var(--max-genislik)",
          margin: "0 auto",
          padding: "0 12px 12px",
        }}
      >
        <button
          className="btn btn-birincil btn-tam btn-buyuk"
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--golge-xl)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                background: "rgba(255,255,255,0.25)",
                borderRadius: "var(--radius-full)",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.875rem",
                fontWeight: 800,
              }}
            >
              {sepetAdet}
            </span>
            Sepeti Gör
          </span>
          <span style={{ fontWeight: 800 }}>{formatPara(sepetToplam)}</span>
        </button>
      </div>
    </div>
  );
}
