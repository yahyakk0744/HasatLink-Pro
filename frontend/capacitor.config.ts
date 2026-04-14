import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hasatlink.app',
  appName: 'HasatLink',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '361061612129-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    FacebookLogin: {
      // NOTE: Replace with real Facebook App ID from https://developers.facebook.com/
      // Until then, the Facebook button is hidden via VITE_ENABLE_FACEBOOK_LOGIN flag.
      appId: 'REPLACE_WITH_FACEBOOK_APP_ID',
      clientToken: 'REPLACE_WITH_FACEBOOK_CLIENT_TOKEN',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFFFFF',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

export default config;
