import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, query, where, orderBy, onSnapshot,
  doc, runTransaction, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";
import { oturumKontrol, oturumSil } from "../../utils/auth";
import {
  formatPara, gecenSure, haritaLink, SIPARIS_DURUMLARI,
} from "../../utils/helpers";

export default function KuryePanel({ toastGoster }) {
  const navigate = useNavigate();
  const [oturum, setOturum] = useState(null);
  const [sekme, setSekme] = useState("havuz");
  const [havuz, setHavuz] = useState([]);
  const [teslimatlar, setTeslimatlar] = useState([]);
  const [islemdeId, setIslemdeId] = useState(null);

  useEffect(() => {
    const o = oturumKontrol("kurye");
    if (!o) {
      navigate("/kurye", { replace: true });
      return;
    }
    setOturum(o);
  }, [navigate]);

  // Havuz: firma'nın kurye_bekliyor siparişleri
  useEffect(() => {
    if (!oturum?.firmaId) return;

    const q = query(
      collection(db, "siparisler"),
      where("firmaId", "==", oturum.firmaId),
      where("durum", "==", "kurye_bekliyor"),
      orderBy("olusturma", "asc")
    );

    return onSnapshot(q, (snap) => {
      setHavuz(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [oturum?.firmaId]);

  // Teslimatlarım: kuryenin aktif siparişleri
  useEffect(() => {
    if (!oturum?.id) return;

    const q = query(
      collection(db, "siparisler"),
      where("kuryeId", "==", oturum.id),
      where("durum", "in", ["yolda", "teslim_edildi"]),
      orderBy("olusturma", "desc")
    );

    return onSnapshot(q, (snap) => {
      setTeslimatlar(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [oturum?.id]);

  // Siparişi al — Firestore transaction ile çift atama önlenir
  const siparisiAl = async (siparisId) => {
    if (islemdeId) return;
    setIslemdeId(siparisId);

    try {
      const siparisRef = doc(db, "siparisler", siparisId);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(siparisRef);
        if (!snap.exists()) throw new Error("Sipariş bulunamadı");

        const data = snap.data();
        if (data.durum !== "kurye_bekliyor") {
          throw new Error("Bu sipariş zaten alındı");
        }

        transaction.update(siparisRef, {
          durum: "yolda",
          kuryeId: oturum.id,
          kuryeAd: oturum.kuryeAdi,
          kuryeAlmaZaman: serverTimestamp(),
        });
      });

      toastGoster("Sipariş alındı! Müşteriye yol alın.", "basari");
      setSekme("teslimatlar");
    } catch (err) {
      console.error("Sipariş alma hatası:", err);
      toastGoster(
        err.message === "Bu sipariş zaten alındı"
          ? "Bu sipariş başka kurye tarafından alındı"
          : "Sipariş alınamadı, tekrar deneyin",
        "hata"
      );
    } finally {
      setIslemdeId(null);
    }
  };

  const teslimEttim = async (siparisId) => {
    try {
      await updateDoc(doc(db, "siparisler", siparisId), {
        durum: "teslim_edildi",
        kuryeTeslimZaman: serverTimestamp(),
      });
      toastGoster("Teslim bildirildi", "basari");
    } catch {
      toastGoster("İşlem başarısız", "hata");
    }
  };

  const cikisYap = () => {
    oturumSil();
    navigate("/kurye", { replace: true });
  };

  if (!oturum) return null;

  return (
    <div>
      {/* Header */}
      <header
        className="header"
        style={{ background: "#06b6d4" }}
      >
        <div>
          <div className="font-bold">{oturum.kuryeAdi}</div>
          <div className="text-xs" style={{ opacity: 0.7 }}>
            {oturum.firmaAdi} · Kurye
          </div>
        </div>
        <button
          onClick={cikisYap}
          className="text-xs"
          style={{ color: "rgba(255,255,255,0.7)" }}
        >
          Çıkış
        </button>
      </header>

      {/* Tab bar */}
      <div style={{ padding: "12px 16px 0", maxWidth: "var(--max-genislik)", margin: "0 auto" }}>
        <div className="tab-bar">
          <button
            className={`tab-bar-btn ${sekme === "havuz" ? "aktif" : ""}`}
            onClick={() => setSekme("havuz")}
            style={
              sekme === "havuz"
                ? { background: "#06b6d4", color: "#fff" }
                : {}
            }
          >
            📦 Havuz ({havuz.length})
          </button>
          <button
            className={`tab-bar-btn ${sekme === "teslimatlar" ? "aktif" : ""}`}
            onClick={() => setSekme("teslimatlar")}
            style={
              sekme === "teslimatlar"
                ? { background: "#06b6d4", color: "#fff" }
                : {}
            }
          >
            🛵 Teslimatlarım ({teslimatlar.length})
          </button>
        </div>
      </div>

      <div className="sayfa" style={{ paddingTop: 8 }}>
        {sekme === "havuz" && (
          <>
            {havuz.length === 0 ? (
              <div className="bos-durum">
                <div className="bos-durum-ikon">📦</div>
                <div className="bos-durum-mesaj">
                  Havuzda bekleyen sipariş yok
                </div>
              </div>
            ) : (
              havuz.map((s) => (
                <div key={s.id} className="kart">
                  <div className="flex justify-between items-center mb-8">
                    <span className="font-bold">
                      #{s.siparisNo || s.id.slice(0, 6).toUpperCase()}
                    </span>
                    <span className="text-xs text-muted">
                      {gecenSure(s.olusturma)}
                    </span>
                  </div>

                  {/* İlçe / Mahalle — kurye için en önemli bilgi */}
                  {(s.ilce || s.mahalle) && (
                    <div
                      style={{
                        background: "#e0f2fe",
                        borderRadius: "var(--radius-sm)",
                        padding: "10px 12px",
                        marginBottom: 10,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: "1.25rem" }}>📍</span>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "1rem", color: "#0c4a6e" }}>
                          {s.ilce}{s.mahalle ? ` — ${s.mahalle}` : ""}
                        </div>
                        {s.adresNot && (
                          <div className="text-xs" style={{ color: "#64748b", marginTop: 2 }}>
                            {s.adresNot}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Müşteri bilgisi */}
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <div className="font-bold text-sm">{s.musteriAd}</div>
                      <a href={`tel:${s.musteriTel}`} className="text-xs" style={{ color: "var(--renk-bilgi)" }}>
                        📞 {s.musteriTel}
                      </a>
                    </div>
                    <span className="font-bold" style={{ color: "var(--renk-birincil)" }}>
                      💵 {formatPara(s.toplam)}
                    </span>
                  </div>

                  {/* Ürünler */}
                  <div
                    style={{
                      background: "var(--renk-gri-50)",
                      borderRadius: "var(--radius-sm)",
                      padding: 10,
                      marginBottom: 8,
                    }}
                  >
                    {s.urunler?.map((u, i) => (
                      <div key={i} className="text-sm" style={{ marginBottom: 2 }}>
                        {u.adet}x {u.ad}
                      </div>
                    ))}
                  </div>

                  {/* Sipariş notu */}
                  {s.not && (
                    <div
                      className="text-xs"
                      style={{
                        background: "var(--renk-uyari-acik)",
                        padding: "6px 10px",
                        borderRadius: "var(--radius-xs)",
                        marginBottom: 8,
                      }}
                    >
                      📝 {s.not}
                    </div>
                  )}

                  {/* Eski format adres (ilçe/mahalle yoksa) */}
                  {!s.ilce && s.adresNot && (
                    <div className="text-xs text-muted mb-8">
                      🏠 {s.adresNot}
                    </div>
                  )}

                  <button
                    onClick={() => siparisiAl(s.id)}
                    disabled={islemdeId === s.id}
                    className="btn btn-tam btn-buyuk"
                    style={{
                      background: "#06b6d4",
                      color: "#fff",
                    }}
                  >
                    {islemdeId === s.id ? "İşleniyor..." : "🛵 Bu Siparişi Al"}
                  </button>
                </div>
              ))
            )}
          </>
        )}

        {sekme === "teslimatlar" && (
          <>
            {teslimatlar.length === 0 ? (
              <div className="bos-durum">
                <div className="bos-durum-ikon">🛵</div>
                <div className="bos-durum-mesaj">Aktif teslimat yok</div>
              </div>
            ) : (
              teslimatlar.map((s) => (
                <div key={s.id} className="kart">
                  <div className="flex justify-between items-center mb-8">
                    <span className="font-bold">{s.musteriAd}</span>
                    <span
                      className="badge"
                      style={{
                        background:
                          s.durum === "yolda"
                            ? "var(--renk-bilgi-acik)"
                            : "var(--renk-basari-acik)",
                        color:
                          s.durum === "yolda"
                            ? "var(--renk-bilgi)"
                            : "var(--renk-basari)",
                      }}
                    >
                      {SIPARIS_DURUMLARI[s.durum]?.etiket}
                    </span>
                  </div>

                  {/* İlçe / Mahalle */}
                  {(s.ilce || s.mahalle) && (
                    <div
                      style={{
                        background: "#e0f2fe",
                        borderRadius: "var(--radius-sm)",
                        padding: "8px 12px",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: "1rem" }}>📍</span>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0c4a6e" }}>
                          {s.ilce}{s.mahalle ? ` — ${s.mahalle}` : ""}
                        </div>
                        {s.adresNot && (
                          <div className="text-xs" style={{ color: "#64748b" }}>
                            {s.adresNot}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Telefon */}
                  <a
                    href={`tel:${s.musteriTel}`}
                    className="text-sm"
                    style={{
                      color: "var(--renk-bilgi)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 8,
                    }}
                  >
                    📞 {s.musteriTel}
                  </a>

                  {/* Ürünler */}
                  <div
                    style={{
                      background: "var(--renk-gri-50)",
                      borderRadius: "var(--radius-sm)",
                      padding: 10,
                      marginBottom: 8,
                    }}
                  >
                    {s.urunler?.map((u, i) => (
                      <div key={i} className="text-sm">
                        {u.adet}x {u.ad}
                      </div>
                    ))}
                    <div
                      className="font-bold"
                      style={{
                        borderTop: "1px solid var(--renk-gri-200)",
                        paddingTop: 4,
                        marginTop: 4,
                      }}
                    >
                      Toplam: {formatPara(s.toplam)}
                    </div>
                  </div>

                  {s.adresNot && (
                    <div className="text-xs text-muted mb-8">
                      🏠 {s.adresNot}
                    </div>
                  )}

                  <div className="flex gap-8">
                    {s.konum && (
                      <a
                        href={haritaLink(s.konum.lat, s.konum.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-ikincil btn-kucuk"
                        style={{ flex: 1, textAlign: "center" }}
                      >
                        📍 Haritada Aç
                      </a>
                    )}

                    {s.durum === "yolda" && (
                      <button
                        onClick={() => teslimEttim(s.id)}
                        className="btn btn-basari btn-kucuk"
                        style={{ flex: 1 }}
                      >
                        ✅ Teslim Ettim
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
