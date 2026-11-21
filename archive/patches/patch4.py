import re,sys
p='/home/claude/v2/src.html'
s=open(p,encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a)
    if n!=count: print('MISMATCH',n,'(want',count,') for',a[:90]); sys.exit(1)
    s=s.replace(a,b)
def sub(pat,repl,count=1,flags=re.S):
    global s
    n=len(re.findall(pat,s,flags))
    if n!=count: print('SUBMISS',n,'for',pat[:90]); sys.exit(1)
    s=re.sub(pat,lambda m:repl,s,flags=flags)

# ---------- identity ----------
rep("Heure Bleue Studio","Moyo Studio",count=s.count("Heure Bleue Studio"))
rep("hello@heure-bleue.example","contact.moyostudio@gmail.com",count=s.count("hello@heure-bleue.example"))
sub(r'<a class="wordmark" href="#top" aria-label="Heure Bleue">Heure Bleue</a>','<a class="wordmark" href="#top" aria-label="Moyo">moyo</a>')
sub(r'<div class="monument">Heure Bleue</div>','<div class="monument">moyo</div>')
sub(r'<meta property="og:description" content="[^"]*">','<meta property="og:description" content="Studio de design et de développement. Un site éclairé par le vrai soleil de Nice.">')
sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="Moyo, studio de design et de développement à Nice. Sites, identités et visualisations de données, dessinés avec la lumière.">')
rep('<meta property="og:type" content="website">','''<meta property="og:type" content="website">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23002FA7'/%3E%3Cpath d='M0 11h32M0 21h32' stroke='%23F1F3F2' stroke-width='2'/%3E%3C/svg%3E">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"ProfessionalService","name":"Moyo","description":"Studio de design et de développement : sites, identités et visualisations de données.","email":"contact.moyostudio@gmail.com","areaServed":"FR","knowsLanguage":["fr","en"]}</script>''')

# ---------- hero title in fixed lines (the sun changes its weight, lines must not reflow) ----------
sub(r'<h1 class="display" id="h1" data-i="h1">.*?</h1>','<h1 class="display" id="h1" data-i="h1"><span class="ln" style="--i:0">Un studio de design</span> <span class="ln" style="--i:1">à Nice, qui dessine</span> <span class="ln" style="--i:2">avec la lumière.</span></h1>')

# ---------- bar: time cell ----------
rep('<span class="bar-now" id="barNow" data-i="sec.top">Accueil</span>','<span class="bar-now" id="barNow" data-i="sec.top">Accueil</span>\n  <span class="bar-time" id="barTime" aria-hidden="true">12:00</span>')

# ---------- menu entry ----------
sub(r'<li><a href="#riviera">.*?</li>','<li><a href="#lumiere"><span class="mn" data-i="sec.light">Lumière</span></a></li>')

# ---------- intro statement: words light up with scroll ----------
rep('<h2 class="display" id="introT" data-i="introT">','<h2 class="display words" id="introT" data-i="introT">')

