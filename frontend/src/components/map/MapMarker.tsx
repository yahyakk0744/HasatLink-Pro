import { Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import type { Listing } from '../../types';
import { formatPrice } from '../../utils/formatters';

interface MapMarkerProps {
  listing: Listing;
}

export default function MapMarker({ listing }: MapMarkerProps) {
  return (
    <Marker position={[listing.coordinates.lat, listing.coordinates.lng]}>
      <Popup>
        <div className="min-w-[180px]">
          <h4 className="font-bold text-sm mb-1">{listing.title}</h4>
          <p className="text-green-600 font-bold text-sm">{formatPrice(listing.price)}</p>
          <p className="text-xs text-gray-500 mb-2">{listing.location}</p>
          <Link
            to={`/ilan/${listing._id}`}
            className="text-xs text-blue-600 hover:underline font-medium"
          >
            Detay &rarr;
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
