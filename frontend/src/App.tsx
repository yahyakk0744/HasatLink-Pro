import { Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import CategoryNav from './components/layout/CategoryNav';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Footer from './components/layout/Footer';
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

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF8' }}>
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
