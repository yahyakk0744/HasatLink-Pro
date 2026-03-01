import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hasatlink.app',
  appName: 'HasatLink',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
