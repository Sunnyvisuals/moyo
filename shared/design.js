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
.k{color:var(--klein)}
/* the dot: it ends the titles, loads the pages, is the cursor, shows the way, and looks at you in the footer */
html.js .sec .dot b{opacity:0;translate:0 -1.35em}
html.js .sec .dot.in b{opacity:1;translate:0 0;transition:opacity .15s ease .2s,translate 1.05s linear(0,.0157,.0625,.1406,.25,.3906,.5625,.7656,1 36.4%,.8906 45.5%,.8125 50%,.7656 54.5%,.75 59%,.7656 63.6%,.8125 68.2%,.8906 72.7%,1 77.3%,.9531,.9375 86.4%,.9531,1 95.5%,.9844,1) .2s}
@media (prefers-reduced-motion:reduce){html.js .sec .dot b{opacity:1;translate:0 0}}
.dot b{display:inline-block;width:.155em;aspect-ratio:1;margin-left:.075em;border-radius:50%;background:var(--klein)}

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

/* ---------- Projects. Home: an accordion of pictures (the one you look at opens), its caption below, on the axes. /projets: a contact sheet. ---------- */
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
  .cases{--k:4.4;--gp:clamp(8px,.9vw,16px);--cap:clamp(11.5rem,14vw,16rem);position:relative;container-type:inline-size;display:flex;gap:var(--gp);padding-bottom:var(--cap)}
  .cases .case{flex:1 1 0;min-width:0;transition:flex-grow 1.15s var(--ease)}
  .cases .case.on,.cases:not(:has(.on)) .case:first-child{flex-grow:var(--k)}
  .cases .row{display:block}
  .cases .plate{aspect-ratio:auto;height:clamp(320px,min(53svh,41vw),720px)}
  /* the picture keeps its open width: the card is a window that opens on it */
  .cases .plate img{left:50%;width:calc((100cqw - (var(--n,5) - 1) * var(--gp)) * var(--k) / (var(--n,5) + var(--k) - 1));max-width:none;translate:calc(-50% + var(--px,0px)) 0;scale:1.04;transition:scale 1.4s var(--ease),translate .9s var(--ease)}
  .cases .case.on .plate img{scale:1.01}
  .cases .cap{position:absolute;left:0;right:0;bottom:0;height:calc(var(--cap) - clamp(24px,2.4vw,40px));display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-template-rows:auto 1fr;gap:0 var(--gut);padding:0;pointer-events:none}
  .cases .cap>*{opacity:0;translate:0 20px;transition:opacity .25s ease,translate .3s ease}
  .cases .case.on .cap>*,.cases:not(:has(.on)) .case:first-child .cap>*{opacity:1;translate:0 0;transition:opacity .8s ease calc(.12s + var(--c,0) * 70ms),translate 1s var(--ease) calc(.12s + var(--c,0) * 70ms)}
  .cases .r-title{grid-column:1/7;text-box:trim-both cap alphabetic}
  .cases .r-desc{--c:1;grid-column:7/-1;text-box:trim-start cap alphabetic}
  .cases .r-type{--c:2;grid-column:7/10;grid-row:2;align-self:end;text-box:trim-end cap alphabetic}
  .cases .r-meta{--c:3;grid-column:10/-1;grid-row:2;align-self:end;text-box:trim-end cap alphabetic}
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

/* ---------- The way ----------
   Home: a line in the margin, one stop per section, the dot travels on it with the scroll (path.js). Hover or focus: the names.
   Other pages: the same line laid flat above the title (where you come from, where you are), and the next stop at the end. */
