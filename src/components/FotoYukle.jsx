import { useState, useRef } from "react";
import { fotografSikistir, dosyaBoyutuFormat } from "../utils/imageCompress";

export default function FotoYukle({ foto, setFoto, setFotoDosya }) {
  const [onizleme, setOnizleme] = useState(foto || "");
  const [yukleniyor, setYukleniyor] = useState(false);
  const inputRef = useRef();

  const dosyaSec = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setYukleniyor(true);
    try {
      const blob = await fotografSikistir(file);
      const url = URL.createObjectURL(blob);
      setOnizleme(url);
      setFotoDosya(blob);
      setYukleniyor(false);
    } catch {
      setYukleniyor(false);
      alert("Fotoğraf işlenemedi, lütfen başka bir fotoğraf deneyin.");
    }
  };

  const temizle = () => {
    setOnizleme("");
    setFoto?.("");
    setFotoDosya(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={dosyaSec}
        style={{ display: "none" }}
      />

      {onizleme ? (
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={onizleme}
            alt="Önizleme"
            style={{
              width: 120,
              height: 120,
              objectFit: "cover",
              borderRadius: "var(--radius-sm)",
              border: "2px solid var(--renk-gri-200)",
            }}
          />
          <button
            type="button"
            onClick={temizle}
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "var(--renk-tehlike)",
              color: "#fff",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={yukleniyor}
          style={{
            width: 120,
            height: 120,
            border: "2px dashed var(--renk-gri-300)",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            color: "var(--renk-gri-400)",
            fontSize: "0.8125rem",
            cursor: "pointer",
            background: "var(--renk-gri-50)",
          }}
        >
          {yukleniyor ? (
            <span className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
          ) : (
            <>
              <span style={{ fontSize: "1.5rem" }}>📷</span>
              Fotoğraf
            </>
          )}
        </button>
      )}
    </div>
  );
}
