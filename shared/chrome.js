/* Shared site chrome (header bar + arc dropdown menu), used on pages other than the home:
   - build.mjs injects CHROME_CSS and CHROME_HEAD into src/projets.src.html,
   - functions/equipe/[id].js inlines them too.
   The behaviour lives in dist/chrome.js (built from src/chrome-rt.js). Keep `export` on the last line only. */

/* Menu button, the same on every page (home included). */
const BURGER_CSS = `/* Menu button: two clean lines. Opening the menu, the close button folds them into a centred cross;
   closing, the header button unfolds the cross back into two lines. Minimal, precise motion. */
#menuBtn{display:inline-flex!important;align-items:center;justify-content:center;min-width:44px}
#menuBtn .bx,#menuClose .bx{display:flex;flex-direction:column;justify-content:center;gap:5px;width:22px;height:15px}
#menuBtn .bx i,#menuClose .bx i{display:block;width:22px;height:2px;background:currentColor;translate:none!important;transform-origin:50% 50%;
  transition:transform .5s cubic-bezier(.76,0,.24,1)}
/* hover (closed): the two lines ease together — a quiet, precise nudge */
#menuBtn:hover .bx i:nth-of-type(1){transform:translateY(1px)}
#menuBtn:hover .bx i:nth-of-type(2){transform:translateY(-1px)}
/* open state (close button): a centred cross */
#menuClose .bx i:nth-of-type(1){transform:translateY(3.5px) rotate(45deg)}
#menuClose .bx i:nth-of-type(2){transform:translateY(-3.5px) rotate(-45deg)}
#menuClose:hover .bx i:nth-of-type(1){transform:translateY(3.5px) rotate(135deg)}
#menuClose:hover .bx i:nth-of-type(2){transform:translateY(-3.5px) rotate(-135deg)}
@keyframes x1{0%{transform:none}50%{transform:translateY(3.5px)}100%{transform:translateY(3.5px) rotate(45deg)}}
@keyframes x2{0%{transform:none}50%{transform:translateY(-3.5px)}100%{transform:translateY(-3.5px) rotate(-45deg)}}
@keyframes b1{0%{transform:translateY(3.5px) rotate(45deg)}50%{transform:translateY(3.5px)}100%{transform:none}}
@keyframes b2{0%{transform:translateY(-3.5px) rotate(-45deg)}50%{transform:translateY(-3.5px)}100%{transform:none}}
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
  .menu-pv .pv-cw{height:66px;overflow:visible;clip-path:inset(-120px -8px 0)}
  .menu-pv .pv-ci{height:66px}
  .menu-pv .pv-nw{overflow:visible;clip-path:inset(-120px -4px -8px)}
  .menu-pv .pv-ns>span{height:66px}
}
`;

