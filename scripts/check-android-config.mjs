import { loadEnv } from 'vite';
import { validateFrontendConfig } from './frontend-config.mjs';

try {
  const result = validateFrontendConfig(loadEnv('production', process.cwd(), 'VITE_'), { android: true });
  if (result.demo) console.log('Build Android de demonstração: sem contas conectadas.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
