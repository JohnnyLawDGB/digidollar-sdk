import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'client'),
  base: '/test/',
  build: {
    outDir: path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/test/api': {
        target: 'http://localhost:3100',
        rewrite: (p) => p.replace(/^\/test/, ''),
      },
    },
  },
});
