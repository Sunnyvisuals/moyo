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

# ---------- A. no city ----------
sub(r'<h1 class="display" id="h1" data-i="h1">.*?</h1>','<h1 class="display" id="h1" data-i="h1"><span class="ln" style="--i:0">Un studio de design</span> <span class="ln" style="--i:1">qui dessine</span> <span class="ln" style="--i:2">avec la lumière.</span></h1>')
rep("'h1':'<span class=\"ln\" style=\"--i:0\">A design studio</span> <span class=\"ln\" style=\"--i:1\">in Nice that draws</span> <span class=\"ln\" style=\"--i:2\">with light.</span>',","'h1':'<span class=\"ln\" style=\"--i:0\">A design studio</span> <span class=\"ln\" style=\"--i:1\">that draws</span> <span class=\"ln\" style=\"--i:2\">with light.</span>',")
rep("Moyo est un studio de design et de développement installé à Nice. Nous concevons","Moyo est un studio de design et de développement. Nous concevons")
rep("'stuP':'Moyo is a design and development studio based in Nice. We design","'stuP':'Moyo is a design and development studio. We design")
sub(r'\s*<span data-i="where">Nice, France</span>','')
rep(",'where':'Nice, France'","")
sub(r'<meta name="description" content="[^"]*">','<meta name="description" content="Moyo, studio de design et de développement. Sites, identités et visualisations de données, dessinés avec la lumière.">')
rep("Studio de design et de développement. Un site éclairé par le vrai soleil de Nice.","Studio de design et de développement. Un site éclairé par le vrai soleil.")
rep(',"areaServed":"FR"','')
rep("Design and development studio in Nice. A site that opens like a window onto blue, lit by the real sun of Nice.","Moyo, a design and development studio. Websites, identities and data visualisations, drawn with light.")
rep("Studio de design et de développement à Nice. Un site qui s\\u2019ouvre comme une fenêtre sur le bleu, éclairé par le vrai soleil de Nice.","Moyo, studio de design et de développement. Sites, identités et visualisations de données, dessinés avec la lumière.") if "Studio de design et de développement à Nice. Un site qui s\\u2019ouvre" in s else None

# ---------- B. the name ----------
rep('''    <ul class="beliefs">''','''    <div class="entry">
      <p class="entry-w" aria-hidden="true">moyo</p>
      <div class="entry-d">
        <p class="entry-t" data-i="enT">Moyo, nom. Un mot d’origine bantoue.</p>
        <dl>
          <dt data-i="enL1">En swahili</dt><dd data-i="enD1">le cœur ; le courage.</dd>
          <dt data-i="enL2">En chichewa</dt><dd data-i="enD2">la vie.</dd>
        </dl>
        <p class="entry-s" data-i="enS">Nous en avons fait une règle : chaque projet doit avoir un cœur, une idée qui bat de la première page au dernier pixel.</p>
      </div>
    </div>
    <ul class="beliefs">''')
rep(" 'teamT':'The team.'"," 'enT':'Moyo, noun. A word of Bantu origin.','enL1':'In Swahili','enD1':'the heart; courage.','enL2':'In Chichewa','enD2':'life.','enS':'We made it a rule: every project needs a heart, one idea that beats from the first page to the last pixel.',\n 'teamT':'The team.'")
rep(".beliefs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 clamp(16px,2vw,32px);margin-top:clamp(56px,10vh,128px)}",""".entry{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:24px clamp(16px,2vw,32px);align-items:end;margin-top:clamp(64px,12vh,152px)}
.entry-w{grid-column:1/8;font-size:clamp(5rem,16vw,17rem);font-weight:300;letter-spacing:-.055em;line-height:.8;margin-left:-.05em}
.entry-d{grid-column:8/-1;padding-bottom:.4rem}
.entry-t{font-size:var(--fs-lead);margin-bottom:14px}
.entry dl{display:grid;grid-template-columns:auto 1fr;gap:6px 20px;margin-bottom:18px;border-top:1px solid var(--paper-line);padding-top:14px}
.entry dt{color:var(--paper-soft)}
.entry-s{color:var(--paper-soft);max-width:36ch}
.beliefs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 clamp(16px,2vw,32px);margin-top:clamp(64px,12vh,152px)}""")
rep("  .statement{grid-column:1/-1!important}","  .statement{grid-column:1/-1!important}\n  .entry-w,.entry-d{grid-column:1/-1}")

