import re,sys
p='/home/claude/v2/src.html'
s=open(p,encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a)
    if n!=count: print('MISMATCH',n,'(want',count,') for',a[:110]); sys.exit(1)
    s=s.replace(a,b)

SUN='<svg class="mq-s" aria-hidden="true"><use href="#sunI"/></svg>'
def group(items):  # items: list of (html attrs, text)
    return ''.join(f'<span class="mq-i"{a}>{t}</span>{SUN}' for a,t in items)
def band(cls,items,speed,flip=1,mid=''):
    g=group(items)
    return f'<div class="mq {cls}" aria-hidden="true" data-speed="{speed}" data-flip="{flip}"{mid}><div class="mq-track"><div class="mq-g">{g}</div><div class="mq-g">{g}</div></div></div>'

# ---------- HTML ----------
head_static=[('','Lever 07:42'),('','Coucher 17:21'),('','2 725 h de soleil par an')]
awn=('<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><symbol id="sunI" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/></g></symbol></svg>\n'
     '<div class="spot" id="spot" aria-hidden="true"></div>\n'
     '<header class="awn" id="awn" data-tone="klein">\n'
     '  <a class="awn-logo" href="#top" aria-label="Moyo">moyo</a>\n'
     '  <div class="mq mq--sm awn-mq" id="awnMq" aria-hidden="true" data-speed="42" data-flip="1"><div class="mq-track"><div class="mq-g" id="awnG">'+group(head_static)+'</div><div class="mq-g">'+group(head_static)+'</div></div></div>\n'
     '  <button class="awn-pause" id="pauseBtn" type="button" aria-pressed="false" data-i="pause">Pause</button>\n'
     '</header>')
rep('<div id="tip" role="status"></div>','<div id="tip" role="status"></div>\n'+awn)
rep('    <a class="wordmark" href="#top" aria-label="Moyo">moyo</a>\n','')

rep('<section class="sec blue intro" id="approche"','<section class="sec blue intro stk" id="approche"')
rep('<section class="sec" id="projets"','<section class="sec cover" id="projets"')
rep('<section class="sec" id="services"','<section class="sec stk" id="services"')
rep('<section class="sec blue studio" id="studio"','<section class="sec blue studio stk cover" id="studio"')
rep('<section class="sec" id="lumiere"','<section class="sec stk cover" id="lumiere"')
rep('<section class="sec blue contact" id="contact"','<section class="sec blue contact cover" id="contact"')

proj_band=band('mq--lg mq--top',[(f' data-pt="{i}"',t) for i,t in enumerate(['Soleil 2 725','Port Hercule à l’échelle','Villa Chaux','La quinzaine claire','Chromatique'])],64,-1)
rep('aria-labelledby="projT">\n  <div class="wrap">','aria-labelledby="projT">\n  '+proj_band+'\n  <div class="wrap">')
meth_band=band('mq--lg mq--bot',[(f' data-i="m{i}t"',t) for i,t in zip((1,2,3,4),('Relever','Choisir','Dessiner','Construire'))],58,1)
rep('  </div>\n</section>\n\n<!-- Studio -->','  </div>\n  '+meth_band+'\n</section>\n\n<!-- Studio -->')
foot_band=band('mq--lg mq--foot',[('',"moyo"),(' data-i="mwHeart"','cœur'),(' data-i="mwLife"','vie'),(' data-i="mwCourage"','courage'),(' data-i="mwLight"','lumière')],72,-1)
rep('  <div class="mono-wrap" aria-hidden="true"><div class="monument">moyo</div></div>','  '+foot_band+'\n  <div class="mono-wrap" aria-hidden="true"><div class="monument" data-px=".012">moyo</div></div>')
rep('      <a href="#top" data-i="top">Retour en haut</a>\n','      <a href="#top" data-i="top">Retour en haut</a>\n      <span>© 2026 moyo</span>\n')

for hid,k in (('projT','.028'),('svcT','.028'),('mthT','.028'),('ctT','.028')):
    rep(f'id="{hid}" data-i="{hid}">',f'id="{hid}" data-px="{k}" data-i="{hid}">')
