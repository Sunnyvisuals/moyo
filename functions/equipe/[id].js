/* Team profile page: /equipe/<id>. Rendered on the server from the data the admin publishes (data.team).
   French and English are both in the page; a small script shows the language chosen on the site (stored as "hb-lang"). */
import { getData } from '../_lib/store.js';
import { escHTML as e, imgURL } from '../../shared/render.js';

const para = t => String(t || '').split(/\n{2,}/).map(p => `<p>${e(p).replace(/\n/g, '<br>')}</p>`).join('');

export async function onRequestGet({ params, env, request }) {
  const data = await getData(env);
  const team = data.team || [];
  const i = team.findIndex(m => m.id === params.id);
  if (i < 0) return Response.redirect(new URL('/#studio', request.url).toString(), 302);
  const m = team[i], next = team[(i + 1) % team.length];
  const fr = m.fr || {}, en = { role: m.en?.role || fr.role, bio: m.en?.bio || fr.bio };

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${e(m.name)} · Moyo Studio</title>
<meta name="description" content="${e(m.name)}, ${e(fr.role)}. Moyo, studio de design basé en Provence-Alpes-Côte d’Azur.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23002FA7'/%3E%3Cpath d='M0 11h32M0 21h32' stroke='%23F1F3F2' stroke-width='2'/%3E%3C/svg%3E">
<link rel="preload" href="/fonts/hanken-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<style>
@font-face{font-family:"Hanken Grotesk";src:url(/fonts/hanken-grotesk.woff2) format("woff2");font-weight:100 900;font-display:swap}
@view-transition{navigation:auto;types:page}
:root{--chaux:#F1F3F2;--klein:#002FA7;--paper:#F1F3F2;--soft:color-mix(in oklab,var(--klein) 74%,var(--chaux));--line:color-mix(in oklab,var(--klein) 24%,var(--chaux));--wash:color-mix(in oklab,var(--klein) 7%,var(--chaux));
  --paper-soft:color-mix(in oklab,var(--paper) 82%,var(--klein));--paper-line:color-mix(in oklab,var(--paper) 34%,var(--klein));--m:clamp(20px,3.2vw,56px);--ease:cubic-bezier(.25,1,.5,1)}
*,*::before,*::after{box-sizing:border-box}
html{background:var(--chaux);scrollbar-width:none}html::-webkit-scrollbar{display:none}
body{margin:0;color:var(--klein);font-family:"Hanken Grotesk",system-ui,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
h1,h2,p,ul{margin:0}ul{padding:0;list-style:none}a{color:inherit}
:focus-visible{outline:2px solid currentColor;outline-offset:3px}
.top{display:flex;justify-content:space-between;align-items:center;padding:var(--m) var(--m) 0}
.top a,.top button{font:inherit;font-size:.875rem;font-weight:500;color:inherit;background:none;border:0;cursor:pointer;text-decoration:none;min-height:44px;display:inline-flex;align-items:center;padding:0 12px}
.mark{font-size:1.125rem!important;font-weight:550!important;letter-spacing:-.02em;padding:0!important}
main{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:24px;padding:clamp(56px,10vh,120px) var(--m) clamp(72px,12vh,140px);max-width:calc(1500px + 2 * var(--m));margin:0 auto}
.idx{grid-column:1/-1;display:flex;align-items:center;gap:14px;font-size:.75rem;font-weight:500;letter-spacing:.09em;text-transform:uppercase;margin-bottom:clamp(24px,5vh,56px)}
.idx i{width:18px;height:7px;border-block:1px solid currentColor}.idx::after{content:"";flex:1;height:1px;background:currentColor;opacity:.22}
h1{grid-column:1/-1;font-size:clamp(3rem,9vw,9rem);font-weight:300;letter-spacing:-.05em;line-height:.95;text-wrap:balance}
.role{grid-column:1/7;font-size:clamp(1.125rem,1.6vw,1.5rem);margin-top:clamp(16px,3vh,32px);color:var(--soft)}
.photo{grid-column:1/6;grid-row:span 2;margin-top:clamp(48px,8vh,96px);aspect-ratio:4/5;background:var(--klein);position:relative;overflow:hidden}
.photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.photo.empty{background:linear-gradient(var(--klein),var(--klein)) 0 0/100% 31% no-repeat,linear-gradient(var(--klein),var(--klein)) 0 50%/100% 31% no-repeat,linear-gradient(var(--klein),var(--klein)) 0 100%/100% 31% no-repeat;background-color:transparent}
.bio{grid-column:7/-1;margin-top:clamp(48px,8vh,96px);font-size:clamp(1.0625rem,1.35vw,1.25rem);max-width:46ch;display:grid;gap:1em}
.links{grid-column:7/-1;align-self:start;display:flex;flex-wrap:wrap;gap:8px;margin-top:24px}
.links a{display:inline-flex;align-items:center;gap:12px;min-height:48px;padding:0 20px;border:1px solid currentColor;text-decoration:none;font-size:.875rem;font-weight:500;transition:background .45s var(--ease),color .45s var(--ease)}
.links a:hover{background:var(--klein);color:var(--paper)}
.cta-bar{display:grid;grid-template-columns:1fr 1fr clamp(72px,7vw,104px);min-height:clamp(84px,11vh,112px)}
.cta-bar a{display:flex;flex-direction:column;justify-content:center;gap:6px;padding:0 clamp(20px,2.4vw,40px);color:var(--paper);text-decoration:none;transition:background .45s var(--ease)}
.cta-bar .n{font-size:.6875rem;font-weight:600;opacity:.75}.cta-bar .t{font-size:clamp(1rem,1.4vw,1.375rem);font-weight:600;text-transform:uppercase}
.cta-bar a:nth-child(1){background:color-mix(in oklab,var(--klein) 58%,#000614)}.cta-bar a:nth-child(2){background:var(--klein)}
.cta-bar a:nth-child(3){background:var(--wash);color:var(--klein);display:grid;grid-template-columns:repeat(2,8px);gap:6px;place-content:center}
.cta-bar a:nth-child(3) i{width:8px;height:8px;background:currentColor}
footer{background:var(--klein);color:var(--paper);padding:28px var(--m);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:.875rem}
footer a{color:var(--paper)}
@media (prefers-reduced-motion:no-preference){
  h1,.role,.photo,.bio,.links{animation:in 1.2s var(--ease) both}.role{animation-delay:.1s}.photo{animation-delay:.18s}.bio{animation-delay:.26s}.links{animation-delay:.32s}
  html:active-view-transition-type(page)::view-transition-old(root){animation:pgOut 1.3s cubic-bezier(.76,0,.24,1) both}
  html:active-view-transition-type(page)::view-transition-new(root){animation:pgIn 1.3s cubic-bezier(.76,0,.24,1) both}
  html:active-view-transition-type(page)::view-transition{background:color-mix(in oklab,var(--klein) 38%,#000614)}
}
@keyframes in{from{opacity:0;translate:0 28px}}
@keyframes pgOut{to{scale:.86;border-radius:28px;filter:brightness(.5)}}
@keyframes pgIn{from{translate:0 100%;border-radius:28px 28px 0 0}to{translate:0 0;border-radius:0}}
@media (max-width:820px){.role,.photo,.bio,.links{grid-column:1/-1}.photo{grid-row:auto}}
[data-l]{display:none}html[lang=fr] [data-l=fr],html[lang=en] [data-l=en]{display:revert}
</style>
<script>for(const t of['pagereveal','pageswap'])addEventListener(t,e=>{const v=e.viewTransition;if(v)for(const p of[v.ready,v.finished,v.updateCallbackDone])p&&p.catch(()=>{})});
try{if(localStorage.getItem('hb-lang')==='en')document.documentElement.lang='en'}catch(e){}</script>
</head>
<body>
<header class="top">
  <a class="mark" href="/">moyo</a>
  <nav><a href="/#studio"><span data-l="fr">Le studio</span><span data-l="en">The studio</span></a><button type="button" id="lang"><span data-l="fr">EN</span><span data-l="en">FR</span></button></nav>
</header>
<main>
  <p class="idx" aria-hidden="true"><i></i><span data-l="fr">L’équipe</span><span data-l="en">The team</span></p>
  <h1>${e(m.name)}</h1>
  <p class="role"><span data-l="fr">${e(fr.role)}</span><span data-l="en">${e(en.role)}</span></p>
  <div class="photo${m.photo ? '' : ' empty'}" aria-hidden="${m.photo ? 'false' : 'true'}">${m.photo ? `<img src="${imgURL(m.photo)}" alt="${e(m.name)}">` : ''}</div>
  <div class="bio"><div data-l="fr">${para(fr.bio)}</div><div data-l="en">${para(en.bio)}</div></div>
  ${m.links?.length ? `<ul class="links">${m.links.map(l => `<li><a href="${e(l.url)}"${/^https?:/i.test(l.url) ? ' target="_blank" rel="noopener"' : ''}>${e(l.label)} →</a></li>`).join('')}</ul>` : ''}
</main>
<nav class="cta-bar" aria-label="Suite">
  ${next && next.id !== m.id ? `<a href="/equipe/${e(next.id)}"><span class="n">01</span><span class="t">${e(next.name)}</span></a>` : `<a href="/#studio"><span class="n">01</span><span class="t"><span data-l="fr">Le studio</span><span data-l="en">The studio</span></span></a>`}
  <a href="/#contact"><span class="n">02</span><span class="t"><span data-l="fr">Écrire au studio</span><span data-l="en">Write to the studio</span></span></a>
  <a href="/" aria-label="Accueil"><i></i><i></i><i></i><i></i></a>
</nav>
<footer><span>© 2026 moyo · Provence-Alpes-Côte d’Azur</span><a href="mailto:contact.moyostudio@gmail.com">contact.moyostudio@gmail.com</a><a href="/"><span data-l="fr">Retour à l’accueil</span><span data-l="en">Back to home</span></a></footer>
<script>document.getElementById('lang').addEventListener('click',()=>{const l=document.documentElement.lang==='en'?'fr':'en';document.documentElement.lang=l;try{localStorage.setItem('hb-lang',l)}catch(e){}});</script>
<script src="/cursor.js" defer></script>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
