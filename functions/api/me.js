import { json, isAdmin, chosen } from '../_lib/auth.js';
import { mailbox, masked } from '../_lib/mail.js';

/* What the login page needs to know. salt and iter are public by nature: they only serve to stretch the password in the browser. */
export async function onRequestGet({ request, env }) {
  const a = await chosen(env);
  return json({ admin: await isAdmin(request, env), configured: !!(a || env.ADMIN_PASSWORD), storage: !!env.MOYO, mail: env.RESEND_API_KEY ? masked(mailbox(env)) : '', ...(a ? { salt: a.salt, iter: a.iter } : {}) });
}
