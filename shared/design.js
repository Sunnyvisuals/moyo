/* The design system of the site, the same on every page (home, /projets, /equipe/<id>).

   Colour   off-white, ink, one grey. Klein blue is the only colour, and it always means something: the action, the idea, the end.
   Type     one family (Hanken Grotesk), three weights: 400 to read, 600 for names and rows, 700 for titles. A few sizes, always the same.
   Grid     12 columns, four axes: 1, 4, 7, 10. Every block of every page, the header and the footer start on one of them.
   Space    what belongs together is close (8 to 24px), groups are apart (48 to 104px), sections are far apart (--sec).
   Motion   one curve. Things fade and rise as they arrive, and leave the same way. Titles do not move.

   Keep `export` on the last line only. */

const DESIGN_CSS = `
@font-face{font-family:"Hanken Grotesk";src:url(/fonts/hanken-grotesk.woff2) format("woff2");font-weight:100 900;font-style:normal;font-display:swap}
:root{
  color-scheme:light;
  --bg:#F5F4F0;--tint:#E8E6DF;--ink:#121214;--mute:#65656B;--line:rgb(18 18 20 / .15);--klein:#002FA7;
  --sans:"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  /* type */
  --fs-hero:clamp(2.75rem,8.5vw,9.75rem);
  --fs-xl:clamp(2.5rem,5.5vw,6.5rem);
  --fs-l:clamp(1.75rem,3.5vw,4.125rem);
  --fs-row:clamp(1.5rem,2.5vw,2.875rem);
  --fs-m:clamp(1.3125rem,1.9vw,2.125rem);
  --fs-lead:clamp(1.125rem,1.35vw,1.5rem);
  --fs-body:clamp(1.0625rem,1.2vw,1.25rem);
  --fs-small:clamp(.9375rem,1.02vw,1.0625rem);
  /* space */
  --m:clamp(20px,3.4vw,64px);--gut:clamp(16px,1.8vw,32px);--max:1680px;
  --edge:max(var(--m),calc((100vw - var(--max)) / 2));
  --sec:clamp(8rem,16vw,17rem);
  --gap:clamp(3rem,6.4vw,7rem);
  --hdr:clamp(64px,8vh,84px);
  /* motion */
  --ease:cubic-bezier(.16,1,.3,1);--ease-io:cubic-bezier(.76,0,.24,1);
  /* names used by the header, the menu and the footer */
  --chaux:var(--bg);--paper:var(--bg);
  --paper-soft:color-mix(in oklab,var(--bg) 80%,var(--klein));--paper-line:color-mix(in oklab,var(--bg) 34%,var(--klein));
  --ease-enter:var(--ease);--dur-1:.45s;--dur-3:.9s;--dur-4:1.2s;
}
*,*::before,*::after{box-sizing:border-box}
html{background:var(--bg);-webkit-text-size-adjust:100%;scrollbar-width:none}
html::-webkit-scrollbar,#proj::-webkit-scrollbar,#menu::-webkit-scrollbar{display:none}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:var(--fs-body);font-weight:400;line-height:1.5;letter-spacing:-.008em;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:clip}
h1,h2,h3,p,ol,ul,dl,dd,figure,fieldset{margin:0}
ol,ul,legend{padding:0;list-style:none}
fieldset{border:0;padding:0;min-width:0}
a{color:inherit;text-decoration:none}
i{font-style:normal}
button{font:inherit;color:inherit;letter-spacing:inherit;text-align:inherit;background:none;border:0;padding:0;cursor:pointer}
input,textarea{font:inherit;color:inherit;letter-spacing:inherit}
img{display:block;max-width:100%}
:focus-visible{outline:2px solid var(--klein);outline-offset:6px}
::selection{background:var(--klein);color:var(--bg)}
.sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
.hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.skip{position:fixed;left:12px;top:-80px;z-index:200;background:var(--ink);color:var(--bg);padding:12px 18px;font-weight:600}
.skip:focus{top:12px}

/* ---------- Type ---------- */
.t-hero,.t-xl,.t-l,.t-m{text-wrap:balance}
.t-hero{font-size:var(--fs-hero);font-weight:700;line-height:.99;letter-spacing:-.05em}
.t-xl{font-size:var(--fs-xl);font-weight:700;line-height:1;letter-spacing:-.048em}
.t-l{font-size:var(--fs-l);font-weight:600;line-height:1.14;letter-spacing:-.036em}
.t-m{font-size:var(--fs-m);font-weight:600;line-height:1.2;letter-spacing:-.026em}
.t-lead{font-size:var(--fs-lead);line-height:1.5;letter-spacing:-.014em}
.t-small{font-size:var(--fs-small);line-height:1.45}
/* titles are cut at the height of the capitals: what is next to them lines up with the letters, not with invisible leading */
.t-hero,.t-xl,.t-l,.t-m{text-box:trim-both cap alphabetic}
p,.r-desc{text-wrap:pretty}
.mute{color:var(--mute)}
.dot,.k{color:var(--klein)}

/* ---------- Grid: four axes ---------- */
.g{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gut)}
.g>*{grid-column:1/-1;min-width:0}
.sec{padding:var(--sec) var(--edge) 0}
.sec>.t-xl{margin-bottom:var(--gap)}
@media (min-width:821px){
  .q1{grid-column:1/4!important}.q2{grid-column:4/7!important}.q3{grid-column:7/10!important}.q4{grid-column:10/-1!important}
  .h1{grid-column:1/7!important}.h2{grid-column:7/-1!important}
  .c5{grid-column:1/6!important}
}

/* ---------- Links and buttons ---------- */
.lnk{display:inline-flex;align-items:center;gap:.45em;min-height:44px;font-weight:600;background:linear-gradient(currentColor,currentColor) 0 calc(50% + .72em)/100% 1px no-repeat;transition:color .4s,background-size .7s var(--ease)}
.lnk:hover{color:var(--klein);background-size:0 1px;background-position:100% calc(50% + .72em)}
.lnk i{transition:translate .6s var(--ease)}
.lnk:hover i{translate:3px 0}.lnk:hover i.dn{translate:0 3px}.lnk:hover i.up{translate:2px -2px}
.btn{display:inline-flex;align-items:center;justify-content:space-between;gap:2.5em;min-height:60px;padding:0 30px;border-radius:999px;background:var(--klein);color:var(--bg);font-weight:600;transition:background .5s,gap .7s var(--ease)}
.btn:hover{background:var(--ink);gap:3.25em}
.btn:disabled{opacity:.5;cursor:progress}

/* ---------- Pictures ---------- */
.plate{position:relative;display:block;aspect-ratio:4/5;overflow:clip;background:var(--tint)}
.plate img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 8%;transition:scale 1.4s var(--ease)}
/* no picture yet: the dot */
.plate--none::after{content:"";position:absolute;left:50%;top:50%;width:26%;aspect-ratio:1;translate:-50% -50%;border-radius:50%;background:var(--klein);transition:scale 1.2s var(--ease)}

/* ---------- Projects: one per row on the home (picture on the first axis, words on the third) ---------- */
.row{display:block;width:100%}
.row:focus-visible{outline-offset:12px}
.row .r-title{display:block;transition:color .4s}
.row .r-desc{display:block;color:var(--mute)}
.row .r-type,.row .r-meta{display:block}
@media (hover:hover){
  .row:hover .plate img{scale:1.025}
  .row:hover .plate--none::after{scale:1.12}
  .row:hover .r-title{color:var(--klein)}
}
.cases{display:grid;row-gap:clamp(4.5rem,11vw,12rem)}
.cases .row{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));column-gap:var(--gut)}
.cases .plate{grid-column:1/-1}
.cases .cap{grid-column:1/-1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px var(--gut);padding-top:24px;align-content:start}
.cases .r-title,.cases .r-desc{grid-column:1/-1}
.cases .r-title{font-size:var(--fs-l);font-weight:600;line-height:1.1;letter-spacing:-.038em}
.cases .r-desc{max-width:44ch}
.cases .r-type,.cases .r-meta{font-size:var(--fs-small)}
@media (min-width:821px){
  .cases .plate{grid-column:1/6}
  .cases .cap{grid-column:7/-1;grid-template-columns:subgrid;grid-template-rows:auto auto 1fr;gap:clamp(20px,2.2vw,36px) var(--gut);padding:0}
  .cases .r-title{text-box:trim-both cap alphabetic}
  .cases .r-type,.cases .r-meta{align-self:end;text-box:trim-end cap alphabetic}
  .cases .r-type{grid-column:1/4}
  .cases .r-meta{grid-column:4/-1}
}

/* ---------- Rows: services, team ---------- */
.rows{border-top:1px solid var(--line)}
.rows>li{border-bottom:1px solid var(--line)}
.line{padding:clamp(1.5rem,2.5vw,2.75rem) 0;align-items:baseline;row-gap:10px}
.line .t-m{font-size:var(--fs-row);letter-spacing:-.034em;line-height:1.15;text-box:normal}
.line p{max-width:44ch}
@media (hover:hover){
  .rows>li{transition:opacity .6s var(--ease)}
  .rows:hover>li:not(:hover){opacity:.28}
}

/* ---------- Project sheet and profile: title on top, picture on the first axis, words on the third ---------- */
.sheet{padding:calc(var(--hdr) + clamp(2.5rem,7vw,7rem)) var(--edge) var(--sec)}
.sheet-t{margin-bottom:var(--gap)}
.sheet-g{row-gap:40px;align-items:start}
.sheet-g .t-lead{max-width:42ch;text-wrap:pretty;text-box:trim-start cap alphabetic}
.facts{margin-top:clamp(2.5rem,5vw,5rem);border-top:1px solid var(--line)}
.facts>div{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:var(--gut);padding:16px 0;border-bottom:1px solid var(--line);font-size:var(--fs-small)}
.facts dt{color:var(--mute)}

#proj{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;background:var(--bg);color:var(--ink);overflow:auto;overscroll-behavior:contain;translate:0 100%;
  transition:translate .95s var(--ease-io),overlay .95s allow-discrete,display .95s allow-discrete}
#proj[open]{translate:0 0}
@starting-style{#proj[open]{translate:0 100%}}
#proj::backdrop{background:rgb(18 18 20 / 0);transition:background .9s,overlay .9s allow-discrete,display .9s allow-discrete}
#proj[open]::backdrop{background:rgb(18 18 20 / .4)}
@starting-style{#proj[open]::backdrop{background:rgb(18 18 20 / 0)}}
#proj .plate{aspect-ratio:auto}
#proj .plate img{position:static;height:auto}
#proj .plate--none{aspect-ratio:4/5}
.dlg-actions{position:fixed;z-index:3;top:0;right:var(--edge);height:var(--hdr);display:flex;align-items:center;gap:clamp(18px,2.4vw,36px);color:#fff;mix-blend-mode:difference}
.dlg-actions button{min-height:44px;font-weight:600;font-size:var(--fs-small)}
.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gut);margin-top:var(--gap)}
.gallery:empty{display:none}
.gallery img{width:100%}
html.is-dialog{overflow:hidden}
@media (max-width:820px){.gallery{grid-template-columns:1fr}}

/* ---------- Page change: the old page steps back, the new one rises over it. Language: a short blur. ---------- */
@view-transition{navigation:auto;types:page}
@media (prefers-reduced-motion:no-preference){
  html:active-view-transition-type(page)::view-transition{background:var(--klein)}
  html:active-view-transition-type(page)::view-transition-group(root){animation-duration:1.2s}
  html:active-view-transition-type(page)::view-transition-old(root){animation:pgOut 1.2s var(--ease-io) both;transform-origin:50% 50%}
  html:active-view-transition-type(page)::view-transition-new(root){animation:pgIn 1.2s var(--ease-io) both}
  html:active-view-transition-type(lang)::view-transition-old(root){animation:langOut .42s var(--ease-io) both}
  html:active-view-transition-type(lang)::view-transition-new(root){animation:langIn .7s var(--ease) .12s both}
}
@keyframes pgOut{to{scale:.92;opacity:.4}}
@keyframes pgIn{from{translate:0 100%}to{translate:0 0}}
@keyframes langOut{to{opacity:0;filter:blur(8px)}}
@keyframes langIn{from{opacity:0;filter:blur(8px)}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;

/* Project sheet (home and /projets). Filled by site.js. */
const sheetHTML = `<dialog id="proj" aria-labelledby="pTitle">
  <div class="dlg-actions">
    <button type="button" id="pPrev" data-i="prev">Précédent</button>
    <button type="button" id="pNext" data-i="next">Suivant</button>
    <button type="button" id="pClose" data-i="close">Fermer</button>
  </div>
  <div class="dlg-in sheet">
    <h2 class="t-hero sheet-t"><span id="pTitle"></span><i class="dot">.</i></h2>
    <div class="g sheet-g">
      <span class="plate c5" id="pPlate" aria-hidden="true"></span>
      <div class="h2">
        <p class="t-lead" id="pDesc"></p>
        <dl class="facts">
          <div><dt data-i="fCat">Catégorie</dt><dd id="pTag"></dd></div>
          <div><dt data-i="fRole">Rôle</dt><dd id="pRole"></dd></div>
          <div><dt data-i="fPlace">Lieu</dt><dd id="pPlace"></dd></div>
          <div><dt data-i="fYear">Année</dt><dd id="pYear"></dd></div>
        </dl>
      </div>
    </div>
    <div class="gallery" id="pGallery"></div>
  </div>
