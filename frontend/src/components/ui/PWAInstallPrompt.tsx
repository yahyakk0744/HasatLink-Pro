import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import IOSInstallGuide from './IOSInstallGuide';
import { usePWAInstall } from '../../hooks/usePWAInstall';

const DISMISSED_KEY = 'hasatlink_pwa_dismissed';

function isMobileDevice(): boolean {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export default function PWAInstallPrompt() {
  const { canInstall, isInstalled, promptInstall } = usePWAInstall();
  const [show, setShow] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    if (isInstalled) return;
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === 'forever') return;
    if (!isMobileDevice()) return;

    // Show banner after short delay for mobile devices
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [isInstalled]);

  const handleInstall = async () => {
    if (canInstall) {
      await promptInstall();
      setShow(false);
      return;
    }
    // No native prompt — show manual "Add to Home Screen" guide (iOS etc.)
    setShow(false);
    setShowInstallGuide(true);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'forever');
    setShow(false);
  };

  if (!show || isInstalled) return <IOSInstallGuide isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} />;

  return (
    <>
      {/* Slim bottom banner — max 80px */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-[var(--bg-surface)] border-t border-[var(--border-default)] shadow-lg px-4 py-2.5">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <img src="/icons/icon.svg" alt="HasatLink" className="w-9 h-9 rounded-xl shrink-0" />
            <p className="flex-1 text-xs font-medium text-[var(--text-primary)] truncate">
              Ana ekrana ekle
            </p>
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 bg-[#2D6A4F] text-white text-xs font-bold rounded-lg hover:bg-[#1B4332] transition-colors shrink-0"
            >
              {canInstall ? (
                <><Download size={12} className="inline mr-1 -mt-0.5" />Yükle</>
              ) : (
                <><Share size={12} className="inline mr-1 -mt-0.5" />Nasıl?</>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-[var(--bg-input)] transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>

      <IOSInstallGuide isOpen={showInstallGuide} onClose={() => setShowInstallGuide(false)} />
    </>
  );
}
