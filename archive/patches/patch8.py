p='/home/claude/v2/src.html'
s=open(p,encoding='utf-8').read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(s.count(a),a[:70]); s=s.replace(a,b)

# ---------- HTML: contact without meta/monument, then a real footer ----------
i=s.index('<section class="sec blue contact" id="contact"'); j=s.index('</main>')
contact='''<section class="sec blue contact" id="contact" data-sec="contact" data-tone="blue" aria-labelledby="ctT">
  <div class="wrap top" style="width:100%">
    <h2 class="display shut" id="ctT" data-i="ctT">Parlons lumière.</h2>
    <a class="mail" id="mail" href="mailto:contact.moyostudio@gmail.com">contact.moyostudio@gmail.com</a><br>
    <button class="link copy" id="copy" type="button" data-i="copy">Copier l’adresse</button>
    <span class="sr" id="copyMsg" role="status"></span>
  </div>
</section>

'''
s=s[:i]+contact+s[j:]
footer='''</main>

<footer class="sec blue foot" id="foot" data-sec="contact" data-tone="blue" aria-label="Pied de page" data-ia="footAria">
  <div class="wrap foot-grid">
    <div class="fcol">
      <h2 class="fh" data-i="fStudio">Studio</h2>
      <ul class="fnames"><li>Zahia Bougouffa</li><li>Yacine Bouabdallah</li></ul>
      <p class="small muted" data-i="fStudioP">Studio indépendant de design et de développement : sites, identités et visualisations de données.</p>
    </div>
    <nav class="fcol" aria-labelledby="fNavT">
      <h2 class="fh" id="fNavT" data-i="fNav">Plan du site</h2>
      <ul>
        <li><a href="#approche" data-i="sec.intro">Approche</a></li>
        <li><a href="#projets" data-i="sec.projects">Projets</a></li>
        <li><a href="#services" data-i="sec.services">Services</a></li>
        <li><a href="#studio" data-i="sec.studio">Studio</a></li>
        <li><a href="#lumiere" data-i="sec.light">Lumière</a></li>
        <li><a href="#contact" data-i="sec.contact">Contact</a></li>
      </ul>
    </nav>
    <div class="fcol fcol--live">
      <h2 class="fh" data-i="fLive">La lumière, maintenant</h2>
      <p class="foot-sun" id="fSunNow"></p>
      <dl class="fdl">
        <dt data-i="rise">Lever</dt><dd id="fRise">--:--</dd>
        <dt data-i="lMid">Midi solaire</dt><dd id="fNoon">--:--</dd>
        <dt data-i="set">Coucher</dt><dd id="fSet">--:--</dd>
        <dt data-i="len">Durée du jour</dt><dd id="fLen">--</dd>
      </dl>
      <p class="small muted" id="fTrend"></p>
    </div>
    <div class="fcol">
      <h2 class="fh" data-i="fAbout">À propos du site</h2>
      <ul class="fabout small">
        <li data-i="fA1">Une seule page de moins de 200 Ko, sans cookie ni traceur.</li>
        <li data-i="fA2">Lisible au clavier, sans JavaScript et avec animations réduites.</li>
        <li data-i="fA3">Typographie Hanken Grotesk, défilement Lenis.</li>
        <li data-i="fA4">Position du soleil : calcul simplifié, fait dans votre navigateur.</li>
      </ul>
    </div>
  </div>
  <div class="wrap foot-base small">
    <span>© 2026 moyo</span>
    <span class="muted" id="fDate"></span>
    <a href="#top" data-i="top">Retour en haut</a>
  </div>
  <div class="mono-wrap" aria-hidden="true"><div class="monument">moyo</div></div>
</footer>
'''
rep('</main>\n',footer)

# ---------- HTML: richer Lumière readings ----------
old_dl=s[s.index('        <dl>\n          <dt data-i="rise">Lever</dt><dd id="dRise">'):s.index('        <p class="small muted" style="margin-top:14px;max-width:34ch" data-i="todayN">')]
new_dl='''        <dl>
          <dt data-i="rise">Lever</dt><dd><span id="dRise">--:--</span><small class="dsub" id="dRiseS"></small></dd>
          <dt data-i="lMid">Midi solaire</dt><dd><span id="dNoon">--:--</span></dd>
          <dt data-i="set">Coucher</dt><dd><span id="dSet">--:--</span><small class="dsub" id="dSetS"></small></dd>
          <dt data-i="len">Durée du jour</dt><dd><span id="dLen">--</span><small class="dsub" id="dLenS"></small></dd>
          <dt data-i="elmax">Soleil au plus haut</dt><dd><span id="dEl">--</span></dd>
          <dt data-i="lGold">Heure dorée du soir</dt><dd><span id="dGold">--</span></dd>
          <dt data-i="lShadow">Ombre à midi (1,70 m)</dt><dd><span id="dShadow">--</span></dd>
        </dl>
        <h3 class="yh" data-i="yearT">La durée du jour sur l’année</h3>
        <div id="yearchart"></div>
        <p class="small" id="yearNote"></p>
'''
s=s.replace(old_dl,new_dl)

