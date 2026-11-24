/* Shared site chrome, the same on every page: header, full-screen menu, footer.
   - build.mjs injects it into src/index.src.html and src/projets.src.html, functions/equipe/[id].js inlines it too.
   - Behaviour: dist/chrome.js (src/chrome-rt.js), dist/footer.js, dist/glass.js. Tokens: shared/design.js.
   Keep `export` on the last line only. */

/* Menu button, the same on every page (home included). */
const BURGER_CSS = `/* Menu button: two clean lines. Opening the menu, the close button folds them into a centred cross;
   closing, the header button unfolds the cross back into two lines. Minimal, precise motion. */
#menuBtn,#menuClose{--bxw:clamp(22px,calc(var(--w) * .0142),34px);--bxt:calc(var(--bxw) / 11);--bxg:calc(var(--bxw) / 4.4);--bxd:calc((var(--bxt) + var(--bxg)) / 2)}
#menuBtn{display:inline-flex!important;align-items:center;justify-content:center;min-width:44px}
#menuBtn .bx,#menuClose .bx{display:flex;flex-direction:column;justify-content:center;gap:var(--bxg);width:var(--bxw);height:calc(var(--bxw) * .68)}
#menuBtn .bx i,#menuClose .bx i{display:block;width:var(--bxw);height:var(--bxt);background:currentColor;translate:none!important;transform-origin:50% 50%;
  transition:transform .5s cubic-bezier(.76,0,.24,1)}
/* hover (closed): the two lines ease together — a quiet, precise nudge */
#menuBtn:hover .bx i:nth-of-type(1){transform:translateY(1px)}
#menuBtn:hover .bx i:nth-of-type(2){transform:translateY(-1px)}
/* open state (close button): a centred cross */
#menuClose .bx i:nth-of-type(1){transform:translateY(var(--bxd)) rotate(45deg)}
#menuClose .bx i:nth-of-type(2){transform:translateY(calc(var(--bxd) * -1)) rotate(-45deg)}
#menuClose:hover .bx i:nth-of-type(1){transform:translateY(var(--bxd)) rotate(135deg)}
#menuClose:hover .bx i:nth-of-type(2){transform:translateY(calc(var(--bxd) * -1)) rotate(-135deg)}
@keyframes x1{0%{transform:none}50%{transform:translateY(var(--bxd))}100%{transform:translateY(var(--bxd)) rotate(45deg)}}
@keyframes x2{0%{transform:none}50%{transform:translateY(calc(var(--bxd) * -1))}100%{transform:translateY(calc(var(--bxd) * -1)) rotate(-45deg)}}
@keyframes b1{0%{transform:translateY(var(--bxd)) rotate(45deg)}50%{transform:translateY(var(--bxd))}100%{transform:none}}
@keyframes b2{0%{transform:translateY(calc(var(--bxd) * -1)) rotate(-45deg)}50%{transform:translateY(calc(var(--bxd) * -1))}100%{transform:none}}
@media (prefers-reduced-motion:no-preference){
  #menu:popover-open #menuClose .bx i:nth-of-type(1){animation:x1 .55s cubic-bezier(.65,0,.35,1) both}
  #menu:popover-open #menuClose .bx i:nth-of-type(2){animation:x2 .55s cubic-bezier(.65,0,.35,1) both}
  #menuBtn.unx .bx i:nth-of-type(1){animation:b1 .55s cubic-bezier(.65,0,.35,1) both}
  #menuBtn.unx .bx i:nth-of-type(2){animation:b2 .55s cubic-bezier(.65,0,.35,1) both}
}
/* menu preview: caption and number slide behind the image (which bulges over them), only their lower edge is cut */
@media (min-width:821px){
  .menu-pv .pv-frame{z-index:2}
  .menu-pv .pv-cap{position:relative;z-index:1}
  .menu-pv .pv-cw{height:5.6em;overflow:visible;clip-path:inset(-120px -8px 0)}
  .menu-pv .pv-ci{height:5.6em}
  .menu-pv .pv-nw{overflow:visible;clip-path:inset(-120px -4px -8px)}
  .menu-pv .pv-ns>span{height:5.6em}
}
`;

