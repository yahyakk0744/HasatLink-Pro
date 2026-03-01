import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'hasatlink_pwa_dismissed';

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check if dismissed forever
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === 'forever' || standalone) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // Check if mobile
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    if (!isMobile) return;

    // Android: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS: show after 2 seconds
    if (ios) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => { clearTimeout(timer); window.removeEventListener('beforeinstallprompt', handler); };
    }

    // Android fallback: show after 3 seconds if no prompt event
    const fallback = setTimeout(() => {
      if (!deferredPrompt) setShow(true);
    }, 3000);

    return () => { clearTimeout(fallback); window.removeEventListener('beforeinstallprompt', handler); };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    }
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
  };

  const handleNeverShow = () => {
    localStorage.setItem(DISMISSED_KEY, 'forever');
    setShow(false);
  };

  if (!show || isStandalone) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="max-w-md mx-auto bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)]"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#2D6A4F] flex items-center justify-center flex-shrink-0">
            <img src="/icons/icon-192x192.png" alt="HasatLink" className="w-10 h-10 rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1">HasatLink Uygulamasini Yükle</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Daha hizli ve kolay erisim icin HasatLink'i ana ekraniniza ekleyin!
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {isIOS ? (
            <div className="bg-[var(--bg-input)] rounded-xl p-3">
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <Share size={14} />
                <span className="font-medium">
                  Paylas simgesine <span className="inline-block mx-1">⬆</span> dokunun, ardindan "Ana Ekrana Ekle" secenegini secin
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#2D6A4F] text-white text-sm font-semibold rounded-xl active:scale-[0.98] transition-transform"
            >
              <Download size={16} />
              Yükle
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Daha Sonra
            </button>
            <button
              onClick={handleNeverShow}
              className="flex-1 py-2 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Bir Daha Gösterme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
