import re,sys
p='/home/claude/v2/src.html'
s=open(p,encoding='utf-8').read()
def rep(a,b,count=1):
    global s
    n=s.count(a)
    if n!=count: print('MISMATCH',n,'for',a[:70]); sys.exit(1)
    s=s.replace(a,b)

# 1 chart bars: .bar clashes with the nav bar
rep("#sunchart .bar rect{","#sunchart .cb rect{")
rep("#sunchart .bar.now rect,#sunchart .bar:hover rect,#sunchart .bar:focus-visible rect{","#sunchart .cb.now rect,#sunchart .cb:hover rect{")
rep("#sunchart .bar:focus-visible{outline:none}\n#sunchart .bar:focus-visible rect{stroke:var(--klein);stroke-width:2px;stroke-offset:3px}\n","")
rep("""s+=`<g class="bar${i===cm?' now':''}" tabindex="0" data-i="${i}" role="img" aria-label="${MN[lang][i]} : ${v} h"><rect""","""s+=`<g class="cb${i===cm?' now':''}" data-i="${i}"><rect""")
rep("""  $$('.bar',host).forEach(g=>{""","""  $$('.cb',host).forEach(g=>{""")
rep("""    g.addEventListener('focus',()=>{const r=g.getBoundingClientRect();showTip(text,r.left+r.width/2,r.top)});
    g.addEventListener('blur',hideTip);
""","")
rep("#sunchart{width:100%}","#sunchart{width:100%;min-height:200px}")
rep('<div class="sc"><table id="sunTbl"></table></div>','<div class="sc" tabindex="0" role="region" aria-label="Heures de soleil par mois" data-ia="tblAria"><table id="sunTbl"></table></div>')
rep("'chartT':'Hours of sun per month in Nice','tbl':'See the data as a table',","'chartT':'Hours of sun per month in Nice','tbl':'See the data as a table','tblAria':'Hours of sun per month',")

# 2 menu: drop the empty time column
s=re.sub(r'<span class="mt"[^>]*>[^<]*</span>','',s)
rep(".menu-list a{display:grid;grid-template-columns:minmax(4.5rem,8rem) 1fr;align-items:baseline;gap:0 16px;padding:12px 0;",".menu-list a{display:block;padding:12px 0;")
rep(".menu-list .mt{font-size:var(--fs-small);color:var(--paper-soft)}\n","")
rep(".menu-list a:hover .mt,.menu-list a:focus-visible .mt{color:var(--soft)}\n","")
rep('<div class="menu-in blue-in">','<div class="menu-in">')
rep('aria-haspopup="dialog" ','')

# 3 project row: hover is tonal only, the box never moves
rep(".row{position:relative;display:grid;grid-template-columns:6rem minmax(0,1fr) minmax(0,16rem) 7rem;gap:0 clamp(12px,2vw,32px);align-items:baseline;width:100%;text-align:left;padding:26px 14px 26px 0;min-height:88px;transition:background var(--dur-3) var(--ease-enter),color var(--dur-3) var(--ease-enter),padding var(--dur-3) var(--ease-enter)}",
    ".row{position:relative;display:grid;grid-template-columns:6rem minmax(0,1fr) minmax(0,16rem) 7rem;gap:0 clamp(12px,2vw,32px);align-items:baseline;width:calc(100% + 28px);margin:0 -14px;text-align:left;padding:26px 14px;min-height:88px;transition:background var(--dur-3) var(--ease-enter),color var(--dur-3) var(--ease-enter)}")
rep(".row:hover,.row:focus-visible{background:var(--klein);color:var(--paper);padding-left:14px}",".row:hover,.row:focus-visible{background:var(--klein);color:var(--paper)}")

# 4 slider target size
rep(".sunui input{width:100%;margin:14px 0 10px;accent-color:var(--klein);height:28px;background:none;cursor:ew-resize}",".sunui input{width:100%;margin:6px 0 6px;accent-color:var(--klein);height:44px;background:none;cursor:ew-resize}")
rep("input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;margin-top:-10px;","input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;margin-top:-11px;")
rep("input[type=range]::-moz-range-thumb{width:22px;height:22px;","input[type=range]::-moz-range-thumb{width:24px;height:24px;")

# 5 bar initial tone (own colour) + no-js
rep('<nav class="bar" id="bar" data-tone="paper"','<nav class="bar" id="bar" data-tone="klein"')
rep("</style>\n</head>","</style>\n<noscript><style>#langBtn{display:none}</style></noscript>\n</head>")

# 6 intro statement shorter
rep("Nous mesurons la lumière avant de la dessiner. Chaque projet commence par des relevés : des heures de soleil, des plans, des longueurs de coque. Puis vient une idée simple, construite avec soin.","Nous mesurons la lumière avant de la dessiner. Chaque projet commence par des relevés, puis une idée simple, construite avec soin.")
rep("We measure light before we draw it. Every project starts with readings: hours of sun, floor plans, hull lengths. Then comes one simple idea, built with care.","We measure light before we draw it. Every project starts with readings, then one simple idea, built with care.")
rep(".intro .display{grid-column:4/-1;max-width:22ch}",".intro .display{grid-column:4/-1;max-width:24ch}")

# 7 junk
rep("""function label(key){return lang==='en'?(EN['sec.'+key]||key):(DICT_FR['sec.'+key]||key)}\n""","")
i=s.index("/* section times in the menu")
j=s.index("/* ---------- Language")
s=s[:i]+s[j:]
rep("""  $('#mail').setAttribute('aria-label','');$('#mail').removeAttribute('aria-label');\n""","")

# 8 menu: page behind is inert while the panel is open
rep("""menu.addEventListener('toggle',e=>{
  const open=e.newState==='open';
  $('#menuBtn').setAttribute('aria-expanded',open);
  if(open){$$('.menu-list a')[0]?.focus({preventScroll:true})}
});""","""menu.addEventListener('beforetoggle',e=>{
  const open=e.newState==='open';
  $('#main').inert=open; bar.inert=open;
  $('#menuBtn').setAttribute('aria-expanded',open);
});
menu.addEventListener('toggle',e=>{ if(e.newState==='open') $$('.menu-list a')[0]?.focus({preventScroll:true}); });""")
open(p,'w',encoding='utf-8').write(s)
print('ok',len(s))
