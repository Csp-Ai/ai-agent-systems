import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  publicDir: 'public',
  css: {
    postcss: resolve(__dirname, 'postcss.config.js'),
  },
});
