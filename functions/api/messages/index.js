import { json, isAdmin } from '../../_lib/auth.js';

/* Contact messages, newest first (admin only). */
export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: 'unauthorized' }, 401);
  if (!env.MOYO) return json({ messages: [] });
  const keys = [];
  let cursor;
  do {
    const page = await env.MOYO.list({ prefix: 'msg:', cursor, limit: 1000 });
    keys.push(...page.keys.map(k => k.name));
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor && keys.length < 5000);
  const latest = keys.sort().reverse().slice(0, 200);
  const messages = (await Promise.all(latest.map(k => env.MOYO.get(k, 'json')))).filter(Boolean);
  return json({ messages, total: keys.length });
}
