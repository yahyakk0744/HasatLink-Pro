import { useRef, useState, useEffect } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

export default function LazyImage({ src, alt, className = '', fallback }: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {!loaded && fallback}
      <img
        ref={imgRef}
        src={inView ? src : undefined}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </>
  );
}
