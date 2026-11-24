/* Project page: /projets/<id>. A real page behind the sheet that opens over the home and /projets: for a shared link, a new tab, a reload,
   a search engine, or a browser without JavaScript. Same template as the sheet and the profiles. French and English are both in the page. */
import seed from '../../data/projects.json';
import { getData } from '../_lib/store.js';
import { escHTML as e, imgURL, catLabel, txt, plateInner } from '../../shared/render.js';
import { DESIGN_CSS, headCommon, scripts } from '../../shared/design.js';
import { CHROME_CSS, chromeHead, FOOTER_CSS, GLASS_CSS, footerHTML } from '../../shared/chrome.js';
import { head, ldWork, sample, SITE } from '../../shared/seo.js';

const two = (fr, en) => `data-fr="${e(fr)}" data-en="${e(en || fr)}">${e(fr)}`;

/* lang: the language of the <head>; functions/en translates the rest */
export async function page({ params, env, request }, lang = 'fr') {
  const data = await getData(env), list = data.projects || [];
  const i = list.findIndex(p => p.id === params.id);
  if (i < 0) return null;
  const p = list[i], nx = list.length > 1 ? list[(i + 1) % list.length] : null, origin = new URL(request.url).origin;
  const fr = txt(p, 'fr'), en = txt(p, 'en'), kind = l => [catLabel(data, p.category, l), (l === 'en' ? en : fr).type].filter(Boolean).join(', ');
  const fact = (k, label, f, g) => f ? `<div><dt data-i="${k}">${label}</dt><dd ${two(f, g)}</dd></div>` : '';
  const L = lang === 'en' ? en : fr, pic = p.cover && new URL(imgURL(p.cover), origin).href, cut = /^\/proj\/(\w+)\.jpg$/.exec(p.cover || ''); // the pictures of the start exist cut for a preview
  const meta = head({ path: '/projets/' + encodeURIComponent(p.id), lang, title: [L.title, L.type].filter(Boolean).join(', ') + ' · Moyo Studio', ogTitle: L.title + ' · Moyo Studio', desc: L.desc, type: 'article',
    image: cut ? { url: `${SITE}/og/${cut[1]}.jpg`, w: 1200, h: 630, alt: L.title } : pic ? { url: pic, alt: L.title } : undefined, robots: sample(p, seed) ? 'noindex,follow' : '', ld: ldWork(p, L, pic, lang) });

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light">
<meta name="theme-color" content="#F5F4F0">
${meta}
${headCommon}
<style>
${DESIGN_CSS}${CHROME_CSS}${FOOTER_CSS}${GLASS_CSS}
main{min-height:100vh;min-height:100svh}
</style>
</head>
<body>
<a class="skip" href="#main" data-i="skip">Aller au contenu</a>
${chromeHead(1)}
<div class="under"><main class="sheet work" id="main">
  <nav class="crumbs" aria-label="Vous êtes ici" data-ia="here"><ol><li><a href="/" data-i="home">Accueil</a></li><li><a href="/projets" data-i="proj">Projets</a></li><li aria-current="page"><span ${two(fr.title, en.title)}</span></li></ol></nav>
  <h1 class="t-hero sheet-t"><span ${two(fr.title, en.title)}</span><i class="dot">&#8288;<b></b></i></h1>
  <div class="g sheet-g">
    <div class="plate c5${p.cover ? '' : ' plate--none'}"${p.cover ? '' : ' aria-hidden="true"'}>${plateInner(p, fr.title).replace('loading="lazy"', 'fetchpriority="high"')}</div>
    <div class="h2">
      <p class="t-lead" ${two(fr.desc, en.desc)}</p>
      <dl class="facts">${fact('fCat', 'Catégorie', kind('fr'), kind('en'))}${fact('fRole', 'Rôle', fr.role, en.role)}${fact('fPlace', 'Lieu', fr.place, en.place)}${fact('fYear', 'Année', p.year, p.year)}</dl>
    </div>
  </div>
  <div class="gallery">${(p.images || []).map(id => `<img src="${imgURL(id)}" alt="" loading="lazy" decoding="async">`).join('')}</div>
  ${nx ? `<a class="nm-link g next" href="/projets/${e(nx.id)}"><span class="nm" ${two(txt(nx, 'fr').title, txt(nx, 'en').title)}</span><span class="nm-role q4" data-i="nextP">Projet suivant</span></a>` : ''}
</main></div>
${footerHTML(data.team)}
<script type="application/json" id="en">{"_title":"${e([en.title, en.type].filter(Boolean).join(', '))} · Moyo Studio","skip":"Skip to content","here":"You are here","home":"Home","proj":"Projects","fCat":"Category","fRole":"Role","fPlace":"Place","fYear":"Year","nextP":"Next project"}</script>
${scripts}
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}

export const onRequestGet = async ctx => (await page(ctx)) || ctx.next(); // unknown: the 404 page
