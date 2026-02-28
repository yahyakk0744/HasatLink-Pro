import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

export default function CookieConsent() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('hasatlink_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('hasatlink_cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('hasatlink_cookie_consent', 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-lg p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie size={20} className="text-[#A47148] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold mb-1">
              {isTr ? 'Çerez Bildirimi' : 'Cookie Notice'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {isTr
                ? 'HasatLink, deneyiminizi iyileştirmek için çerezler kullanır. Devam ederek KVKK kapsamındaki çerez politikamızı kabul etmiş olursunuz.'
                : 'HasatLink uses cookies to improve your experience. By continuing, you accept our cookie policy under GDPR regulations.'}
              {' '}
              <Link to="/cerez-politikasi" className="text-[#2D6A4F] underline hover:no-underline">
                {isTr ? 'Çerez Politikası' : 'Cookie Policy'}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={handleReject}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-full border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            {isTr ? 'Reddet' : 'Reject'}
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium uppercase tracking-wider rounded-full bg-[#2D6A4F] text-white hover:bg-[#1B4332] transition-colors"
          >
            {isTr ? 'Kabul Et' : 'Accept'}
          </button>
          <button onClick={handleReject} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] sm:hidden">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
