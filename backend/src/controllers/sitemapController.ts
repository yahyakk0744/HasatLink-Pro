import { Request, Response } from 'express';
import Blog from '../models/Blog';
import Listing from '../models/Listing';

const SITE_URL = 'https://hasatlink.com';

// Public/crawlable static pages only — auth-gated routes (ai-teshis, uydu-analiz,
// fiyat-alarmlari, davet, admin, profil, mesajlar, ...) are intentionally excluded.
const STATIC_PAGES: { path: string; changefreq: string; priority: string }[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/pazar', changefreq: 'daily', priority: '0.9' },
  { path: '/lojistik', changefreq: 'daily', priority: '0.8' },
  { path: '/isgucu', changefreq: 'daily', priority: '0.8' },
  { path: '/ekipman', changefreq: 'daily', priority: '0.8' },
  { path: '/arazi', changefreq: 'daily', priority: '0.8' },
  { path: '/depolama', changefreq: 'daily', priority: '0.8' },
  { path: '/hayvancilik', changefreq: 'daily', priority: '0.8' },
  { path: '/harita', changefreq: 'daily', priority: '0.8' },
  { path: '/hal-fiyatlari', changefreq: 'daily', priority: '0.8' },
  { path: '/hasatlink-pazari', changefreq: 'daily', priority: '0.8' },
  { path: '/tarim-ansiklopedisi', changefreq: 'weekly', priority: '0.7' },
  { path: '/blog', changefreq: 'daily', priority: '0.8' },
  { path: '/forum', changefreq: 'daily', priority: '0.8' },
  { path: '/hasat-takvimi', changefreq: 'monthly', priority: '0.7' },
  { path: '/is-ilanlari', changefreq: 'daily', priority: '0.7' },
  { path: '/nakliyeci', changefreq: 'daily', priority: '0.7' },
  { path: '/bayiler', changefreq: 'weekly', priority: '0.7' },
  { path: '/basari-hikayeleri', changefreq: 'weekly', priority: '0.6' },
  { path: '/sponsorlu', changefreq: 'weekly', priority: '0.5' },
  { path: '/premium', changefreq: 'monthly', priority: '0.6' },
  { path: '/iletisim', changefreq: 'monthly', priority: '0.6' },
  { path: '/gizlilik', changefreq: 'yearly', priority: '0.3' },
  { path: '/kullanim-sartlari', changefreq: 'yearly', priority: '0.3' },
  { path: '/cerez-politikasi', changefreq: 'yearly', priority: '0.3' },
];

const TR_CHAR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', I: 'i', İ: 'i', ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
};

function slugify(text: string): string {
  return text
    .split('')
    .map(ch => TR_CHAR_MAP[ch] ?? ch)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function xmlEscape(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function urlEntry(loc: string, changefreq: string, priority: string): string {
  return `  <url><loc>${xmlEscape(loc)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

// Public: dynamic sitemap covering static pages + published blog posts + active listings.
// Mounted at /api/sitemap.xml; the frontend's Vercel config rewrites /sitemap.xml to this
// endpoint so it stays on the same host as the URLs it lists, per the sitemap protocol.
export const getSitemap = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [blogs, listings] = await Promise.all([
      Blog.find({ published: true }).select('slug updatedAt createdAt').sort({ createdAt: -1 }).limit(1000).lean(),
      Listing.find({ status: 'active' }).select('title updatedAt createdAt').sort({ createdAt: -1 }).limit(2000).lean(),
    ]);

    const entries = [
      ...STATIC_PAGES.map(p => urlEntry(`${SITE_URL}${p.path}`, p.changefreq, p.priority)),
      ...blogs.map(b => urlEntry(`${SITE_URL}/blog/${b.slug}`, 'weekly', '0.6')),
      ...listings.map(l => urlEntry(`${SITE_URL}/ilan/${l._id}-${slugify(l.title)}`, 'daily', '0.6')),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (error) {
    res.status(500).json({ message: 'Sitemap oluşturma hatası', error });
  }
};
