import re,sys,math
p='/home/claude/v2/src.html'
s=open(p,encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a)
    if n!=count: print('MISMATCH',n,'(want',count,') for',a[:100]); sys.exit(1)
    s=s.replace(a,b)
def sub(pat,repl,count=1,flags=re.S):
    global s
    n=len(re.findall(pat,s,flags))
    if n!=count: print('SUBMISS',n,'for',pat[:100]); sys.exit(1)
    s=re.sub(pat,lambda m:repl,s,flags=flags)

# ============ 1. slower rhythm ============
rep("--dur-1:300ms; --dur-3:650ms; --dur-4:1300ms; --dur-5:2000ms;","--dur-1:450ms; --dur-3:950ms; --dur-4:1500ms; --dur-5:2400ms;")
rep(".hero-copy h1 .ln{animation:ln 1600ms var(--ease-enter) both;animation-delay:calc(200ms + var(--i,0) * 170ms)}",".hero-copy h1 .ln{animation:ln 2400ms var(--ease-enter) both;animation-delay:calc(300ms + var(--i,0) * 300ms)}")
rep(".sunui,.hint{animation:fadeIn 1600ms ease both;animation-delay:1300ms}",".sunui,.hint{animation:fadeIn 2400ms ease both;animation-delay:1800ms}")
rep("transition-delay:calc(300ms + (sibling-index() - 1) * 90ms)}","transition-delay:calc(300ms + (sibling-index() - 1) * 110ms)}")
rep("#proj[open] .dlg-in>*{animation:itemIn 1500ms var(--spring) both;animation-delay:calc(450ms + (sibling-index() - 1) * 110ms)}",
    "#proj[open] .dlg-in>*{animation:itemIn 1900ms var(--spring) both;animation-delay:calc(600ms + (sibling-index() - 1) * 150ms)}\n  #proj[open] .dlg-in>h3{animation:itemIn 1900ms var(--spring) both,shutters 2600ms var(--ease-enter) 700ms both}")

# ============ 2. Lenis hooks in CSS ============
rep("@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}",
"""@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}
html.lenis,html.lenis body{height:auto}
html.lenis{scroll-behavior:auto!important}
.lenis.lenis-stopped{overflow:clip}
.lenis [data-lenis-prevent]{overscroll-behavior:contain}
[tabindex="-1"]:focus{outline:none}""")

# ============ 3. Button: an awning unrolls ============
sub(r"\.link\{display:inline-flex.*?\.link:hover\{background:var\(--klein\);color:var\(--paper\)\}",
""".link{--aw1:var(--klein);--aw2:color-mix(in oklab,var(--klein) 80%,var(--chaux));--aw-ink:var(--paper);
  position:relative;isolation:isolate;overflow:hidden;display:inline-flex;align-items:center;min-height:44px;padding:0 22px;border:1px solid currentColor;text-decoration:none;font-weight:550;font-size:var(--fs-small);
  transition:color var(--dur-3) var(--ease-enter) 160ms}
.blue .link{--aw1:var(--paper);--aw2:color-mix(in oklab,var(--paper) 84%,var(--klein));--aw-ink:var(--klein)}
/* store banne: striped, with a scalloped hem, unrolled from the top */
.link::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:0;height:calc(100% + 10px);
  background:repeating-linear-gradient(90deg,var(--aw1) 0 14px,var(--aw2) 14px 28px);
  -webkit-mask:linear-gradient(#000 0 0) 0 0/100% calc(100% - 10px) no-repeat,radial-gradient(circle 7px at 50% 0,#000 97%,#0000) 0 100%/14px 10px repeat-x;
  mask:linear-gradient(#000 0 0) 0 0/100% calc(100% - 10px) no-repeat,radial-gradient(circle 7px at 50% 0,#000 97%,#0000) 0 100%/14px 10px repeat-x;
  translate:0 -104%;transition:translate var(--dur-4) var(--ease-enter)}
.link:hover,.link:focus-visible{color:var(--aw-ink)}
.link:hover::before,.link:focus-visible::before{translate:0 0}""")

