/**
 * GASTRO27 — Yardımcı Fonksiyonlar
 */

// ══════════════════════════════════════
// Gaziantep Varsayılan Kategoriler
// ══════════════════════════════════════
export const VARSAYILAN_KATEGORILER = [
  "Lahmacun",
  "Kebap/Döner",
  "Pide/Künefe",
  "Baklava/Tatlı",
  "Kahvaltılık",
  "Baharat/Sos/Salça",
  "Kuruyemiş/Çerez",
  "Ev Yemekleri",
  "Çiğ Köfte",
  "İçecek/Şerbet/Ayran",
];

// ══════════════════════════════════════
// Sipariş Durumları
// ══════════════════════════════════════
export const SIPARIS_DURUMLARI = {
  beklemede: { etiket: "Beklemede", renk: "#f59e0b", ikon: "⏳" },
  onaylandi: { etiket: "Onaylandı", renk: "#3b82f6", ikon: "✅" },
  hazirlaniyor: { etiket: "Hazırlanıyor", renk: "#8b5cf6", ikon: "👨‍🍳" },
  kurye_bekliyor: { etiket: "Kurye Bekleniyor", renk: "#f97316", ikon: "📦" },
  yolda: { etiket: "Yolda", renk: "#06b6d4", ikon: "🛵" },
  teslim_edildi: { etiket: "Teslim Edildi", renk: "#10b981", ikon: "📬" },
  tamamlandi: { etiket: "Tamamlandı", renk: "#6b7280", ikon: "✔️" },
  iptal_isletme: { etiket: "İşletme İptal Etti", renk: "#ef4444", ikon: "❌" },
  iptal_musteri: { etiket: "Müşteri İptal Etti", renk: "#ef4444", ikon: "❌" },
  reddedildi: { etiket: "Reddedildi", renk: "#ef4444", ikon: "🚫" },
};

// ══════════════════════════════════════
// Haftanın Günleri (Türkçe)
// ══════════════════════════════════════
export const HAFTANIN_GUNLERI = [
  "pazartesi",
  "sali",
  "carsamba",
  "persembe",
  "cuma",
  "cumartesi",
  "pazar",
];

export const GUN_ETIKETLERI = {
  pazartesi: "Pazartesi",
  sali: "Salı",
  carsamba: "Çarşamba",
  persembe: "Perşembe",
  cuma: "Cuma",
  cumartesi: "Cumartesi",
  pazar: "Pazar",
};

// ══════════════════════════════════════
// Format Fonksiyonları
// ══════════════════════════════════════

/** Para formatı: 355 → "355 ₺" */
export function formatPara(tutar) {
  if (tutar == null) return "0 ₺";
  return (
    Number(tutar).toLocaleString("tr-TR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }) + " ₺"
  );
}

/** Tarih formatı: Firestore timestamp → "12.04.2026 14:30" */
export function formatTarih(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Kısa saat: "14:30" */
export function formatSaat(ts) {
  if (!ts) return "-";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Geçen süre: "3 dk önce", "1 saat önce" */
export function gecenSure(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const fark = Date.now() - d.getTime();
  const dk = Math.floor(fark / 60000);
  if (dk < 1) return "Az önce";
  if (dk < 60) return `${dk} dk önce`;
  const saat = Math.floor(dk / 60);
  if (saat < 24) return `${saat} saat önce`;
  const gun = Math.floor(saat / 24);
  return `${gun} gün önce`;
}

// ══════════════════════════════════════
// Türkçe Arama Normalize
// ══════════════════════════════════════

/** Türkçe karakterleri normalize et (arama için) */
export function normalizeArama(str) {
  if (!str) return "";
  return str
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .trim();
}

// ══════════════════════════════════════
// Sipariş No Üretici (6 haneli)
// ══════════════════════════════════════
export function siparisNoUret() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ══════════════════════════════════════
// Çalışma Saati Kontrolü
// ══════════════════════════════════════

/** Firma şu an açık mı kontrol et */
export function firmaAcikMi(calismaSaatleri) {
  if (!calismaSaatleri) return true; // Saat bilgisi yoksa açık kabul et

  const simdi = new Date();
  const gunler = [
    "pazar",
    "pazartesi",
    "sali",
    "carsamba",
    "persembe",
    "cuma",
    "cumartesi",
  ];
  const bugun = gunler[simdi.getDay()];
  const gunBilgi = calismaSaatleri[bugun];

  if (!gunBilgi || gunBilgi.kapali) return false;

  const saat = simdi.getHours() * 100 + simdi.getMinutes();
  const acilis = parseInt(gunBilgi.acilis?.replace(":", "") || "0", 10);
  const kapanis = parseInt(gunBilgi.kapanis?.replace(":", "") || "2359", 10);

  return saat >= acilis && saat <= kapanis;
}

// ══════════════════════════════════════
// Google Maps Yardımcıları
// ══════════════════════════════════════

/** Google Maps navigasyon linki */
export function haritaLink(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Google Maps statik harita önizleme (ücretsiz embed) */
export function haritaOnizleme(lat, lng) {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
}
