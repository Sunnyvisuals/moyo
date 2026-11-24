/* Mail to the studio, through Resend (secret RESEND_API_KEY; optional: TO_EMAIL, FROM_EMAIL; RESEND_URL in local tests). */
export const mailbox = env => env.TO_EMAIL || 'contact.moyostudio@gmail.com';
export const masked = m => { const [a, b] = String(m).split('@'); return a.slice(0, 2) + '•••@' + b; };

export async function send(env, { subject, text, html }) {
  if (!env.RESEND_API_KEY) return false;
  try {
    const r = await fetch(env.RESEND_URL || 'https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.FROM_EMAIL || 'moyo <onboarding@resend.dev>', to: [mailbox(env)], subject, text, html }) });
    return r.ok;
  } catch { return false; }
}