# ============ 4. Projects become plates with two layers of parallax ============
sub(r"/\* Projects \*/.*?(?=/\* Project dialog \*/)",
"""/* Projects: plates, each with a back and a front layer that drift at different speeds */
.projects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(48px,8vw,120px) clamp(16px,2.4vw,40px);align-items:start}
.projects li:nth-child(even){margin-top:clamp(56px,14vh,176px)}
.row{position:relative;display:block;width:100%;text-align:left}
.plate{position:relative;display:block;aspect-ratio:5/4;overflow:clip;background:var(--klein);color:var(--chaux)}
.plate[data-t="wash"]{background:var(--wash);color:var(--klein)}
.plate svg{position:absolute;left:0;top:-12%;width:100%;height:124%;display:block;overflow:visible}
.plate::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(105deg,#0000 36%,rgb(241 243 242 / .22) 50%,#0000 64%);translate:-100% 0;transition:translate 2000ms var(--ease-enter)}
.plate[data-t="wash"]::after{background:linear-gradient(105deg,#0000 36%,rgb(0 47 167 / .10) 50%,#0000 64%)}
.row:hover .plate::after,.row:focus-visible .plate::after{translate:100% 0}
.cap{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:2px 18px;align-items:baseline;padding-top:16px}
.r-year{font-size:var(--fs-small);color:var(--soft)}
.r-title{justify-self:start;font-size:clamp(1.5rem,2.6vw,2.5rem);font-weight:350;letter-spacing:-.03em;line-height:1.1;padding-bottom:3px;background:linear-gradient(currentColor,currentColor) 0 100%/0 1px no-repeat;transition:background-size var(--dur-4) var(--ease-enter)}
.r-type{grid-column:2/-1;font-size:var(--fs-small);color:var(--soft)}
.r-place{font-size:var(--fs-small)}
.row:hover .r-title,.row:focus-visible .r-title{background-size:100% 1px}
.row:focus-visible{outline-offset:8px}

""")

# ============ 5. Motion additions ============
motion = r'''
/* Slower, layered motion. Everything below is an enhancement: with no support or reduced motion, all text and images are simply there. */
@property --shut{syntax:"<number>";inherits:false;initial-value:1.05}
@keyframes shutters{from{--shut:0}to{--shut:1.05}}
@keyframes swell{from{font-weight:130}to{font-weight:300}}
@keyframes plateB{from{translate:0 -5%}to{translate:0 5%}}
@keyframes plateF{from{translate:0 9%}to{translate:0 -9%}}
@keyframes csP1{from{translate:0 -90px}to{translate:0 90px}}
@keyframes csP2{from{translate:0 70px}to{translate:0 -70px}}
/* persiennes: the text opens like shutters; at the end the mask is solid, so nothing is left behind */
.shut,#proj .dlg-in>h3{--slat:.3em;-webkit-mask-image:repeating-linear-gradient(180deg,#000 0,#000 calc(var(--shut) * var(--slat)),#0000 calc(var(--shut) * var(--slat)),#0000 var(--slat));mask-image:repeating-linear-gradient(180deg,#000 0,#000 calc(var(--shut) * var(--slat)),#0000 calc(var(--shut) * var(--slat)),#0000 var(--slat))}
@media (prefers-reduced-motion:no-preference){
  .hero-copy h1 .ln{transform:translateY(calc(var(--open) * (var(--i) + 1) * -46px))}
  .hero-copy p{translate:0 calc(var(--open) * -18px)}
  .win .cs b:nth-child(1){translate:0 calc(var(--open) * -120px)}
  .win .cs b:nth-child(2){translate:0 calc(var(--open) * 80px)}
}
@supports (animation-timeline:view()){
  @media (prefers-reduced-motion:no-preference){
    .shut{animation:shutters linear both;animation-timeline:view();animation-range:entry 8% entry 80%}
    .shut.par{animation:par linear both,shutters linear both;animation-timeline:--v,view();animation-range:cover 0% cover 100%,entry 8% entry 80%}
    .plate .b{animation:plateB linear both;animation-timeline:view();animation-range:cover 0% cover 100%}
    .plate .f{animation:plateF linear both;animation-timeline:view();animation-range:cover 0% cover 100%}
    .sec .cs b:nth-child(1){animation:csA 90s linear infinite,csP1 linear both;animation-timeline:auto,--v;animation-range:normal,cover 0% cover 100%}
    .sec .cs b:nth-child(2){animation:csB 64s linear infinite,csP2 linear both;animation-timeline:auto,--v;animation-range:normal,cover 0% cover 100%}
  }
}
@supports (animation-timeline:view()) and (width:calc(sibling-index() * 1px)){
  @media (prefers-reduced-motion:no-preference){
    .entry-w .c{display:inline-block;animation:swell linear both;animation-timeline:view();animation-range:entry calc(sibling-index() * 6%) entry calc(58% + sibling-index() * 6%)}
  }
}
'''
rep("\n/* Light in water: caustics drift inside the blue, brightness follows the real sun */", motion+"\n/* Light in water: caustics drift inside the blue, brightness follows the real sun */")
# caustics: wider boxes so parallax never uncovers an edge; sharper lines
rep(".cs b:nth-child(1){left:-460px;top:-460px;right:0;bottom:0;background-size:460px;opacity:.13;animation:csA 90s linear infinite}",
    ".cs b:nth-child(1){left:-620px;top:-620px;right:-160px;bottom:-160px;background-size:460px;opacity:.2;animation:csA 90s linear infinite}")
