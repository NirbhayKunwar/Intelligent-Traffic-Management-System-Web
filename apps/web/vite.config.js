import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@itms/shared': path.resolve(__dirname, '../../packages/shared')
    }
  },
  plugins: [
    react(),
  ],
  server: {
    proxy: {
      "/api": "http://127.0.0.1:4000",
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
