// App Android «Pizarra Matemática»: el móvil como pizarra de la app de escritorio.
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.matematica.pizarra',
  appName: 'Pizarra Matemática',
  webDir: 'dist-companion',
  backgroundColor: '#0e1016',
  server: {
    // La interfaz se sirve como http://localhost para poder abrir ws:// y http:// hacia
    // el PC en la red local (con https el WebView bloquearía esas conexiones).
    androidScheme: 'http',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
