// Google Analytics utility
// Set your tracking ID in .env: VITE_GA_ID=G-XXXXXXXXXX

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function initGA() {
  if (!GA_ID) return;

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

export function trackPageView(path: string) {
  if (!GA_ID || !window.gtag) return;
  window.gtag('config', GA_ID, { page_path: path });
}

export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (!GA_ID || !window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
}
