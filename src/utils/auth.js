/**
 * GASTRO27 — Kimlik Doğrulama Yardımcıları
 * SHA-256 tabanlı şifre hash + localStorage oturum yönetimi
 */

// SHA-256 hash (Web Crypto API)
export async function hashSifre(sifre) {
  const encoder = new TextEncoder();
  const data = encoder.encode(sifre);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Oturum anahtarları
const OTURUM_KEY = "gastro27_oturum";

/**
 * Oturum kaydet
 * @param {"isletme"|"kurye"|"admin"} rol
 * @param {string} id - firmaId veya kuryeId
 * @param {object} ekstra - { firmaAdi, kuryeAdi, firmaId (kurye için) vs. }
 */
export function oturumKaydet(rol, id, ekstra = {}) {
  const oturum = {
    rol,
    id,
    ...ekstra,
    zaman: Date.now(),
  };
  localStorage.setItem(OTURUM_KEY, JSON.stringify(oturum));
}

/** Oturum oku — yoksa null */
export function oturumOku() {
  try {
    const raw = localStorage.getItem(OTURUM_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Oturum sil (çıkış) */
export function oturumSil() {
  localStorage.removeItem(OTURUM_KEY);
}

/**
 * Belirli role sahip oturum var mı kontrol et
 * @param {"isletme"|"kurye"|"admin"} gerekliRol
 * @returns {object|null}
 */
export function oturumKontrol(gerekliRol) {
  const oturum = oturumOku();
  if (!oturum) return null;
  if (oturum.rol !== gerekliRol) return null;
  // 24 saatlik oturum süresi
  if (Date.now() - oturum.zaman > 24 * 60 * 60 * 1000) {
    oturumSil();
    return null;
  }
  return oturum;
}
