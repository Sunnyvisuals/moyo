/* Team profile page: /equipe/<id>. Rendered on the server from the data the admin publishes (data.team).
   Same template as a project sheet: name on top, portrait on the first axis, words on the third.
   French and English are both in the page; CSS shows the language of <html lang> (chosen on the site, stored as "hb-lang"). */
import { getData } from '../_lib/store.js';
import { escHTML as e, imgURL } from '../../shared/render.js';
import { DESIGN_CSS, headCommon, scripts } from '../../shared/design.js';
import { CHROME_CSS, chromeHead, FOOTER_CSS, GLASS_CSS, footerHTML } from '../../shared/chrome.js';

const para = t => String(t || '').split(/\n{2,}/).map(p => `<p>${e(p).replace(/\n/g, '<br>')}</p>`).join('');

export async function onRequestGet({ params, env, request }) {
  const data = await getData(env);
  const team = data.team || [];
  const i = team.findIndex(m => m.id === params.id);
  if (i < 0) return Response.redirect(new URL('/#equipe', request.url).toString(), 302);
  const m = team[i], next = team.length > 1 ? team[(i + 1) % team.length] : null;
  const fr = m.fr || {}, en = { role: m.en?.role || fr.role, bio: m.en?.bio || fr.bio };
  const about = `${e(m.name)}, ${e(fr.role)}. Moyo, agence créative basée en Provence-Alpes-Côte d’Azur.`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#F5F4F0">
<title>${e(m.name)} · Moyo Studio</title>
<meta name="description" content="${about}">
<meta property="og:title" content="${e(m.name)} · Moyo Studio">
<meta property="og:description" content="${about}">
<meta property="og:type" content="profile">
<meta property="og:image" content="https://moyo-d0n.pages.dev/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="moyo">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://moyo-d0n.pages.dev/og.png">
<link rel="canonical" href="https://moyo-d0n.pages.dev/equipe/${e(m.id)}">
${headCommon}
<style>
${DESIGN_CSS}${CHROME_CSS}${FOOTER_CSS}${GLASS_CSS}
main{min-height:100vh;min-height:100svh}
.bio{max-width:42ch;font-size:var(--fs-lead);line-height:1.5;letter-spacing:-.014em;text-wrap:pretty}
.bio p+p{margin-top:1.1em}
.role{margin-bottom:clamp(2rem,3.6vw,3.75rem)}
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
    <div class="plate c5${m.photo ? '' : ' plate--none'}"${m.photo ? '' : ' aria-hidden="true"'}>${m.photo ? `<img src="${imgURL(m.photo)}" alt="${e(m.name)}">` : ''}</div>
    <div class="h2">
      ${fr.role ? `<p class="t-m role"><span data-l="fr">${e(fr.role)}</span><span data-l="en">${e(en.role)}</span></p>` : ''}
      <div class="bio"><div data-l="fr">${para(fr.bio)}</div><div data-l="en">${para(en.bio)}</div></div>
    </div>
  </div>
  ${next ? `<a class="nm-link g next" href="/equipe/${e(next.id)}"><span class="nm">${e(next.name)}</span><span class="nm-role q4" data-i="nextS">Suivant</span></a>` : ''}
</main></div>
${footerHTML(team)}
<script type="application/json" id="en">{"skip":"Skip to content","here":"You are here","home":"Home","team":"Team","nextS":"Next"}</script>
${scripts}
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
