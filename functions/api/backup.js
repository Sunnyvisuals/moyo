/* Backups, for the signed-in admin only.
     GET /api/backup            the versions kept: each publication keeps the one before (the last ten, with their pictures)
     GET /api/backup?id=<id>    one of them, to take it up again
     GET /api/backup?tout=1     everything in one file to keep elsewhere: the site, the versions, the messages, the sign-ups (not the pictures) */
import { json, isAdmin } from '../_lib/auth.js';
import { getData, versions, VERSION_ID } from '../_lib/store.js';

async function all(env, prefix) {
  const names = [];
  for (let cursor, more = true; more;) {
    const r = await env.MOYO.list({ prefix, cursor });
    names.push(...r.keys.map(k => k.name));
    more = !r.list_complete; cursor = r.cursor;
  }
  return (await Promise.all(names.sort().map(n => env.MOYO.get(n, 'json')))).filter(Boolean);
}

export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: 'unauthorized' }, 401);
  if (!env.MOYO) return json({ versions: [] });
  const q = new URL(request.url).searchParams, id = q.get('id');
  if (id) {
    const doc = VERSION_ID.test(id) ? await env.MOYO.get('backup:' + id, 'json') : null;
    return doc ? json(doc) : json({ error: 'gone', message: 'Cette version n’existe plus.' }, 404);
  }
  const list = await versions(env);
  if (!q.has('tout')) return json({ versions: list.map(i => ({ id: i, at: new Date(+i).toISOString() })) });
  const day = new Date().toISOString().slice(0, 10);
  return json({
    at: new Date().toISOString(), site: await getData(env),
    versions: await Promise.all(list.map(async i => ({ at: new Date(+i).toISOString(), site: await env.MOYO.get('backup:' + i, 'json') }))),
    legal: await env.MOYO.get('legal', 'json'), messages: await all(env, 'msg:'), subscribers: await all(env, 'sub:')
  }, 200, { 'Content-Disposition': `attachment; filename="moyo-sauvegarde-${day}.json"` });
}