const CHROME_CSS = `
/* Header bar (minimal): logo, EN, burger. Fixed, blue text on the light pages. */
.bar{position:fixed;z-index:90;top:0;left:0;right:0;height:var(--hdr);display:flex;align-items:center;padding:0 var(--m);color:var(--klein);gap:clamp(16px,2.4vw,40px);pointer-events:auto}
.bar,.bar *{transition-property:color,translate,opacity,background-size;transition-duration:.9s;transition-timing-function:cubic-bezier(.25,1,.5,1)}
.bar.away{translate:0 -100%}
.bar::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--chaux);opacity:0;transition:opacity .4s,background .4s}
.bar.scrolled::before{opacity:1}
.bar[data-tone="paper"]{color:var(--paper)}
.bar[data-tone="paper"]::before{background:var(--klein)}
.bar-mark{display:flex;align-items:center;text-decoration:none;color:inherit;font-size:clamp(1.625rem,2.1vw,1.875rem);font-weight:700;letter-spacing:-.045em;line-height:1}
.bar-r{margin-left:auto;display:flex;align-items:center;gap:clamp(18px,2.4vw,36px)}
.bar button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;font-weight:500;background:none}
#langBtn{font-size:var(--fs-small);background:linear-gradient(currentColor,currentColor) 0 calc(50% + .8em)/0 1px no-repeat;transition:background-size var(--dur-3) var(--ease-enter)}
#langBtn:hover{background-size:100% 1px}
.bar :focus-visible{outline:2px solid currentColor;outline-offset:4px}

/* Menu (popover): comes down like a blind */
#menu{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;padding:0;border:0;background:var(--klein);color:var(--paper);overflow:auto;clip-path:inset(0);
  transition:clip-path var(--dur-4) var(--ease-move,cubic-bezier(.76,0,.24,1)),overlay var(--dur-4) allow-discrete,display var(--dur-4) allow-discrete}
#menu:not(:popover-open){clip-path:inset(0 0 100% 0)}
@starting-style{#menu:popover-open{clip-path:inset(0 0 100% 0)}}
#menu::backdrop{background:transparent}
.menu-in{min-height:100%;padding:calc(var(--hdr) + clamp(24px,6vh,72px)) var(--m) var(--m);display:flex;flex-direction:column;justify-content:center;position:relative;isolation:isolate}
.menu-mark{font-size:clamp(1.625rem,2.1vw,1.875rem);font-weight:700;letter-spacing:-.045em;line-height:1;position:absolute;left:var(--m);top:calc((var(--hdr) - 1.2em) / 2 + .1em);color:var(--paper)}
.menu-close{position:absolute;z-index:2;top:0;right:var(--m);height:var(--hdr);display:inline-flex;align-items:center;color:var(--paper);min-width:44px;justify-content:center;background:none}
.menu-list{list-style:none;margin:0;padding:0}
.menu-list a{position:relative;isolation:isolate;overflow:hidden;padding:12px 0;display:block;text-decoration:none;color:var(--paper);transition:color .7s cubic-bezier(.76,0,.24,1)!important;background:none!important}
.menu-list a::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--paper);transform:scaleY(0);transform-origin:50% 100%;transition:transform .7s cubic-bezier(.76,0,.24,1)}
.menu-list a::after{content:"→";position:absolute;right:clamp(8px,2vw,24px);top:50%;font-size:clamp(1.5rem,3vw,2.5rem);font-weight:300;line-height:1;translate:-24px -50%;opacity:0;transition:translate .7s cubic-bezier(.76,0,.24,1),opacity .4s}
.menu-list a:hover,.menu-list a:focus-visible{color:var(--klein)}
.menu-list a:hover::before,.menu-list a:focus-visible::before{transform:scaleY(1)}
.menu-list a:hover::after,.menu-list a:focus-visible::after{translate:0 -50%;opacity:1}
.menu-list .mn{font-size:clamp(2.25rem,7vw,4.5rem);font-weight:350;letter-spacing:-.03em;line-height:1.05}
.menu-list .roll{position:relative;display:inline-block;overflow:hidden;vertical-align:top;padding-left:.04em}
.menu-list .roll .r2{position:absolute;left:.04em;top:0}
.menu-list .roll .c{display:inline-block;white-space:pre;transition:transform .7s cubic-bezier(.76,0,.24,1);transition-delay:calc(var(--i) * 18ms)}
.menu-list .roll .r2 .c{transform:translateY(105%)}
@media (prefers-reduced-motion:no-preference){
  .menu-list a:hover .r1 .c,.menu-list a:focus-visible .r1 .c{transform:translateY(-105%)}
  .menu-list a:hover .r2 .c,.menu-list a:focus-visible .r2 .c{transform:translateY(0)}
}
@media (prefers-reduced-motion:reduce){.menu-list .roll .r2{display:none}}
.menu-close svg{width:28px;height:28px;overflow:visible}
.menu-close path{stroke:currentColor;stroke-width:1.1}
.sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}

/* Arc carousel (desktop) */
@media (min-width:821px){
  #menu{--arc-on:var(--paper);--arc-off:color-mix(in srgb,var(--paper) 22%,transparent);--arc-frame:#A3A7AF}
  #menu .menu-in{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:clamp(24px,4vw,80px);padding:0 var(--m);min-height:100%;height:100%}
  .menu-list.arc{position:relative;flex:none;width:clamp(300px,30vw,520px);height:100svh;margin:0;padding:0}
  .menu-list.arc li{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform,opacity}
  .menu-list.arc a{transform-origin:0 50%;border:0!important;padding:0!important;white-space:nowrap;display:inline-flex;align-items:baseline;gap:.3em;color:var(--arc-off);overflow:visible;outline:none!important;transition:none!important}
  .menu-list.arc .mn,.menu-list.arc .c{transition:none!important}
  .menu-list.arc a::before{display:none!important}
  .menu-list.arc a::after{content:"↗";position:static;display:inline-block;font-size:.42em;font-weight:400;opacity:var(--arw,0);
    translate:calc((var(--arw,0) - 1) * .12em) calc((1 - var(--arw,0)) * .12em);transition:none}
  .menu-list.arc .mn{font-size:clamp(2rem,3.2vw,3.5rem);font-weight:280;line-height:1.08;letter-spacing:-.025em}
  .menu-list.arc .roll{overflow:visible}
  .menu-list.arc .roll .r2{display:none}
  .menu-list.arc .roll .c{transform:none!important;transition:none}
  .menu-list.arc a:hover,.menu-list.arc a:focus-visible{background:none!important}
  #menu .menu-list.arc li{transition:none!important;translate:none!important}
  .menu-pv{flex:none;width:clamp(220px,20vw,330px);will-change:transform}
  .pv-frame{display:block;cursor:pointer;position:relative;aspect-ratio:4/5;transform-origin:50% 50%}
  .pv-l{position:absolute;left:0;right:0;top:-12%;bottom:-12%;background:var(--arc-frame) var(--img,none) 50% var(--py,50%)/cover no-repeat;clip-path:inset(12% 0)}
  .pv-cap{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-top:10px}
  .pv-cw{height:50px;overflow:hidden;flex:1;min-width:0}
  .pv-ci{height:50px;overflow:hidden}
  .pv-cs,.pv-ns{display:block;will-change:transform}
  .pv-desc{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:.6875rem;line-height:1.35;opacity:.6;max-width:28ch}
  .pv-name{margin-top:2px;font-size:.8125rem;font-weight:600}
  .pv-n{font-size:.6875rem;font-variant-numeric:tabular-nums;white-space:nowrap}
  .pv-nw{display:inline-block;height:1.3em;line-height:1.3em;overflow:hidden;vertical-align:top}
  .pv-ns>span{display:block;height:1.3em}
  .pv-t{opacity:.5}
  @keyframes pvRise{from{clip-path:inset(100% -10% 0 -10%);translate:0 2.5rem}to{clip-path:inset(-20% -10%);translate:0 0}}
  @keyframes pvFade{from{opacity:0}}
  #menu:popover-open .pv-frame{animation:pvRise 1.2s cubic-bezier(.22,1,.36,1) .35s both}
  #menu:popover-open .pv-cap{animation:pvFade .8s ease .9s both}
}
@media (min-width:821px) and (prefers-reduced-motion:reduce){#menu:popover-open .pv-frame,#menu:popover-open .pv-cap{animation:none}}
@media (max-width:820px){.menu-pv,.menu-list .arc-clone{display:none}}

${BURGER_CSS}
html.menu-lock{overflow:hidden}
`;

