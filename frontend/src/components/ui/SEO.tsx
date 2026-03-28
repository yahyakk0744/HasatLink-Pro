import { useEffect } from 'react';
import { API_ORIGIN } from '../../config/api';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  listingId?: string;
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

function getListingIdFromUrl(): string | null {
  const match = window.location.pathname.match(/\/ilan\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export default function SEO({ title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, listingId }: SEOProps) {
  useEffect(() => {
    const prev = document.title;
    if (title) document.title = `${title} | HasatLink`;
    if (description) setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);

    // Resolve OG image: explicit prop > API OG service > none
    const resolvedListingId = listingId || getListingIdFromUrl();
    const resolvedOgImage = ogImage || (resolvedListingId ? `${API_ORIGIN}/api/og/${resolvedListingId}` : undefined);

    // Open Graph
    setMeta('og:type', 'website', true);
    if (ogTitle || title) setMeta('og:title', ogTitle || title || 'HasatLink', true);
    if (ogDescription || description) setMeta('og:description', (ogDescription || description)!, true);
    if (resolvedOgImage) setMeta('og:image', resolvedOgImage, true);
    if (ogUrl) setMeta('og:url', ogUrl, true);
    setMeta('og:site_name', 'HasatLink', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    if (ogTitle || title) setMeta('twitter:title', ogTitle || title || 'HasatLink');
    if (ogDescription || description) setMeta('twitter:description', (ogDescription || description)!);
    if (resolvedOgImage) setMeta('twitter:image', resolvedOgImage);

    return () => { document.title = prev; };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, listingId]);

  return null;
}
