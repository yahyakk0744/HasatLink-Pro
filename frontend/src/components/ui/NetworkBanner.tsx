import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { onNetworkChange, getNetworkStatus, isNative } from '../../utils/native';

export default function NetworkBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (isNative) {
      getNetworkStatus().then((status) => setOffline(!status.connected));
      onNetworkChange((status) => setOffline(!status.connected));
    } else {
      setOffline(!navigator.onLine);
      const goOffline = () => setOffline(true);
      const goOnline = () => setOffline(false);
      window.addEventListener('offline', goOffline);
      window.addEventListener('online', goOnline);
      return () => {
        window.removeEventListener('offline', goOffline);
        window.removeEventListener('online', goOnline);
      };
    }
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] bg-red-600 text-white text-center py-2 text-sm font-medium flex items-center justify-center gap-2 animate-slide-down">
      <WifiOff size={16} />
      İnternet bağlantısı yok
    </div>
  );
}
