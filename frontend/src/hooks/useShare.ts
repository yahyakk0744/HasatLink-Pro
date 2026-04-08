import { useCallback } from 'react';
import toast from 'react-hot-toast';
import api, { API_ORIGIN } from '../config/api';
import { nativeShare, hapticLight, isNative } from '../utils/native';

export const useShare = () => {
  const shareListing = useCallback(async (listingId: string, title: string) => {
    const url = `${window.location.origin}/ilan/${listingId}`;

    // Track share
    try { await api.post(`/listings/${listingId}/share`); } catch {}

    // Haptic feedback on native
    hapticLight();

    if (isNative || typeof navigator.share === 'function') {
      try {
        await nativeShare({
          title: `HasatLink - ${title}`,
          text: `${title} - HasatLink'te bu ilana goz atin! #HasatLink #Mut #Tarim`,
          url,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(url);
          toast.success('Link kopyalandi!');
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link kopyalandi!');
    }
  }, []);

  const shareAsStory = useCallback(async (listingId: string) => {
    const storyUrl = `${API_ORIGIN}/api/story/${listingId}`;

    try {
      const response = await fetch(storyUrl);
      const svgText = await response.text();
      const blob = new Blob([svgText], { type: 'image/svg+xml' });

      // Try native share with file
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'hasatlink-story.svg', { type: 'image/svg+xml' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'HasatLink Story',
          });
          return;
        }
      }

      // Fallback: download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hasatlink-story-${listingId}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Story gorseli indirildi!');
    } catch {
      toast.error('Story olusturulamadi');
    }
  }, []);

  const getOgImageUrl = useCallback((listingId: string) => {
    return `${API_ORIGIN}/api/og/${listingId}`;
  }, []);

  return { shareListing, shareAsStory, getOgImageUrl };
};