/* Language button (every page): on hover the label rolls up and the same label takes its place. No underline.
   The label is drawn twice from the button's lang attribute; the real text stays for assistive tech. */
const LANG_CSS = `
/* footer: the name of the agency, and the credit with the names of the team (links to their pages) */
.fnames li.bn{font-size:clamp(1.5rem,2vw,1.875rem);font-weight:700;letter-spacing:-.045em;line-height:1.1}
.fby a{display:inline-flex;align-items:center;gap:.4em}.fby a::after{content:"↗";font-size:.8em;opacity:.6;transition:translate .5s cubic-bezier(.25,1,.5,1),opacity .3s}.fby a:hover::after{translate:2px -2px;opacity:1}

#bar #langBtn{position:relative;display:inline-grid;place-items:center;min-width:44px;background:none!important;-webkit-text-fill-color:transparent;letter-spacing:.02em}
#bar #langBtn::before,#bar #langBtn::after{content:attr(lang);content:attr(lang)/"";position:absolute;inset:auto;text-transform:uppercase;line-height:1.3;-webkit-text-fill-color:currentColor;pointer-events:none;
  transition:translate .5s cubic-bezier(.65,0,.15,1),clip-path .5s cubic-bezier(.65,0,.15,1)}
#bar #langBtn::before{clip-path:inset(0)}
#bar #langBtn::after{translate:0 100%;clip-path:inset(0 0 100%)}
@media (hover:hover) and (prefers-reduced-motion:no-preference){
  #bar #langBtn:hover::before{translate:0 -100%;clip-path:inset(100% 0 0)}
  #bar #langBtn:hover::after{translate:0 0;clip-path:inset(0)}
}
@media (forced-colors:active){#bar #langBtn{-webkit-text-fill-color:currentColor}#bar #langBtn::before,#bar #langBtn::after{content:none}}
`;

