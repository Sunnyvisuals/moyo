// Copie Sveltia CMS dans public/admin pour qu'il soit servi depuis le site (aucun CDN tiers).
import { cpSync, existsSync } from 'node:fs';
const src = 'node_modules/@sveltia/cms/dist/sveltia-cms.js';
if (existsSync(src)) cpSync(src, 'public/admin/sveltia-cms.js');
