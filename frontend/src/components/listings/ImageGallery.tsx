import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState<Set<number>>(new Set());

  const markLoaded = (i: number) => setLoaded(prev => new Set(prev).add(i));

  if (!images.length) {
    return (
      <div className="aspect-video bg-[var(--bg-input)] rounded-[2rem] flex items-center justify-center text-6xl">
        🌾
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-[var(--bg-input)] rounded-[2rem] overflow-hidden">
      <img
        src={images[current]}
        alt={title}
        loading="lazy"
        onLoad={() => markLoaded(current)}
        className={`w-full h-full object-cover transition-[filter] duration-400 ${loaded.has(current) ? '' : 'img-lazy'}`}
      />

      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrent(prev => (prev - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrent(prev => (prev + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-white w-6' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
