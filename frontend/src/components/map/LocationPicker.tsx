import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin } from 'lucide-react';

interface LocationPickerProps {
  lat?: number;
  lng?: number;
  onSelect: (lat: number, lng: number) => void;
}

function ClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ lat, lng, onSelect }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    lat && lng ? [lat, lng] : null
  );

  useEffect(() => {
    if (lat && lng) setPosition([lat, lng]);
  }, [lat, lng]);

  const handleSelect = (newLat: number, newLng: number) => {
    setPosition([newLat, newLng]);
    onSelect(newLat, newLng);
  };

  const handleAutoLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSelect(pos.coords.latitude, pos.coords.longitude);
      },
      () => {}
    );
  };

  const center: [number, number] = position || [39.0, 35.0];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-[#6B6560]">
          Haritadan Konum Seç
        </label>
        <button
          type="button"
          onClick={handleAutoLocation}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium bg-[#2D6A4F] text-white rounded-full"
        >
          <MapPin size={10} /> Konumum
        </button>
      </div>
      <div className="h-[200px] rounded-xl overflow-hidden border border-[var(--border-default)]">
        <MapContainer
          center={center}
          zoom={position ? 13 : 6}
          className="w-full h-full z-0"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onSelect={handleSelect} />
          {position && <Marker position={position} />}
        </MapContainer>
      </div>
      {position && (
        <p className="text-[10px] text-[#6B6560]">
          Koordinatlar: {position[0].toFixed(5)}, {position[1].toFixed(5)}
        </p>
      )}
    </div>
  );
}
