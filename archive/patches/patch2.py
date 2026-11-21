import sys
p='/home/claude/v2/src.html'
s=open(p,encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a)
    if n!=count: print('MISMATCH',n,'for',a[:80]); sys.exit(1)
    s=s.replace(a,b)

# a. French window: taller, one mullion + one transom
rep(".stage{--wl:50vw;--wr:9vw;--wt:12svh;--wb:21svh;",".stage{--wl:58vw;--wr:10vw;--wt:11svh;--wb:21svh;")
rep('<g stroke="rgb(0 8 60 / .5)" stroke-width="7"><line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="33.33" x2="100" y2="33.33"/><line x1="0" y1="66.67" x2="100" y2="66.67"/></g>','<g stroke="rgb(0 8 60 / .5)" stroke-width="9"><line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="24" x2="100" y2="24"/></g>')
rep('<g stroke="#F1F3F2" stroke-width="5"><line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="33.33" x2="100" y2="33.33"/><line x1="0" y1="66.67" x2="100" y2="66.67"/></g>','<g stroke="#F1F3F2" stroke-width="6"><line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="24" x2="100" y2="24"/></g>')

# b. shorter scroll distance
rep(".hero{position:relative;height:calc(100svh + 140svh)}",".hero{position:relative;height:calc(100svh + 120svh)}")
rep("animation-range:0px 140svh","animation-range:0px 120svh")
rep("clamp(scrollY/(innerHeight*1.4)).toFixed(4)","clamp(scrollY/(innerHeight*1.2)).toFixed(4)")
rep(".intro{padding-top:clamp(72px,12vh,160px);padding-bottom:clamp(96px,18vh,220px)}",".intro{padding-top:clamp(40px,7vh,88px);padding-bottom:clamp(96px,18vh,220px)}")

# c. bar tone from what is under the bar; slides away over the footer wordmark
rep("""  const mid=innerHeight*.5;
  let found=secs[0];
  for(const s of secs){const r=s.getBoundingClientRect(); if(r.top<=mid&&r.bottom>mid){found=s;break}}
  const key=found.dataset.sec;
  let tone=found.dataset.tone;
  if(key==='top'){const open=hasSDA&&!reduce?parseFloat(getComputedStyle(stage).getPropertyValue('--open'))||0:clamp(scrollY/(innerHeight*1.4)); tone=open>.55?'blue':'paper'}
  bar.dataset.tone=tone==='blue'?'paper':'klein';""","""  const mid=innerHeight*.5, under=innerHeight-48;
  let found=secs[0], foundUnder=secs[0];
  for(const s of secs){const r=s.getBoundingClientRect(); if(r.top<=mid&&r.bottom>mid) found=s; if(r.top<=under&&r.bottom>under) foundUnder=s;}
  const key=found.dataset.sec;
  let tone=foundUnder.dataset.tone;
  if(foundUnder.dataset.sec==='top'){const r=win.getBoundingClientRect(),cx=innerWidth/2; tone=(cx>=r.left&&cx<=r.right&&under>=r.top&&under<=r.bottom)?'blue':'paper'}
  bar.dataset.tone=tone==='blue'?'paper':'klein';
  const away=mono.getBoundingClientRect().top<innerHeight-84;
  bar.classList.toggle('away',away); bar.inert=away||menu.matches(':popover-open');""")
rep("const bar=$('#bar'), barNow=$('#barNow');","const bar=$('#bar'), barNow=$('#barNow'), win=$('.win'), mono=$('.monument');")
rep(".bar :focus-visible{outline-color:currentColor;outline-offset:-4px}",".bar.away{transform:translate(-50%,calc(100% + 28px));visibility:hidden;transition:transform var(--dur-3) var(--ease-enter),visibility 0s linear var(--dur-3)}\n.bar :focus-visible{outline-color:currentColor;outline-offset:-4px}")
rep("transition:background var(--dur-3) var(--ease-enter),color var(--dur-3) var(--ease-enter)}\n.bar[data-tone","transition:background var(--dur-3) var(--ease-enter),color var(--dur-3) var(--ease-enter),transform var(--dur-3) var(--ease-enter)}\n.bar[data-tone")
# menu close: keep the bar's own inert state in sync
rep("$('#main').inert=open; bar.inert=open;","$('#main').inert=open; bar.inert=open; if(!open) setTimeout(updateBar,0);")

# d. section-head note on the right edge
rep(".sec-head p{grid-column:9/-1;justify-self:start}",".sec-head p{grid-column:9/-1;justify-self:end;text-align:right;max-width:30ch}")
# e/f/g
rep(".facts .t{grid-column:6/11;max-width:34ch;font-size:var(--fs-lead);line-height:1.35}",".facts .t{grid-column:6/11;max-width:36ch;font-size:var(--fs-lead);line-height:1.35;text-wrap:balance}")
rep(".today dl{display:grid;grid-template-columns:auto 1fr;gap:6px 24px}",".today dl{display:grid;grid-template-columns:auto 1fr;gap:8px 24px;align-items:baseline}")
rep(".studio{padding-top:0}",".studio{padding-top:0;padding-bottom:0}")

# h. monument fits the width exactly and sits on the bottom edge
rep("--fs-monument:clamp(4.5rem,17.2vw,26rem);\n","")
rep(".monument{font-size:var(--fs-monument);font-weight:300;letter-spacing:-.055em;line-height:.74;white-space:nowrap;margin:0 calc(var(--m) * -1);padding:0 var(--m) .04em;user-select:none}",
    ".mono-wrap{container-type:inline-size;margin:0 0 -.02em}\n.monument{font-size:calc(100cqw / 4.74);font-weight:300;letter-spacing:-.055em;line-height:.72;white-space:nowrap;margin-left:-.045em;user-select:none}")
rep('<div class="monument" aria-hidden="true">Heure Bleue</div>','<div class="mono-wrap" aria-hidden="true"><div class="monument">Heure Bleue</div></div>')

# i. back to top
rep("""      <span data-i="where">Nice, France</span>""","""      <span data-i="where">Nice, France</span>
      <a href="#top" data-i="top">Retour en haut</a>""")
rep("'ctT':'Let’s talk about light.',","'ctT':'Let’s talk about light.','top':'Back to top',")

# j. thousands separators per language
rep('<span class="n">2 725 h</span>','<span class="n" data-i="f1n">2 725 h</span>')
rep('<span class="n">39 993</span>','<span class="n" data-i="f3n">39 993</span>')
rep("'f1':'of sun a year in Nice","'f1n':'2,725 h','f3n':'39,993','f1':'of sun a year in Nice")
open(p,'w',encoding='utf-8').write(s)
print('ok')
