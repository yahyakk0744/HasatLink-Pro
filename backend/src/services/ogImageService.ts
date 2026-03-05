import { Request, Response } from 'express';
import Listing from '../models/Listing';

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.substring(0, max) + '...' : str;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(price);
}

export const getOgImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).send('Not found');
      return;
    }

    const title = escapeXml(truncate(listing.title, 60));
    const location = escapeXml(truncate(listing.location || '', 40));
    const price = escapeXml(formatPrice(listing.price));
    const category = escapeXml(listing.type.toUpperCase());

    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a2e1a"/>
      <stop offset="100%" stop-color="#2D6A4F"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#40916C"/>
      <stop offset="100%" stop-color="#2D6A4F"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="60" y="60" width="1080" height="510" rx="32" fill="rgba(255,255,255,0.08)"/>
  <rect x="80" y="80" width="160" height="40" rx="20" fill="url(#accent)"/>
  <text x="160" y="106" font-family="system-ui,-apple-system,sans-serif" font-size="18" font-weight="700" fill="white" text-anchor="middle">${category}</text>
  <text x="100" y="200" font-family="system-ui,-apple-system,sans-serif" font-size="48" font-weight="800" fill="white" letter-spacing="-1">${title}</text>
  <text x="100" y="300" font-family="system-ui,-apple-system,sans-serif" font-size="64" font-weight="800" fill="#52B788">${price}</text>
  <text x="100" y="370" font-family="system-ui,-apple-system,sans-serif" font-size="24" fill="rgba(255,255,255,0.6)">${location}</text>
  <rect x="80" y="460" width="300" height="60" rx="16" fill="rgba(255,255,255,0.1)"/>
  <text x="230" y="498" font-family="system-ui,-apple-system,sans-serif" font-size="22" font-weight="700" fill="#52B788" text-anchor="middle">HasatLink</text>
  <circle cx="1060" cy="500" r="40" fill="rgba(82,183,136,0.2)"/>
  <text x="1060" y="510" font-family="system-ui,-apple-system,sans-serif" font-size="28" fill="#52B788" text-anchor="middle">H</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  } catch (error) {
    res.status(500).send('Error generating image');
  }
};

// Generate Instagram Story format (9:16 = 1080x1920)
export const getStoryImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      res.status(404).send('Not found');
      return;
    }

    const title = escapeXml(truncate(listing.title, 50));
    const location = escapeXml(truncate(listing.location || '', 35));
    const price = escapeXml(formatPrice(listing.price));
    const category = escapeXml(listing.type.toUpperCase());

    const svg = `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0D1B0D"/>
      <stop offset="50%" stop-color="#1a2e1a"/>
      <stop offset="100%" stop-color="#2D6A4F"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1920" fill="url(#bg)"/>
  <circle cx="540" cy="400" r="200" fill="rgba(82,183,136,0.1)"/>
  <circle cx="540" cy="400" r="120" fill="rgba(82,183,136,0.15)"/>
  <text x="540" y="420" font-family="system-ui,-apple-system,sans-serif" font-size="72" font-weight="800" fill="#52B788" text-anchor="middle">H</text>
  <text x="540" y="520" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="600" fill="rgba(255,255,255,0.5)" text-anchor="middle" letter-spacing="8">HASATLINK</text>
  <rect x="80" y="700" width="920" height="600" rx="40" fill="rgba(255,255,255,0.06)"/>
  <rect x="80" y="700" width="920" height="8" rx="4" fill="#52B788"/>
  <rect x="120" y="760" width="180" height="44" rx="22" fill="rgba(82,183,136,0.2)"/>
  <text x="210" y="790" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="700" fill="#52B788" text-anchor="middle">${category}</text>
  <text x="120" y="890" font-family="system-ui,-apple-system,sans-serif" font-size="44" font-weight="800" fill="white" letter-spacing="-1">${title}</text>
  <text x="120" y="1020" font-family="system-ui,-apple-system,sans-serif" font-size="72" font-weight="800" fill="#52B788">${price}</text>
  <text x="120" y="1100" font-family="system-ui,-apple-system,sans-serif" font-size="28" fill="rgba(255,255,255,0.5)">${location}</text>
  <rect x="120" y="1180" width="840" height="70" rx="35" fill="#52B788"/>
  <text x="540" y="1225" font-family="system-ui,-apple-system,sans-serif" font-size="26" font-weight="700" fill="white" text-anchor="middle">hasatlink.com'da incele</text>
  <text x="540" y="1780" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="rgba(255,255,255,0.3)" text-anchor="middle">hasatlink.com</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  } catch (error) {
    res.status(500).send('Error generating story image');
  }
};
