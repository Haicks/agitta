import { build } from 'vite';

// Unlike local preview builds, a published app must never point at this computer.
process.env.AGITTA_PUBLIC_BUILD = 'true';
const base = process.env.AGITTA_BASE_PATH || '/';
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) throw new Error('AGITTA_BASE_PATH precisa ser um caminho como / ou /agitta/.');
await build({ base });
