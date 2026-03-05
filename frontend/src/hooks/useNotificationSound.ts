import { useCallback } from 'react';

// Shared AudioContext — reuse the same instance to avoid browser autoplay restrictions
let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!sharedCtx || sharedCtx.state === 'closed') {
      sharedCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (sharedCtx.state === 'suspended') {
      sharedCtx.resume();
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

export const useNotificationSound = () => {
  const playSound = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;

      // Crystal-clear iPhone Tri-tone: three ascending pure tones
      const notes = [
        { freq: 1174.66, start: 0.00, dur: 0.10 },   // D6
        { freq: 1396.91, start: 0.12, dur: 0.10 },   // F6
        { freq: 1760.00, start: 0.24, dur: 0.16 },   // A6 (held slightly longer)
      ];

      notes.forEach(({ freq, start, dur }) => {
        // Primary: pure sine for clarity
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now + start);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        gain1.gain.setValueAtTime(0, now + start);
        gain1.gain.linearRampToValueAtTime(0.22, now + start + 0.008);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + start + dur + 0.18);
        osc1.start(now + start);
        osc1.stop(now + start + dur + 0.25);

        // Secondary: soft harmonic overtone for sparkle
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, now + start);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        gain2.gain.setValueAtTime(0, now + start);
        gain2.gain.linearRampToValueAtTime(0.06, now + start + 0.008);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + start + dur + 0.12);
        osc2.start(now + start);
        osc2.stop(now + start + dur + 0.2);
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