</dialog>`;

/* What every <head> needs, besides its own title and description. */
const headCommon = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23F5F4F0'/%3E%3Ccircle cx='16' cy='16' r='7' fill='%23002FA7'/%3E%3C/svg%3E">
<link rel="preload" href="/fonts/hanken-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<script>/* the language chosen on the site, before anything is drawn. Page transitions can be cut short by a fast click: that is not an error. */
try{var l=localStorage.getItem('hb-lang');if(l!=='fr'&&l!=='en')l=/^fr/i.test(navigator.language||'fr')?'fr':'en';document.documentElement.lang=l}catch(e){}
for(const t of['pagereveal','pageswap'])addEventListener(t,e=>{const v=e.viewTransition;if(v)for(const p of[v.ready,v.finished,v.updateCallbackDone])p&&p.catch(()=>{})});</script>`;

/* Scripts of every page, in order. */
const scripts = `<script src="/lenis.js" defer></script>
<script src="/site.js" defer></script>
<script src="/chrome.js" defer></script>
<script src="/footer.js" defer></script>
<script src="/glass.js" defer></script>
<script src="/stage.js" defer></script>
<script src="/reveal.js" defer></script>
<script src="/roll.js" defer></script>
<script src="/leave.js" defer></script>
<script src="/cursor.js" defer></script>`;

export { DESIGN_CSS, sheetHTML, headCommon, scripts };