const CHROME_CSS = `
/* Header: the wordmark and the menu button, nothing else. White in difference mode: ink on the page, white on photographs. */
.bar{position:fixed;z-index:90;top:0;left:0;right:0;height:var(--hdr);display:flex;align-items:center;justify-content:space-between;padding:0 var(--edge);color:#fff;background:#000;mix-blend-mode:difference;pointer-events:none;transition:translate .9s var(--ease)}
.bar>*{pointer-events:auto}
.bar.away{translate:0 -100%}
html.kbd .bar:focus-within{translate:0 0}
.bar-mark,.menu-mark{font-size:clamp(1.5rem,calc(var(--w) * .0204),2.75rem);font-weight:700;letter-spacing:-.052em;line-height:1;margin-left:-.06em}
.bar-mark{display:inline-flex;align-items:center;min-height:44px;color:inherit}
.bar-mark::before{content:"moyo"}
.bar :focus-visible{outline-color:currentColor;outline-offset:4px}
.bar #menuBtn{justify-content:flex-end}

/* Menu: the page turns blue */
#menu{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;background:var(--klein);color:var(--bg);overflow:auto;overscroll-behavior:contain;clip-path:inset(0);
  transition:clip-path 1.1s var(--ease-io),overlay 1.1s allow-discrete,display 1.1s allow-discrete}
#menu:not(:popover-open){clip-path:inset(0 0 100% 0)}
@starting-style{#menu:popover-open{clip-path:inset(0 0 100% 0)}}
#menu::backdrop{background:transparent}
#menu :focus-visible{outline-color:var(--bg)}
.menu-in{min-height:100%;padding:calc(var(--hdr) + clamp(24px,6vh,72px)) var(--edge) var(--edge);display:flex;flex-direction:column;justify-content:center;position:relative;isolation:isolate}
.menu-mark{position:absolute;z-index:2;left:var(--edge);top:0;height:var(--hdr);display:flex;align-items:center;color:var(--bg)}
.menu-close{position:absolute;z-index:2;top:0;right:var(--edge);height:var(--hdr);display:inline-flex;align-items:center;justify-content:flex-end;min-width:44px;color:var(--bg)}
.menu-foot{position:absolute;z-index:2;left:var(--edge);right:var(--edge);bottom:clamp(14px,2.4vw,34px);display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:0 24px;font-size:var(--fs-small);font-weight:600}
.menu-foot a,.menu-foot button{display:inline-flex;align-items:center;min-height:44px}
.menu-foot .flang button{color:var(--paper-soft);background:none}
.menu-foot .flang button[aria-pressed="true"]{color:var(--bg);text-decoration:underline;text-underline-offset:6px;text-decoration-thickness:1px}
.menu-list a{position:relative;display:block;padding:10px 0;color:var(--bg)}
.menu-list .mn{font-size:clamp(2.25rem,11vw,4.5rem);font-weight:700;letter-spacing:-.045em;line-height:1.08}
.menu-list .roll{position:relative;display:inline-block;overflow:hidden;vertical-align:top;padding:0 .06em .2em 0;margin-bottom:-.2em}
.menu-list .roll .r2{position:absolute;left:0;top:0}
.menu-list .roll .c{display:inline-block;white-space:pre;transition:transform .7s var(--ease-io);transition-delay:calc(var(--i) * 18ms)}
.menu-list .roll .r2 .c{transform:translateY(125%)}

/* Arc carousel (desktop) */
@media (min-width:821px){
  #menu{--arc-on:var(--paper);--arc-off:color-mix(in srgb,var(--paper) 22%,transparent);--arc-frame:#A3A7AF}
  #menu .menu-in{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:clamp(24px,calc(var(--w) * .043),130px);padding:0 var(--m);min-height:100%;height:100%}
  .menu-list.arc{position:relative;flex:none;width:clamp(300px,calc(var(--w) * .322),780px);height:100svh;margin:0;padding:0}
  .menu-list.arc li{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform,opacity}
  .menu-list.arc a{transform-origin:0 50%;border:0!important;padding:0!important;white-space:nowrap;display:inline-flex;align-items:baseline;gap:.3em;color:var(--arc-off);overflow:visible;outline:none!important;transition:none!important}
  .menu-list.arc .mn,.menu-list.arc .c{transition:none!important}
  .menu-list.arc a::before{display:none!important}
  .menu-list.arc a::after{content:"↗";position:static;display:inline-block;font-size:.48em;font-weight:500;opacity:var(--arw,0);
    translate:calc((var(--arw,0) - 1) * .12em) calc((1 - var(--arw,0)) * .12em);transition:none}
  .menu-list.arc .mn{font-size:clamp(2rem,calc(var(--w) * .0343),5.25rem);font-weight:280;line-height:1.08;letter-spacing:-.025em}
  .menu-list.arc .roll{overflow:visible}
  .menu-list.arc .roll .r2{display:none}
  .menu-list.arc .roll .c{transform:none!important;transition:none}
  .menu-list.arc a:hover,.menu-list.arc a:focus-visible{background:none!important}
  #menu .menu-list.arc li{transition:none!important;translate:none!important}
  .menu-pv{flex:none;width:clamp(220px,calc(var(--w) * .2146),520px);will-change:transform}
  .pv-frame{display:block;cursor:pointer;position:relative;aspect-ratio:4/5;transform-origin:50% 50%}
  .pv-l{position:absolute;left:0;right:0;top:-12%;bottom:-12%;background:var(--arc-frame) var(--img,none) 50% var(--py,50%)/cover no-repeat;clip-path:inset(12% 0)}
  .pv-cap{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-top:.9em;font-size:clamp(.8125rem,calc(var(--w) * .0098),1.375rem)}
  .pv-cw{height:5em;overflow:hidden;flex:1;min-width:0}
  .pv-ci{height:5em;overflow:hidden}
  .pv-cs,.pv-ns{display:block;will-change:transform}
  .pv-desc{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:1em;line-height:1.35;opacity:.72;max-width:30ch}
  .pv-name{margin-top:.25em;font-size:1.12em;font-weight:600}
  .pv-n{font-size:1em;font-variant-numeric:tabular-nums;white-space:nowrap}
  .pv-nw{display:inline-block;height:1.3em;line-height:1.3em;overflow:hidden;vertical-align:top}
  .pv-ns>span{display:block;height:1.3em}
  .pv-t{opacity:.72}
  @keyframes pvRise{from{clip-path:inset(100% -10% 0 -10%);translate:0 2.5rem}to{clip-path:inset(-20% -10%);translate:0 0}}
  @keyframes pvFade{from{opacity:0}}
  #menu:popover-open .pv-frame{animation:pvRise 1.2s cubic-bezier(.22,1,.36,1) .35s both}
  #menu:popover-open .pv-cap{animation:pvFade .8s ease .9s both}
}
@media (min-width:821px) and (prefers-reduced-motion:reduce){#menu:popover-open .pv-frame,#menu:popover-open .pv-cap{animation:none}}
@media (max-width:820px){.menu-pv,.menu-list .arc-clone{display:none}
  /* small screens: the foot of the menu follows the list, it never sits on it */
  #menu:popover-open{display:flex;flex-direction:column}
  .menu-in{flex:1 0 auto;min-height:0;padding-bottom:20px}
  .menu-foot{position:static;flex:none;padding:0 var(--edge) max(16px,env(safe-area-inset-bottom))}
}

${BURGER_CSS}
html.menu-lock{overflow:hidden}
`;