rep(".cs b:nth-child(2){left:-300px;top:0;right:0;bottom:-300px;background-size:300px;opacity:.09;animation:csB 64s linear infinite}",
    ".cs b:nth-child(2){left:-460px;top:-160px;right:-160px;bottom:-460px;background-size:300px;opacity:.14;animation:csB 64s linear infinite}")
rep("const v=clamp(Math.pow(Math.abs(cc),8))*255","const v=clamp(Math.pow(Math.abs(cc),12)*1.15)*255")

# VT: the plate fades while it grows into the blue
rep("::view-transition-old(proj),::view-transition-new(proj){height:100%;animation:none;mix-blend-mode:normal}\n::view-transition-old(proj){opacity:0}",
    "::view-transition-old(proj),::view-transition-new(proj){height:100%;object-fit:cover;animation:none;mix-blend-mode:normal}\n::view-transition-old(proj){animation:vtOut 1100ms ease-in both}\n@keyframes vtOut{to{opacity:0}}")

# responsive
rep("  .row{grid-template-columns:4.5rem minmax(0,1fr) 7rem}\n  .r-type{display:none}\n","  .projects{grid-template-columns:1fr}\n  .projects li:nth-child(even){margin-top:0}\n")
rep("  .row{grid-template-columns:3.6rem minmax(0,1fr) 5.5rem}\n","")

# ============ 6. HTML ============
def plate0():
    hrs=[160,170,215,225,265,305,350,315,240,185,150,140]; r=''
    for k,h in enumerate(hrs):
        a=math.radians(-90+30*k); L=34+(h-140)/210*108; r0=42
        r+=f'<line x1="{250+r0*math.cos(a):.1f}" y1="{200+r0*math.sin(a):.1f}" x2="{250+(r0+L)*math.cos(a):.1f}" y2="{200+(r0+L)*math.sin(a):.1f}"/>'
    b='<g fill="none" stroke="currentColor" stroke-width="1" opacity=".3"><circle cx="250" cy="200" r="100"/><circle cx="250" cy="200" r="160"/><circle cx="250" cy="200" r="230"/></g>'
    f=f'<g stroke="currentColor" stroke-width="5" stroke-linecap="round">{r}</g><circle cx="250" cy="200" r="22" fill="currentColor"/>'
    return b,f
def plate1():
    b='<g stroke="currentColor" fill="none"><path d="M-40 226H540" stroke-width="1" opacity=".5"/>'+''.join(f'<path d="M-40 {226+14*i}H540" stroke-width="1" opacity="{.2-.03*i:.2f}"/>' for i in range(1,6))+'</g>'
    sc=3.7; hulls=[7,24,46,70,111]; ys=[44,78,112,146,180]
    bars=''.join(f'<rect x="44" y="{y}" width="{h*sc:.0f}" height="12" rx="6"/>' for h,y in zip(hulls,ys))
    ticks=''.join(f'<path d="M{44+10*sc*i:.1f} 300v{14 if i%5==0 else 8}" />' for i in range(0,12))
    f=f'<g fill="currentColor">{bars}</g><g stroke="currentColor" stroke-width="1.5" fill="none"><path d="M44 300H{44+110*sc:.0f}"/>{ticks}</g>'
    return b,f
