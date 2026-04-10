import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useCallback } from "react";

// Müşteri
import AnaSayfa from "./pages/musteri/AnaSayfa";
import Arama from "./pages/musteri/Arama";
import FirmaDetay from "./pages/musteri/FirmaDetay";
import Sepet from "./pages/musteri/Sepet";
import SiparisTakip from "./pages/musteri/SiparisTakip";

// İşletme
import IsletmeGiris from "./pages/isletme/IsletmeGiris";
import IsletmePanel from "./pages/isletme/IsletmePanel";

// Kurye
import KuryeGiris from "./pages/kurye/KuryeGiris";
import KuryePanel from "./pages/kurye/KuryePanel";

// Admin
import AdminPanel from "./pages/admin/AdminPanel";

// Toast Bildirimi
function Toast({ mesaj, tip, onKapat }) {
  if (!mesaj) return null;
  return (
    <div className={`toast toast-${tip}`} onClick={onKapat}>
      {mesaj}
    </div>
  );
}

export default function App() {
  // Global sepet state
  const [sepet, setSepet] = useState([]);
  const [sepetFirmaId, setSepetFirmaId] = useState(null);
  const [sepetFirmaAdi, setSepetFirmaAdi] = useState("");

  // Toast state
  const [toast, setToast] = useState({ mesaj: "", tip: "bilgi" });

  const toastGoster = useCallback((mesaj, tip = "bilgi") => {
    setToast({ mesaj, tip });
    setTimeout(() => setToast({ mesaj: "", tip: "bilgi" }), 3000);
  }, []);

  // Sepet işlemleri
  const sepeteEkle = useCallback(
    (urun, firmaId, firmaAdi) => {
      if (sepetFirmaId && sepetFirmaId !== firmaId) {
        const devam = window.confirm(
          "Sepetinizde başka bir firmadan ürün var. Sepeti temizleyip devam etmek ister misiniz?"
        );
        if (!devam) return;
        setSepet([]);
      }

      setSepetFirmaId(firmaId);
      setSepetFirmaAdi(firmaAdi);

      setSepet((prev) => {
        const mevcut = prev.find((s) => s.id === urun.id);
        if (mevcut) {
          return prev.map((s) =>
            s.id === urun.id ? { ...s, adet: s.adet + 1 } : s
          );
        }
        return [...prev, { ...urun, adet: 1 }];
      });

      toastGoster(`${urun.ad} sepete eklendi`, "basari");
    },
    [sepetFirmaId, toastGoster]
  );

  const sepettenCikar = useCallback((urunId) => {
    setSepet((prev) => {
      const urun = prev.find((s) => s.id === urunId);
      if (!urun) return prev;
      if (urun.adet <= 1) {
        const yeni = prev.filter((s) => s.id !== urunId);
        if (yeni.length === 0) {
          setSepetFirmaId(null);
          setSepetFirmaAdi("");
        }
        return yeni;
      }
      return prev.map((s) =>
        s.id === urunId ? { ...s, adet: s.adet - 1 } : s
      );
    });
  }, []);

  const sepetiTemizle = useCallback(() => {
    setSepet([]);
    setSepetFirmaId(null);
    setSepetFirmaAdi("");
  }, []);

  const sepetToplam = sepet.reduce((t, s) => t + s.fiyat * s.adet, 0);
  const sepetAdet = sepet.reduce((t, s) => t + s.adet, 0);

  const sepetProps = {
    sepet,
    sepetFirmaId,
    sepetFirmaAdi,
    sepetToplam,
    sepetAdet,
    sepeteEkle,
    sepettenCikar,
    sepetiTemizle,
    toastGoster,
  };

  return (
    <BrowserRouter>
      <Toast
        mesaj={toast.mesaj}
        tip={toast.tip}
        onKapat={() => setToast({ mesaj: "", tip: "bilgi" })}
      />

      <Routes>
        {/* Müşteri */}
        <Route path="/" element={<AnaSayfa {...sepetProps} />} />
        <Route path="/ara" element={<Arama {...sepetProps} />} />
        <Route path="/firma/:firmaId" element={<FirmaDetay {...sepetProps} />} />
        <Route path="/sepet" element={<Sepet {...sepetProps} />} />
        <Route path="/takip/:siparisId" element={<SiparisTakip />} />

        {/* İşletme */}
        <Route path="/isletme" element={<IsletmeGiris toastGoster={toastGoster} />} />
        <Route path="/isletme/panel" element={<IsletmePanel toastGoster={toastGoster} />} />

        {/* Kurye */}
        <Route path="/kurye" element={<KuryeGiris toastGoster={toastGoster} />} />
        <Route path="/kurye/panel" element={<KuryePanel toastGoster={toastGoster} />} />

        {/* Süper Admin */}
        <Route path="/admin" element={<AdminPanel toastGoster={toastGoster} />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
