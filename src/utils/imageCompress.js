/**
 * GASTRO27 — Client-side Fotoğraf Sıkıştırma
 * Max 800px, JPEG %80 kalite
 */

/**
 * Fotoğrafı sıkıştır
 * @param {File} file - Seçilen dosya
 * @param {object} opts - { maxBoyut: 800, kalite: 0.8 }
 * @returns {Promise<Blob>} Sıkıştırılmış blob
 */
export function fotografSikistir(file, opts = {}) {
  const { maxBoyut = 800, kalite = 0.8 } = opts;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // En-boy oranını koru, büyük kenarı maxBoyut'a düşür
      if (width > maxBoyut || height > maxBoyut) {
        if (width > height) {
          height = Math.round((height * maxBoyut) / width);
          width = maxBoyut;
        } else {
          width = Math.round((width * maxBoyut) / height);
          height = maxBoyut;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      // Beyaz arka plan (JPEG transparency desteği yok)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Fotoğraf sıkıştırılamadı"));
          }
        },
        "image/jpeg",
        kalite
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Fotoğraf yüklenemedi"));
    };

    img.src = url;
  });
}

/**
 * Dosya boyutunu okunabilir formata çevir
 */
export function dosyaBoyutuFormat(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