rep('id="stuT" style="--a:44px" data-i="stuT">','id="stuT" style="--a:44px" data-px=".028" data-i="stuT">')
rep('id="lumT" style="--a:36px" data-i="lumT">','id="lumT" style="--a:36px" data-px=".028" data-i="lumT">')
rep('<span class="nm par shut" style="--a:40px">','<span class="nm par shut" data-px=".014" style="--a:40px">')
rep('<span class="nm par shut" style="--a:-26px">','<span class="nm par shut" data-px=".014" style="--a:-26px">')
rep('<span class="r-title">','<span class="r-title" data-px=".02">',5)
rep('<a class="mail" id="mail" href=','<a class="mail" id="mail" data-px=".016" href=')
rep('<p class="entry-w par" style="--a:64px" aria-hidden="true">','<p class="entry-w par" style="--a:64px" data-px=".014" aria-hidden="true">')

# ---------- CSS ----------
rep(".sec{position:relative;padding:clamp(88px,14vh,184px) var(--m)}",".sec{position:relative;padding:clamp(88px,14vh,184px) var(--m);background:var(--chaux)}")
rep(".mail{display:inline-block;",".mail{transition:background var(--dur-3) var(--ease-enter),color var(--dur-3) var(--ease-enter);display:inline-block;")
css=r'''
/* ===== v6: header awning, banners, sections that slide over each other, reactions to the pointer ===== */
@property --a1{syntax:"<color>";inherits:true;initial-value:#002FA7}
@property --a2{syntax:"<color>";inherits:true;initial-value:#2F55BF}
@property --ink{syntax:"<color>";inherits:true;initial-value:#F1F3F2}
@property --p{syntax:"<number>";inherits:false;initial-value:0}

/* Header: a striped awning with a scalloped hem. It rolls up when you scroll down and comes back when you scroll up or reach the top edge. */
.awn{--a1:var(--klein);--a2:color-mix(in oklab,var(--klein) 80%,var(--chaux));--ink:var(--paper);
  position:fixed;z-index:70;left:0;right:0;top:0;height:46px;display:flex;align-items:center;gap:clamp(12px,2vw,28px);padding:0 var(--m);
  background-color:var(--a1);color:var(--ink);
  filter:drop-shadow(calc(var(--sx,.22) * 5px) calc(var(--sy,.9) * 5px) 5px rgb(0 8 60 / calc(var(--a,.26) * .7)));
  transition:translate var(--dur-4) var(--ease-enter),--a1 var(--dur-3) var(--ease-enter),--a2 var(--dur-3) var(--ease-enter),--ink var(--dur-3) var(--ease-enter)}
.awn[data-tone="paper"]{--a1:var(--paper);--a2:color-mix(in oklab,var(--paper) 84%,var(--klein));--ink:var(--klein)}
.awn.up{translate:0 calc(-100% - 16px)}
.awn:focus-within{translate:0 0}
.awn::before{content:"";position:absolute;z-index:-1;left:0;right:0;top:0;height:calc(100% + 10px);
  background:repeating-linear-gradient(90deg,var(--a1) 0 14px,var(--a2) 14px 28px);background-position-x:var(--ax,0px);
  -webkit-mask:linear-gradient(#000 0 0) 0 0/100% calc(100% - 10px) no-repeat,radial-gradient(circle 7px at 50% 0,#000 97%,#0000) 0 100%/14px 10px repeat-x;
  mask:linear-gradient(#000 0 0) 0 0/100% calc(100% - 10px) no-repeat,radial-gradient(circle 7px at 50% 0,#000 97%,#0000) 0 100%/14px 10px repeat-x}
.awn :focus-visible{outline-color:var(--ink);outline-offset:-4px}
.awn-logo{display:flex;align-items:center;min-height:44px;padding-right:6px;font-size:1.125rem;font-weight:600;letter-spacing:-.02em;text-decoration:none;flex:none}
.awn-mq{flex:1;min-width:0;-webkit-mask-image:linear-gradient(90deg,#0000,#000 7%,#000 93%,#0000);mask-image:linear-gradient(90deg,#0000,#000 7%,#000 93%,#0000)}
.awn-pause{flex:none;display:flex;align-items:center;gap:8px;min-height:44px;padding:0 4px 0 10px;font-size:var(--fs-small);font-weight:550}
.awn-pause::before{content:"";width:9px;height:9px;border:1.5px solid currentColor}
.awn-pause[aria-pressed="true"]::before{background:currentColor}

/* Banners: they follow the scroll (faster, and in the direction you scroll) and slow down under the pointer */
.mq{--mqc:var(--klein);overflow:clip;white-space:nowrap;user-select:none;-webkit-user-select:none}
.blue .mq{--mqc:var(--paper)}
.mq-track{display:flex;width:max-content;animation:mq var(--mq-t,80s) linear infinite}
.mq.js .mq-track{animation:none;will-change:transform}
html.paused .mq-track{animation-play-state:paused}
@keyframes mq{to{transform:translateX(-50%)}}
.mq-g{display:flex;flex:none;align-items:center}
.mq-i{display:inline-block;padding:0 .42em;-webkit-text-stroke:0 var(--mqc);transition:color var(--dur-3) var(--ease-enter),-webkit-text-stroke-width var(--dur-3) var(--ease-enter)}
.mq-s{flex:none;width:.4em;height:.4em;opacity:.92}
.mq--lg{font-size:clamp(2.75rem,8.4vw,8.5rem);font-weight:300;letter-spacing:-.045em;line-height:1.16;padding:.08em 0}
.mq--lg .mq-i:hover{color:transparent;-webkit-text-stroke-width:1.6px}
.mq--sm{font-size:var(--fs-small);font-weight:500}
.mq--sm .mq-i{padding:0 .9em}
.mq--sm .mq-s{width:1.15em;height:1.15em}
.mq--top{margin:calc(-1 * clamp(88px,14vh,184px)) calc(-1 * var(--m)) clamp(48px,8vh,96px);border-bottom:1px solid var(--line)}
.mq--bot{margin:clamp(56px,10vh,120px) calc(-1 * var(--m)) calc(-1 * clamp(88px,14vh,184px));border-top:1px solid var(--line)}
.mq--foot{margin:0 calc(-1 * var(--m));border-block:1px solid var(--paper-line)}
@media (prefers-reduced-motion:reduce){.mq-track{animation:none}.awn-pause{display:none}.awn{transition:none}}

/* Pointer reactions: letters thicken near the pointer, plates tilt, a soft light follows */
.ch,.entry-w .c{-webkit-text-stroke:calc(var(--p) * var(--k,.03) * 1em) currentColor;transition:--p 1.6s var(--ease-enter)}
.pw{white-space:nowrap}
.mail .pw{white-space:normal}
.spot{position:fixed;left:0;top:0;width:640px;height:640px;margin:-320px 0 0 -320px;border-radius:50%;pointer-events:none;z-index:150;opacity:0;transition:opacity 1.6s ease;
  background:radial-gradient(closest-side,rgb(255 255 255 / .55),rgb(255 255 255 / .2) 55%,#0000);mix-blend-mode:soft-light;will-change:transform}
html.pm .spot{opacity:1}
@media (hover:none),(prefers-reduced-motion:reduce){.spot{display:none}}
.plate{transform:perspective(1100px) rotateX(calc(var(--ty,0) * -3deg)) rotateY(calc(var(--tx,0) * 4deg))}
.plate .b{transform:translate(calc(var(--tx,0) * -7px),calc(var(--ty,0) * -7px))}
.plate .f{transform:translate(calc(var(--tx,0) * 13px),calc(var(--ty,0) * 13px))}
.list li{transition:background var(--dur-3) var(--ease-enter),box-shadow var(--dur-3) var(--ease-enter)}
.list li:hover{background:var(--wash);box-shadow:-14px 0 0 var(--wash),14px 0 0 var(--wash)}
.beliefs li{transition:border-color var(--dur-3) var(--ease-enter)}
.beliefs li:hover{border-top-color:var(--paper)}
.names .nm{transition:opacity var(--dur-3) var(--ease-enter)}
.names:hover .nm{opacity:.38}
.names li:hover .nm{opacity:1}
details.tbl summary{transition:color var(--dur-3) var(--ease-enter)}
details.tbl summary:hover{color:var(--klein)}
.link:active,.awn-pause:active{opacity:.85}
.monument{text-shadow:calc(var(--sx,.22) * 22px) calc(var(--sy,.9) * 22px) 30px rgb(0 8 60 / calc(var(--a,.26) * 1.5))}

/* Sections slide over each other: the one below stays pinned, dims and steps back while the next one covers it */
@media (prefers-reduced-motion:no-preference){
  .stk{position:sticky;top:min(0px,calc(100svh - var(--h)))}
  .stk::after{content:"";position:absolute;inset:0;z-index:4;pointer-events:none;background:rgb(0 8 40);opacity:calc(var(--cov,0) * .5)}
  .stk>.wrap{transform-origin:50% 0;transform:translateY(calc(var(--cov,0) * -5svh)) scale(calc(1 - var(--cov,0) * .05))}
  .cover{box-shadow:0 -30px 60px -24px rgb(0 8 60 / .3)}
}
'''
rep("\n/* Responsive */",css+"\n/* Responsive */")
rep("  .stage{--wl:12vw;","  .stage{--wl:12vw;") if False else None