/* Header + menu markup. `start` = the arc card the menu opens on (page's own section). */
const chromeHead = (start = 0) => `<header class="bar" id="bar">
  <a class="bar-mark" href="/" aria-label="moyo, accueil" data-ia="homeAria">moyo</a>
  <nav class="bar-r" aria-label="Navigation principale" data-ia="nav">
    <button type="button" id="langBtn" aria-label="Switch to English" lang="en">EN</button>
    <button type="button" id="menuBtn" class="bar-menu" popovertarget="menu" popovertargetaction="toggle"><span class="sr" data-i="menu">Menu</span><span class="bx" aria-hidden="true"><i></i><i></i></span></button>
  </nav>
</header>
<nav id="menu" popover aria-label="Menu" data-ia="menu" data-start="${start}">
  <div class="menu-in">
    <ol class="menu-list arc">
      <li><a href="/"><span class="mn" data-i="sec.top">Accueil</span></a></li>
      <li><a href="/#projets"><span class="mn" data-i="sec.projects">Projets choisis</span></a></li>
      <li><a href="/projets"><span class="mn" data-i="sec.all">Tous les projets</span></a></li>
      <li><a href="/#services"><span class="mn" data-i="sec.services">Services</span></a></li>
      <li><a href="/#studio"><span class="mn" data-i="sec.studio">Agence</span></a></li>
      <li><a href="/#equipe"><span class="mn" data-i="sec.team">L’équipe</span></a></li>
      <li><a href="/#contact"><span class="mn" data-i="sec.contact">Contact</span></a></li>
    </ol>
    <div class="menu-pv" aria-hidden="true">
      <a class="pv-frame" id="pvLink" href="/" tabindex="-1"><span class="pv-l" id="pvB"></span><span class="pv-l" id="pvA"></span></a>
      <div class="pv-cap">
        <div class="pv-cw"><div class="pv-cs" id="pvCS">
          <div class="pv-ci"><p class="pv-desc"></p><p class="pv-name"></p></div>
          <div class="pv-ci"><p class="pv-desc"></p><p class="pv-name"></p></div>
        </div></div>
        <p class="pv-n"><span class="pv-nw"><span class="pv-ns" id="pvNS"><span>01</span><span>02</span></span></span><span class="pv-t" id="pvTot">/07</span></p>
      </div>
    </div>
  </div>
  <span class="menu-mark" aria-hidden="true">moyo</span>
  <button type="button" class="menu-close" id="menuClose" popovertarget="menu" popovertargetaction="hide"><span class="sr" data-i="close">Fermer</span><span class="bx" aria-hidden="true"><i></i><i></i></span></button>
</nav>`;