# ---------- Studio + Light sections ----------
i=s.index('<!-- Studio -->'); j=s.index('<!-- Contact -->')
new_sections='''<!-- Studio -->
<section class="sec blue studio" id="studio" data-sec="studio" data-tone="blue" aria-labelledby="stuT">
  <div class="wrap">
    <h2 class="display par" id="stuT" style="--a:44px" data-i="stuT">Le studio.</h2>
    <p class="statement words" data-i="stuP">Moyo est un studio de design et de développement installé à Nice. Nous concevons des sites et des identités pour des lieux, des événements et des marques qui ont quelque chose de précis à montrer.</p>
    <ul class="beliefs">
      <li><h3 data-i="b1t">Une idée par projet.</h3><p data-i="b1p">Nous choisissons une seule idée forte, puis nous la tenons du premier écran à la dernière ligne de code.</p></li>
      <li><h3 data-i="b2t">Du temps pour la lumière.</h3><p data-i="b2p">Des mouvements lents, des pauses, de l’air. Un site se lit, il ne se subit pas.</p></li>
      <li><h3 data-i="b3t">Accessible dès le départ.</h3><p data-i="b3p">Clavier, contraste, mouvement réduit, sans JavaScript : des états dessinés, pas des correctifs.</p></li>
    </ul>
    <h3 class="team-t" data-i="teamT">L’équipe.</h3>
    <ul class="names" aria-label="Équipe" data-ia="teamAria">
      <li><span class="nm par" style="--a:40px">Zahia Bougouffa</span></li>
      <li><span class="nm par" style="--a:-26px">Yacine Bouabdallah</span></li>
    </ul>
    <div class="studio-cta"><a class="link" href="#contact" data-i="stuL">Écrire au studio</a></div>
  </div>
</section>

<!-- Lumière -->
<section class="sec" id="lumiere" data-sec="light" data-tone="paper" aria-labelledby="lumT">
  <div class="wrap">
    <div class="sec-head">
      <h2 class="display par" id="lumT" style="--a:36px" data-i="lumT">La lumière de Nice, en direct.</h2>
      <p class="small muted" data-i="lumN">Ce site calcule la position réelle du soleil. Voici les valeurs d’aujourd’hui.</p>
    </div>
    <div class="today">
      <div class="par" style="--a:26px">
        <h3 data-i="todayT">Aujourd’hui à Nice</h3>
        <dl>
          <dt data-i="rise">Lever</dt><dd id="dRise">--:--</dd>
          <dt data-i="set">Coucher</dt><dd id="dSet">--:--</dd>
          <dt data-i="len">Durée du jour</dt><dd id="dLen">--</dd>
          <dt data-i="elmax">Soleil au plus haut</dt><dd id="dEl">--</dd>
        </dl>
        <p class="small muted" style="margin-top:14px;max-width:34ch" data-i="todayN">Calculé dans votre navigateur pour 43,70° N, 7,26° E, heure de Paris.</p>
      </div>
      <div>
        <h3 data-i="chartT">Heures de soleil par mois à Nice</h3>
        <div id="sunchart"></div>
        <details class="tbl"><summary data-i="tbl">Voir les données en tableau</summary><div class="sc" tabindex="0" role="region" aria-label="Heures de soleil par mois" data-ia="tblAria"><table id="sunTbl"></table></div></details>
        <p class="small muted src"><span data-i="srcT">2 725 h de soleil par an en moyenne, 1991 à 2020. Source : </span><a href="https://www.climatsetvoyages.com/climat/france/nice">Climats et Voyages</a>.</p>
      </div>
    </div>
  </div>
</section>

'''
s=s[:i]+new_sections+s[j:]

# ---------- contact ----------
sub(r'\s*<span data-i="note">.*?</span>','')
rep(".mail{display:inline-block;font-size:clamp(1.5rem,5.2vw,5rem)",".mail{display:inline-block;font-size:clamp(1.25rem,4.6vw,4.5rem)")

# ---------- CSS: tokens, durations, bar ----------
rep("--dur-1:200ms; --dur-3:400ms; --dur-4:800ms; --dur-5:1200ms;","--dur-1:300ms; --dur-3:650ms; --dur-4:1300ms; --dur-5:2000ms;\n  --barw:min(380px,calc(100vw - 24px));\n  --spring:linear(0,.2 8%,.62 22%,.92 38%,1.03 52%,1.01 66%,1 80%,1);")
rep("width:min(340px,calc(100vw - 24px))","width:var(--barw)",count=s.count("width:min(340px,calc(100vw - 24px))"))
rep("max(12px,calc(50% - 170px))","calc((100% - var(--barw)) / 2)",count=s.count("max(12px,calc(50% - 170px))"))
rep(".bar{position:fixed;",".bar{box-shadow:calc(var(--sx,.22) * 8px) calc(var(--sy,.9) * 8px) 16px 0 rgb(0 8 60 / calc(var(--a,.26) * .9));position:fixed;")
rep(".bar-now{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}",".bar-now{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}\n.bar>.bar-time{padding:0 14px;min-width:4.6rem;justify-content:center;font-weight:400;opacity:.82}")
rep(".hero{position:relative;height:calc(100svh + 120svh)}",".hero{position:relative;height:calc(100svh + 200svh)}")
rep("animation-range:0px 120svh","animation-range:0px 200svh")
rep(".hero-copy h1{margin-bottom:clamp(16px,2.4vw,28px)}",".hero-copy h1{margin-bottom:clamp(16px,2.4vw,28px);font-weight:var(--sunw,350)}\n.hero-copy h1 .ln{display:block}")

