import { X } from 'lucide-react';

interface IOSInstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

function SafariShareIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function AddToHomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export default function IOSInstallGuide({ isOpen, onClose }: IOSInstallGuideProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative w-full max-w-md mx-4 mb-6 bg-[var(--bg-surface)] rounded-3xl overflow-hidden shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Green header band */}
        <div className="bg-gradient-to-r from-[#2D6A4F] to-[#1B4332] px-6 pt-6 pb-5">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 text-white"
          >
            <X size={16} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden border-2 border-white/20">
              <img src="/icons/icon-192x192.png" alt="" className="w-12 h-12 rounded-xl" />
            </div>
            <div className="text-white">
              <h3 className="text-lg font-bold tracking-tight">HasatLink'i Yükle</h3>
              <p className="text-xs text-white/70 mt-0.5">2 adimda ana ekranina ekle</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                Safari'de <span className="text-[#007AFF]">Paylas</span> butonuna dokunun
              </p>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-[#007AFF] flex items-center justify-center shadow-lg shadow-[#007AFF]/30">
                    <SafariShareIcon />
                  </div>
                  {/* Bouncing finger pointer */}
                  <div className="absolute -bottom-3 -right-2 text-xl" style={{ animation: 'bounce 1s infinite' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L8 8h3v6h2V8h3L12 2z" fill="#2D6A4F" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 bg-[var(--bg-input)] rounded-xl p-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#007AFF]/10 flex items-center justify-center flex-shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                      <polyline points="16 6 12 2 8 6" />
                      <line x1="12" y1="2" x2="12" y2="15" />
                    </svg>
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">Ekranin altindaki bu ikona dokunun</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connector line */}
          <div className="flex items-center pl-4">
            <div className="w-1 h-4 bg-[#2D6A4F]/20 rounded-full ml-3.5" />
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4">
            <div className="w-9 h-9 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                <span className="text-[#007AFF]">"Ana Ekrana Ekle"</span> secenegine dokunun
              </p>
              {/* Simulated iOS menu item */}
              <div className="bg-[var(--bg-input)] rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-subtle)] opacity-50">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  <span className="text-xs text-[var(--text-secondary)]">Yer Isareti Ekle</span>
                </div>
                {/* Highlighted row */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[#2D6A4F]/10 relative">
                  <AddToHomeIcon />
                  <span className="text-sm font-semibold text-[#007AFF]">Ana Ekrana Ekle</span>
                  {/* Arrow indicator */}
                  <div className="absolute right-3 text-[#2D6A4F]" style={{ animation: 'pulse 1.5s infinite' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 4l8 8-8 8V4z" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 opacity-50">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span className="text-xs text-[var(--text-secondary)]">Kopyala</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom arrow pointing to Safari bar */}
          <div className="flex justify-center pt-2">
            <div className="flex flex-col items-center gap-1 text-[#2D6A4F]" style={{ animation: 'bounce 1.5s infinite' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 16l-6-6h4V4h4v6h4l-6 6z" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Safari alt menüsü</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
