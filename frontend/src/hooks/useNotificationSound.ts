import { useCallback } from 'react';

export const useNotificationSound = () => {
  const playSound = useCallback(() => {
    try {
      // iPhone Tri-tone inspired chime using Web Audio API
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Three-note sequence mimicking iPhone tri-tone
      const notes = [
        { freq: 1174.66, start: 0, duration: 0.08 },     // D6
        { freq: 1396.91, start: 0.1, duration: 0.08 },    // F6
        { freq: 1760.00, start: 0.2, duration: 0.12 },    // A6
      ];

      notes.forEach(({ freq, start, duration }) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(0.25, now + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration + 0.15);

        osc.start(now + start);
        osc.stop(now + start + duration + 0.2);
      });
    } catch {}
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const showNotification = useCallback((title: string, body: string) => {
    playSound();
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.svg' });
    }
  }, [playSound]);

  return { playSound, requestPermission, showNotification };
};
