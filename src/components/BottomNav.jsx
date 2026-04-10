import { useNavigate, useLocation } from "react-router-dom";

const menuler = [
  { yol: "/", ikon: "🏠", etiket: "Ana Sayfa" },
  { yol: "/ara", ikon: "🔍", etiket: "Ara" },
  { yol: "/sepet", ikon: "🛒", etiket: "Sepet" },
];

export default function BottomNav({ sepetAdet }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--renk-beyaz)",
        borderTop: "1px solid var(--renk-gri-200)",
        display: "flex",
        justifyContent: "center",
        zIndex: 80,
      }}
    >
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "var(--max-genislik)",
        }}
      >
        {menuler.map((m) => {
          const aktif = location.pathname === m.yol;
          return (
            <button
              key={m.yol}
              onClick={() => navigate(m.yol)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 0 10px",
                gap: 2,
                color: aktif ? "var(--renk-birincil)" : "var(--renk-gri-400)",
                fontWeight: aktif ? 700 : 400,
                fontSize: "0.6875rem",
                position: "relative",
                transition: "color var(--gecis-hizli)",
              }}
            >
              <span style={{ fontSize: "1.25rem", position: "relative" }}>
                {m.ikon}
                {/* Sepet badge */}
                {m.yol === "/sepet" && sepetAdet > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -10,
                      background: "var(--renk-birincil)",
                      color: "#fff",
                      fontSize: "0.625rem",
                      fontWeight: 800,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {sepetAdet}
                  </span>
                )}
              </span>
              {m.etiket}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
