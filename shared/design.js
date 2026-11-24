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
  --bg:#FAFAF8;--tint:#EFEFEC;--ink:#121214;--mute:#65656B;--line:rgb(18 18 20 / .15);--klein:#002FA7;
  --sans:"Hanken Grotesk",system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
  /* grid: its width drives everything, so a very large screen gets a larger page, not a lost one */
  --m:max(clamp(20px,3.4vw,64px),env(safe-area-inset-left),env(safe-area-inset-right));--max:clamp(1680px,80vw,2400px);
  --edge:max(var(--m),calc((100vw - var(--max)) / 2));--w:calc(100vw - 2 * var(--edge));
  --gut:clamp(16px,calc(var(--w) * .0193),44px);
  /* type */
  --fs-hero:clamp(2.75rem,calc(var(--w) * .0912),15rem);
  --fs-xl:clamp(2.5rem,calc(var(--w) * .059),9.5rem);
  --fs-l:clamp(1.75rem,calc(var(--w) * .0375),6rem);
  --fs-row:clamp(1.5rem,calc(var(--w) * .0268),4.25rem);
  --fs-m:clamp(1.3125rem,calc(var(--w) * .0204),3.25rem);
  --fs-lead:clamp(1.125rem,calc(var(--w) * .0145),2.25rem);
  --fs-body:clamp(1.0625rem,calc(var(--w) * .0129),1.75rem);
  --fs-small:clamp(.9375rem,calc(var(--w) * .0109),1.4rem);
  /* space */
  --sec:clamp(8rem,calc(var(--w) * .172),26rem);
  --gap:clamp(3rem,calc(var(--w) * .0687),10rem);
  --hdr:clamp(64px,8vh,84px);
  /* motion */
  --ease:cubic-bezier(.16,1,.3,1);--ease-io:cubic-bezier(.76,0,.24,1);
  /* names used by the header, the menu and the footer */
  --chaux:var(--bg);--paper:var(--bg);
  --paper-soft:color-mix(in oklab,var(--bg) 80%,var(--klein));--paper-line:color-mix(in oklab,var(--bg) 34%,var(--klein));
  --ease-enter:var(--ease);--dur-1:.45s;--dur-3:.9s;--dur-4:1.2s;
}
*,*::before,*::after{box-sizing:border-box}
html{background:var(--bg);-webkit-text-size-adjust:100%;scrollbar-width:none;scroll-padding-top:calc(var(--hdr) + 12px)}
@media (pointer:fine){html{overscroll-behavior-y:none}}
html::-webkit-scrollbar,#proj::-webkit-scrollbar,#menu::-webkit-scrollbar{display:none}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);font-size:var(--fs-body);font-weight:400;line-height:1.5;letter-spacing:-.008em;font-variant-numeric:tabular-nums;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:clip}
h1,h2,h3,p,ol,ul,dl,dd,figure,fieldset{margin:0}
ol,ul,legend{padding:0;list-style:none}
fieldset{border:0;padding:0;min-width:0}
a{color:inherit;text-decoration:none}
a,button,label,input,textarea{touch-action:manipulation}
h1,h2,h3,.nm,.r-title{overflow-wrap:break-word}
i{font-style:normal}
button{font:inherit;color:inherit;letter-spacing:inherit;text-align:inherit;background:none;border:0;padding:0;cursor:pointer}
input,textarea{font:inherit;color:inherit;letter-spacing:inherit}
img{display:block;max-width:100%}
:focus-visible{outline:2px solid var(--klein);outline-offset:6px}
::selection{background:var(--klein);color:var(--bg)}
.sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}
[hidden]{display:none!important}
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
html.js.calm .sec .dot b{opacity:1;translate:0 0}
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

/* ---------- Home: three times, and no more, a sheet of paper passes over the screen before it (stack.js): the projects over the first
   sentence, the studio over the method, the footer over the contact. Its top edge is the glass of the footer. The other sections simply follow. */
