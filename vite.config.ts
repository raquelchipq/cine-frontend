import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    host: '0.0.0.0',
    port: 5173,
    // Vite bloquea peticiones con Host desconocido. Al entrar por el proxy
    // inverso, el Host que llega es el dominio configurado en Nginx.
    allowedHosts: ['cine-dev.com', 'api-cine-dev.com', 'localhost', '127.0.0.1'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
});
