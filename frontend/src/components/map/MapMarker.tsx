import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import type { Listing } from '../../types';
import { formatPrice } from '../../utils/formatters';

const CATEGORY_COLORS: Record<string, string> = {
  pazar: '#2D6A4F',
  lojistik: '#0077B6',
  isgucu: '#E76F51',
  ekipman: '#C1341B',
  arazi: '#A47148',
  depolama: '#7B2CBF',
};

const CATEGORY_LABELS_TR: Record<string, string> = {
  pazar: 'Pazar',
  lojistik: 'Lojistik',
  isgucu: 'İş Gücü',
  ekipman: 'Ekipman',
  arazi: 'Arazi',
  depolama: 'Depolama',
};

function createColoredIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="5" fill="#fff"/>
  </svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
    iconSize: [28, 42],
    iconAnchor: [14, 42],
    popupAnchor: [0, -42],
  });
}

const iconCache: Record<string, L.Icon> = {};
function getIcon(type: string) {
  if (!iconCache[type]) {
    iconCache[type] = createColoredIcon(CATEGORY_COLORS[type] || '#2D6A4F');
  }
  return iconCache[type];
}

interface MapMarkerProps {
  listing: Listing;
}

export default function MapMarker({ listing }: MapMarkerProps) {
  return (
    <Marker position={[listing.coordinates.lat, listing.coordinates.lng]} icon={getIcon(listing.type)}>
      <Popup>
        <div className="min-w-[200px]">
          {listing.images?.[0] && (
            <img src={listing.images[0]} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
          )}
          <span
            className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full text-white mb-1"
            style={{ background: CATEGORY_COLORS[listing.type] || '#2D6A4F' }}
          >
            {CATEGORY_LABELS_TR[listing.type] || listing.type}
          </span>
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

export { CATEGORY_COLORS, CATEGORY_LABELS_TR };
