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
import NetworkBanner from './components/ui/NetworkBanner';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { trackPageView } from './utils/analytics';
import { isNative, registerPushNotifications, onAppStateChange, onPushNotificationReceived } from './utils/native';

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
const AdminDealersPage = lazy(() => import('./pages/AdminDealersPage'));
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
const BlogPage = lazy(() => import('./pages/BlogPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const AdminBlogPage = lazy(() => import('./pages/AdminBlogPage'));
const AdminModerationPage = lazy(() => import('./pages/AdminModerationPage'));
const SatelliteHealthPage = lazy(() => import('./pages/SatelliteHealthPage'));
const AgriEncyclopediaPage = lazy(() => import('./pages/AgriEncyclopediaPage'));
const SellerStorePage = lazy(() => import('./pages/SellerStorePage'));
const PriceAlertsPage = lazy(() => import('./pages/PriceAlertsPage'));
const MyOffersPage = lazy(() => import('./pages/MyOffersPage'));

function PageLoader() {
  return <LoadingSpinner size="lg" className="py-20" />;
}

export default function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageView(pathname);
  }, [pathname]);

  // Native: register push notifications & app lifecycle
  useEffect(() => {
    if (!isNative) return;

    registerPushNotifications().then((token) => {
      if (token) {
        // Send push token to backend for future notifications
        import('./config/api').then(({ default: api }) => {
          api.post('/users/push-token', { token, platform: 'ios' }).catch(() => {});
        });
      }
    });

    onPushNotificationReceived((notification) => {
      import('react-hot-toast').then(({ default: toast }) => {
        toast(notification.title || 'Yeni bildirim');
      });
    });

    onAppStateChange((state) => {
      if (state.isActive) {
        // App came to foreground — refresh data if needed
        window.dispatchEvent(new Event('app-foreground'));
      }
    });
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-page)' }}>
      {!isAdmin && <Header />}
      {!isAdmin && <CategoryNav />}

      <main className={isAdmin ? '' : 'pb-20 md:pb-0'}>
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
            <Route path="/tarim-ansiklopedisi" element={<AgriEncyclopediaPage />} />
            <Route path="/uydu-analiz" element={<SatelliteHealthPage />} />
            <Route path="/bildirimler" element={<NotificationsPage />} />
            <Route path="/hal-fiyatlari" element={<HalFiyatlariPage />} />
            <Route path="/hasatlink-pazari" element={<HasatlinkPazariPage />} />
            <Route path="/mesajlar" element={<MessagesPage />} />
            <Route path="/mesajlar/:conversationId" element={<MessagesPage />} />
            <Route path="/iletisim" element={<ContactPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/blog/:slug" element={<BlogDetailPage />} />
            <Route path="/kullanici/:userId" element={<ProfilePage />} />
            <Route path="/magaza/:userId" element={<SellerStorePage />} />
            <Route path="/fiyat-alarmlari" element={<PriceAlertsPage />} />
            <Route path="/tekliflerim" element={<MyOffersPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/ilanlar" element={<AdminListingsPage />} />
            <Route path="/admin/kullanicilar" element={<AdminUsersPage />} />
            <Route path="/admin/hal-fiyatlari" element={<AdminHalPricesPage />} />
            <Route path="/admin/pazar-fiyatlari" element={<AdminPazarPricesPage />} />
            <Route path="/admin/mesajlar" element={<AdminContactsPage />} />
            <Route path="/admin/ayarlar" element={<AdminSettingsPage />} />
            <Route path="/admin/gelir" element={<AdminRevenuePage />} />
            <Route path="/admin/reklamlar" element={<AdminAdsPage />} />
            <Route path="/admin/bayiler" element={<AdminDealersPage />} />
            <Route path="/admin/bildirimler" element={<AdminNotificationsPage />} />
            <Route path="/admin/blog" element={<AdminBlogPage />} />
            <Route path="/admin/moderasyon" element={<AdminModerationPage />} />
            <Route path="/gizlilik" element={<PrivacyPage />} />
            <Route path="/kullanim-sartlari" element={<TermsPage />} />
            <Route path="/cerez-politikasi" element={<CookiePolicyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {!isAdmin && <MobileAppDownload />}
      {!isAdmin && <Footer />}
      {!isAdmin && <MobileBottomNav />}
      <ScrollToTop />
      <CookieConsent />
      {!isNative && <PWAInstallPrompt />}
      <NetworkBanner />
    </div>
  );
}
