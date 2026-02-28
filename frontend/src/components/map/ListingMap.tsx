import { MapContainer, TileLayer } from 'react-leaflet';
import type { Listing } from '../../types';
import MapMarker from './MapMarker';

interface ListingMapProps {
  listings: Listing[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

export default function ListingMap({ listings, center = [37.0247, 35.8176], zoom = 10, className = '' }: ListingMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`w-full h-full min-h-[300px] rounded-2xl z-0 ${className}`}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {listings.map(listing => (
        listing.coordinates?.lat && listing.coordinates?.lng && (
          <MapMarker key={listing._id} listing={listing} />
        )
      ))}
    </MapContainer>
  );
}
