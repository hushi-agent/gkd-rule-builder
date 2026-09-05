import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hushi.gkdbuilder',
  appName: 'GKD规则生成器',
  webDir: 'dist',
  backgroundColor: '#111827',
  server: {
    androidScheme: 'https',
  },
};

export default config;
