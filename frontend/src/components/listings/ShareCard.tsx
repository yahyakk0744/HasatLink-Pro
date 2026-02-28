import type { Listing } from '../../types';
import { formatPrice } from '../../utils/formatters';

interface ShareCardProps {
  listing: Listing;
}

export default function ShareCard({ listing }: ShareCardProps) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-lg max-w-sm">
      {listing.images?.[0] && (
        <img src={listing.images[0]} alt={listing.title} className="w-full aspect-video object-cover rounded-2xl mb-4" />
      )}
      <h3 className="text-lg font-semibold tracking-tight mb-1">{listing.title}</h3>
      <p className="text-xl font-semibold text-[#2D6A4F] mb-2">{formatPrice(listing.price)}</p>
      <p className="text-xs text-[#6B6560]">{listing.location}</p>
      <div className="mt-4 pt-4 border-t border-[#D6D0C8] text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-[#6B6560]">
          <span className="text-[#1A1A1A]">HASAT</span>
          <span className="text-[#2D6A4F]">LiNK</span>
        </p>
      </div>
    </div>
  );
}