/* Header and menu. `start`: the arc entry the menu opens on. `land`: the header stays away on the first screen (home). */
const chromeHead = (start = 0, { land = false } = {}) => `<header class="bar${land ? ' away' : ''}" id="bar"${land ? ' data-land' : ''}>
  <a class="bar-mark" href="/" aria-label="moyo, accueil" data-ia="homeAria"></a>
  <button type="button" id="menuBtn" class="bar-menu" popovertarget="menu" popovertargetaction="toggle" aria-expanded="false"><span class="sr" data-i="menu">Menu</span><span class="bx" aria-hidden="true"><i></i><i></i></span></button>
</header>
<nav id="menu" popover aria-label="Menu" data-ia="menu" data-start="${start}">
  <a class="menu-mark" href="/" aria-label="moyo, accueil" data-ia="homeAria" translate="no">moyo</a>
  <div class="menu-in">
    <ol class="menu-list arc">
      <li><a href="/"><span class="mn" data-i="sec.top">Accueil</span></a></li>
      <li><a href="/projets"><span class="mn" data-i="sec.all">Projets</span></a></li>
      <li><a href="/#services"><span class="mn" data-i="sec.services">Services</span></a></li>
      <li><a href="/#studio"><span class="mn" data-i="sec.studio">Studio</span></a></li>
      <li><a href="/#equipe"><span class="mn" data-i="sec.team">Équipe</span></a></li>
      <li><a href="/#contact"><span class="mn" data-i="sec.contact">Contact</span></a></li>
    </ol>
    <div class="menu-pv" aria-hidden="true">
      <a class="pv-frame" id="pvLink" href="/" tabindex="-1"><span class="pv-l" id="pvB"></span><span class="pv-l" id="pvA"></span></a>
      <div class="pv-cap">
        <div class="pv-cw"><div class="pv-cs" id="pvCS">
          <div class="pv-ci"><p class="pv-desc"></p><p class="pv-name"></p></div>
          <div class="pv-ci"><p class="pv-desc"></p><p class="pv-name"></p></div>
        </div></div>
        <p class="pv-n"><span class="pv-nw"><span class="pv-ns" id="pvNS"><span>01</span><span>02</span></span></span><span class="pv-t" id="pvTot">/06</span></p>
      </div>
    </div>
  </div>
  <div class="menu-foot"><a href="mailto:contact.moyostudio@gmail.com">contact.moyostudio@gmail.com</a><span class="flang" role="group" aria-label="Langue" data-ia="langAria"><button type="button" data-l="fr" lang="fr" aria-pressed="true">Français</button><button type="button" data-l="en" lang="en" aria-pressed="false">English</button></span></div>
  <button type="button" class="menu-close" id="menuClose" popovertarget="menu" popovertargetaction="hide"><span class="sr" data-i="close">Fermer</span><span class="bx" aria-hidden="true"><i></i><i></i></span></button>
</nav>`;