/* Footer (columns, live sun, sign-up, blur "moyo"), with a gentle parallax reveal. */
const FOOTER_CSS = `
.foot{position:relative;z-index:2;background:var(--klein);color:var(--paper);padding:clamp(64px,10vh,120px) var(--m) 0;overflow:clip;margin-top:calc(clamp(48px,8vh,96px) * -1);box-shadow:0 -40px 90px -50px rgb(0 6 40 / .55)}
.foot ::selection{background:var(--paper);color:var(--klein)}
.foot :focus-visible{outline-color:var(--paper)}
.foot .small{font-size:var(--fs-small)}
.foot .muted{color:var(--paper-soft)}
.foot-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:48px clamp(16px,2vw,32px);max-width:1500px;margin:0 auto}
.fcol{grid-column:span 3;min-width:0}
.fh{font-size:.875rem;font-weight:500;letter-spacing:.06em;text-transform:uppercase;margin-bottom:16px;color:var(--paper-soft)}
.fcol ul{display:grid;gap:2px;list-style:none;margin:0;padding:0}
.fnames li{font-size:1.25rem;font-weight:300;letter-spacing:-.02em;line-height:1.3}
.fnames+p{margin-top:16px;max-width:30ch}
.fcol a{display:inline-flex;align-items:center;min-height:32px;text-decoration:none;color:var(--paper);background:linear-gradient(currentColor,currentColor) 0 calc(100% - 6px)/0 1px no-repeat;transition:background-size var(--dur-3) var(--ease-enter)}
.fcol a:hover{background-size:100% 1px}
.foot-sun{font-size:1.25rem;font-weight:300;letter-spacing:-.02em;line-height:1.3;margin-bottom:16px;max-width:24ch;text-wrap:balance}
.fcol--live .small{margin-top:14px;max-width:30ch}
.foot-base{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 32px;margin:clamp(56px,9vh,104px) auto 0;max-width:1500px;padding-top:20px;border-top:1px solid var(--paper-line);font-size:var(--fs-small)}
.foot-base a{display:inline-flex;align-items:center;min-height:32px;color:var(--paper);text-decoration:none}
.flang{display:inline-flex;gap:14px}
.flang button{min-height:32px;color:var(--paper-soft);background:linear-gradient(currentColor,currentColor) 0 calc(100% - 6px)/0 1px no-repeat;transition:background-size var(--dur-3) var(--ease-enter),color var(--dur-1)}
.flang button:hover{color:var(--paper)}
.flang button[aria-pressed="true"]{color:var(--paper);background-size:100% 1px}
.foot-subwrap{max-width:1500px;margin:clamp(44px,7vh,96px) auto 0}
.foot-sub{max-width:520px}
.fh2{font-size:var(--fs-lead);font-weight:400;line-height:1.15;margin:0 0 20px;color:var(--paper)}
.sub-row{display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap}
.sub-row input[type=email]{flex:1 1 220px;min-width:0;font:inherit;font-size:clamp(1.125rem,1.4vw,1.375rem);font-weight:300;color:var(--paper);background:transparent;border:0;border-bottom:1px solid var(--paper-line);border-radius:0;padding:6px 0 12px;outline:none;transition:border-color var(--dur-1)}
.sub-row input[type=email]::placeholder{color:color-mix(in oklab,var(--paper) 78%,var(--klein))}
.sub-row input[type=email]:focus-visible{border-color:var(--paper)}
.sub-btn{flex:none;display:inline-flex;align-items:center;gap:16px;min-height:52px;padding:0 24px;background:var(--paper);color:var(--klein);font:inherit;font-size:.9375rem;font-weight:550;cursor:pointer;transition:gap var(--dur-3) var(--ease-enter),background var(--dur-1)}
.sub-btn::after{content:"→"}
.sub-btn:hover{gap:26px;background:color-mix(in oklab,var(--paper) 90%,var(--klein))}
.sub-btn:focus-visible{outline:2px solid var(--paper);outline-offset:4px}
.sub-btn:disabled{opacity:.6;cursor:progress;gap:16px}
.sub-msg{margin-top:16px;min-height:1.3em;opacity:.85}
.sub-msg.err{color:color-mix(in oklab,var(--paper) 80%,#ffb3b3)}
@media (max-width:560px){.sub-btn{flex:1 1 100%;justify-content:space-between}}
.mono-wrap{container-type:inline-size;margin:clamp(40px,7vh,88px) calc(var(--m) * -1) 0;padding:0 var(--m)}
.monument{font-size:calc(100cqw / 2.165);font-weight:300;letter-spacing:-.055em;line-height:.72;white-space:nowrap;margin-left:-.077em;user-select:none;height:.915em}
.monument.blurtext{background:none!important;-webkit-text-fill-color:currentColor;color:var(--paper)}
.monument.blurtext .bl{display:inline-block;filter:blur(var(--b,0px));padding:0 .1em .28em;margin:0 -.1em -.28em;
  background-image:radial-gradient(circle at 50% 50%,rgb(0 47 167 / .28) .7px,#0000 1.1px),linear-gradient(var(--paper),var(--paper));background-size:4px 4px,100% 100%;
  -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.foot-grid,.foot-subwrap,.foot-base{transform:translateY(calc((1 - var(--fp,1)) * 40px))}
.foot .mono-wrap{transform:translateY(calc((1 - var(--fp,1)) * 90px))}
@media (prefers-reduced-motion:reduce){.foot-grid,.foot-subwrap,.foot-base,.foot .mono-wrap{transform:none}}
@media (max-width:900px){.fcol{grid-column:span 6}}
@media (max-width:560px){.fcol{grid-column:1/-1}}
@media (max-width:820px){.bar-mark,.fcol a,.foot-base a,.flang button{min-height:44px}.fcol ul{gap:0}}
/* The blue panel rises over the content as it scrolls in (parallax "comes over"). */
@media (prefers-reduced-motion:no-preference){@supports (animation-timeline:view()){
  .foot{animation:footOver linear both;animation-timeline:view();animation-range:entry 0% cover 14%}
  @keyframes footOver{from{translate:0 100px}to{translate:0 0}}
}}
`;

