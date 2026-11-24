import { json, isAdmin } from '../_lib/auth.js';

/* Footer sign-ups ("sub:<email>"), newest first (admin only). */
export async function onRequestGet({ request, env }) {
  if (!(await isAdmin(request, env))) return json({ error: 'unauthorized' }, 401);
  if (!env.MOYO) return json({ subscribers: [] });
  const keys = [];
  let cursor;
  do {
    const page = await env.MOYO.list({ prefix: 'sub:', cursor, limit: 1000 });
    keys.push(...page.keys.map(k => k.name));
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor && keys.length < 5000);
  const subscribers = (await Promise.all(keys.slice(0, 1000).map(k => env.MOYO.get(k, 'json')))).filter(Boolean)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return json({ subscribers, total: keys.length });
}
