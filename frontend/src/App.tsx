import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import CategoryNav from './components/layout/CategoryNav';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Footer from './components/layout/Footer';
import MobileAppDownload from './components/layout/MobileAppDownload';
import ScrollToTop from './components/ui/ScrollToTop';
import CookieConsent from './components/ui/CookieConsent';
import PWAInstallPrompt from './components/ui/PWAInstallPrompt';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { trackPageView } from './utils/analytics';

// Lazy-loaded pages — each becomes its own chunk
const HomePage = lazy(() => import('./pages/HomePage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ListingsPage = lazy(() => import('./pages/ListingsPage'));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const AIDiagnosisPage = lazy(() => import('./pages/AIDiagnosisPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const HalFiyatlariPage = lazy(() => import('./pages/HalFiyatlariPage'));
const HasatlinkPazariPage = lazy(() => import('./pages/HasatlinkPazariPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminContactsPage = lazy(() => import('./pages/AdminContactsPage'));
const AdminSettingsPage = lazy(() => import('./pages/AdminSettingsPage'));
const AdminRevenuePage = lazy(() => import('./pages/AdminRevenuePage'));
const AdminAdsPage = lazy(() => import('./pages/AdminAdsPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminListingsPage = lazy(() => import('./pages/AdminListingsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminHalPricesPage = lazy(() => import('./pages/AdminHalPricesPage'));
const AdminPazarPricesPage = lazy(() => import('./pages/AdminPazarPricesPage'));
const AdminNotificationsPage = lazy(() => import('./pages/AdminNotificationsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'));
const AccountSettingsPage = lazy(() => import('./pages/AccountSettingsPage'));

function PageLoader() {
  return <LoadingSpinner size="lg" className="py-20" />;
}

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
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/giris" element={<AuthPage />} />
            <Route path="/hesap-ayarlari" element={<AccountSettingsPage />} />
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
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/ilanlar" element={<AdminListingsPage />} />
            <Route path="/admin/kullanicilar" element={<AdminUsersPage />} />
            <Route path="/admin/hal-fiyatlari" element={<AdminHalPricesPage />} />
            <Route path="/admin/pazar-fiyatlari" element={<AdminPazarPricesPage />} />
            <Route path="/admin/mesajlar" element={<AdminContactsPage />} />
            <Route path="/admin/ayarlar" element={<AdminSettingsPage />} />
            <Route path="/admin/gelir" element={<AdminRevenuePage />} />
            <Route path="/admin/reklamlar" element={<AdminAdsPage />} />
            <Route path="/admin/bildirimler" element={<AdminNotificationsPage />} />
            <Route path="/gizlilik" element={<PrivacyPage />} />
            <Route path="/kullanim-sartlari" element={<TermsPage />} />
            <Route path="/cerez-politikasi" element={<CookiePolicyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      <MobileAppDownload />
      <Footer />
      <MobileBottomNav />
      <ScrollToTop />
      <CookieConsent />
      <PWAInstallPrompt />
    </div>
  );
}