# ---------- JS ----------
rep("const bar=$('#bar'), barNow=$('#barNow'), win=$('.win'), mono=$('.monument');","const bar=$('#bar'), barNow=$('#barNow'), win=$('.win'), mono=$('.monument'), hdr=$('#awn');")
rep("for(const n of [stage,bar]){","for(const n of [stage,bar,hdr,mono]){")
rep("  bar.dataset.tone=tone==='blue'?'paper':'klein';\n","""  bar.dataset.tone=tone==='blue'?'paper':'klein';
  { const hy=34; let hf=secs[0]; for(const s of secs){const r=s.getBoundingClientRect(); if(r.top<=hy&&r.bottom>hy) hf=s}
    let ht=hf.dataset.tone;
    if(hf.dataset.sec==='top'){const r=win.getBoundingClientRect(),cx=innerWidth/2; ht=(cx>=r.left&&cx<=r.right&&hy>=r.top&&hy<=r.bottom)?'blue':'paper'}
    hdr.dataset.tone=ht==='blue'?'paper':'klein'; }
  updateStack();
""")
rep("  $('#main').inert=open; bar.inert=open; if(!open) setTimeout(updateBar,0);","  $('#main').inert=open; bar.inert=open; hdr.inert=open; if(!open) setTimeout(updateBar,0);")
rep("'sample':'Sample project',","'pause':'Pause','mwHeart':'heart','mwLife':'life','mwCourage':'courage','mwLight':'light','sample':'Sample project',")
rep("  $$('.words').forEach(splitWords);\n","  $$('.words').forEach(splitWords);\n  $$('[data-pt]').forEach(e=>{e.textContent=PROJ[+e.dataset.pt][l].title});\n")
rep("applySun(sunCur); fillToday(); renderChart(); if(proj.open) fillProject(pIdx);","applySun(sunCur); fillToday(); renderChart(); fillAwn(); applyPx(); refreshMqs(); if(proj.open) fillProject(pIdx);")
rep("const y=id==='top'?0:Math.round(el.getBoundingClientRect().top+scrollY);","const y=id==='top'?0:flowTop(el);")

