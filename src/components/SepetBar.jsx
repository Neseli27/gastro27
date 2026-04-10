import { useNavigate } from "react-router-dom";
import { formatPara } from "../utils/helpers";

export default function SepetBar({ sepetAdet, sepetToplam }) {
  const navigate = useNavigate();

  if (!sepetAdet) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 52,
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
          padding: "0 12px",
        }}
      >
        <button
          onClick={() => navigate("/sepet")}
          className="sepet-bar-btn"
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="sepet-bar-count">{sepetAdet}</span>
            Sepeti Gör
          </span>
          <span style={{ fontWeight: 800 }}>{formatPara(sepetToplam)}</span>
        </button>
      </div>
    </div>
  );
}
