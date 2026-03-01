import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

interface LocationData {
  lat: number;
  lng: number;
  city: string;
  district: string;
}

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

const STORAGE_KEY = 'hasatlink_location';

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<LocationData | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<{ city: string; district: string }> => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=tr`);
      const data = await res.json();
      const addr = data.address || {};
      const city = addr.province || addr.city || addr.state || '';
      const district = addr.town || addr.county || addr.suburb || addr.district || '';
      return { city, district };
    } catch {
      return { city: '', district: '' };
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Tarayıcınız konum desteği sunmuyor');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const { city, district } = await reverseGeocode(lat, lng);
        const loc: LocationData = { lat, lng, city, district };
        setLocation(loc);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
        setLoading(false);
        setError(null);
      },
      () => {
        setError('Konum alınamadı');
        setLoading(false);
        // Fallback: IP-based location
        fetchIPLocation();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, [reverseGeocode]);

  const fetchIPLocation = useCallback(async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      if (data.latitude && data.longitude) {
        const loc: LocationData = {
          lat: data.latitude,
          lng: data.longitude,
          city: data.region || data.city || '',
          district: data.city || '',
        };
        setLocation(loc);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
      }
    } catch {}
  }, []);

  // Request location on first load if not cached
  useEffect(() => {
    if (!location) {
      requestLocation();
    }
  }, []);

  return (
    <LocationContext.Provider value={{ location, loading, error, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within LocationProvider');
  return context;
};