/* Footer: the end of every page, on the same paper as the page. Useful things first, on the four axes; then the wordmark, which looks back
   (eyes.js). Blue only comes if the visitor asks for it: hold an eye, and it floods the whole footer (.flood is an inverted copy). */
const FOOTER_CSS = `
.foot{position:relative;z-index:2;color:var(--ink);padding:0 var(--edge);overflow:clip}
.foot-grid{row-gap:56px;align-items:start}
.fh{font-size:var(--fs-small);font-weight:400;line-height:1.3;color:var(--mute);margin-bottom:14px}
.fcol a{display:inline-flex;align-items:center;min-height:40px;font-weight:600;background:linear-gradient(currentColor,currentColor) 0 calc(100% - 7px)/0 1px no-repeat;transition:background-size .7s var(--ease),color .4s}
.fcol a:hover{background-size:100% 1px;color:var(--klein)}
.fby a{gap:.4em}.fby a::after{content:"↗";font-size:.8em;opacity:.6;transition:translate .5s var(--ease),opacity .3s}.fby a:hover::after{translate:2px -2px;opacity:1}
.sub-row{display:flex;align-items:center;border-bottom:1px solid rgb(18 18 20 / .3);transition:border-color .4s,box-shadow .4s}
.sub-row:focus-within{border-color:var(--klein);box-shadow:0 1px 0 var(--klein)}
.sub-row input[type=email]{flex:1 1 0;min-width:0;min-height:44px;padding:0;color:var(--ink);background:transparent;border:0;border-radius:0;outline:none;font-weight:600}
.sub-row input[type=email]::placeholder{color:var(--mute);opacity:1;font-weight:400}
.sub-btn{flex:none;width:44px;height:44px;display:grid;place-items:center end;transition:color .4s,translate .6s var(--ease)}
.sub-btn:hover{color:var(--klein);translate:4px 0}
.sub-btn:disabled{opacity:.5;cursor:progress}
.sub-msg{margin-top:12px;min-height:1.4em;font-size:var(--fs-small)}
.foot-base{margin-top:clamp(3.5rem,6vw,6rem);padding-top:20px;border-top:1px solid var(--line);font-size:var(--fs-small);row-gap:4px;align-items:center}
.foot-base a,.foot-base .calm,.flang button{display:inline-flex;align-items:center;min-height:40px;font-weight:500;background:linear-gradient(currentColor,currentColor) 0 calc(100% - 7px)/0 1px no-repeat;transition:background-size .7s var(--ease),color .4s}
.foot-base a,.foot-base .calm{justify-self:start}
.calm[aria-pressed="true"]{background-size:100% 1px}
@media (prefers-reduced-motion:reduce){.foot-base .calm{display:none}}
.flang{display:inline-flex;gap:18px}
.flang button{color:var(--mute)}
.flang button:hover{color:var(--ink)}
.flang button[aria-pressed="true"]{color:var(--ink);background-size:100% 1px}
.foot-base a:hover,.foot-base .calm:hover{background-size:100% 1px;color:var(--klein)}
.foot-end{margin-top:clamp(7rem,17vw,17rem);align-items:last baseline;row-gap:28px}
.foot-cta{display:inline-block}
.foot-cta .q{position:relative;color:var(--klein)}
.foot-cta .qd{position:absolute;width:var(--qd,0);height:var(--qd,0);margin:calc(var(--qd,0em) / -2) 0 0 calc(var(--qd,0em) / -2);border-radius:50%;background:var(--klein)}
@media (min-width:821px){.foot-end>:first-child{grid-column:1/9!important}}
.foot-note{font-size:var(--fs-small);line-height:1.45;color:var(--mute);text-wrap:balance}
.foot-note p{min-height:2.9em;display:flex;align-items:flex-end}
.hold{display:inline-flex;align-items:center;min-height:44px;font-size:var(--fs-small);font-weight:600;color:var(--ink);touch-action:none;user-select:none;-webkit-user-select:none}
.hold::before{content:"";width:9px;height:9px;margin-right:10px;border-radius:50%;background:var(--klein);transition:scale .6s var(--ease)}
.hold:hover::before{scale:1.5}
/* the wordmark, as wide as the grid; only the tail of the y is cut by the end of the page */
.mono-wrap{container-type:inline-size;pointer-events:none;margin-top:clamp(0rem,1vw,1rem)}
.monument{font-size:calc(100cqw * var(--mono-k,.4406));font-weight:700;letter-spacing:-.055em;line-height:.72;white-space:nowrap;margin-left:calc(var(--mono-l,-.0625) * 1em);height:.915em;user-select:none;-webkit-user-select:none}
.monument .bl{display:inline-block}
/* each o is an eye: --ecx/--ecy its centre, --epr the radius of the pupil, --erx/--ery the radii of its inside (measured on the font, in em).
   The letter never changes shape: what opens and shuts is a lid, in the ink of the letter, inside it (--lid: 1 open, 0 shut) */
.eye{position:relative}
.eye .ld{--x:.034;position:absolute;left:calc(var(--ecx,.28) * 1em);top:calc(var(--ecy,.45) * 1em);width:calc((var(--erx,.14) + var(--x)) * 2em);height:calc((var(--ery,.19) + var(--x)) * 2em);translate:-50% -50%;border-radius:50%;overflow:clip;pointer-events:none}
.eye .ld::before{content:"";position:absolute;left:-12%;right:-12%;bottom:100%;height:100%;border-radius:0 0 50% 50%/0 0 15% 15%;background:currentColor;translate:0 calc((1 - var(--lid,1)) * 101%)}
/* shut, the eye is a thin curve */
.eye .ld::after{content:"";position:absolute;left:50%;top:50%;width:58%;aspect-ratio:1;border:.022em solid var(--bg);border-radius:50%;translate:-50% -64%;clip-path:inset(63% -1px -1px);opacity:calc((.15 - var(--lid,1)) * 12)}
.flood .eye .ld::after{border-color:#002FA7}
.eye .pu,.eye .hit{position:absolute;left:calc(var(--ecx,.28) * 1em);top:calc(var(--ecy,.45) * 1em);border-radius:50%}
.eye .pu{width:calc(var(--epr,.072) * 2em);aspect-ratio:1;margin:calc(var(--epr,.072) * -1em) 0 0 calc(var(--epr,.072) * -1em);background:var(--klein);translate:var(--gx,0px) var(--gy,0px);scale:var(--pd,1)}
.eye .hit{width:calc(var(--ecr,.27) * 2em);aspect-ratio:1;margin:calc(var(--ecr,.27) * -1em) 0 0 calc(var(--ecr,.27) * -1em);pointer-events:auto;cursor:pointer;touch-action:none;-webkit-touch-callout:none}
.foot .mono-wrap{transform:translateY(calc((1 - var(--fp,1)) * 60px))}
/* the flood: an inverted copy of the footer, seen through a circle that opens from the pupil */
.flood{position:absolute;inset:0;z-index:6;padding:inherit;background:#002FA7;color:var(--bg);overflow:clip;clip-path:circle(0 at 50% 50%);cursor:none;--ink:#FAFAF8;--mute:#B9C2E0;--line:rgb(250 250 248 / .3);--klein:#FAFAF8}
.flood .sub-row{border-color:rgb(250 250 248 / .4)}
.flood .pu{opacity:0}
html.mono .bar{mix-blend-mode:normal;background:none;color:var(--bg)}
@media (prefers-reduced-motion:reduce){.foot .mono-wrap{transform:none}}
html.calm .foot .mono-wrap{transform:none}
@media (max-width:1080px){.fcol{grid-column:span 6!important}}
@media (max-width:820px){
  .fcol a,.foot-base a,.foot-base .calm,.flang button{min-height:44px}
  .fcol.foot-sub{grid-column:1/-1!important}
}
@media (max-width:480px){.fcol{grid-column:1/-1!important}}
`;

