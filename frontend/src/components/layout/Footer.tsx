import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../../config/api';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const year = new Date().getFullYear();
  const [socials, setSocials] = useState({ instagramUrl: '', twitterUrl: '' });

  useEffect(() => {
    api.get('/settings').then(({ data }) => setSocials(data)).catch(() => {});
  }, []);

  const hasSocials = socials.instagramUrl || socials.twitterUrl;

  return (
    <footer className="bg-[#1A1A1A] text-white py-12 mt-16 hidden md:block">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand + Social */}
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3">
              <span className="text-white">HASAT</span>
              <span className="text-[#2D6A4F]">LiNK</span>
            </h3>
            <p className="text-sm text-[#6B6560] mb-4">{t('footer.description')}</p>
            {hasSocials && (
              <div className="flex items-center gap-3">
                {socials.instagramUrl && (
                  <a href={socials.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-[#2D6A4F] hover:text-white transition-colors">
                    <InstagramIcon />
                  </a>
                )}
                {socials.twitterUrl && (
                  <a href={socials.twitterUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-[#2D6A4F] hover:text-white transition-colors">
                    <XIcon />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[#6B6560] mb-3">{t('categories.pazar')}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/pazar" className="text-sm text-white/70 hover:text-white">{t('categories.pazar')}</Link>
              <Link to="/lojistik" className="text-sm text-white/70 hover:text-white">{t('categories.lojistik')}</Link>
              <Link to="/isgucu" className="text-sm text-white/70 hover:text-white">{t('categories.isgucu')}</Link>
              <Link to="/ekipman" className="text-sm text-white/70 hover:text-white">{t('categories.ekipman')}</Link>
              <Link to="/arazi" className="text-sm text-white/70 hover:text-white">{t('categories.arazi')}</Link>
              <Link to="/depolama" className="text-sm text-white/70 hover:text-white">{t('categories.depolama')}</Link>
            </div>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[#6B6560] mb-3">{t('features')}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/harita" className="text-sm text-white/70 hover:text-white">{t('map.title')}</Link>
              <Link to="/ai-teshis" className="text-sm text-white/70 hover:text-white">{t('ai.title')}</Link>
              <Link to="/hal-fiyatlari" className="text-sm text-white/70 hover:text-white">{isTr ? 'Hal Fiyatları' : 'Market Prices'}</Link>
              <Link to="/hasatlink-pazari" className="text-sm text-white/70 hover:text-white">{isTr ? 'HasatLink Pazarı' : 'HasatLink Market'}</Link>
              <Link to="/iletisim" className="text-sm text-white/70 hover:text-white">{isTr ? 'İletişim' : 'Contact'}</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[#6B6560] mb-3">{isTr ? 'Yasal' : 'Legal'}</h4>
            <div className="flex flex-col gap-2">
              <Link to="/gizlilik" className="text-sm text-white/70 hover:text-white">{t('footer.privacy')}</Link>
              <Link to="/kullanim-sartlari" className="text-sm text-white/70 hover:text-white">{t('footer.terms')}</Link>
              <Link to="/iletisim" className="text-sm text-white/70 hover:text-white">{isTr ? 'İletişim' : 'Contact'}</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6B6560]">&copy; {year} HasatLink. {t('footer.rights')}</p>
          <div className="flex items-center gap-4 text-xs text-[#6B6560]">
            <Link to="/gizlilik" className="hover:text-white">{t('footer.privacy')}</Link>
            <Link to="/kullanim-sartlari" className="hover:text-white">{t('footer.terms')}</Link>
            <Link to="/iletisim" className="hover:text-white">{isTr ? 'İletişim' : 'Contact'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
