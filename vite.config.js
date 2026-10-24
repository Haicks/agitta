import { defineConfig, loadEnv } from 'vite';
import { validateFrontendConfig } from './scripts/frontend-config.mjs';
import legacy, { cspHashes } from '@vitejs/plugin-legacy';

export default defineConfig(({ mode }) => {
  validateFrontendConfig(loadEnv(mode, process.cwd(), 'VITE_'));
  return {
    base: './',
    plugins: [
      // Use a single compatible bundle: older WebViews can execute it without
      // ESM support or data-URL feature probes blocked by the app's CSP.
      legacy({ targets: ['Chrome >= 53'], renderModernChunks: false, additionalLegacyPolyfills: ['core-js/es/global-this'] }),
      {
        name: 'agitta-legacy-csp',
        transformIndexHtml: {
          order: 'post',
          handler: (html) => html.replace("script-src 'self';", `script-src 'self' ${cspHashes.map((hash) => `'sha256-${hash}'`).join(' ')};`),
        },
      },
    ],
    build: { outDir: 'www', emptyOutDir: true },
    server: { host: '0.0.0.0', port: 5173, strictPort: true },
    preview: { port: 4173, strictPort: true },
  };
});
