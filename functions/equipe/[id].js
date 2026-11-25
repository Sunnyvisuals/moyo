/* Team profile page: /equipe/<id>. Rendered on the server from the data the admin publishes (data.team).
   Same template as a project sheet: name on top, portrait on the first axis, words on the third.
   French and English are both in the page; CSS shows the language of <html lang> (chosen on the site, stored as "hb-lang"). */
import { getData } from '../_lib/store.js';
import { escHTML as e, imgURL, focusStyle } from '../../shared/render.js';
import { DESIGN_CSS, headCommon, scripts } from '../../shared/design.js';
import { CHROME_CSS, chromeHead, FOOTER_CSS, GLASS_CSS, footerHTML } from '../../shared/chrome.js';
import { head, ldPerson, waiting, clip } from '../../shared/seo.js';

const para = t => String(t || '').split(/\n{2,}/).map(p => `<p>${e(p).replace(/\n/g, '<br>')}</p>`).join('');

/* lang: the language of the <head>; functions/en translates the rest */
export async function page({ params, env, request }, lang = 'fr') {
  const data = await getData(env);
  const team = data.team || [];
  const i = team.findIndex(m => m.id === params.id);
  if (i < 0) return null;
  const m = team[i], next = team.length > 1 ? team[(i + 1) % team.length] : null;
  const fr = m.fr || {}, en = { role: m.en?.role || fr.role, bio: m.en?.bio || fr.bio, phrase: m.en?.phrase || fr.phrase };
  const links = (m.links || []).filter(l => l && l.label && /^(https?:\/\/|mailto:)/i.test(l.url || ''));
  const L = lang === 'en' ? en : fr, what = lang === 'en' ? 'Moyo, creative studio based on the French Riviera.' : 'Moyo, studio créatif basé en Provence-Alpes-Côte d’Azur.';
  const meta = head({ path: '/equipe/' + encodeURIComponent(m.id), lang, title: [m.name, L.role].filter(Boolean).join(', ') + ' · Moyo Studio', desc: `${[m.name, L.role].filter(Boolean).join(', ')}. ${waiting(m) || !L.bio ? what : clip(L.bio, 120)}`, type: 'profile',
    robots: waiting(m) ? 'noindex,follow' : '', ld: ldPerson(m, lang, m.photo && new URL(imgURL(m.photo), request.url).href) });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#FAFAF8">
${meta}
${headCommon}
<style>
${DESIGN_CSS}${CHROME_CSS}${FOOTER_CSS}${GLASS_CSS}
main{min-height:100vh;min-height:100svh}
.bio{max-width:42ch;font-size:var(--fs-lead);line-height:1.5;letter-spacing:-.014em;text-wrap:pretty}
.bio p+p{margin-top:1.1em}
.role{margin-bottom:clamp(2rem,3.6vw,3.75rem)}
.role.has-ph{margin-bottom:.6em}
.phrase{font-size:var(--fs-lead);line-height:1.35;letter-spacing:-.014em;margin-bottom:clamp(2rem,3.6vw,3.75rem)}
.links{list-style:none;margin:clamp(2rem,3.6vw,3.25rem) 0 0;padding:0;display:flex;flex-wrap:wrap;gap:0 2em}
[data-l]:is(span,div){display:none}
html[lang=fr] [data-l=fr]:is(span,div),html[lang=en] [data-l=en]:is(span,div){display:revert}
</style>
</head>
<body>
<a class="skip" href="#main" data-i="skip">Aller au contenu</a>
${chromeHead(4)}
<div class="under"><main class="sheet" id="main">
  <nav class="crumbs" aria-label="Vous êtes ici" data-ia="here"><ol><li><a href="/" data-i="home">Accueil</a></li><li><a href="/#equipe" data-i="team">Équipe</a></li><li aria-current="page"><span>${e(m.name)}</span></li></ol></nav>
  <h1 class="t-hero sheet-t">${e(m.name)}<i class="dot">&#8288;<b></b></i></h1>
  <div class="g sheet-g">
    <div class="plate c5${m.photo ? '' : ' plate--none'}"${m.photo ? '' : ' aria-hidden="true"'}>${m.photo ? `<img src="${imgURL(m.photo)}" alt="${e([m.name, L.role].filter(Boolean).join(', '))}"${focusStyle(m.focus)} fetchpriority="high" decoding="async">` : ''}</div>
    <div class="h2">
      ${fr.role ? `<p class="t-m role${fr.phrase ? ' has-ph' : ''}"><span data-l="fr">${e(fr.role)}</span><span data-l="en">${e(en.role)}</span></p>` : ''}
      ${fr.phrase ? `<p class="phrase mute"><span data-l="fr">${e(fr.phrase)}</span><span data-l="en">${e(en.phrase)}</span></p>` : ''}
      <div class="bio"><div data-l="fr">${para(fr.bio)}</div><div data-l="en">${para(en.bio)}</div></div>
      ${links.length ? `<ul class="links">${links.map(l => `<li><a class="btn" href="${e(l.url)}"${/^https?:/i.test(l.url) ? ' target="_blank" rel="noopener me"' : ''}><span>${e(l.label)}</span><i class="ar" aria-hidden="true"></i></a></li>`).join('')}</ul>` : ''}
    </div>
  </div>
  ${next ? `<a class="nm-link g next" href="/equipe/${e(next.id)}"><span class="nm">${e(next.name)}</span><span class="nm-role q4" data-i="nextS">Suivant</span></a>` : ''}
</main></div>
${footerHTML(team)}
<script type="application/json" id="en">{"_title":"${e([m.name, en.role].filter(Boolean).join(', '))} · Moyo Studio","skip":"Skip to content","here":"You are here","home":"Home","team":"Team","nextS":"Next"}</script>
${scripts}
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}

export const onRequestGet = async ctx => (await page(ctx)) || Response.redirect(new URL('/#equipe', ctx.request.url).toString(), 302);