html.stack main>*{position:relative;background:var(--bg)}
html.stack main>.pin{position:sticky;top:min(0px,calc(100vh - var(--h,100vh)));top:min(0px,calc(100svh - var(--h,100svh)));translate:0 calc(var(--cv,0) * -15vh)}
html.stack main>.over{--gh:calc(var(--sec) * .9);--gp:calc(var(--gh) - 36px);--gr:clamp(26px,3.2vw,52px);--liquid:var(--liquid-s);isolation:isolate;border-radius:var(--gr) var(--gr) 0 0;scroll-margin-top:calc(96px - var(--gh));
  background:linear-gradient(to bottom,#0000 calc(var(--gh) - 1px),var(--bg) calc(var(--gh) - 1px));box-shadow:0 -2px 8px rgb(18 18 20 / calc(.05 * var(--ov,0))),0 -26px 52px -14px rgb(18 18 20 / calc(.15 * var(--ov,0)))}
html.stack main>.mth.live{margin-top:0;padding:var(--sec) 0 0;height:calc(460vh + var(--sec));height:calc(460svh + var(--sec))}
.veil{position:absolute;inset:0;z-index:20;border-radius:inherit;background:var(--bg);opacity:calc(var(--cv,0) * .82);pointer-events:none}

/* ---------- Links and buttons ---------- */
.lnk{display:inline-flex;align-items:center;gap:.45em;min-height:44px;font-weight:600;background:linear-gradient(currentColor,currentColor) 0 calc(50% + .72em)/100% 1px no-repeat;transition:color .4s,background-size .7s var(--ease)}
.lnk:hover{color:var(--klein);background-size:0 1px;background-position:100% calc(50% + .72em)}
.lnk i{transition:translate .6s var(--ease)}
.lnk:hover i{translate:3px 0}.lnk:hover i.dn{translate:0 3px}.lnk:hover i.up{translate:2px -2px}
.btn{display:inline-flex;align-items:center;justify-content:space-between;gap:2.5em;min-height:max(60px,3em);padding:0 max(30px,1.4em);border-radius:999px;background:var(--klein);color:var(--bg);font-weight:600;transition:background .5s,gap .7s var(--ease),scale .3s var(--ease)}
/* pressed */
.btn:active{scale:.97}
.lnk:active,.la:active,.nm-link:active,.dlg-actions button:active,.crumbs a:active{opacity:.6}
.btn:hover{background:var(--ink);gap:3.25em}
.btn:disabled{opacity:.5;cursor:progress}

/* ---------- Forms ---------- */
.f-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:inherit;column-gap:var(--gut)}
.fld{display:block}
.fl{display:block;font-size:var(--fs-small);color:var(--mute);line-height:1.3;text-box:trim-both cap alphabetic;margin-bottom:8px}
.fld input,.fld textarea{display:block;width:100%;padding:12px 0 14px;border:0;border-bottom:1px solid rgb(18 18 20 / .3);border-radius:0;background:none;font-size:var(--fs-lead);line-height:1.4;outline:none;transition:border-color .4s,box-shadow .4s}
.fld textarea{resize:vertical;min-height:calc(4.2em + 26px)}
@supports (field-sizing:content){.fld textarea{field-sizing:content;resize:none;max-height:60vh}}
.fld input:hover,.fld textarea:hover{border-color:var(--ink)}
.fld input:focus,.fld textarea:focus{border-color:var(--klein);box-shadow:0 1px 0 var(--klein)}
.f-err{display:block;font-size:var(--fs-small);line-height:1.35;color:#B3261E}
.f-err:not(:empty){margin-top:10px}
.fld [aria-invalid]{border-color:#B3261E;box-shadow:0 1px 0 #B3261E}
.chips{display:flex;flex-wrap:wrap;gap:8px 6px}
.chips legend{float:left;width:100%;margin-bottom:20px}
.opt{color:var(--mute)}
.chips label{position:relative}
.chips input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}
.chips label span{display:inline-flex;align-items:center;min-height:max(44px,2.3em);padding:0 max(15px,.85em);border:1px solid rgb(18 18 20 / .22);border-radius:999px;font-size:var(--fs-small);font-weight:500;transition:background .4s,color .4s,border-color .4s,scale .3s var(--ease)}
.chips label:hover span{border-color:var(--ink)}
.chips input:checked+span{background:var(--ink);border-color:var(--ink);color:var(--bg)}
.chips input:focus-visible+span{outline:2px solid var(--klein);outline-offset:3px}
.f-foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:20px 32px}
.f-foot p{max-width:26ch}
.f-dots{display:inline-flex;gap:7px;margin-bottom:12px}
.f-dots i{width:11px;height:11px;border-radius:50%;box-shadow:inset 0 0 0 1.5px rgb(18 18 20 / .35);transition:background .4s,box-shadow .4s,translate .9s var(--ease),scale .9s var(--ease)}
.f-dots i.ok{background:var(--klein);box-shadow:none}
.f-dots.full i:nth-child(1){translate:18px 0}.f-dots.full i:nth-child(3){translate:-18px 0}.f-dots.full i{scale:1.5}
.f-dots.busy i{animation:busy 1s var(--ease-io) infinite}.f-dots.busy i:nth-child(2){animation-delay:.12s}.f-dots.busy i:nth-child(3){animation-delay:.24s}
@keyframes busy{50%{opacity:.25;scale:.6}}
.chips label:active span{scale:.96}
.f-status{font-size:var(--fs-small);min-height:1.5em}
.f-status.err{color:#B3261E}

/* ---------- Pictures ---------- */
.plate{position:relative;display:block;aspect-ratio:4/5;overflow:clip;background:var(--tint)}
.plate img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 8%;transition:scale 1.4s var(--ease)}
/* no picture yet: the dot */
.plate--none::after{content:"";position:absolute;left:50%;top:50%;width:26%;aspect-ratio:1;translate:calc(-50% + var(--dx,0px)) calc(-50% + var(--dy,0px));border-radius:50%;background:var(--klein);transition:scale 1.2s var(--ease),translate .55s cubic-bezier(.22,1,.36,1)}

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
  .cases.still .case,.cases.still .case *{transition:none!important}
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
.line{position:relative}
.la[href]::after{content:"";position:absolute;inset:0}
.line .n{font-size:.42em;font-weight:600;letter-spacing:0;vertical-align:.95em;margin-left:.22em;color:var(--klein);line-height:0}
/* services: the dot at work (trades.js), on the fourth axis; next to the description on small screens */
.svc{position:relative;--sc:clamp(80px,11vw,108px)}
.svc-c{position:absolute;right:0;top:0;width:var(--sc);aspect-ratio:1;translate:0 var(--y,0px);opacity:0;pointer-events:none;transition:translate .9s var(--ease),opacity 1s ease}
.svc-c.on{opacity:1}
@media (max-width:1080px){.svc .line p{padding-right:calc(var(--sc) + 20px);min-height:var(--sc);max-width:none}}
@media (min-width:1081px){
  .svc{--sc:calc((100% + var(--gut)) / 4 - var(--gut))}
  .svc .rows{width:calc((100% + var(--gut)) * .75 - var(--gut))}
  .svc .line{grid-template-columns:repeat(9,minmax(0,1fr))}
  .svc-c{pointer-events:auto}
}
@media (hover:hover){
  .rows>li{transition:opacity .6s var(--ease)}
  .rows:hover>li:not(:hover){opacity:.28}
}

/* ---------- The way ----------
   Home: one line and one dot in the margin, the dot travels with the scroll (path.js). Pointed at or focused, the line opens on the names.
   Other pages: the same line laid flat above the title (where you come from, where you are), and the next stop at the end.
   --p: where the dot is (0 to 1), --k: how much the line is open, --row: the height of a name. */
@property --k{syntax:"<number>";inherits:true;initial-value:.46}
.path{--row:clamp(38px,calc(var(--w) * .0232),54px);--pw:min(var(--edge),64px);--px:calc(var(--edge) / 2);--pd:clamp(11px,calc(var(--w) * .0074),17px);--k:.46;
  position:fixed;z-index:60;right:calc(var(--px) - var(--pw) / 2);top:50%;width:var(--pw);height:calc(var(--row) * 7);translate:0 -50%;opacity:0;visibility:hidden;transition:opacity .6s ease,visibility 0s .6s,--k .8s var(--ease)}
.path.on{opacity:1;visibility:visible;transition:opacity .6s ease,--k .8s var(--ease)}
.path.open{--k:1}
.path.end{opacity:1;visibility:visible;pointer-events:none}
.path.end>:not(.path-d){opacity:0;visibility:hidden;transition:opacity .4s}
.path.gone .path-d{opacity:0}
.path-l{position:absolute;left:50%;top:50%;width:1px;height:calc(var(--row) * 6);margin-left:-.5px;background:rgb(18 18 20 / .2);translate:0 -50%;scale:1 var(--k);pointer-events:none}
.path-d{position:absolute;left:50%;top:50%;width:var(--pd);height:var(--pd);margin:calc(var(--pd) / -2) 0 0 calc(var(--pd) / -2);border-radius:50%;background:var(--klein);translate:0 calc((var(--p,0) - .5) * var(--row) * 6 * var(--k));pointer-events:none}
.path ol{position:absolute;right:50%;top:0}
.path a{display:flex;align-items:center;justify-content:flex-end;height:var(--row);padding:0 28px 0 48px;font-size:var(--fs-small);font-weight:500;color:var(--mute);white-space:nowrap;pointer-events:none}
.path a span{opacity:0;translate:10px 0;transition:opacity .2s ease,translate .4s ease,color .3s}
.path a[aria-current]{color:var(--ink)}
.path a:hover,.path a:focus-visible{color:var(--klein)}
.path a:focus-visible{outline:0}.path a:focus-visible span{outline:2px solid var(--klein);outline-offset:6px}
.path.open a{pointer-events:auto}
.path.open a span{opacity:1;translate:0 0;transition:opacity .4s ease calc(var(--i) * 24ms),translate .8s var(--ease) calc(var(--i) * 24ms),color .3s}
/* paper under the names, only while they are there */
.path::before{content:"";position:absolute;z-index:-1;right:calc(50% - var(--px));top:-50vh;bottom:-50vh;width:calc(var(--px) + 250px);background:linear-gradient(to left,var(--bg) 58%,rgb(250 250 248 / 0));opacity:0;transition:opacity .4s ease;pointer-events:none}
.path.open::before{opacity:1}
/* very large screens: the line stays near the page, and the names have the margin for themselves */
@media (min-width:2400px){
  .path{--px:calc(var(--edge) - 72px)}
  .path ol{right:auto;left:50%}
  .path a{justify-content:flex-start;padding:0 48px 0 30px}
  .path a span{translate:-10px 0}
  .path::before{display:none}
}
@media (max-width:820px){
  .path{--row:16px;--pd:9px;--k:1;pointer-events:none}
  .path ol,.path::before{display:none}
}
.crumbs ol{display:flex;flex-wrap:wrap;align-items:center;font-size:var(--fs-small);font-weight:500}
.crumbs li{display:inline-flex;align-items:center}
.crumbs li+li::before{content:"";width:clamp(20px,3vw,52px);height:1px;margin:0 14px;background:rgb(18 18 20 / .3)}
.crumbs a{display:inline-flex;align-items:center;min-height:44px;color:var(--mute);transition:color .4s}
.crumbs a:hover{color:var(--klein)}
.crumbs [aria-current]::after{content:"";width:7px;height:7px;margin-left:8px;border-radius:50%;background:var(--klein)}
.crumbs{margin-bottom:clamp(1.25rem,2.6vw,2.75rem)}
@media (max-width:820px){.crumbs ol{flex-wrap:nowrap}.crumbs li{flex:none}.crumbs li:last-child{flex:0 1 auto;min-width:0}.crumbs [aria-current] span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}
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
.sheet-t{margin-bottom:var(--gap);outline:none}
.sheet-g{row-gap:40px;align-items:start}
.sheet-g .t-lead{max-width:42ch;text-wrap:pretty;text-box:trim-start cap alphabetic}
.facts{margin-top:clamp(2.5rem,5vw,5rem);border-top:1px solid var(--line)}
.facts>div{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:var(--gut);padding:16px 0;border-bottom:1px solid var(--line);font-size:var(--fs-small)}
.facts dt{color:var(--mute)}

#proj{position:fixed;z-index:80;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;background:var(--bg);color:var(--ink);overflow:auto;overscroll-behavior:contain;translate:0 100%;
  transition:translate .95s var(--ease-io),display .95s allow-discrete}
