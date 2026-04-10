import { useEffect, useRef } from "react";

/**
 * Yeni sipariş geldiğinde ses çalar
 * @param {boolean} aktif - Ses çalınsın mı
 * @param {function} onKapat - Kapatma callback
 */
export default function BildirimModal({ aktif, onKapat }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!aktif) return;

    // Web Audio API ile basit bildirim sesi
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      gain.gain.value = 0.3;

      // Üç tonlu bildirim
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523, now);       // C5
      osc.frequency.setValueAtTime(659, now + 0.15); // E5
      osc.frequency.setValueAtTime(784, now + 0.3);  // G5

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.start(now);
      osc.stop(now + 0.6);

      // 3 saniye sonra tekrar çal (dikkat çekmek için)
      const timer = setTimeout(() => {
        try {
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.type = "sine";
          gain2.gain.value = 0.3;
          const t = ctx.currentTime;
          osc2.frequency.setValueAtTime(784, t);
          osc2.frequency.setValueAtTime(659, t + 0.15);
          osc2.frequency.setValueAtTime(784, t + 0.3);
          gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
          osc2.start(t);
          osc2.stop(t + 0.6);
        } catch {}
      }, 3000);

      return () => clearTimeout(timer);
    } catch {
      // Audio API desteklenmiyorsa sessiz devam et
    }
  }, [aktif]);

  if (!aktif) return null;

  return (
    <div className="modal-overlay" onClick={onKapat}>
      <div
        className="modal-icerik"
        onClick={(e) => e.stopPropagation()}
        style={{ textAlign: "center", padding: "32px 24px" }}
      >
        <div style={{ fontSize: "4rem", marginBottom: 16 }}>🔔</div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 8 }}>
          Yeni Sipariş!
        </h2>
        <p className="text-muted" style={{ marginBottom: 24 }}>
          Yeni bir sipariş geldi, hemen kontrol edin.
        </p>
        <button className="btn btn-birincil btn-tam" onClick={onKapat}>
          Tamam, Gördüm
        </button>
      </div>
    </div>
  );
}