/* Glass top of the footer (every page): the panel slides over the page, its top is frosted glass with a bright rim,
   then it turns into the solid Klein blue before the text starts. To remove the effect, empty this string. */
const GLASS_CSS = `
footer#foot{--gp:clamp(240px,44vh,640px);--gh:calc(var(--gp) + 40px);--gr:calc(64px - var(--fr,.75) * 32px);
  border:0;border-radius:var(--gr) var(--gr) 0 0;padding-top:var(--gp);margin-top:0;animation:none;isolation:isolate;
  background:linear-gradient(to bottom,#0000 calc(var(--gh) - 1px),rgb(0 47 167) calc(var(--gh) - 1px));
  box-shadow:0 -2px 8px rgb(0 6 40 / .08),0 -24px 48px -12px rgb(0 6 40 / .22)!important}
/* the glass: clear, it bends what is behind it (glass.js sets --liquid where the browser can), then turns blue downwards */
footer#foot.foot::before{content:"";display:block;position:absolute;z-index:-1;inset:0 0 auto;height:var(--gh);pointer-events:none;border-radius:inherit;opacity:1;mix-blend-mode:normal;
  background:linear-gradient(to bottom in oklab,rgb(0 47 167 / 0.012) calc(var(--gp) * 0.000),rgb(0 47 167 / 0.012) calc(var(--gp) * 0.049),rgb(0 47 167 / 0.012) calc(var(--gp) * 0.098),rgb(0 47 167 / 0.012) calc(var(--gp) * 0.147),rgb(0 47 167 / 0.012) calc(var(--gp) * 0.196),rgb(0 47 167 / 0.012) calc(var(--gp) * 0.245),rgb(0 47 167 / 0.012) calc(var(--gp) * 0.294),rgb(0 47 167 / 0.016) calc(var(--gp) * 0.343),rgb(0 47 167 / 0.037) calc(var(--gp) * 0.392),rgb(0 47 167 / 0.086) calc(var(--gp) * 0.441),rgb(0 47 167 / 0.166) calc(var(--gp) * 0.490),rgb(0 47 167 / 0.272) calc(var(--gp) * 0.539),rgb(0 47 167 / 0.398) calc(var(--gp) * 0.588),rgb(0 47 167 / 0.533) calc(var(--gp) * 0.637),rgb(0 47 167 / 0.666) calc(var(--gp) * 0.686),rgb(0 47 167 / 0.785) calc(var(--gp) * 0.735),rgb(0 47 167 / 0.882) calc(var(--gp) * 0.784),rgb(0 47 167 / 0.949) calc(var(--gp) * 0.833),rgb(0 47 167 / 0.987) calc(var(--gp) * 0.882),rgb(0 47 167 / 0.999) calc(var(--gp) * 0.931),rgb(0 47 167 / 1.000) calc(var(--gp) * 0.980)),
    radial-gradient(700px 130px at var(--lx,50%) 0,rgb(255 255 255 / .12),#0000),
    linear-gradient(rgb(255 255 255 / .09),#0000 130px);
  /* bevel: a lit lip, then the shadow under it; it deepens with the scroll speed */
  box-shadow:inset 0 1px 0 rgb(255 255 255 / .35),inset 0 calc(6px + var(--fv,0) * 8px) calc(10px + var(--fv,0) * 6px) calc(-8px - var(--fv,0) * 3px) rgb(0 14 70 / calc(.16 + var(--fv,0) * .14));
  -webkit-backdrop-filter:blur(4px) saturate(1.3);backdrop-filter:var(--liquid,blur(4px)) saturate(1.35) brightness(1.04)}
/* the edge: a fine ring, brightest where the light hits it (--lx) */
footer#foot.foot::after{content:"";display:block;position:absolute;z-index:-1;inset:0 0 auto;height:var(--gh);pointer-events:none;border-radius:inherit;opacity:1;padding:1px;box-shadow:none;
  background:radial-gradient(calc(380px + var(--fv,0) * 260px) 70px at var(--lx,50%) 0,#fff 10%,#0000),
    radial-gradient(700px 110px at calc(var(--lx,50%) - 12%) 0,rgb(170 225 255 / .5),#0000),
    radial-gradient(700px 110px at calc(var(--lx,50%) + 12%) 0,rgb(225 205 255 / .5),#0000),
    linear-gradient(to bottom,rgb(255 255 255 / .55) 0,rgb(255 255 255 / .4) 24px,rgb(255 255 255 / .14) 34%,#0000 70%);
  -webkit-mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0)}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){footer#foot{background:var(--klein)}}
@media (max-width:820px){footer#foot{--gp:clamp(170px,27vh,250px);--gr:calc(40px - var(--fr,.75) * 16px)}}
/* home: the last section must not lift, the glass would show the page background under it */
html.stack main>.contact{transform:none}
/* pages other than the home: what comes before stays put while the footer slides over it (--st is set in footer.js) */
.under{position:sticky;top:var(--st,0px);z-index:1;background:var(--chaux)}
@media (prefers-reduced-motion:reduce){.under{position:relative;top:0}}
`;