js=r'''/* ---------- v6: sections that slide over each other, banners, pointer reactions, the awning header ---------- */
const mainEl=$('#main');
function flowTop(el){let y=mainEl.getBoundingClientRect().top+scrollY;for(const c of mainEl.children){if(c===el)break;y+=c.offsetHeight}return Math.round(y)}
const STACK=[['approche','projets'],['services','studio'],['studio','lumiere'],['lumiere','contact']].map(([a,b])=>[document.getElementById(a),document.getElementById(b)]);
function updateStack(){
  if(reduce) return;
  for(const [a,b] of STACK){const p=clamp((innerHeight-b.getBoundingClientRect().top)/innerHeight);a.style.setProperty('--cov',p.toFixed(3))}
}
const mqs=[]; let paused=false, PX=[];
const fineP=matchMedia('(hover:hover) and (pointer:fine)');
function refreshMq(o){
  const g0=o.track.firstElementChild; if(!g0) return;
  while(o.track.children.length>1) o.track.lastElementChild.remove();
  o.gw=g0.offsetWidth; if(!o.gw) return;
  const n=Math.ceil(innerWidth/o.gw)+1;
  for(let i=0;i<n;i++){const c=g0.cloneNode(true);c.setAttribute('aria-hidden','true');o.track.appendChild(c)}
}
function refreshMqs(){mqs.forEach(refreshMq)}
function fillAwn(){
  const g=$('#awnG'); if(!g) return;
  const f=fmtParis(lang), en=lang==='en';
  const items=[(en?'Sunrise ':'Lever ')+f.format(new Date(DI.riseMs)),(en?'Sunset ':'Coucher ')+f.format(new Date(DI.setMs)),hmLen(DI.len)+(en?' of daylight':' de jour'),(en?'Sun up to ':'Soleil jusqu’à ')+Math.round(DI.elMax)+'°',en?'2,725 hours of sun a year':'2 725 h de soleil par an'];
  g.innerHTML=items.map(t=>`<span class="mq-i">${esc(t)}</span><svg class="mq-s" aria-hidden="true"><use href="#sunI"/></svg>`).join('');
  const o=mqs.find(x=>x.m.id==='awnMq'); if(o) refreshMq(o);
}
function splitPx(el){
  if(el.querySelector('.ch,.c')) return;
  const txt=el.textContent; if(!txt.trim()) return;
  el.innerHTML='<span class="sr">'+esc(txt)+'</span><span aria-hidden="true">'+txt.split(/(\s+)/).map(w=>!w||/^\s+$/.test(w)?w:'<span class="pw">'+[...w].map(c=>'<span class="ch">'+esc(c)+'</span>').join('')+'</span>').join('')+'</span>';
}
function applyPx(){
  PX=[]; if(!fineP.matches||reduce) return;
  $$('.hero-copy h1 .ln').forEach(l=>{l.dataset.px='.022'});
  PX=$$('[data-px]');
  PX.forEach(el=>{splitPx(el);el.style.setProperty('--k',el.dataset.px);el._ch=$$('.ch,.c',el)});
}
function initMotion(){
  /* pinned heights for the stacking sections */
  if('ResizeObserver' in window){const ro=new ResizeObserver(es=>es.forEach(e=>e.target.style.setProperty('--h',e.target.offsetHeight+'px')));$$('.stk').forEach(n=>ro.observe(n))}
  else $$('.stk').forEach(n=>n.style.setProperty('--h',n.offsetHeight+'px'));
  /* awning header: rolls up on the way down */
  let lastY=scrollY;
  addEventListener('scroll',()=>{const y=scrollY,d=y-lastY; if(Math.abs(d)>5){hdr.classList.toggle('up',d>0&&y>240);lastY=y}},{passive:true});
  const pb=$('#pauseBtn'); pb.addEventListener('click',()=>{paused=!paused;pb.setAttribute('aria-pressed',paused);root.classList.toggle('paused',paused)});
  if(reduce) return;
  /* banners */
  $$('.mq').forEach(m=>{
    const o={m,track:$('.mq-track',m),x:0,sp:0,vis:true,hover:false,dir:1,flip:+(m.dataset.flip||1),base:+(m.dataset.speed||60),gw:0};
    m.classList.add('js'); mqs.push(o); refreshMq(o);
    m.addEventListener('pointerenter',()=>{o.hover=true}); m.addEventListener('pointerleave',()=>{o.hover=false});
    if('IntersectionObserver' in window) new IntersectionObserver(es=>es.forEach(e=>{o.vis=e.isIntersecting})).observe(m);
  });
  let rt=0; addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(refreshMqs,150)});
  /* pointer */
  let px=-1e4,py=-1e4,dirty=false,spx=0,spy=0,hoverRow=null;
  const spot=$('#spot'), rows=$$('.row'); rows.forEach(r=>{r._t={x:0,y:0}});
  addEventListener('pointermove',e=>{
    if(e.pointerType==='touch') return;
    px=e.clientX; py=e.clientY; dirty=true; root.classList.add('pm');
    if(e.clientY<48) hdr.classList.remove('up');
    if(e.clientY<64) hdr.style.setProperty('--ax',((e.clientX/innerWidth-.5)*-28).toFixed(1)+'px');
  },{passive:true});
  document.addEventListener('pointerleave',()=>{px=py=-1e4;dirty=true;root.classList.remove('pm')});
  addEventListener('scroll',()=>{dirty=true},{passive:true});
  let lastT=performance.now(), lastSY=scrollY, vel=0;
  function tick(t){
    const dt=Math.min(64,t-lastT)/1000||.016; lastT=t;
    const dy=scrollY-lastSY; lastSY=scrollY; vel+=((dy/dt)-vel)*.1;
    for(const o of mqs){
      if(!o.vis||!o.gw) continue;
      if(vel>40) o.dir=1; else if(vel<-40) o.dir=-1;
      const target=paused?0:o.flip*o.dir*(o.base+Math.min(Math.abs(vel),2600)*.22)*(o.hover?.1:1);
      o.sp+=(target-o.sp)*Math.min(1,dt*2.6);
      o.x=(((o.x+o.sp*dt)%o.gw)+o.gw)%o.gw;
      o.track.style.transform='translate3d('+(-o.x).toFixed(2)+'px,0,0)';
    }
    if(fineP.matches){
      spx+=(px-spx)*.12; spy+=(py-spy)*.12;
      spot.style.transform='translate3d('+spx.toFixed(1)+'px,'+spy.toFixed(1)+'px,0)';
      if(dirty){
        dirty=false;
        for(const el of PX){
          const r=el.getBoundingClientRect();
          const near=r.bottom>0&&r.top<innerHeight&&px>r.left-140&&px<r.right+140&&py>r.top-140&&py<r.bottom+140;
          if(near){
            el._act=true;
            for(const c of el._ch){
              const b=c.getBoundingClientRect(), d=Math.hypot(px-(b.left+b.width/2),py-(b.top+b.height/2)), v=Math.max(0,1-d/Math.max(120,b.height*.9)), q=Math.round(v*v*10)/10;
              if(c._q!==q){c._q=q;c.style.setProperty('--p',q)}
            }
          } else if(el._act){el._act=false;for(const c of el._ch){if(c._q){c._q=0;c.style.setProperty('--p',0)}}}
        }
        const hit=px>-1e3?document.elementFromPoint(px,py):null; hoverRow=hit&&hit.closest?hit.closest('.row'):null;
      }
      for(const r of rows){
        const T=r._t; let tx=0,ty=0;
        if(r===hoverRow){const b=r.getBoundingClientRect(); tx=clamp((px-b.left)/b.width*2-1,-1,1); ty=clamp((py-b.top)/b.height*2-1,-1,1)}
        const nx=T.x+(tx-T.x)*.07, ny=T.y+(ty-T.y)*.07;
        if(Math.abs(nx-T.x)>.0005||Math.abs(ny-T.y)>.0005){T.x=nx;T.y=ny;r.style.setProperty('--tx',nx.toFixed(3));r.style.setProperty('--ty',ny.toFixed(3))}
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------- Soft scroll'''
rep("/* ---------- Soft scroll",js)
rep("applyLang(lang);\ninitLenis();\nonScroll();\n","applyLang(lang);\ninitLenis();\ninitMotion();\nrefreshMqs();\nonScroll();\n")
open(p,'w',encoding='utf-8').write(s)
print('patched',len(s))
