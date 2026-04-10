import { useNavigate, useLocation } from "react-router-dom";

const menuler = [
  { yol: "/", ikon: "🏠", etiket: "Ana Sayfa" },
  { yol: "/ara", ikon: "🔍", etiket: "Ara" },
  { yol: "/siparislerim", ikon: "📋", etiket: "Siparişlerim" },
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
        borderTop: "1.5px solid var(--renk-bal-acik)",
        display: "flex",
        justifyContent: "center",
        zIndex: 80,
      }}
    >
      <div style={{ display: "flex", width: "100%", maxWidth: "var(--max-genislik)" }}>
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
                color: aktif ? "var(--renk-bakir)" : "var(--renk-gri-300)",
                fontWeight: aktif ? 700 : 500,
                fontSize: "0.625rem",
                position: "relative",
                transition: "color var(--gecis-hizli)",
              }}
            >
              {/* Aktif çizgi */}
              {aktif && (
                <div
                  style={{
                    position: "absolute",
                    top: -1.5,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 32,
                    height: 3,
                    background: "linear-gradient(to right, var(--renk-bal), var(--renk-bal-parlak))",
                    borderRadius: "0 0 3px 3px",
                  }}
                />
              )}
              <span style={{ fontSize: "1.125rem", position: "relative" }}>
                {m.ikon}
                {m.yol === "/sepet" && sepetAdet > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -10,
                      background: "var(--renk-birincil)",
                      color: "#fff",
                      fontSize: "0.5625rem",
                      fontWeight: 800,
                      width: 16,
                      height: 16,
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
