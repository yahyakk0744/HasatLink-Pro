/**
 * Native platform utilities — Capacitor plugin wrappers
 * Used to provide native iOS/Android features beyond web browsing
 */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';
import { Keyboard } from '@capacitor/keyboard';
import { Device } from '@capacitor/device';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Browser } from '@capacitor/browser';

export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isAndroid = Capacitor.getPlatform() === 'android';

// ─── Haptics ────────────────────────────────────────
export async function hapticLight() {
  if (!isNative) return;
  await Haptics.impact({ style: ImpactStyle.Light });
}

export async function hapticMedium() {
  if (!isNative) return;
  await Haptics.impact({ style: ImpactStyle.Medium });
}

export async function hapticHeavy() {
  if (!isNative) return;
  await Haptics.impact({ style: ImpactStyle.Heavy });
}

// ─── Share ──────────────────────────────────────────
export async function nativeShare(options: { title: string; text: string; url: string }) {
  if (isNative) {
    await Share.share(options);
  } else {
    if (navigator.share) {
      await navigator.share(options);
    } else {
      await navigator.clipboard.writeText(options.url);
    }
  }
}

// ─── Camera ─────────────────────────────────────────
export async function takePhoto() {
  const image = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Camera,
    width: 1024,
    height: 1024,
  });
  return image;
}

export async function pickImage() {
  const image = await Camera.getPhoto({
    quality: 85,
    allowEditing: false,
    resultType: CameraResultType.Base64,
    source: CameraSource.Photos,
    width: 1024,
    height: 1024,
  });
  return image;
}

// ─── Push Notifications ─────────────────────────────
export async function registerPushNotifications(): Promise<string | null> {
  if (!isNative) return null;

  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return null;

  await PushNotifications.register();

  return new Promise((resolve) => {
    PushNotifications.addListener('registration', (token) => {
      resolve(token.value);
    });
    PushNotifications.addListener('registrationError', () => {
      resolve(null);
    });
  });
}

export function onPushNotificationReceived(callback: (notification: any) => void) {
  if (!isNative) return;
  PushNotifications.addListener('pushNotificationReceived', callback);
}

// ─── Local Notifications ────────────────────────────
export async function scheduleLocalNotification(title: string, body: string, delaySeconds = 5) {
  if (!isNative) return;
  await LocalNotifications.requestPermissions();
  await LocalNotifications.schedule({
    notifications: [
      {
        title,
        body,
        id: Date.now(),
        schedule: { at: new Date(Date.now() + delaySeconds * 1000) },
      },
    ],
  });
}

// ─── Network ────────────────────────────────────────
export async function getNetworkStatus() {
  return Network.getStatus();
}

export function onNetworkChange(callback: (status: { connected: boolean; connectionType: string }) => void) {
  Network.addListener('networkStatusChange', callback);
}

// ─── Device ─────────────────────────────────────────
export async function getDeviceInfo() {
  return Device.getInfo();
}

// ─── Status Bar ─────────────────────────────────────
export async function setupStatusBar() {
  if (!isNative) return;
  try {
    await StatusBar.setStyle({ style: Style.Light });
    if (isAndroid) {
      await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
    }
  } catch {
    // Status bar not available
  }
}

// ─── App Lifecycle ──────────────────────────────────
export function onAppStateChange(callback: (state: { isActive: boolean }) => void) {
  App.addListener('appStateChange', callback);
}

export function onBackButton(callback: () => void) {
  App.addListener('backButton', callback);
}

// ─── Keyboard ───────────────────────────────────────
export function setupKeyboard() {
  if (!isNative) return;
  try {
    Keyboard.setAccessoryBarVisible({ isVisible: true });
  } catch {
    // Keyboard plugin not available
  }
}

// ─── Browser (external links) ───────────────────────
export async function openExternalUrl(url: string) {
  if (isNative) {
    await Browser.open({ url });
  } else {
    window.open(url, '_blank');
  }
}

// ─── Analytics (disabled on native to avoid tracking issue) ──
export function shouldLoadAnalytics(): boolean {
  // Don't load Google Analytics on native apps to avoid ATT/cookie issues
  return !isNative;
}
