/* Team profile page: /equipe/<id>. Rendered on the server from the data the admin publishes (data.team).
   French and English are both in the page; a small script shows the language chosen on the site (stored as "hb-lang"). */
import { getData } from '../_lib/store.js';
import { escHTML as e, imgURL } from '../../shared/render.js';
import { CHROME_CSS, LANG_CSS, chromeHead, FOOTER_CSS, footerHTML } from '../../shared/chrome.js';

const para = t => String(t || '').split(/\n{2,}/).map(p => `<p>${e(p).replace(/\n/g, '<br>')}</p>`).join('');

export async function onRequestGet({ params, env, request }) {
  const data = await getData(env);
  const team = data.team || [];
  const i = team.findIndex(m => m.id === params.id);
  if (i < 0) return Response.redirect(new URL('/#studio', request.url).toString(), 302);
  const m = team[i];
  const fr = m.fr || {}, en = { role: m.en?.role || fr.role, bio: m.en?.bio || fr.bio };

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${e(m.name)} · Moyo Studio</title>
<meta name="description" content="${e(m.name)}, ${e(fr.role)}. Moyo, agence créative basée en Provence-Alpes-Côte d’Azur.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23002FA7'/%3E%3Cpath d='M0 11h32M0 21h32' stroke='%23F1F3F2' stroke-width='2'/%3E%3C/svg%3E">
<link rel="preload" href="/fonts/hanken-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<style>
@font-face{font-family:"Hanken Grotesk";src:url(/fonts/hanken-grotesk.woff2) format("woff2");font-weight:100 900;font-display:swap}
@view-transition{navigation:auto;types:page}
:root{--chaux:#F1F3F2;--klein:#002FA7;--paper:#F1F3F2;--soft:color-mix(in oklab,var(--klein) 88%,var(--chaux));--line:color-mix(in oklab,var(--klein) 24%,var(--chaux));--wash:color-mix(in oklab,var(--klein) 7%,var(--chaux));
  --paper-soft:color-mix(in oklab,var(--paper) 90%,var(--klein));--paper-line:color-mix(in oklab,var(--paper) 34%,var(--klein));--m:clamp(20px,3.2vw,56px);--ease:cubic-bezier(.25,1,.5,1);--ease-enter:cubic-bezier(.25,1,.5,1);--dur-1:450ms;--dur-3:950ms;--dur-4:1500ms;--hdr:clamp(64px,8vh,84px);--fs-small:.9375rem;--fs-lead:clamp(1.125rem,1.4vw,1.375rem)}
*,*::before,*::after{box-sizing:border-box}
html{background:var(--chaux);scrollbar-width:none}html::-webkit-scrollbar{display:none}
body{margin:0;color:var(--klein);font-family:"Hanken Grotesk",system-ui,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
h1,h2,p,ul{margin:0}ul{padding:0;list-style:none}a{color:inherit}
:focus-visible{outline:2px solid currentColor;outline-offset:3px}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
main{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:40px clamp(16px,2vw,32px);align-items:end;min-height:100svh;padding:calc(var(--hdr) + clamp(16px,3vh,40px)) var(--m) clamp(48px,8vh,96px);max-width:calc(1500px + 2 * var(--m));margin:0 auto}
.photo{grid-column:1/6;aspect-ratio:4/5;max-height:calc(100svh - var(--hdr) - clamp(64px,11vh,136px));background:#b0b4ba;position:relative;overflow:hidden}
.photo img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.who{grid-column:7/-1}
h1{font-size:clamp(2.5rem,5.2vw,5.5rem);font-weight:300;letter-spacing:-.045em;line-height:1.02;text-wrap:balance}
.bio{margin-top:clamp(20px,3vh,36px);font-size:clamp(1.125rem,1.4vw,1.375rem);line-height:1.6;max-width:44ch}
.bio p+p{margin-top:1em}
@media (prefers-reduced-motion:no-preference){
  .photo,h1,.bio{animation:in 1.2s var(--ease) both}h1{animation-delay:.1s}.bio{animation-delay:.18s}
  html:active-view-transition-type(page)::view-transition-old(root){animation:pgOut 1.3s cubic-bezier(.76,0,.24,1) both}
  html:active-view-transition-type(page)::view-transition-new(root){animation:pgIn 1.3s cubic-bezier(.76,0,.24,1) both}
  html:active-view-transition-type(page)::view-transition{background:color-mix(in oklab,var(--klein) 38%,#000614)}
}
@keyframes in{from{opacity:0;translate:0 28px}}
@keyframes pgOut{to{scale:.86;border-radius:28px;filter:brightness(.5)}}
@keyframes pgIn{from{translate:0 100%;border-radius:28px 28px 0 0}to{translate:0 0;border-radius:0}}
@media (max-width:820px){main{min-height:0;align-items:start}.photo,.who{grid-column:1/-1}.photo{max-height:none}}
span[data-l],div[data-l]{display:none}html[lang=fr] :is(span,div)[data-l=fr],html[lang=en] :is(span,div)[data-l=en]{display:revert}

${CHROME_CSS}${LANG_CSS}${FOOTER_CSS}
.foot{margin-top:0;animation:none}
/* Language switch: the page blurs out and the other language fades in (no abrupt swap) */
@media (prefers-reduced-motion:no-preference){
  html:active-view-transition-type(lang)::view-transition-old(root){animation:langOut .42s cubic-bezier(.76,0,.24,1) both}
  html:active-view-transition-type(lang)::view-transition-new(root){animation:langIn .7s cubic-bezier(.25,1,.5,1) .12s both}
}
@keyframes langOut{to{opacity:0;filter:blur(8px)}}
@keyframes langIn{from{opacity:0;filter:blur(8px)}}
</style>
<script>for(const t of['pagereveal','pageswap'])addEventListener(t,e=>{const v=e.viewTransition;if(v)for(const p of[v.ready,v.finished,v.updateCallbackDone])p&&p.catch(()=>{})});
try{if(localStorage.getItem('hb-lang')==='en')document.documentElement.lang='en'}catch(e){}</script>
</head>
<body>
${chromeHead(5)}
<main id="main">
  <div class="photo"${m.photo ? '' : ' aria-hidden="true"'}>${m.photo ? `<img src="${imgURL(m.photo)}" alt="${e(m.name)}">` : ''}</div>
  <div class="who">
    <h1>${e(m.name)}</h1>
    <div class="bio"><div data-l="fr">${para(fr.bio)}</div><div data-l="en">${para(en.bio)}</div></div>
  </div>
</main>
${footerHTML()}
<script src="/lenis.js"></script>
<script>(()=>{const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,root=document.documentElement;
const set=l=>{if(l===root.lang)return;const run=()=>{root.lang=l};if(document.startViewTransition&&!reduce){try{document.startViewTransition({update:run,types:['lang']}).finished.catch(()=>{})}catch(e){run()}}else run();try{localStorage.setItem('hb-lang',l)}catch(e){}};
document.getElementById('langBtn').addEventListener('click',()=>set(root.lang==='en'?'fr':'en'));
document.querySelectorAll('.flang button').forEach(b=>b.addEventListener('click',()=>set(b.dataset.l)));
if(!reduce&&typeof Lenis!=='undefined')new Lenis({lerp:.055,wheelMultiplier:.8,smoothWheel:true,autoRaf:true});})();</script>
<script src="/chrome.js" defer></script>
<script src="/footer.js" defer></script>
<script src="/hand.js" defer></script>
<script src="/reveal.js" defer></script>
<script src="/leave.js" defer></script>
<script src="/cursor.js" defer></script>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' } });
}
