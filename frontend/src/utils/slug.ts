const TR_CHAR_MAP: Record<string, string> = {
  ç: 'c', Ç: 'c',
  ğ: 'g', Ğ: 'g',
  ı: 'i', I: 'i', İ: 'i',
  ö: 'o', Ö: 'o',
  ş: 's', Ş: 's',
  ü: 'u', Ü: 'u',
};

export function slugify(text: string): string {
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

// Public listing URLs embed a readable slug after the id for SEO: /ilan/<id>-<slug>.
// The id always leads, so old bare-id links (/ilan/<id>) keep resolving unchanged.
export function listingUrl(id: string, title?: string): string {
  const slug = title ? slugify(title) : '';
  return slug ? `/ilan/${id}-${slug}` : `/ilan/${id}`;
}

// Mongo ObjectIds are 24 hex chars; pull that prefix out of a possibly slug-suffixed
// route param so /ilan/<id> and /ilan/<id>-<slug> both resolve to the same listing.
export function extractListingId(param: string): string {
  const match = param.match(/^[0-9a-fA-F]{24}/);
  return match ? match[0] : param;
}