def plate2():
    b='<rect x="120" y="36" width="260" height="330" fill="none" stroke="currentColor" stroke-width="1" opacity=".22"/>'
    slats=lambda x0:''.join(f'<path d="M{x0} {y}h92"/>' for y in range(76,336,13))
    f=('<rect x="204" y="56" width="92" height="290" fill="currentColor"/><path d="M204 214H296" stroke="var(--wash)" stroke-width="2"/><circle cx="250" cy="170" r="14" fill="var(--wash)"/>'
       '<rect x="106" y="56" width="92" height="290" fill="currentColor"/><rect x="302" y="56" width="92" height="290" fill="currentColor"/>'
       f'<g stroke="var(--wash)" stroke-width="2.4">{slats(106)}{slats(302)}</g>')
    return b,f
def plate3():
    perf=lambda y:''.join(f'<rect x="{10+20*i}" y="{y}" width="10" height="10"/>' for i in range(25))
    b=f'<g fill="currentColor" opacity=".3">{perf(24)}{perf(366)}</g>'
    fr=''
    for i in range(18):
        c,rw=i%6,i//6; op=.07+.93*(i/17)**1.2
        fr+=f'<rect x="{46+70*c}" y="{122+56*rw}" width="58" height="44" fill-opacity="{op:.2f}"/>'
    f=f'<g fill="currentColor">{fr}</g>'
    return b,f
def plate4():
    w=[34,52,24,60,38,46,28,56,32,50,26,54]; t=sum(w); k=540/t; x=-20; st=''
    for i,wi in enumerate(w):
        ww=wi*k; op=.12+.88*(i/(len(w)-1))
        st+=f'<path d="M{x:.1f} -90H{x+ww:.1f}V268A{ww/2:.1f} {ww/2:.1f} 0 0 1 {x:.1f} 268Z" fill-opacity="{op:.2f}"/>'
        x+=ww
    b='<g stroke="currentColor" fill="none" opacity=".28"><path d="M-40 338H540" stroke-width="1"/><path d="M-40 352H540" stroke-width="1"/></g>'
    f=f'<g fill="currentColor">{st}</g>'
    return b,f
PL=[plate0(),plate1(),plate2(),plate3(),plate4()]
META=[('2026','Soleil 2 725','Installation de données','Nice'),('2026','Port Hercule à l’échelle','Site interactif','Monaco'),('2025','Villa Chaux','Identité et site','Cap Ferrat'),('2025','La quinzaine claire','Identité animée','Cannes'),('2024','Chromatique','Atlas','Nice')]
lis=''
for i,((b,f),(y,t,ty,pl)) in enumerate(zip(PL,META)):
    wash=' data-t="wash"' if i==2 else ''
    lis+=(f'\n      <li><button class="row" type="button" data-p="{i}"><span class="plate row-bg"{wash} aria-hidden="true">'
          f'<svg class="b" viewBox="0 0 500 400" preserveAspectRatio="xMidYMid meet">{b}</svg><svg class="f" viewBox="0 0 500 400" preserveAspectRatio="xMidYMid meet">{f}</svg></span>'
          f'<span class="cap"><span class="r-year">{y}</span><span class="r-title">{t}</span><span class="r-place">{pl}</span><span class="r-type">{ty}</span></span></button></li>')
sub(r'<ol class="projects" id="projects">.*?</ol>','<ol class="projects" id="projects">'+lis+'\n    </ol>')

rep('<nav id="menu" popover aria-label="Menu" data-ia="menu">','<nav id="menu" popover aria-label="Menu" data-ia="menu" data-lenis-prevent>')
rep('<dialog id="proj" aria-labelledby="pTitle">','<dialog id="proj" aria-labelledby="pTitle" data-lenis-prevent>')
rep('<h2 class="display" id="projT" data-i="projT">','<h2 class="display shut" id="projT" data-i="projT">')
rep('<h2 class="display" id="svcT" data-i="svcT">','<h2 class="display shut" id="svcT" data-i="svcT">')
rep('<h2 class="display" id="mthT" data-i="mthT">','<h2 class="display shut" id="mthT" data-i="mthT">')
rep('<h2 class="display" id="ctT" data-i="ctT">','<h2 class="display shut" id="ctT" data-i="ctT">')
rep('<h2 class="display par" id="stuT"','<h2 class="display par shut" id="stuT"')
rep('<h2 class="display par" id="lumT"','<h2 class="display par shut" id="lumT"')
rep('<span class="nm par" style="--a:40px">','<span class="nm par shut" style="--a:40px">')
rep('<span class="nm par" style="--a:-26px">','<span class="nm par shut" style="--a:-26px">')
rep('<section aria-labelledby="mthT">','<section class="par" style="--a:30px" aria-labelledby="mthT">')
rep('<p class="entry-w" aria-hidden="true">moyo</p>','<p class="entry-w par" style="--a:64px" aria-hidden="true"><span class="c">m</span><span class="c">o</span><span class="c">y</span><span class="c">o</span></p>')
rep('<script>\n(() => {\n\'use strict\';','<script>__LENIS__</script>\n<script>\n(() => {\n\'use strict\';')

