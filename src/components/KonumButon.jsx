import { useState } from "react";

export default function KonumButon({ konum, setKonum, setAdresText }) {
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState("");

  const konumAl = () => {
    if (!navigator.geolocation) {
      setHata("Tarayıcınız konum desteklemiyor. Lütfen adresinizi yazın.");
      setAdresText?.("");
      return;
    }

    setYukleniyor(true);
    setHata("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setKonum({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setYukleniyor(false);
      },
      (err) => {
        setYukleniyor(false);
        if (err.code === 1) {
          setHata("Konum izni reddedildi. Lütfen adresinizi yazın.");
        } else {
          setHata("Konum alınamadı. Lütfen adresinizi yazın.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ marginBottom: 12 }}>
      {!konum ? (
        <>
          <button
            type="button"
            onClick={konumAl}
            disabled={yukleniyor}
            className="btn btn-ikincil btn-tam"
            style={{ marginBottom: 6 }}
          >
            {yukleniyor ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Konum alınıyor...
              </>
            ) : (
              <>📍 Konumumu Gönder</>
            )}
          </button>
          {hata && (
            <div className="text-xs" style={{ color: "var(--renk-tehlike)" }}>
              {hata}
            </div>
          )}
        </>
      ) : (
        <div>
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: 6 }}
          >
            <span className="text-sm" style={{ color: "var(--renk-basari)" }}>
              ✅ Konum alındı
            </span>
            <button
              type="button"
              onClick={() => setKonum(null)}
              className="text-xs"
              style={{ color: "var(--renk-tehlike)" }}
            >
              Değiştir
            </button>
          </div>

          {/* Harita önizleme */}
          <div
            style={{
              borderRadius: "var(--radius-sm)",
              overflow: "hidden",
              height: 150,
              background: "var(--renk-gri-100)",
            }}
          >
            <iframe
              title="Konum"
              src={`https://maps.google.com/maps?q=${konum.lat},${konum.lng}&z=16&output=embed`}
              style={{ width: "100%", height: "100%", border: "none" }}
              loading="lazy"
            />
          </div>
        </div>
      )}
    </div>
  );
}