# drop old facts/team/studio/sources css
s=re.sub(r'^\s*\.(facts|team|studio|sources)[^\n]*\n','',s,flags=re.M)
rep(".two>section:first-child,.two>section:last-child,.studio .cols>div:first-child,.studio .cols>div:last-child,.today>div:first-child,.today>div:last-child{grid-column:1/-1}",".two>section:first-child,.two>section:last-child,.today>div:first-child,.today>div:last-child{grid-column:1/-1}")

css_new='''
/* Studio */
.studio .wrap{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:0 clamp(16px,2vw,32px)}
.studio .wrap>*{grid-column:1/-1}
.statement{grid-column:4/-1!important;margin-top:clamp(24px,5vh,56px);max-width:36ch;font-size:clamp(1.375rem,2.4vw,2.25rem);font-weight:350;letter-spacing:-.02em;line-height:1.25;text-wrap:pretty}
.beliefs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 clamp(16px,2vw,32px);margin-top:clamp(56px,10vh,128px)}
.beliefs li{border-top:1px solid var(--paper-line);padding:16px 12px 8px 0}
.beliefs h3{font-size:1.5rem;font-weight:400;letter-spacing:-.02em;line-height:1.15;margin-bottom:8px}
.beliefs p{color:var(--paper-soft);max-width:34ch}
.team-t{margin-top:clamp(64px,12vh,152px);margin-bottom:14px;font-size:var(--fs-small);font-weight:500;color:var(--paper-soft)}
.names{border-top:1px solid var(--paper-line)}
.names li{border-bottom:1px solid var(--paper-line);padding:clamp(10px,1.6vw,22px) 0}
.nm{display:block;font-size:clamp(2.25rem,6.4vw,6.75rem);font-weight:300;letter-spacing:-.045em;line-height:1.02;text-wrap:balance}
.studio-cta{margin-top:clamp(32px,6vh,72px)}
.src{margin-top:14px;max-width:46ch}
.src a{color:var(--klein)}
.words .w{display:inline}

/* Motion, 2026: view timelines, sibling-index(), scroll-state, native springs. Every effect is an enhancement. */
@keyframes ln{from{opacity:0;translate:0 .55em;clip-path:inset(0 0 100% 0)}to{opacity:1;translate:0 0;clip-path:inset(-.2em -.1em -.3em -.1em)}}
@keyframes fadeIn{from{opacity:0}}
@keyframes par{from{translate:0 var(--a,48px)}to{translate:0 calc(var(--a,48px) * -1)}}
@keyframes monoIn{from{translate:0 44%}to{translate:0 0}}
@keyframes word{from{opacity:.2}to{opacity:1}}
@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes itemIn{from{opacity:0;translate:0 1.4rem}}
@media (prefers-reduced-motion:no-preference){
  .hero-copy h1 .ln{animation:ln 1600ms var(--ease-enter) both;animation-delay:calc(200ms + var(--i,0) * 170ms)}
  .sunui,.hint{animation:fadeIn 1600ms ease both;animation-delay:1300ms}
  #menu .menu-list li{transition:opacity var(--dur-4) var(--ease-enter),translate var(--dur-4) var(--ease-enter);transition-delay:calc(300ms + (sibling-index() - 1) * 90ms)}
  #menu:not(:popover-open) .menu-list li{opacity:0;translate:0 1.5rem;transition-duration:300ms;transition-delay:0ms}
  @starting-style{#menu:popover-open .menu-list li{opacity:0;translate:0 1.5rem}}
  #proj[open] .dlg-in>*{animation:itemIn 1500ms var(--spring) both;animation-delay:calc(450ms + (sibling-index() - 1) * 110ms)}
}
@supports (animation-timeline:view()){
  @media (prefers-reduced-motion:no-preference){
    .sec{view-timeline:--v block}
    .par{animation:par linear both;animation-timeline:--v;animation-range:cover 0% cover 100%}
    .mono-wrap{animation:monoIn linear both;animation-timeline:--v;animation-range:entry 0% entry 100%}
    .words .w{animation:word linear both;animation-timeline:view();animation-range:entry 30% entry 95%}
    #sunchart .cb{transform-box:fill-box;transform-origin:50% 100%;animation:grow linear both;animation-timeline:view();animation-range:entry calc(var(--i) * 4%) entry calc(50% + var(--i) * 4%)}
  }
}
@supports (container-type:scroll-state){
  details.tbl .sc{container-type:scroll-state}
  @container scroll-state(scrollable: inline){details.tbl table{mask-image:linear-gradient(90deg,#000 88%,transparent)}}
}
'''
rep("/* Responsive */",css_new+"\n/* Responsive */")
rep("  .dlg-desc{grid-column:1/-1}","  .dlg-desc{grid-column:1/-1}\n  .statement{grid-column:1/-1!important}\n  .beliefs{grid-template-columns:1fr;gap:20px 0}")