# ============ 7. JS ============
rep("let curSec='top', touched=false, lastKey='', lastInfo='', caus=[], lastLum=.6;","let curSec='top', touched=false, lastKey='', lastInfo='', caus=[], lastLum=.6, lenis=null;")
rep("openCur=Math.abs(d)<.0006?t:openCur+d*.075;","openCur=Math.abs(d)<.0006?t:openCur+d*(lenis?.2:.075);")
rep("  $('#main').inert=open; bar.inert=open; if(!open) setTimeout(updateBar,0);","  $('#main').inert=open; bar.inert=open; if(!open) setTimeout(updateBar,0);\n  if(lenis){open?lenis.stop():lenis.start()}")
rep("const show=()=>{fillProject(i);proj.showModal();","const show=()=>{lenis?.stop();fillProject(i);proj.showModal();")
rep("const done=()=>{proj.close();root.classList.remove('is-dialog');row.classList.remove('live');row.focus({preventScroll:true})};","const done=()=>{proj.close();root.classList.remove('is-dialog');row.classList.remove('live');lenis?.start();row.focus({preventScroll:true})};")
rep("vt.finished.finally(()=>{bg.style.viewTransitionName='';row.classList.remove('live');row.focus({preventScroll:true})});","vt.finished.finally(()=>{bg.style.viewTransitionName='';row.classList.remove('live');lenis?.start();row.focus({preventScroll:true})});")
rep("document.querySelector('meta[name=description]').content=l==='en'?'Moyo, a design and development studio. Websites, identities and data visualisations, drawn with light.':'Studio de design et de développement à Nice. Un site qui s’ouvre comme une fenêtre sur le bleu, éclairé par le vrai soleil de Nice.';",
    "document.querySelector('meta[name=description]').content=l==='en'?'Moyo, a design and development studio. Websites, identities and data visualisations, drawn with light.':'Moyo, studio de design et de développement. Sites, identités et visualisations de données, dessinés avec la lumière.';")

lenis_js = r'''/* ---------- Soft scroll: Lenis (MIT), desktop wheel only. Touch stays native. Absent with reduced motion. ---------- */
function initLenis(){
  if(reduce||typeof Lenis==='undefined') return;
  lenis=new Lenis({lerp:.065,wheelMultiplier:.85,smoothWheel:true,autoRaf:true});
  lenis.on('scroll',kick);
  $$('a[href^="#"]:not(.skip)').forEach(a=>a.addEventListener('click',e=>{
    const id=a.getAttribute('href').slice(1), el=id?document.getElementById(id):null;
    if(!el) return;
    e.preventDefault();
    const go=()=>{
      const y=id==='top'?0:Math.round(el.getBoundingClientRect().top+scrollY);
      lenis.scrollTo(y,{duration:clamp(1.4+Math.abs(y-scrollY)/2600,1.8,3.6),easing:t=>1-Math.pow(1-t,4),onComplete:()=>{
        el.setAttribute('tabindex','-1'); el.focus({preventScroll:true});
        try{history.replaceState(null,'','#'+id)}catch(_){}
      }});
    };
    if(menu.matches(':popover-open')){menu.hidePopover();setTimeout(go,80)} else go();
  }));
}

/* ---------- Boot ---------- */'''
rep("/* ---------- Boot ---------- */",lenis_js)
rep("applyLang(lang);\nonScroll();\n","applyLang(lang);\ninitLenis();\nonScroll();\n")
open(p,'w',encoding='utf-8').write(s)
print('patched',len(s))