/* Glass top of the footer (every page), and of the sheets that pass over a screen (home): clear at the rim, then frosted, then paper.
   What fades is not a pile of CSS gradients but one picture, computed by glass-rt.js: paper with a horizon that is not a straight line, and a light
   behind it, Klein, where the horizon is lowest, so that the way from black to white does not go through grey. Under it what is behind is blurred
   more and more. It slides a little with the scroll (--rise), on the compositor only. --kl: how much light.
   To remove the effect, empty GLASS_CSS. */
const PAPER = '250 250 248';
const GLASS_CSS = `
footer#foot{--gh:clamp(260px,44vh,680px);--gr:calc(64px - var(--fr,.75) * 32px);--rise:var(--fr,.5);--kl:.38;
  border:0;border-radius:var(--gr) var(--gr) 0 0;padding-top:calc(var(--gh) * .92);margin-top:0;animation:none;isolation:isolate;
  background:linear-gradient(to bottom,#0000 calc(var(--gh) - 2px),rgb(${PAPER}) calc(var(--gh) - 2px));
  box-shadow:0 -1px 4px rgb(18 18 20 / .05),0 -34px 80px -28px rgb(18 18 20 / .13)!important}
/* the glass: clear, it bends what is behind it (glass-rt.js sets --liquid where the browser can). Lower the frost takes over, so it stops there */
:is(footer#foot.foot,html.stack main>.over)::before{content:"";display:block;position:absolute;z-index:-1;inset:0 0 auto;height:calc(var(--gh) * .5);pointer-events:none;border-radius:inherit;opacity:1;mix-blend-mode:normal;
  background:radial-gradient(760px 120px at var(--lx,50%) 0,rgb(255 255 255 / .075),rgb(255 255 255 / .02) 60%,#0000),linear-gradient(rgb(255 255 255 / .06),rgb(255 255 255 / .02) 40px,rgb(255 255 255 / .005) 84px,#0000 120px);
  /* bevel: a lit lip, then the shadow under it; it deepens with the scroll speed */
  box-shadow:inset 0 1px 0 rgb(255 255 255 / .35),inset 0 calc(6px + var(--fv,0) * 8px) calc(10px + var(--fv,0) * 6px) calc(-8px - var(--fv,0) * 3px) rgb(18 18 20 / calc(.16 + var(--fv,0) * .14));
  -webkit-backdrop-filter:blur(4px) saturate(1.08);backdrop-filter:var(--liquid,blur(4px)) saturate(1.06)}
/* the frost (three blurs, more and more), the light, the paper: elements added by glass-rt.js */
.mist{position:absolute;z-index:-1;inset:0 0 auto;height:var(--gh);pointer-events:none;border-radius:inherit;overflow:clip}
.mist>*{position:absolute;inset:0}
.mist i{bottom:auto;-webkit-backdrop-filter:blur(var(--b));backdrop-filter:blur(var(--b));-webkit-mask:linear-gradient(to bottom,#0000,rgb(0 0 0 / .16) 18%,rgb(0 0 0 / .84) 46%,#000 64%);mask:linear-gradient(to bottom,#0000,rgb(0 0 0 / .16) 18%,rgb(0 0 0 / .84) 46%,#000 64%)}
.mist i:nth-child(1){--b:3px;top:14%;height:48%}.mist i:nth-child(2){--b:10px;top:28%;height:50%}.mist i:nth-child(3){--b:26px;top:44%;height:52%}
.mist canvas{left:-7%;width:114%;height:100%;translate:calc((var(--rise,.5) - .5) * 11%);will-change:translate}
.floor{position:absolute;z-index:-1;inset:calc(var(--gh) * .6) 0 0}
footer#foot.clear{pointer-events:none}footer#foot.clear>:not(.mist,.mono-wrap){pointer-events:auto}
.flood :is(.mist,.floor){display:none}
/* the edge: a fine ring, brightest where the light hits it (--lx) */
:is(footer#foot.foot,html.stack main>.over)::after{content:"";display:block;position:absolute;z-index:-1;inset:0 0 auto;height:var(--gh);pointer-events:none;border-radius:inherit;opacity:1;padding:1px;box-shadow:none;
  background:radial-gradient(calc(380px + var(--fv,0) * 260px) 70px at var(--lx,50%) 0,#fff 10%,#0000),
    radial-gradient(700px 110px at calc(var(--lx,50%) - 12%) 0,rgb(170 225 255 / .5),#0000),
    radial-gradient(700px 110px at calc(var(--lx,50%) + 12%) 0,rgb(225 205 255 / .5),#0000),
    linear-gradient(to bottom,rgb(255 255 255 / .55) 0,rgb(255 255 255 / .4) 24px,rgb(255 255 255 / .12) 22%,#0000 44%);
  -webkit-mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){footer#foot{background:var(--bg)}}
/* without JavaScript: plain paper */
html:not(.js) footer#foot.foot{background:rgb(${PAPER})}
@media (max-width:820px){footer#foot{--gh:clamp(200px,34vh,320px);--gr:calc(40px - var(--fr,.75) * 16px)}.mist canvas{left:-34%;width:172%}}
/* pages other than the home: what comes before stays put while the footer slides over it (--st is set in footer.js) */
.under{position:sticky;top:var(--st,0px);z-index:1;background:var(--chaux)}
@media (prefers-reduced-motion:reduce){.under{position:relative;top:0}}
html.calm .under,html:not(.js) .under{position:relative;top:0}
`;

