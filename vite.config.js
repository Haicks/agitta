import { defineConfig, loadEnv } from 'vite';
import { validateFrontendConfig } from './scripts/frontend-config.mjs';

export default defineConfig(({ mode }) => {
  validateFrontendConfig(loadEnv(mode, process.cwd(), 'VITE_'));
  return {
    base: './',
    build: { outDir: 'www', emptyOutDir: true, target: 'es2020' },
    server: { host: '0.0.0.0', port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true },
  };
});