# ---------- JS: dictionary ----------
a=s.index("const EN={"); b=s.index("const PROJ=[")
EN='''const EN={
 'skip':'Skip to content','nav':'Main navigation','menu':'Menu','close':'Close',
 'sec.top':'Home','sec.intro':'Approach','sec.projects':'Projects','sec.services':'Services','sec.studio':'Studio','sec.light':'Light','sec.contact':'Contact',
 'h1':'<span class="ln" style="--i:0">A design studio</span> <span class="ln" style="--i:1">in Nice that draws</span> <span class="ln" style="--i:2">with light.</span>',
 'h1p':'Websites, identities and data visualisations. An independent design and development studio.',
 'sunLabel':'Time in Nice','hint':'Scroll to open the window.',
 'introT':'We measure light before we draw it. Every project starts with readings, then one simple idea, built with care.',
 'introL':'See the projects',
 'projT':'Selected projects.','projN':'Sample projects, to be replaced with yours.',
 'svcAria':'Services and method','svcT':'What we do.',
 's1t':'Art direction','s1p':'One idea, a type system, a palette. Everything is decided before the first pixel.',
 's2t':'Immersive websites','s2p':'Narrative scroll, WebGL only when it serves the subject, readable without a mouse or animation.',
 's3t':'Data visualisation','s3p':'Charts you can explore, with their sources and a table version.',
 's4t':'Moving identities','s4p':'Logos, grids and animation for brands that live on screen.',
 'mthT':'How we work.',
 'm1t':'Survey','m1p':'We visit, measure and collect the real figures.',
 'm2t':'Choose','m2p':'We keep one idea, and what it rules out.',
 'm3t':'Draw','m3p':'Grid, type and motion, on 390 and 1440 pixel screens.',
 'm4t':'Build','m4p':'Code without needless dependencies, tested by keyboard, without animation, without JavaScript.',
 'stuT':'The studio.',
 'stuP':'Moyo is a design and development studio based in Nice. We design websites and identities for places, events and brands that have something precise to show.',
 'b1t':'One idea per project.','b1p':'We choose a single strong idea, then hold it from the first screen to the last line of code.',
 'b2t':'Time for light.','b2p':'Slow movement, pauses, air. A site is meant to be read, not endured.',
 'b3t':'Accessible from the start.','b3p':'Keyboard, contrast, reduced motion, no JavaScript: designed states, not afterthought fixes.',
 'teamT':'The team.','teamAria':'Team','stuL':'Write to the studio',
 'lumT':'The light of Nice, live.','lumN':'This site calculates the real position of the sun. These are today\\u2019s values.',
 'todayT':'Today in Nice','rise':'Sunrise','set':'Sunset','len':'Day length','elmax':'Sun at its highest',
 'todayN':'Calculated in your browser for 43.70\\u00b0 N, 7.26\\u00b0 E, Paris time.',
 'chartT':'Hours of sun per month in Nice','tbl':'See the data as a table','tblAria':'Hours of sun per month',
 'srcT':'2,725 hours of sun a year on average, 1991 to 2020. Source: ',
 'ctT':'Let\\u2019s talk about light.','copy':'Copy the address','where':'Nice, France','top':'Back to top',
 'sample':'Sample project','fRole':'Role','fYear':'Year','fPlace':'Place','prev':'Previous','next':'Next'
};
'''
s=s[:a]+EN+s[b:]