# ---------- CSS ----------
css='''
/* Contact is only the invitation; the footer carries the rest */
.contact{min-height:0;display:block;padding-bottom:clamp(72px,12vh,140px);overflow:clip}
.contact .top{padding-bottom:0}
.dsub{display:block;font-size:.8125rem;line-height:1.35;color:var(--soft);font-weight:400}
.today dd{min-height:1.9rem}
.yh{margin-top:clamp(28px,5vh,48px)}
#yearchart{width:100%;min-height:130px}
#yearchart svg{display:block;width:100%;height:auto;overflow:visible}
#yearchart text{font-family:var(--sans);font-size:11px;fill:var(--soft)}
#yearchart .yl{fill:none;stroke:var(--klein);stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
#yearchart .yg{stroke:var(--line);stroke-width:1}
#yearchart .yd{fill:var(--klein);stroke:var(--chaux);stroke-width:2}
#yearchart .yt{fill:var(--klein);font-weight:600}
#yearNote{margin-top:10px;max-width:40ch;color:var(--soft)}

/* Footer */
.foot{padding-block:clamp(64px,10vh,120px) 0;overflow:clip;border-top:1px solid var(--paper-line)}
.foot-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:48px clamp(16px,2vw,32px)}
.fcol{grid-column:span 3;min-width:0}
.fh{font-size:var(--fs-small);font-weight:600;letter-spacing:0;margin-bottom:16px;color:var(--paper)}
.fcol ul{display:grid;gap:2px}
.fnames li{font-size:1.25rem;font-weight:300;letter-spacing:-.02em;line-height:1.3}
.fnames+p{margin-top:16px;max-width:30ch}
.fcol a{display:inline-flex;align-items:center;min-height:32px;text-decoration:none;color:var(--paper);background:linear-gradient(currentColor,currentColor) 0 calc(100% - 6px)/0 1px no-repeat;transition:background-size var(--dur-3) var(--ease-enter)}
.fcol a:hover{background-size:100% 1px}
.foot-sun{font-size:1.25rem;font-weight:300;letter-spacing:-.02em;line-height:1.3;margin-bottom:16px;max-width:24ch;text-wrap:balance}
.fdl{display:grid;grid-template-columns:auto 1fr;gap:6px 20px;align-items:baseline}
.fdl dt{color:var(--paper-soft)}
.fdl dd{font-variant-numeric:tabular-nums}
.fcol--live .small{margin-top:14px;max-width:30ch}
.fabout{gap:10px}
.fabout li{color:var(--paper-soft);max-width:34ch}
.foot-base{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 32px;margin-top:clamp(56px,9vh,104px);padding-top:20px;border-top:1px solid var(--paper-line)}
.foot-base a{display:inline-flex;align-items:center;min-height:32px;color:var(--paper)}
.foot .mono-wrap{margin-top:clamp(40px,7vh,88px)}
@media (max-width:900px){.fcol{grid-column:span 6}}
@media (max-width:560px){.fcol{grid-column:1/-1}}
'''
rep('/* Responsive */',css+'\n/* Responsive */')

