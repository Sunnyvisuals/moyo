import { json, random, sha, limit, ipOf, ours } from '../_lib/auth.js';
import { mailbox, masked, send } from '../_lib/mail.js';

const hex = u => [...u].map(b => b.toString(16).padStart(2, '0')).join('');
const MIN = 30;

/* Forgotten password, or never chosen: a one-time link, sent only to the studio's own mailbox (never to an address given here). Valid 30 minutes. */
export async function onRequestPost({ request, env }) {
  if (!ours(request)) return json({ error: 'bad_request' }, 400);
  if (!env.MOYO || !env.RESEND_API_KEY) return json({ error: 'no_mail', message: 'L’envoi d’e-mails n’est pas réglé sur ce site.' }, 503);
  const mine = await limit(env, 'rlf:' + ipOf(request), 3, 3600), all = await limit(env, 'rlf', 6, 3600);
  if (mine.full || all.full) return json({ error: 'too_many', message: 'Trop de demandes. Réessayez dans une heure.' }, 429);
  await mine.add(); await all.add();

  const token = random(32), link = new URL(request.url).origin + '/admin/#creer=' + token;
  await env.MOYO.put('reset:' + hex(await sha(token)), String(Date.now()), { expirationTtl: MIN * 60 });
  const F = '-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif';
  const ok = await send(env, {
    subject: 'Le mot de passe de l’admin',
    text: `Choisissez le mot de passe de l’admin de moyo :\n\n${link}\n\nCe lien est valable ${MIN} minutes et ne sert qu’une fois.\nSi vous ne l’avez pas demandé, ignorez ce message : rien ne change.`,
    html: `<!doctype html><html lang="fr"><body style="margin:0;background:#FAFAF8;padding:48px 24px"><table role="presentation" width="100%" style="max-width:520px;margin:0 auto"><tr><td>
<p style="margin:0 0 56px;font:700 26px/1 ${F};letter-spacing:-.05em;color:#121214">moyo</p>
<p style="margin:0 0 20px;font:700 40px/1.05 ${F};letter-spacing:-.045em;color:#121214">Votre mot de passe<span style="color:#002FA7">.</span></p>
<p style="margin:0 0 32px;font:400 17px/1.5 ${F};color:#121214">Choisissez le mot de passe de l’admin. Ce lien est valable ${MIN} minutes et ne sert qu’une fois.</p>
<p style="margin:0 0 48px"><a href="${link}" style="display:inline-block;background:#002FA7;color:#FAFAF8;text-decoration:none;font:600 17px/1 ${F};padding:21px 34px;border-radius:999px">Choisir le mot de passe</a></p>
<p style="margin:0;font:400 14px/1.5 ${F};color:#65656B">Si vous ne l’avez pas demandé, ignorez ce message : rien ne change.</p>
</td></tr></table></body></html>`
  });
  return ok ? json({ ok: true, to: masked(mailbox(env)) }) : json({ error: 'mail_failed', message: 'L’e-mail n’a pas pu partir.' }, 502);
}
