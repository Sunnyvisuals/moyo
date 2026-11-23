/* Cloudflare "Workers Builds" installs the packages, then runs `wrangler deploy` on each push. This repo is set up for
   Pages (`pages_build_output_dir`), so that command has no Worker to deploy and fails.
   On that CI only, right after install: build dist/, compile functions/ into one Worker, and write a Worker config
   that wrangler finds through .wrangler/deploy/config.json. Locally and on Pages this script does nothing. */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const e = process.env;
if ((e.WORKERS_CI || e.CI) && !e.CF_PAGES && !e.GITHUB_ACTIONS) {
  const run = cmd => execSync(cmd, { stdio: 'inherit' });
  run('node build.mjs');
  run('npx --no-install wrangler pages functions build functions --outdir .wrangler/worker');
  const toml = fs.readFileSync('wrangler.toml', 'utf8');
  const pick = re => { const m = toml.match(re); if (!m) throw new Error('wrangler.toml: missing ' + re); return m[1]; };
  fs.writeFileSync('.wrangler/worker/wrangler.json', JSON.stringify({
    name: pick(/^name = "(.+)"/m),
    main: 'index.js',
    compatibility_date: pick(/^compatibility_date = "(.+)"/m),
    assets: { directory: '../../dist', binding: 'ASSETS', run_worker_first: true },
    kv_namespaces: [{ binding: 'MOYO', id: pick(/^id = "(.+)"/m) }],
    keep_vars: true
  }, null, 2));
  fs.mkdirSync('.wrangler/deploy', { recursive: true });
  fs.writeFileSync('.wrangler/deploy/config.json', JSON.stringify({ configPath: '../worker/wrangler.json' }));
}
