import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../firebase";
import { formatPara, formatTarih, SIPARIS_DURUMLARI } from "../../utils/helpers";
import BottomNav from "../../components/BottomNav";

export default function GecmisSiparisler() {
  const navigate = useNavigate();
  const [telefon, setTelefon] = useState("");
  const [siparisler, setSiparisler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aranmis, setAranmis] = useState(false);

  const siparisleriGetir = async (e) => {
    e.preventDefault();
    if (!telefon.trim() || telefon.trim().length < 10) return;

    setYukleniyor(true);
    setAranmis(true);
    try {
      const q = query(
        collection(db, "siparisler"),
        where("musteriTel", "==", telefon.trim()),
        orderBy("olusturma", "desc")
      );
      const snap = await getDocs(q);
      setSiparisler(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Siparişler yüklenemedi:", err);
      // Index gerekebilir — ilk seferinde hata verir
      setSiparisler([]);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "center", background: "var(--renk-beyaz)", borderBottom: "1.5px solid var(--renk-bal-acik)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ width: "100%", maxWidth: "var(--max-genislik)", padding: "0 16px", height: "var(--nav-yukseklik)", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => navigate("/")} style={{ color: "var(--renk-bakir)", fontSize: "1.25rem", padding: "4px" }}>←</button>
          <div className="font-bold" style={{ color: "var(--renk-gri-900)" }}>Geçmiş Siparişlerim</div>
        </div>
      </div>

      <div className="sayfa">
        {/* Telefon arama */}
        <form onSubmit={siparisleriGetir} style={{ marginBottom: 16 }}>
          <div className="text-sm text-muted" style={{ marginBottom: 10 }}>
            Sipariş verirken kullandığınız telefon numarasını girin
          </div>
          <div className="flex gap-8">
            <input
              className="form-input"
              type="tel"
              placeholder="05XX XXX XX XX"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              disabled={yukleniyor}
              className="btn btn-birincil"
            >
              {yukleniyor ? "..." : "Ara"}
            </button>
          </div>
        </form>

        {/* Sonuçlar */}
        {yukleniyor ? (
          <div className="yukleniyor"><div className="spinner" /></div>
        ) : !aranmis ? null : siparisler.length === 0 ? (
          <div className="bos-durum">
            <div className="bos-durum-ikon">📋</div>
            <div className="bos-durum-mesaj">Bu numaraya ait sipariş bulunamadı</div>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted mb-10">{siparisler.length} sipariş bulundu</div>
            {siparisler.map((s) => {
              const durum = SIPARIS_DURUMLARI[s.durum] || { etiket: s.durum, renk: "#78716c", ikon: "📋" };
              const devamEden = !["tamamlandi", "iptal_isletme", "iptal_musteri", "reddedildi"].includes(s.durum);

              return (
                <div
                  key={s.id}
                  className="kart"
                  style={{ cursor: devamEden ? "pointer" : "default" }}
                  onClick={() => devamEden && navigate(`/takip/${s.id}`)}
                >
                  {/* Üst satır */}
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <span className="font-bold" style={{ fontSize: "0.9375rem" }}>
                        {s.firmaAdi}
                      </span>
                    </div>
                    <span
                      className="badge"
                      style={{ background: durum.renk + "20", color: durum.renk }}
                    >
                      {durum.ikon} {durum.etiket}
                    </span>
                  </div>

                  {/* Ürünler */}
                  <div className="text-sm text-muted" style={{ marginBottom: 6 }}>
                    {s.urunler?.map((u) => `${u.adet}x ${u.ad}`).join(", ")}
                  </div>

                  {/* Alt satır */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">
                      {formatTarih(s.olusturma)}
                    </span>
                    <span style={{ fontWeight: 800, color: "var(--renk-birincil)", fontSize: "0.9375rem" }}>
                      {formatPara(s.toplam)}
                    </span>
                  </div>

                  {/* Aktif sipariş ise takip et butonu */}
                  {devamEden && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "6px 12px",
                        background: "var(--renk-bakir-acik)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--renk-bakir)",
                        textAlign: "center",
                      }}
                    >
                      Takip Et →
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <BottomNav sepetAdet={0} />
    </div>
  );
}
