import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import IOSInstallGuide from './IOSInstallGuide';

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
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === 'forever' || standalone) return;

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    if (!isMobile) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (ios) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => { clearTimeout(timer); window.removeEventListener('beforeinstallprompt', handler); };
    }

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

  const handleDismiss = () => setShow(false);

  const handleNeverShow = () => {
    localStorage.setItem(DISMISSED_KEY, 'forever');
    setShow(false);
  };

  if (!show || isStandalone) return <IOSInstallGuide isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />;

  return (
    <>
      <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 animate-slide-up">
        <div className="max-w-md mx-auto bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-3xl p-5 shadow-2xl">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)]"
          >
            <X size={14} />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg border border-[#2D6A4F]/20">
              <img src="/icons/icon.svg" alt="HasatLink" className="w-12 h-12 rounded-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold tracking-tight">HasatLink Uygulaması</h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mt-0.5">
                Hızlı erişim için ana ekranına ekle!
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {isIOS ? (
              <button
                onClick={() => { setShow(false); setShowIOSGuide(true); }}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#2D6A4F] text-white text-sm font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-[#2D6A4F]/30"
              >
                <Download size={18} />
                Uygulamayı İndir
              </button>
            ) : (
              <button
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#2D6A4F] text-white text-sm font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-lg shadow-[#2D6A4F]/30"
              >
                <Download size={18} />
                Şimdi Yükle
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

      <IOSInstallGuide isOpen={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
    </>
  );
}
