import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { outDir: 'www', emptyOutDir: true, target: 'es2020' },
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
