import { build, preview } from 'vite';

// Isolated demo build: preserve the developer's backend and local configuration.
process.env.AGITTA_PUBLIC_BUILD = 'true';
process.env.VITE_SUPABASE_URL = '';
process.env.VITE_SUPABASE_ANON_KEY = '';
await build({ base: '/agitta/', build: { outDir: '.tools/web-test-dist' } });
await preview({ base: '/agitta/', build: { outDir: '.tools/web-test-dist' }, preview: { host: '127.0.0.1', port: 4175, strictPort: true } });
console.log('Webapp de teste disponível na porta 4175.');