# ---------- C. light in water ----------
css='''
/* Light in water: caustics drift inside the blue, brightness follows the real sun */
.cs{position:absolute;inset:0;overflow:hidden;z-index:-1;pointer-events:none;opacity:0;transition:opacity 2400ms ease}
html.caustic .cs{opacity:var(--lum,.6)}
.cs.out{display:none}
.cs b{position:absolute;display:block;mix-blend-mode:screen;background-repeat:repeat;will-change:transform}
.cs b:nth-child(1){left:-460px;top:-460px;right:0;bottom:0;background-size:460px;opacity:.13;animation:csA 90s linear infinite}
.cs b:nth-child(2){left:-300px;top:0;right:0;bottom:-300px;background-size:300px;opacity:.09;animation:csB 64s linear infinite}
@keyframes csA{to{transform:translate3d(460px,460px,0)}}
@keyframes csB{to{transform:translate3d(300px,-300px,0)}}
@media (prefers-reduced-motion:reduce){.cs b{animation:none}}
'''
rep("\n/* Responsive */",css+"\n/* Responsive */")

# sun block: lum on the caustic layers
rep("let curSec='top', touched=false, lastKey='', lastInfo='';","let curSec='top', touched=false, lastKey='', lastInfo='', caus=[], lastLum=.6;")
rep("  const sw=Math.round(220+280*Math.pow(sin,.7));\n  const key=sx.toFixed(3)+'|'+sy.toFixed(3)+'|'+a.toFixed(3)+'|'+blur.toFixed(1)+'|'+sw;",
    "  const sw=Math.round(220+280*Math.pow(sin,.7));\n  const lum=+(.35+.65*Math.pow(sin,.6)).toFixed(2);\n  const key=sx.toFixed(3)+'|'+sy.toFixed(3)+'|'+a.toFixed(3)+'|'+blur.toFixed(1)+'|'+sw+'|'+lum;")
rep("    stage.style.setProperty('--sunw',sw);\n  }","    stage.style.setProperty('--sunw',sw);\n    lastLum=lum; for(const c of caus) c.style.setProperty('--lum',lum);\n  }")

js='''/* ---------- Light in water: tileable caustics rendered once on a 2D canvas, then only transforms move ---------- */
function causticTile(size,t){
  const c=document.createElement('canvas'); c.width=c.height=size;
  const x=c.getContext('2d'), img=x.createImageData(size,size), TAU=Math.PI*2, N=5, k=.005;
  for(let py=0;py<size;py++)for(let px=0;px<size;px++){
    const p0x=((px/size)*TAU)-250, p0y=((py/size)*TAU)-250;
    let ix=p0x, iy=p0y, cc=1;
    for(let n=0;n<N;n++){
      const tt=t*(1-3.5/(n+1));
      ix=p0x+Math.cos(tt-ix)+Math.sin(tt+iy);
      iy=p0y+Math.sin(tt-iy)+Math.cos(tt+ix);
      cc+=1/Math.hypot(p0x*k/Math.sin(ix+tt),p0y*k/Math.cos(iy+tt));
    }
    cc/=N; cc=1.17-Math.pow(cc,1.4);
    const v=clamp(Math.pow(Math.abs(cc),8))*255, o=(py*size+px)*4;
    img.data[o]=img.data[o+1]=img.data[o+2]=v; img.data[o+3]=255;
  }
  x.putImageData(img,0,0);
  return c.toDataURL('image/png');
}
function initCaustics(){
  const targets=[$('.win'),...$$('.blue'),$('.menu-in'),$('#dlgBg')].filter(Boolean);
  targets.forEach(el=>el.insertAdjacentHTML('afterbegin','<i class="cs" aria-hidden="true"><b></b><b></b></i>'));
  caus=$$('.cs'); for(const c of caus) c.style.setProperty('--lum',lastLum);
  const st=document.createElement('style');
  st.textContent='.cs b:nth-child(1){background-image:url('+causticTile(256,4.3)+')}.cs b:nth-child(2){background-image:url('+causticTile(256,11.1)+')}';
  document.head.appendChild(st);
  root.classList.add('caustic');
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{const c=e.target.querySelector(':scope>.cs'); if(c) c.classList.toggle('out',!e.isIntersecting)}),{rootMargin:'30% 0px'});
    targets.forEach(t=>io.observe(t));
  }
}

/* ---------- Boot ---------- */'''
rep("/* ---------- Boot ---------- */",js)
rep("applyLang(lang);\nonScroll();","applyLang(lang);\nonScroll();\n(window.requestIdleCallback||(f=>setTimeout(f,120)))(initCaustics,{timeout:900});")
open(p,'w',encoding='utf-8').write(s)
print('patched',len(s))
