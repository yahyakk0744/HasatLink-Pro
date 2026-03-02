interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Listener = () => void;

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(fn => fn());
}

// Check if already running as installed PWA
if (typeof window !== 'undefined') {
  if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true) {
    installed = true;
  }

  // Capture the event as early as possible — before React renders
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    installed = true;
    deferredPrompt = null;
    notify();
  });
}

export function getCanInstall(): boolean {
  return deferredPrompt !== null;
}

export function getIsInstalled(): boolean {
  return installed;
}

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return outcome === 'accepted';
}