.path{position:fixed;z-index:60;right:0;top:50%;width:var(--edge);height:min(46vh,440px);translate:0 -50%;opacity:0;visibility:hidden;transition:opacity .6s ease,visibility 0s .6s}
.path.on{opacity:1;visibility:visible;transition:opacity .6s ease}
.path-l{position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgb(18 18 20 / .2)}
.path-l::after{content:"";position:absolute;left:0;top:0;width:100%;height:100%;background:var(--klein);transform-origin:50% 0;transform:scaleY(var(--pp,0))}
.path ol{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between}
.path li{position:relative;height:0}
.path a{position:absolute;right:0;top:-22px;width:100%;height:44px;display:grid;place-items:center}
.path a::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--bg);box-shadow:0 0 0 1px rgb(18 18 20 / .4);transition:background .4s,box-shadow .4s}
.path a.past::before{background:var(--klein);box-shadow:0 0 0 1px var(--klein)}
.path a span{position:absolute;right:calc(50% + 22px);font-size:var(--fs-small);font-weight:500;white-space:nowrap;opacity:0;translate:10px 0;transition:opacity .35s ease,translate .6s var(--ease),color .3s;pointer-events:none}
.path a[aria-current]{color:var(--klein)}
.path a:hover{color:var(--klein)}
.path-d{position:absolute;left:50%;top:0;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:var(--klein);translate:0 var(--py,0px);pointer-events:none}
.path-h{display:none;position:absolute;left:calc(50% + 8px);top:0;font-size:14px;line-height:1;font-weight:500;white-space:nowrap;writing-mode:vertical-rl;translate:0 calc(var(--py,0px) - 50%);opacity:var(--ho,1);transition:opacity .3s ease;pointer-events:none}
.path::before{content:"";position:absolute;right:0;top:-50vh;bottom:-50vh;width:calc(var(--edge) * .5 + 230px);background:linear-gradient(to left,var(--bg) 62%,rgb(245 244 240 / 0));opacity:0;transition:opacity .4s ease;pointer-events:none}
.path-b{display:none}
@media (min-width:1300px){.path-h{display:block}}
@media (hover:hover) and (min-width:821px){
  .path:hover::before{opacity:1}
  .path:hover a span{opacity:1;translate:0 0;transition-delay:calc(var(--i) * 25ms),calc(var(--i) * 25ms),0s}
  .path:hover .path-h{opacity:0}
}
.path:focus-within::before{opacity:1}
.path:focus-within a span{opacity:1;translate:0 0}
.path:focus-within .path-h{opacity:0}
@media (max-width:820px){
  .path{right:auto;left:var(--m);top:auto;bottom:14px;width:auto;height:auto;translate:none}
  .path::before,.path-l,.path-d,.path-h{display:none}
  .path-b{display:inline-flex;align-items:center;gap:10px;min-height:44px;padding:0 18px 0 16px;border-radius:999px;background:var(--bg);box-shadow:0 0 0 1px var(--line),0 8px 24px -10px rgb(18 18 20 / .25);font-size:var(--fs-small);font-weight:600}
  .path-b::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--klein)}
  .path ol{inset:auto auto calc(100% + 10px) 0;display:none;min-width:200px;padding:10px 0;border-radius:22px;background:var(--bg);box-shadow:0 0 0 1px var(--line),0 12px 32px -12px rgb(18 18 20 / .3)}
  .path.open ol{display:block}
  .path li{height:auto}
  .path a{position:static;width:auto;height:auto;min-height:44px;display:flex;align-items:center;gap:14px;padding:0 20px}
  .path a span,.path:focus-within a span{position:static;opacity:1;translate:none}
}
.crumbs ol{display:flex;flex-wrap:wrap;align-items:center;font-size:var(--fs-small);font-weight:500}
.crumbs li{display:inline-flex;align-items:center}
.crumbs li+li::before{content:"";width:clamp(20px,3vw,52px);height:1px;margin:0 14px;background:rgb(18 18 20 / .3)}
.crumbs a{display:inline-flex;align-items:center;min-height:44px;color:var(--mute);transition:color .4s}
.crumbs a:hover{color:var(--klein)}
.crumbs [aria-current]::after{content:"";width:7px;height:7px;margin-left:8px;border-radius:50%;background:var(--klein)}
.crumbs{margin-bottom:clamp(1.25rem,2.6vw,2.75rem)}
.next{margin-top:var(--sec);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}

/* names as rows: team, and the next stop; the arrow says they open */
.nm-link{position:relative;width:100%;align-items:baseline;padding:clamp(1.1rem,1.9vw,2rem) 0;transition:color .4s}
.nm{font-size:var(--fs-xl);font-weight:700;line-height:1.16;letter-spacing:-.048em;text-wrap:balance}
.nm-role{color:var(--mute)}
.nm-link::after{content:"";position:absolute;right:6px;top:50%;width:clamp(12px,1.15vw,18px);aspect-ratio:1;border-top:2px solid currentColor;border-right:2px solid currentColor;translate:0 -50%;rotate:45deg;transition:translate .6s var(--ease)}
@media (hover:hover){.nm-link:hover{color:var(--klein)}.nm-link:hover::after{translate:8px -50%}}
@media (min-width:821px){.nm{grid-column:1/10!important}}
@media (max-width:820px){.nm-link{padding-right:36px;row-gap:2px}}

/* ---------- Project sheet and profile: title on top, picture on the first axis, words on the third ---------- */
.sheet{padding:calc(var(--hdr) + clamp(1.5rem,4.5vw,4.5rem)) var(--edge) var(--sec)}
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
.dlg-actions{position:fixed;z-index:3;top:0;left:var(--edge);right:var(--edge);height:var(--hdr);justify-content:flex-end;display:flex;align-items:center;gap:clamp(18px,2.4vw,36px);color:#fff;background:#000;mix-blend-mode:difference;pointer-events:none}
.dlg-actions button{pointer-events:auto}
.dlg-actions button{min-height:44px;font-weight:600;font-size:var(--fs-small)}
.dlg-pos{margin-right:auto;display:inline-flex;align-items:center;font-size:var(--fs-small);font-weight:500}
.dlg-pos>:last-child::before{content:"";display:inline-block;width:clamp(20px,3vw,52px);height:1px;margin:0 14px;vertical-align:.3em;background:currentColor;opacity:.5}
.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gut);margin-top:var(--gap)}
.gallery:empty{display:none}
.gallery img{width:100%}
html.is-dialog{overflow:hidden}
@media (max-width:820px){.gallery{grid-template-columns:1fr}}

