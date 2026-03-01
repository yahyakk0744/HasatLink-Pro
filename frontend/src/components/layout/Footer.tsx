import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronDown, Download, Share, Smartphone } from 'lucide-react';
import api from '../../config/api';

/* ---- Social SVG Icons ---- */
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );
}
function XIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}
function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

/* ---- Accordion Section (mobile only) ---- */
function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6560]">{title}</span>
        <ChevronDown size={14} className={`text-[#6B6560] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-60 opacity-100 pb-3' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  );
}

interface Socials {
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
}

function detectPlatform(): 'android' | 'ios' | 'other' {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  return 'other';
}

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const year = new Date().getFullYear();
  const [socials, setSocials] = useState<Socials>({ instagramUrl: '', twitterUrl: '', linkedinUrl: '', youtubeUrl: '' });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform] = useState(() => detectPlatform());

  useEffect(() => {
    api.get('/settings').then(({ data }) => setSocials({
      instagramUrl: data.instagramUrl || '',
      twitterUrl: data.twitterUrl || '',
      linkedinUrl: data.linkedinUrl || '',
      youtubeUrl: data.youtubeUrl || '',
    })).catch(() => {});

    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (platform === 'android') {
      const link = document.createElement('a');
      link.href = '/downloads/HasatLink.apk';
      link.download = 'HasatLink.apk';
      link.click();
      return;
    }
    if (deferredPrompt) { await deferredPrompt.prompt(); setDeferredPrompt(null); }
  };

  const hasSocials = socials.instagramUrl || socials.twitterUrl || socials.linkedinUrl || socials.youtubeUrl;

  const socialIcons = [
    { url: socials.instagramUrl, icon: <InstagramIcon />, label: 'Instagram' },
    { url: socials.twitterUrl, icon: <XIcon />, label: 'X' },
    { url: socials.linkedinUrl, icon: <LinkedInIcon />, label: 'LinkedIn' },
    { url: socials.youtubeUrl, icon: <YouTubeIcon />, label: 'YouTube' },
  ].filter(s => s.url);

  return (
    <footer className="bg-[#1A1A1A] text-white mt-16 pb-24 md:pb-0">
      <div className="max-w-7xl mx-auto px-4">

        {/* ====== MOBILE LAYOUT ====== */}
        <div className="md:hidden py-6">
          {/* Brand + Socials — compact */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight leading-none">
                <span className="text-white">HASAT</span>
                <span className="text-[#2D6A4F]">LiNK</span>
              </h3>
              <p className="text-[10px] text-[#6B6560] mt-0.5">{isTr ? "Türkiye'nin tarım pazaryeri" : 'Agricultural marketplace'}</p>
            </div>
            {hasSocials && (
              <div className="flex items-center gap-2">
                {socialIcons.map(s => (
                  <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-[#2D6A4F] hover:text-white transition-colors">
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Accordion Sections */}
          <AccordionSection title={isTr ? 'Pazar' : 'Market'}>
            <div className="flex flex-col gap-1.5 pl-1">
              <Link to="/pazar" className="text-xs text-white/60 hover:text-white">{t('categories.pazar')}</Link>
              <Link to="/lojistik" className="text-xs text-white/60 hover:text-white">{t('categories.lojistik')}</Link>
              <Link to="/isgucu" className="text-xs text-white/60 hover:text-white">{t('categories.isgucu')}</Link>
              <Link to="/ekipman" className="text-xs text-white/60 hover:text-white">{t('categories.ekipman')}</Link>
              <Link to="/arazi" className="text-xs text-white/60 hover:text-white">{t('categories.arazi')}</Link>
              <Link to="/depolama" className="text-xs text-white/60 hover:text-white">{t('categories.depolama')}</Link>
            </div>
          </AccordionSection>

          <AccordionSection title={isTr ? 'Özellikler' : 'Features'}>
            <div className="flex flex-col gap-1.5 pl-1">
              <Link to="/harita" className="text-xs text-white/60 hover:text-white">{t('map.title')}</Link>
              <Link to="/ai-teshis" className="text-xs text-white/60 hover:text-white">{t('ai.title')}</Link>
              <Link to="/hal-fiyatlari" className="text-xs text-white/60 hover:text-white">{isTr ? 'Hal Fiyatları' : 'Market Prices'}</Link>
              <Link to="/hasatlink-pazari" className="text-xs text-white/60 hover:text-white">{isTr ? 'HasatLink Pazarı' : 'HasatLink Market'}</Link>
              <Link to="/iletisim" className="text-xs text-white/60 hover:text-white">{isTr ? 'İletişim' : 'Contact'}</Link>
            </div>
          </AccordionSection>

          <AccordionSection title={isTr ? 'Yasal' : 'Legal'}>
            <div className="flex flex-col gap-1.5 pl-1">
              <Link to="/gizlilik" className="text-xs text-white/60 hover:text-white">{isTr ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link>
              <Link to="/kullanim-sartlari" className="text-xs text-white/60 hover:text-white">{isTr ? 'Kullanım Şartları' : 'Terms of Service'}</Link>
              <Link to="/cerez-politikasi" className="text-xs text-white/60 hover:text-white">{isTr ? 'Çerez Politikası' : 'Cookie Policy'}</Link>
              <Link to="/iletisim" className="text-xs text-white/60 hover:text-white">{isTr ? 'İletişim' : 'Contact'}</Link>
            </div>
          </AccordionSection>

          {/* App install — platform-aware */}
          {!isStandalone && (
            <div className="flex items-center gap-3 mt-4 py-3 px-3 bg-white/5 rounded-xl">
              {platform === 'android' ? (
                <Smartphone size={16} className="text-[#2D6A4F] shrink-0" />
              ) : platform === 'ios' ? (
                <Share size={16} className="text-[#2D6A4F] shrink-0" />
              ) : (
                <Download size={16} className="text-[#2D6A4F] shrink-0" />
              )}
              <p className="flex-1 text-[11px] text-white/60 leading-tight">
                {platform === 'android'
                  ? (isTr ? 'Android uygulamayı indir' : 'Download Android app')
                  : platform === 'ios'
                  ? (isTr ? 'Ana ekrana ekle' : 'Add to home screen')
                  : (isTr ? 'Uygulamayı yükle' : 'Install the app')}
              </p>
              {platform === 'android' ? (
                <a
                  href="/downloads/HasatLink.apk"
                  download="HasatLink.apk"
                  className="px-3 py-1.5 bg-[#2D6A4F] text-white text-[10px] font-semibold uppercase rounded-lg hover:bg-[#1B4332] transition-colors shrink-0"
                >
                  {isTr ? 'İndir' : 'Download'}
                </a>
              ) : (
                <button
                  onClick={handleInstallPWA}
                  className="px-3 py-1.5 bg-[#2D6A4F] text-white text-[10px] font-semibold uppercase rounded-lg hover:bg-[#1B4332] transition-colors shrink-0"
                >
                  {platform === 'ios' ? (isTr ? 'Nasıl?' : 'How?') : (isTr ? 'Yükle' : 'Install')}
                </button>
              )}
            </div>
          )}

          {/* Bottom bar */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between flex-wrap gap-2">
            <p className="text-[10px] text-[#6B6560]">&copy; {year} HasatLink</p>
            <div className="flex items-center gap-3 text-[10px] text-[#6B6560]">
              <Link to="/gizlilik" className="hover:text-white">{isTr ? 'Gizlilik' : 'Privacy'}</Link>
              <Link to="/kullanim-sartlari" className="hover:text-white">{isTr ? 'Şartlar' : 'Terms'}</Link>
              <Link to="/cerez-politikasi" className="hover:text-white">{isTr ? 'Çerez' : 'Cookies'}</Link>
              <Link to="/iletisim" className="hover:text-white">{isTr ? 'İletişim' : 'Contact'}</Link>
            </div>
          </div>
        </div>

        {/* ====== DESKTOP LAYOUT ====== */}
        <div className="hidden md:block py-12">
          <div className="grid grid-cols-4 gap-8">
            {/* Brand + Social */}
            <div>
              <h3 className="text-xl font-semibold tracking-tight mb-3">
                <span className="text-white">HASAT</span>
                <span className="text-[#2D6A4F]">LiNK</span>
              </h3>
              <p className="text-sm text-[#6B6560] mb-4">{t('footer.description')}</p>
              {hasSocials && (
                <div className="flex items-center gap-2">
                  {socialIcons.map(s => (
                    <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-[#2D6A4F] hover:text-white transition-colors">
                      {s.icon}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] mb-3">{t('categories.pazar')}</h4>
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
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] mb-3">{isTr ? 'Özellikler' : 'Features'}</h4>
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
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] mb-3">{isTr ? 'Yasal' : 'Legal'}</h4>
              <div className="flex flex-col gap-2">
                <Link to="/gizlilik" className="text-sm text-white/70 hover:text-white">{isTr ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link>
                <Link to="/kullanim-sartlari" className="text-sm text-white/70 hover:text-white">{isTr ? 'Kullanım Şartları' : 'Terms of Service'}</Link>
                <Link to="/cerez-politikasi" className="text-sm text-white/70 hover:text-white">{isTr ? 'Çerez Politikası' : 'Cookie Policy'}</Link>
                <Link to="/iletisim" className="text-sm text-white/70 hover:text-white">{isTr ? 'İletişim' : 'Contact'}</Link>
              </div>
            </div>
          </div>

          {/* Desktop app download */}
          {!isStandalone && (
            <div className="border-t border-white/10 mt-8 pt-8">
              <div className="flex items-center gap-6 bg-gradient-to-r from-[#2D6A4F]/20 to-[#1B4332]/20 border border-[#2D6A4F]/30 rounded-2xl p-6">
                <div className="w-12 h-12 bg-[#2D6A4F] rounded-xl flex items-center justify-center shrink-0">
                  <Smartphone size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold">
                    {isTr ? 'HasatLink Mobil Uygulamayı İndir' : 'Download HasatLink Mobile App'}
                  </h4>
                  <p className="text-xs text-white/60 mt-0.5">
                    {isTr ? 'Android APK ile hemen yükleyin veya PWA olarak ekleyin' : 'Install via Android APK or add as PWA'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href="/downloads/HasatLink.apk"
                    download="HasatLink.apk"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#1A1A1A] rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
                  >
                    <Download size={16} />
                    Android APK
                  </a>
                  {deferredPrompt && (
                    <button
                      onClick={handleInstallPWA}
                      className="flex items-center gap-2 px-5 py-2.5 border border-white/20 text-white rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors"
                    >
                      <Download size={16} />
                      PWA
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Desktop bottom bar */}
          <div className="border-t border-white/10 mt-8 pt-6 flex items-center justify-between">
            <p className="text-xs text-[#6B6560]">&copy; {year} HasatLink. {t('footer.rights')}</p>
            <div className="flex items-center gap-4 text-xs text-[#6B6560]">
              <Link to="/gizlilik" className="hover:text-white">{isTr ? 'Gizlilik' : 'Privacy'}</Link>
              <Link to="/kullanim-sartlari" className="hover:text-white">{isTr ? 'Kullanım Şartları' : 'Terms'}</Link>
              <Link to="/cerez-politikasi" className="hover:text-white">{isTr ? 'Çerezler' : 'Cookies'}</Link>
              <Link to="/iletisim" className="hover:text-white">{isTr ? 'İletişim' : 'Contact'}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