#proj[open]{translate:0 0}
@starting-style{#proj[open]{translate:0 100%}}
/* the page behind: a shade. The header of the site stays above the sheet. */
body::after{content:"";position:fixed;z-index:79;inset:0;background:rgb(18 18 20 / 0);pointer-events:none;transition:background .9s}
html.is-dialog body::after{background:rgb(18 18 20 / .4)}
/* where the browser can: the picture of the card becomes the picture of the sheet, the paper opens from the card (site.js) */
html.vt-sheet #proj,html.vt-sheet body::after{transition:none!important}
html.vt-sheet::view-transition-group(shot){animation-duration:.95s;animation-timing-function:var(--ease-io);z-index:3}
html.vt-sheet::view-transition-old(shot),html.vt-sheet::view-transition-new(shot){width:100%;height:100%;object-fit:cover;object-position:var(--vp,50% 8%);overflow:clip;mix-blend-mode:normal;animation:none}
html.vt-sheet.vt-in::view-transition-old(shot),html.vt-sheet:not(.vt-in)::view-transition-new(shot){display:none}
html.vt-sheet::view-transition-old(root),html.vt-sheet::view-transition-new(root){animation:none;mix-blend-mode:normal}
html.vt-sheet.vt-in::view-transition-new(root){animation:sheetIn .95s var(--ease-io) both}
html.vt-sheet:not(.vt-in)::view-transition-old(root){z-index:2;animation:sheetOut .85s var(--ease-io) both}
::view-transition-group(cur){animation:none;z-index:9}
::view-transition-old(cur){display:none}
::view-transition-new(cur){animation:none}
@keyframes sheetIn{from{clip-path:inset(var(--vt,50%) round 0)}to{clip-path:inset(0)}}
@keyframes sheetOut{from{clip-path:inset(0)}to{clip-path:inset(var(--vt,50%))}}
:is(#proj,.work) .plate{aspect-ratio:auto}
:is(#proj,.work) .plate img{position:static;width:100%;height:auto;aspect-ratio:auto 4/5}
:is(#proj,.work) .plate--none{aspect-ratio:4/5}
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
html.calm *,html.calm *::before,html.calm *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}
`;

/* Project sheet (home and /projets). Filled by site.js. */
const sheetHTML = `<dialog id="proj" aria-labelledby="pTitle" data-lenis-prevent>
  <div class="dlg-in sheet">
    <nav class="crumbs" aria-label="Vous êtes ici" data-ia="here"><ol><li><a href="/" data-i="home">Accueil</a></li><li><a href="/projets" data-i="sProjL" data-close>Projets</a></li><li aria-current="page"><span id="pHere"></span></li></ol></nav>
    <h2 class="t-hero sheet-t" tabindex="-1"><span id="pTitle"></span><i class="dot">&#8288;<b></b></i></h2>
    <div class="g sheet-g">
      <span class="plate c5" id="pPlate"></span>
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
const headCommon = `<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/fonts/hanken-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<script>/* before anything is drawn: the language, and less motion if it was asked for in the footer */
try{var D=document.documentElement,S=localStorage,q=new URLSearchParams(location.search).get('lang'),l='en';D.dataset.served=D.lang; /* /en is always in English; elsewhere: ?lang=, the choice made on the site, the language of the visitor. Robots read the page as it is. */
if(D.lang!=='en'){l=/^(fr|en)$/.test(q)?q:S.getItem('hb-lang');if(q&&l===q)S.setItem('hb-lang',l);if(l!=='fr'&&l!=='en')l=/bot|crawl|spider|slurp|lighthouse|preview/i.test(navigator.userAgent)?'fr':((navigator.languages||[navigator.language||'fr']).find(x=>/^(fr|en)/i.test(x))||'en').slice(0,2).toLowerCase()}D.lang=l}catch(e){}
try{if(localStorage.getItem('moyo-calm')==='1'){document.documentElement.classList.add('calm');const m=matchMedia.bind(window);window.matchMedia=x=>/prefers-reduced-motion: ?reduce/.test(x)?{matches:true,media:x,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}:m(x)}}catch(e){}
/* Page transitions can be cut short by a fast click: that is not an error. */
/* what opens the page: the loading (first visit, reload), the dot closing on the title (coming from a link of the site), or nothing */
try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){var k=+sessionStorage.getItem('moyo-in')||0,n=performance.getEntriesByType('navigation')[0],o=document.referrer&&new URL(document.referrer).origin===location.origin,d=document.documentElement;sessionStorage.removeItem('moyo-in');
if(Date.now()-k<8000)d.classList.add('enter');else if(n&&(n.type==='reload'||n.type==='navigate'&&!o))d.classList.add('load');setTimeout(function(){d.classList.remove('load','enter')},9000)}}catch(e){}
for(const t of['pagereveal','pageswap'])addEventListener(t,e=>{const v=e.viewTransition;if(v){for(const p of[v.ready,v.finished,v.updateCallbackDone])p&&p.catch(()=>{});if(/Apple/.test(navigator.vendor))v.skipTransition()}});</script>`;

/* Scripts of every page, in order. */
const scripts = `<script src="/lenis.js" defer></script>
<script src="/load.js" defer></script>
<script src="/stack.js" defer></script>
<script src="/divide.js" defer></script>
<script src="/site.js" defer></script>
<script src="/chrome.js" defer></script>
<script src="/path.js" defer></script>
<script src="/footer.js" defer></script>
<script src="/eyes.js" defer></script>
<script src="/glass.js" defer></script>
<script src="/method.js" defer></script>
<script src="/ink.js" defer></script>
<script src="/trades.js" defer></script>
<script src="/stage.js" defer></script>
<script src="/reveal.js" defer></script>
<script src="/roll.js" defer></script>
<script src="/weight.js" defer></script>
<script src="/play.js" defer></script>
<script src="/leave.js" defer></script>
<script src="/cursor.js" defer></script>`;

export { DESIGN_CSS, sheetHTML, headCommon, scripts };