# ---------- JS: sun block ----------
a=s.index("/* ---------- Hero shadow ---------- */"); b=s.index("/* ---------- Menu ---------- */")
SUN='''/* ---------- Sun: shadow, weight of the title, the day passes as you scroll ---------- */
const stage=$('#stage'), sun=$('#sun'), sunT=$('#sunT'), sunInfo=$('#sunInfo'), barTime=$('#barTime');
const bar=$('#bar'), barNow=$('#barNow'), win=$('.win'), mono=$('.monument');
const secs=$$('[data-sec]');
const DICT_FR={};
let curSec='top', touched=false, lastKey='', lastInfo='';
const nowMin=P0.hour*60+P0.minute;
const nightDefault=!(nowMin>=SUN_MIN&&nowMin<=SUN_MAX);
let heroTarget=nightDefault?NOON_MIN:nowMin;
let sunCur=heroTarget;
function applySun(min){
  const ms=localMidnightMs+min*60000;
  const {el,az}=sunAt(ms);
  const ar=clamp(az-Math.PI,-78*R,78*R);
  const sin=Math.max(0,Math.sin(el));
  const sx=clamp(Math.tan(ar),-2.2,2.2);
  const sy=clamp(Math.tan(Math.max(el,1*R))/Math.cos(ar),0,2.6);
  const a=el>2*R?(.10+.24*Math.pow(sin,.6))*Math.pow(Math.cos(ar),.5):0;
  const blur=6+14*(1-sin);
  const sw=Math.round(220+280*Math.pow(sin,.7));
  const key=sx.toFixed(3)+'|'+sy.toFixed(3)+'|'+a.toFixed(3)+'|'+blur.toFixed(1)+'|'+sw;
  if(key!==lastKey){
    lastKey=key;
    for(const n of [stage,bar]){
      n.style.setProperty('--sx',sx.toFixed(3));
      n.style.setProperty('--sy',sy.toFixed(3));
      n.style.setProperty('--a',a.toFixed(3));
      n.style.setProperty('--blur',blur.toFixed(1)+'px');
    }
    stage.style.setProperty('--sunw',sw);
  }
  const t=hm(min);
  if(sunT.textContent!==t){sunT.textContent=t;barTime.textContent=t}
  const dir=COMP[lang][Math.round(az/(Math.PI/8))%16];
  const date=new Intl.DateTimeFormat(lang==='en'?'en-GB':'fr-FR',{day:'numeric',month:'long',timeZone:'Europe/Paris'}).format(new Date(localMidnightMs+12*3600000));
  const deg=Math.round(el/R);
  const night=(nightDefault&&!touched&&scrollY<innerHeight*.45)?(lang==='en'?'It is night in Nice. Here is noon. ':'Il fait nuit à Nice. Voici midi. '):'';
  const info=night+(lang==='en'
    ?`Sun at ${deg}°, ${dir}. The shadow is calculated for Nice, ${date}.`
    :`Soleil à ${deg}°, ${dir}. L\\u2019ombre est calculée pour Nice, le ${date}.`);
  if(info!==lastInfo){lastInfo=info;sunInfo.textContent=info}
}
sun.min=SUN_MIN; sun.max=SUN_MAX; sun.value=heroTarget; applySun(sunCur);

/* The window opens with inertia (JS lerp on --open). Without JS, the CSS scroll timeline on .stage does it. */
const drive=!reduce;
if(drive) stage.style.animation='none';
let openCur=0, raf=0, scrub=true;
function wanted(){
  const s0=innerHeight*.45;
  if(reduce||scrollY<s0) return heroTarget;
  const max=Math.max(s0+1,document.documentElement.scrollHeight-innerHeight);
  return SUN_MIN+(SUN_MAX-SUN_MIN)*clamp((scrollY-s0)/(max-s0));
}
function frame(){
  raf=0; let more=false;
  if(drive){
    const t=clamp(scrollY/(innerHeight*2));
    const d=t-openCur;
    openCur=Math.abs(d)<.0006?t:openCur+d*.075;
    stage.style.setProperty('--open',openCur.toFixed(4));
    if(openCur!==t) more=true;
  }
  const w=wanted(), d2=w-sunCur;
  sunCur=Math.abs(d2)<.15?w:sunCur+d2*.07;
  if(scrollY<innerHeight*.45&&document.activeElement!==sun) sun.value=Math.round(sunCur);
  applySun(sunCur);
  if(sunCur!==w) more=true;
  updateBar();
  if(more) raf=requestAnimationFrame(frame);
}
function kick(){ if(!raf) raf=requestAnimationFrame(frame) }
sun.addEventListener('input',()=>{heroTarget=sunCur=+sun.value;scrub=false;touched=true;applySun(sunCur);kick()});
const fine=matchMedia('(pointer:fine)');
window.addEventListener('pointermove',e=>{
  if(reduce||!fine.matches||!scrub||document.activeElement===sun) return;
  if(scrollY>innerHeight*.45) return;
  heroTarget=SUN_MIN+(SUN_MAX-SUN_MIN)*clamp(e.clientX/innerWidth);
  touched=true; kick();
},{passive:true});

/* ---------- Bar: tone from what is under it, section label, away over the footer ---------- */
function updateBar(){
  const mid=innerHeight*.5, under=innerHeight-48;
  let found=secs[0], foundUnder=secs[0];
  for(const s of secs){const r=s.getBoundingClientRect(); if(r.top<=mid&&r.bottom>mid) found=s; if(r.top<=under&&r.bottom>under) foundUnder=s;}
  const key=found.dataset.sec;
  let tone=foundUnder.dataset.tone;
  if(foundUnder.dataset.sec==='top'){const r=win.getBoundingClientRect(),cx=innerWidth/2; tone=(cx>=r.left&&cx<=r.right&&under>=r.top&&under<=r.bottom)?'blue':'paper'}
  bar.dataset.tone=tone==='blue'?'paper':'klein';
  const away=mono.getBoundingClientRect().top<innerHeight-24;
  bar.classList.toggle('away',away); bar.inert=away||menu.matches(':popover-open');
  if(key!==curSec){curSec=key;barNow.dataset.i='sec.'+key;barNow.innerHTML=lang==='en'?EN['sec.'+key]:DICT_FR['sec.'+key]}
}
function onScroll(){kick()}
addEventListener('scroll',kick,{passive:true}); addEventListener('resize',kick);

'''
s=s[:a]+SUN+s[b:]

# ---------- JS: words splitter, chart index ----------
rep("/* ---------- Language ---------- */","""/* ---------- Scroll-linked words (only where view timelines exist) ---------- */
const esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function splitWords(el){
  if(reduce||!CSS.supports('animation-timeline','view()')) return;
  el.innerHTML=el.textContent.split(/(\\s+)/).map(t=>/^\\s+$/.test(t)||!t?t:`<span class="w">${esc(t)}</span>`).join('');
}

/* ---------- Language ---------- */""")
rep("  $$('[data-ia]').forEach(el=>{","  $$('.words').forEach(splitWords);\n  $$('[data-ia]').forEach(el=>{")
rep("""s+=`<g class="cb${i===cm?' now':''}" data-i="${i}"><rect""","""s+=`<g class="cb${i===cm?' now':''}" data-i="${i}" style="--i:${i}"><rect""")
open(p,'w',encoding='utf-8').write(s)
print('patched',len(s))
