/* Rebuilds assets/partage.png (the image shown when the site is shared, 2400 x 1260) from assets/og-src.html, with Google Chrome in headless mode.
   A new drawing needs a new file name (here and in shared/seo.js): Discord and the others keep the old one under its address.
   Usage: node scripts/og.mjs [path to chrome]. Needs Chrome installed; nothing else. */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chrome = process.argv[2] || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'google-chrome', 'chromium'
].find(p => { try { return p.includes('/') || p.includes('\\') ? spawnSync(p, ['--version']).status === 0 : spawnSync(p, ['--version']).status === 0; } catch { return false; } });
if (!chrome) { console.error('Chrome not found: pass its path as the first argument.'); process.exit(1); }
const out = path.join(root, 'assets/partage.png');
const r = spawnSync(chrome, ['--headless=new', '--hide-scrollbars', '--force-device-scale-factor=2', '--allow-file-access-from-files', '--window-size=1200,630', '--virtual-time-budget=3000', `--screenshot=${out}`, pathToFileURL(path.join(root, 'assets/og-src.html')).href], { stdio: 'inherit' });
process.exit(r.status || 0);
