import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import CategoryNav from './components/layout/CategoryNav';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/ui/ScrollToTop';
import CookieConsent from './components/ui/CookieConsent';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import ProfilePage from './pages/ProfilePage';
import MapPage from './pages/MapPage';
import AIDiagnosisPage from './pages/AIDiagnosisPage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';
import HalFiyatlariPage from './pages/HalFiyatlariPage';
import HasatlinkPazariPage from './pages/HasatlinkPazariPage';
import MessagesPage from './pages/MessagesPage';
import ContactPage from './pages/ContactPage';
import AdminContactsPage from './pages/AdminContactsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import { trackPageView } from './utils/analytics';

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageView(pathname);
  }, [pathname]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      <Header />
      <CategoryNav />

      <main className="pb-20 md:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/giris" element={<AuthPage />} />
          <Route path="/pazar" element={<ListingsPage />} />
          <Route path="/lojistik" element={<ListingsPage />} />
          <Route path="/isgucu" element={<ListingsPage />} />
          <Route path="/ekipman" element={<ListingsPage />} />
          <Route path="/arazi" element={<ListingsPage />} />
          <Route path="/depolama" element={<ListingsPage />} />
          <Route path="/ilan/:id" element={<ListingDetailPage />} />
          <Route path="/profil" element={<ProfilePage />} />
          <Route path="/profil/:userId" element={<ProfilePage />} />
          <Route path="/harita" element={<MapPage />} />
          <Route path="/ai-teshis" element={<AIDiagnosisPage />} />
          <Route path="/bildirimler" element={<NotificationsPage />} />
          <Route path="/hal-fiyatlari" element={<HalFiyatlariPage />} />
          <Route path="/hasatlink-pazari" element={<HasatlinkPazariPage />} />
          <Route path="/mesajlar" element={<MessagesPage />} />
          <Route path="/mesajlar/:conversationId" element={<MessagesPage />} />
          <Route path="/iletisim" element={<ContactPage />} />
          <Route path="/admin/mesajlar" element={<AdminContactsPage />} />
          <Route path="/admin/ayarlar" element={<AdminSettingsPage />} />
          <Route path="/gizlilik" element={<PrivacyPage />} />
          <Route path="/kullanim-sartlari" element={<TermsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
      <MobileBottomNav />
      <ScrollToTop />
      <CookieConsent />
    </div>
  );
}