/* Single source of the footer content. The home keeps its own <footer> shell (sticky stack), in-page anchors and `sec.*` labels. */
const SEED_TEAM = [{ id: 'zahia-bougouffa', name: 'Zahia Bougouffa' }, { id: 'yacine-bouabdallah', name: 'Yacine Bouabdallah' }];
const escH = v => String(v).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
/* the credit in the footer: one link per person, from the team data (also rewritten by the middleware when the admin has saved) */
const creditLinks = team => (team && team.length ? team : SEED_TEAM).map(m => `<li><a href="/equipe/${escH(m.id)}" data-who="${escH(m.id)}">${escH(m.name)}</a></li>`).join('');
const footerInner = ({ home = false, team } = {}) => {
  const w = home ? 'wrap ' : '', h = home ? '#' : '/#';
  return `  <div class="${w}foot-grid">
    <div class="fcol">
      <h2 class="fh" data-i="fStudio">Agence</h2>
      <ul class="fnames"><li class="bn">moyo</li></ul>
      <p class="small muted" data-i="fStudioP">Agence créative indépendante, basée en Provence-Alpes-Côte d’Azur : sites, identités, audiovisuel et communication.</p>
    </div>
    <nav class="fcol" aria-labelledby="fNavT">
      <h2 class="fh" id="fNavT" data-i="fNav">Plan du site</h2>
      <ul>
${home ? "" : `        <li><a href="/" data-i="home">Accueil</a></li>
`}        <li><a href="${h}approche" data-i="${home ? 'sec.intro' : 'sIntro'}">Approche</a></li>
        <li><a href="${h}projets" data-i="${home ? 'sec.projects' : 'sProj'}">Projets choisis</a></li>
        <li><a href="/projets" data-i="${home ? 'sec.all' : 'allL'}">Tous les projets</a></li>
        <li><a href="${h}services" data-i="${home ? 'sec.services' : 'sSvc'}">Services</a></li>
        <li><a href="${h}studio" data-i="${home ? 'sec.studio' : 'sStu'}">Agence</a></li>
        <li><a href="${h}equipe" data-i="${home ? 'sec.team' : 'sTeam'}">L’équipe</a></li>
        <li><a href="${h}contact" data-i="${home ? 'sec.contact' : 'contact'}">Contact</a></li>
      </ul>
    </nav>
    <div class="fcol fcol--by">
      <h2 class="fh" data-i="fBy">Réalisé par</h2>
      <ul class="fnames fby">${creditLinks(team)}</ul>
    </div>
    <div class="fcol">
      <h2 class="fh" data-i="${home ? 'sec.contact' : 'contact'}">Contact</h2>
      <ul><li><a href="mailto:contact.moyostudio@gmail.com">contact.moyostudio@gmail.com</a></li></ul>
    </div>
  </div>
  <div class="${w}foot-subwrap"><form class="foot-sub" id="subForm" novalidate><h2 class="fh2" data-i="subH">Inscrivez-vous pour un peu de joie.</h2><div class="sub-row"><label class="sr" for="subMail" data-i="subH">Inscrivez-vous pour un peu de joie.</label><input id="subMail" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="vous@exemple.com" data-ph="subPh"><input type="text" name="website" class="sr" tabindex="-1" autocomplete="off" aria-hidden="true"><button type="submit" class="sub-btn" data-i="subBtn">S’inscrire</button></div><p class="sub-msg small" id="subMsg" role="status" aria-live="polite"></p></form></div>
  <div class="${w}foot-base small">
    <span>© 2026 moyo</span>
    <span class="muted" id="fDate"></span>
    <span class="flang" role="group" aria-label="Langue" data-ia="langAria"><button type="button" data-l="fr" lang="fr" aria-pressed="true">Français</button><button type="button" data-l="en" lang="en" aria-pressed="false">English</button></span>
    <a href="${home ? '#top' : '#main'}" data-i="top">Retour en haut</a>
  </div>
  <div class="mono-wrap" aria-hidden="true"><div class="monument blurtext"><span class="bl" style="--i:0">m</span><span class="bl" style="--i:1">o</span><span class="bl" style="--i:2">y</span><span class="bl" style="--i:3">o</span></div></div>`;
};

const footerHTML = team => `<footer class="foot" id="foot" aria-label="Pied de page" data-ia="footAria">
${footerInner({ team })}
</footer>`;

export { creditLinks, GLASS_CSS, BURGER_CSS, CHROME_CSS, LANG_CSS, chromeHead, FOOTER_CSS, footerInner, footerHTML };