/* ---------- Loading and page change (load.js, leave.js): the dot draws the title, or opens on the click and closes on the next title ---------- */
html.load::before,html.enter::before{content:"";position:fixed;inset:0;z-index:2147482000;background:var(--bg)}
html.enter::before{background:var(--klein)}
html.load,html.enter{overflow:hidden}
.ld{position:fixed;inset:0;z-index:2147482100;pointer-events:none;overflow:clip}
.ld-d{position:absolute;left:0;top:0;border-radius:50%;background:var(--klein);will-change:translate}
.ld-n{position:absolute;overflow:clip;line-height:1;font-size:var(--fs-hero);font-weight:700;letter-spacing:-.05em}
.ld-n span{display:block}
.kl{position:fixed;inset:0;width:auto;height:auto;margin:0;padding:0;border:0;background:var(--klein);pointer-events:none;z-index:2147482200}

/* ---------- Language: a short blur ---------- */
@view-transition{navigation:auto;types:page}
@media (prefers-reduced-motion:no-preference){
  html:active-view-transition-type(page)::view-transition-group(*){animation-duration:.3s}
  html:active-view-transition-type(lang)::view-transition-old(root){animation:langOut .42s var(--ease-io) both}
  html:active-view-transition-type(lang)::view-transition-new(root){animation:langIn .7s var(--ease) .12s both}
}
@keyframes langOut{to{opacity:0;filter:blur(8px)}}
@keyframes langIn{from{opacity:0;filter:blur(8px)}}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;

/* Project sheet (home and /projets). Filled by site.js. */
const sheetHTML = `<dialog id="proj" aria-labelledby="pTitle">
  <div class="dlg-actions">
    <span class="dlg-pos" aria-hidden="true"><span data-i="sProjL">Projets</span><span id="pPos"></span></span>
    <button type="button" id="pPrev" data-i="prev">Précédent</button>
    <button type="button" id="pNext" data-i="next">Suivant</button>
    <button type="button" id="pClose" data-i="close">Fermer</button>
  </div>
  <div class="dlg-in sheet">
    <h2 class="t-hero sheet-t"><span id="pTitle"></span><i class="dot">&#8288;<b></b></i></h2>
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
    <button type="button" class="nm-link g next" id="pNext2"><span class="nm" id="pNextT"></span><span class="nm-role q4" data-i="nextP">Projet suivant</span></button>
  </div>
</dialog>`;

/* What every <head> needs, besides its own title and description. */
const headCommon = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%23F5F4F0'/%3E%3Ccircle cx='16' cy='16' r='7' fill='%23002FA7'/%3E%3C/svg%3E">
<link rel="preload" href="/fonts/hanken-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<script>/* the language chosen on the site, before anything is drawn. Page transitions can be cut short by a fast click: that is not an error. */
try{var l=localStorage.getItem('hb-lang');if(l!=='fr'&&l!=='en')l=/^fr/i.test(navigator.language||'fr')?'fr':'en';document.documentElement.lang=l}catch(e){}
/* what opens the page: the loading (first visit, reload), the dot closing on the title (coming from a link of the site), or nothing */
try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){var k=+sessionStorage.getItem('moyo-in')||0,n=performance.getEntriesByType('navigation')[0],o=document.referrer&&new URL(document.referrer).origin===location.origin,d=document.documentElement;sessionStorage.removeItem('moyo-in');
if(Date.now()-k<8000)d.classList.add('enter');else if(n&&(n.type==='reload'||n.type==='navigate'&&!o))d.classList.add('load');setTimeout(function(){d.classList.remove('load','enter')},7000)}}catch(e){}
for(const t of['pagereveal','pageswap'])addEventListener(t,e=>{const v=e.viewTransition;if(v)for(const p of[v.ready,v.finished,v.updateCallbackDone])p&&p.catch(()=>{})});</script>`;

/* Scripts of every page, in order. */
const scripts = `<script src="/lenis.js" defer></script>
<script src="/load.js" defer></script>
<script src="/site.js" defer></script>
<script src="/chrome.js" defer></script>
<script src="/path.js" defer></script>
<script src="/footer.js" defer></script>
<script src="/eyes.js" defer></script>
<script src="/glass.js" defer></script>
<script src="/method.js" defer></script>
<script src="/stage.js" defer></script>
<script src="/reveal.js" defer></script>
<script src="/roll.js" defer></script>
<script src="/weight.js" defer></script>
<script src="/leave.js" defer></script>
<script src="/cursor.js" defer></script>`;

export { DESIGN_CSS, sheetHTML, headCommon, scripts };
