import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
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

export default function SEO({ title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl }: SEOProps) {
  useEffect(() => {
    const prev = document.title;
    if (title) document.title = `${title} | HasatLink`;
    if (description) setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);

    // Open Graph
    setMeta('og:type', 'website', true);
    if (ogTitle || title) setMeta('og:title', ogTitle || title || 'HasatLink', true);
    if (ogDescription || description) setMeta('og:description', (ogDescription || description)!, true);
    if (ogImage) setMeta('og:image', ogImage, true);
    if (ogUrl) setMeta('og:url', ogUrl, true);
    setMeta('og:site_name', 'HasatLink', true);

    // Twitter Card
    setMeta('twitter:card', 'summary_large_image');
    if (ogTitle || title) setMeta('twitter:title', ogTitle || title || 'HasatLink');
    if (ogDescription || description) setMeta('twitter:description', (ogDescription || description)!);
    if (ogImage) setMeta('twitter:image', ogImage);

    return () => { document.title = prev; };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl]);

  return null;
}