# ---------- JS: readings ----------
js='''
/* ---------- Light: more readings from the same sun model ---------- */
const declN=n=>{const g=2*Math.PI/365*(n-1);return .006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g)};
const lenN=n=>{const d=declN(n),c=(Math.cos(90.833*R)-Math.sin(LAT*R)*Math.sin(d))/(Math.cos(LAT*R)*Math.cos(d));return 8*Math.acos(clamp(c,-1,1))/R/60};
const YEAR=Array.from({length:365},(_,i)=>lenN(i+1));
const LMIN=Math.min(...YEAR), LMAX=Math.max(...YEAR);
const compIdx=ms=>Math.round(sunAt(ms).az/(Math.PI/8))%16;
const azDeg=ms=>Math.round(sunAt(ms).az/R);
const fmtDur=sec=>{const m=Math.floor(sec/60),r=Math.round(sec%60);return m?m+' min '+pad(r)+' s':r+' s'};
const durMs=ms=>{const m=Math.max(1,Math.round(ms/60000));return m>=60?Math.floor(m/60)+' h '+pad(m%60):m+' min'};
let GOLD=DI.setMs; for(let ms=DI.noonMs;ms<=DI.setMs;ms+=60000){ if(sunAt(ms).el<=6*R){GOLD=ms;break} }
const SHADOW=1.7/Math.tan(DI.elMax*R);
function trendText(){
  const en=lang==='en', d=(lenN(doy)-lenN(doy-1))*3600;
  if(Math.abs(d)<1) return en?'As long as yesterday.':'Autant qu’hier.';
  return d<0?(en?fmtDur(-d)+' shorter than yesterday.':fmtDur(-d)+' de moins qu’hier.'):(en?fmtDur(d)+' longer than yesterday.':fmtDur(d)+' de plus qu’hier.');
}
function solsticeText(){
  const en=lang==='en', y=P0.year;
  let nx=null;
  for(const [t,k] of [[Date.UTC(y,5,21),'s'],[Date.UTC(y,11,21),'w'],[Date.UTC(y+1,5,21),'s']]){const d=Math.round((t-dayUTC)/864e5); if(d>=0){nx={d,k};break}}
  const when=nx.d===0?(en?'today':'aujourd’hui'):(en?'in '+nx.d+' day'+(nx.d>1?'s':''):'dans '+nx.d+' jour'+(nx.d>1?'s':''));
  if(nx.k==='w') return en?`Winter solstice ${when}: the shortest day, ${hmLen(LMIN)}.`:`Solstice d’hiver ${when} : le jour le plus court, ${hmLen(LMIN)}.`;
  return en?`Summer solstice ${when}: the longest day, ${hmLen(LMAX)}.`:`Solstice d’été ${when} : le jour le plus long, ${hmLen(LMAX)}.`;
}
function renderYear(){
  const host=$('#yearchart'); if(!host) return;
  const en=lang==='en', w=Math.max(240,host.clientWidth||420), h=132, pl=4, pr=4, pt=26, pb=24;
  const lo=Math.floor(LMIN)-1, hi=Math.ceil(LMAX)+1;
  const X=n=>pl+(n-1)/364*(w-pl-pr), Y=v=>pt+(1-(v-lo)/(hi-lo))*(h-pt-pb);
  const d=YEAR.map((v,i)=>(i?'L':'M')+X(i+1).toFixed(1)+' '+Y(v).toFixed(1)).join('');
  const nmax=YEAR.indexOf(LMAX)+1, mo=n=>new Date(Date.UTC(2026,0,n)).getUTCMonth();
  const tv=lenN(doy), tx=X(doy), ty=Y(tv), base=h-pb;
  const lab=en?'Today':'Aujourd’hui';
  const al=en?`Day length through the year in Nice: ${hmLen(LMIN)} at the winter solstice, ${hmLen(LMAX)} at the summer solstice, ${hmLen(tv)} today.`:`Durée du jour sur l’année à Nice : ${hmLen(LMIN)} au solstice d’hiver, ${hmLen(LMAX)} au solstice d’été, ${hmLen(tv)} aujourd’hui.`;
  let t=`<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${al}">`;
  t+=`<line class="yg" x1="${pl}" x2="${w-pr}" y1="${base}" y2="${base}"/>`;
  for(let m=0;m<12;m++){const n=Math.round(31*m+m*.6)+1; const x=X(Math.min(365,Math.round(m*30.4)+1)); t+=`<text x="${x.toFixed(1)}" y="${h-6}" text-anchor="start">${w>380||en?M3[lang][m][0]:M3[lang][m][0]}</text>`}
  t+=`<path class="yl" d="${d}"/>`;
  t+=`<text x="${X(nmax).toFixed(1)}" y="${(Y(LMAX)-9).toFixed(1)}" text-anchor="middle">${hmLen(LMAX)}</text>`;
  t+=`<line class="yg" x1="${tx.toFixed(1)}" x2="${tx.toFixed(1)}" y1="${ty.toFixed(1)}" y2="${base}"/>`;
  t+=`<circle class="yd" cx="${tx.toFixed(1)}" cy="${ty.toFixed(1)}" r="5"/>`;
  t+=`<text class="yt" x="${(tx-8).toFixed(1)}" y="${(ty+20).toFixed(1)}" text-anchor="end">${lab} ${hmLen(tv)}</text>`;
  t+='</svg>';
  host.innerHTML=t;
}
function fillFoot(){
  const f=fmtParis(lang), en=lang==='en', now=Date.now();
  let sNow;
  if(now<DI.riseMs) sNow=(en?'The sun rises in ':'Le soleil se lève dans ')+durMs(DI.riseMs-now)+'.';
  else if(now>DI.setMs) sNow=en?'The sun set '+durMs(now-DI.setMs)+' ago.':'Le soleil est couché depuis '+durMs(now-DI.setMs)+'.';
  else{const sa=sunAt(now), c=COMP[lang][Math.round(sa.az/(Math.PI/8))%16]; sNow=en?`The sun is ${Math.round(sa.el/R)}° above the horizon, ${c}.`:`Le soleil est à ${Math.round(sa.el/R)}° au-dessus de l’horizon, ${c}.`}
  $('#fSunNow').textContent=sNow;
  $('#fRise').textContent=f.format(new Date(DI.riseMs));
  $('#fNoon').textContent=f.format(new Date(DI.noonMs));
  $('#fSet').textContent=f.format(new Date(DI.setMs));
  $('#fLen').textContent=hmLen(DI.len);
  $('#fTrend').textContent=trendText();
  const dt=new Intl.DateTimeFormat(en?'en-GB':'fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Paris'}).format(new Date(localMidnightMs+12*3600000));
  $('#fDate').textContent=en?'Sun calculated on '+dt:'Soleil calculé le '+dt;
}
'''
rep('function fillToday(){\n  const f=fmtParis(lang);\n  $(\'#dRise\').textContent=f.format(new Date(DI.riseMs));\n  $(\'#dSet\').textContent=f.format(new Date(DI.setMs));\n  $(\'#dLen\').textContent=hmLen(DI.len);\n  $(\'#dEl\').textContent=Math.round(DI.elMax)+\'°\';\n}',
js+'''function fillToday(){
  const f=fmtParis(lang), L=COMP[lang], nf=new Intl.NumberFormat(lang==='en'?'en-GB':'fr-FR',{maximumFractionDigits:1});
  $('#dRise').textContent=f.format(new Date(DI.riseMs));
  $('#dRiseS').textContent=L[compIdx(DI.riseMs)]+', '+azDeg(DI.riseMs)+'°';
  $('#dNoon').textContent=f.format(new Date(DI.noonMs));
  $('#dSet').textContent=f.format(new Date(DI.setMs));
  $('#dSetS').textContent=L[compIdx(DI.setMs)]+', '+azDeg(DI.setMs)+'°';
  $('#dLen').textContent=hmLen(DI.len);
  $('#dLenS').textContent=trendText();
  $('#dEl').textContent=Math.round(DI.elMax)+'°';
  $('#dGold').textContent=f.format(new Date(GOLD))+' – '+f.format(new Date(DI.setMs));
  $('#dShadow').textContent=nf.format(SHADOW)+' m';
  $('#yearNote').textContent=solsticeText();
  renderYear(); fillFoot();
}''')
rep("new ResizeObserver(()=>renderChart()).observe($('#sunchart'));","new ResizeObserver(()=>renderChart()).observe($('#sunchart'));\nnew ResizeObserver(()=>renderYear()).observe($('#yearchart'));")
rep("  $('#main').inert=open; bar.inert=open;","  $('#main').inert=open; $('#foot').inert=open; bar.inert=open;")
rep("applyLang(lang);\ninitLenis();","applyLang(lang);\nsetInterval(fillFoot,60000);\ninitLenis();")

# ---------- EN strings ----------
rep(" 'pause'" if " 'pause'" in s else "'ctT':'Let\\u2019s talk about light.'",
    ("'footAria':'Site footer','fStudio':'Studio','fStudioP':'An independent design and development studio: websites, identities and data visualisations.','fNav':'Site map','fLive':'The light, right now','fAbout':'About this site','fA1':'A single page under 200 KB, with no cookies and no trackers.','fA2':'Readable by keyboard, without JavaScript, and with animations reduced.','fA3':'Typeface Hanken Grotesk, smooth scroll by Lenis.','fA4':'Sun position: a simplified calculation, made in your browser.','lMid':'Solar noon','lGold':'Golden hour, evening','lShadow':'Shadow at noon (1.70 m)','yearT':'Day length through the year',\n ")
    + ("'ctT':'Let\\u2019s talk about light.'" ),1)
open(p,'w',encoding='utf-8').write(s)
print('ok',len(s))
