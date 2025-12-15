import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Essencial para o GitHub Pages
  build: {
    outDir: 'dist',
  },
  define: {
    // Polifill seguro para process.env que injeta a API_KEY se disponível no ambiente de build
    'process.env': JSON.stringify({
      API_KEY: process.env.API_KEY || '',
      NODE_ENV: process.env.NODE_ENV || 'production'
    })
  }
});