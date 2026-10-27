import { defineConfig, loadEnv } from 'vite';
import { validateFrontendConfig } from './scripts/frontend-config.mjs';
import { webApp } from './scripts/web-app.mjs';

export default defineConfig(({ mode }) => {
  validateFrontendConfig(loadEnv(mode, process.cwd(), 'VITE_'), { publicDeployment: process.env.AGITTA_PUBLIC_BUILD === 'true' });
  return {
    base: '/',
    plugins: [webApp()],
    build: { outDir: 'dist', emptyOutDir: true, target: ['chrome83', 'safari15.4'] },
    server: { host: '0.0.0.0', port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true },
  };
});