/* Single source of the footer content. `home`: in-page anchors. */
const SEED_TEAM = [{ id: 'zahia-bougouffa', name: 'Zahia Bougouffa', fr: { role: 'Cofondatrice' }, en: { role: 'Co-founder' } }, { id: 'yacine-bouabdallah', name: 'Yacine Bouabdallah', fr: { role: 'Cofondateur' }, en: { role: 'Co-founder' } }];
const escH = v => String(v ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
/* the credit in the footer and the rows of the team section: one link per person, from the team data
   (both are rewritten by the middleware when the admin has saved) */
const creditLinks = team => (team && team.length ? team : SEED_TEAM).map(m => `<li><a href="/equipe/${escH(m.id)}" data-who="${escH(m.id)}">${escH(m.name)}</a></li>`).join('');
const teamRows = team => (team && team.length ? team : SEED_TEAM).map(m => { const fr = m.fr?.role || '', en = m.en?.role || fr; return `<li><a class="nm-link g" href="/equipe/${escH(m.id)}"><span class="nm">${escH(m.name)}</span><span class="nm-role q4" data-fr="${escH(fr)}" data-en="${escH(en)}">${escH(fr)}</span></a></li>`; }).join('');
const footerInner = ({ home = false, team } = {}) => {
  const h = home ? '#' : '/#';
  return `  <div class="g foot-grid">
    <div class="fcol q1">
      <h2 class="fh" data-i="contact">Contact</h2>
      <ul><li><a href="mailto:contact.moyostudio@gmail.com">contact.moyostudio@gmail.com</a></li></ul>
    </div>
    <nav class="fcol q2" aria-labelledby="fNavT">
      <h2 class="fh" id="fNavT" data-i="fNav">Plan du site</h2>
      <ul>
        <li><a href="/projets" data-i="sProj">Projets</a></li>
        <li><a href="${h}services" data-i="sSvc">Services</a></li>
        <li><a href="${h}methode" data-i="sMth">Méthode</a></li>
        <li><a href="${h}studio" data-i="sStu">Studio</a></li>
        <li><a href="${h}equipe" data-i="sTeam">Équipe</a></li>
      </ul>
    </nav>
    <div class="fcol q3">
      <h2 class="fh" data-i="fBy">Réalisé par</h2>
      <ul class="fnames fby">${creditLinks(team)}</ul>
    </div>
    <form class="fcol q4 foot-sub" id="subForm" novalidate>
      <h2 class="fh" data-i="subH">Inscrivez-vous pour un peu de joie.</h2>
      <div class="sub-row"><label class="sr" for="subMail" data-i="subH">Inscrivez-vous pour un peu de joie.</label><input id="subMail" name="email" type="email" inputmode="email" autocomplete="email" spellcheck="false" required placeholder="vous@exemple.com" data-ph="subPh"><input type="text" name="website" class="sr" tabindex="-1" autocomplete="off" aria-hidden="true"><button type="submit" class="sub-btn" aria-label="S’inscrire" data-ia="subBtn">→</button></div>
      <p class="sub-msg" id="subMsg" role="status" aria-live="polite"></p>
    </form>
  </div>
  <div class="g foot-base">
    <span class="q1" translate="no">© 2026 moyo</span>
    <button type="button" class="calm q2" id="calm" aria-pressed="false" data-i="fCalm">Moins de mouvement</button>
    <span class="flang q3" role="group" aria-label="Langue" data-ia="langAria"><button type="button" data-l="fr" lang="fr" aria-pressed="true">Français</button><button type="button" data-l="en" lang="en" aria-pressed="false">English</button></span>
    <a class="q4" href="${home ? '#top' : '#main'}" data-i="top">Retour en haut</a>
  </div>
  <div class="g foot-end">
    <p><a class="t-hero foot-cta" href="${home ? '#contact' : '/#contact'}"><span data-i="fSee">Quelle est votre idée</span><span class="q">&nbsp;?</span></a></p>
    <div class="foot-note q4">
      <p id="together"></p>
      <button class="hold" id="hold" type="button" data-i="fHold">Maintenez un œil</button>
    </div>
  </div>
  <div class="mono-wrap" aria-hidden="true" translate="no"><div class="monument"><span class="bl">m</span><span class="bl eye">o<i class="pu"></i><i class="ld"></i><i class="hit"></i></span><span class="bl">y</span><span class="bl eye">o<i class="pu"></i><i class="ld"></i><i class="hit"></i></span></div></div>`;
};

const footerHTML = (team, opts = {}) => `<footer class="foot" id="foot" aria-label="Pied de page" data-ia="footAria">
${footerInner({ team, ...opts })}
</footer>`;

export { creditLinks, teamRows, GLASS_CSS, CHROME_CSS, chromeHead, FOOTER_CSS, footerHTML };
