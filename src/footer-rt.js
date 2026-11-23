/* Shared footer runtime (pages other than the home): FR/EN labels, live sun, blur "moyo", sign-up, parallax.
   The page owns the language: it sets <html lang>; this file follows it. */
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const getLang=()=>document.documentElement.lang==='en'?'en':'fr';
let lang=getLang();
const EN={home:'Home',
  contact:'Contact',
  footAria:'Site footer',
  langAria:'Language',
  fStudio:'Agency',
  fStudioP:'An independent creative agency, based on the French Riviera: websites, identities, audiovisual and communication.',
  fNav:'Site map',
  sIntro:'Approach',
  sProj:'Projects',
  allL:'All projects',
  sSvc:'Services',
  sStu:'Agency',
  sTeam:'The team',
  fLive:'The light, right now',
  subH:'Sign up for a little joy.',
  subBtn:'Sign up',
  subPh:'you@example.com',
  top:'Back to top'};
function label(){
  const ft=document.getElementById('foot'); if(!ft) return;
  const put=(el,k,store,get,set)=>{ if(!(store in el.dataset)) el.dataset[store]=get(); set(lang==='en'&&EN[k]?EN[k]:el.dataset[store]); };
  ft.querySelectorAll('[data-i]').forEach(el=>put(el,el.dataset.i,'fr',()=>el.textContent,v=>{el.textContent=v}));
  [ft,...ft.querySelectorAll('[data-ia]')].forEach(el=>put(el,el.dataset.ia,'frA',()=>el.getAttribute('aria-label'),v=>el.setAttribute('aria-label',v)));
  ft.querySelectorAll('[data-ph]').forEach(el=>put(el,el.dataset.ph,'frP',()=>el.placeholder,v=>{el.placeholder=v}));
  ft.querySelectorAll('.flang button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.l===lang)));
}
/* ---------- Footer: live sun, blur "moyo", sign-up, parallax ---------- */
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const pad=n=>String(n).padStart(2,'0');
const setT=(id,v)=>{const e=document.getElementById(id); if(e&&e.textContent!==v) e.textContent=v};
const setV=(el,k,v)=>{ if(el&&el.style.getPropertyValue(k)!==v) el.style.setProperty(k,v) };
const COMP={fr:['vers le nord','vers le nord-nord-est','vers le nord-est','vers l’est-nord-est','vers l’est','vers l’est-sud-est','vers le sud-est','vers le sud-sud-est','vers le sud','vers le sud-sud-ouest','vers le sud-ouest','vers l’ouest-sud-ouest','vers l’ouest','vers l’ouest-nord-ouest','vers le nord-ouest','vers le nord-nord-ouest'],
  en:['towards the north','towards the north-northeast','towards the northeast','towards the east-northeast','towards the east','towards the east-southeast','towards the southeast','towards the south-southeast','towards the south','towards the south-southwest','towards the southwest','towards the west-southwest','towards the west','towards the west-northwest','towards the northwest','towards the north-northwest']};
const LAT=43.7102, LON=7.2620, R=Math.PI/180;
const fmtParts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function parisNow(){const p={};fmtParts.formatToParts(new Date()).forEach(x=>{p[x.type]=+x.value});return p}
const P0=parisNow();
const dayUTC=Date.UTC(P0.year,P0.month-1,P0.day);
const noonUTC=new Date(Date.UTC(P0.year,P0.month-1,P0.day,12));
const offMin=((+new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',hourCycle:'h23'}).format(noonUTC))-12)*60;
const localMidnightMs=dayUTC-offMin*60000;
const doy=Math.round((dayUTC-Date.UTC(P0.year,0,0))/864e5);
function sunAt(ms){
  const d=new Date(ms);
  const n=Math.round((Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())-Date.UTC(d.getUTCFullYear(),0,0))/864e5);
  const g=2*Math.PI/365*(n-1+(d.getUTCHours()-12)/24);
  const decl=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
  const eot=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
  const utcMin=d.getUTCHours()*60+d.getUTCMinutes()+d.getUTCSeconds()/60;
  const tst=((utcMin+eot+4*LON)%1440+1440)%1440;
  const ha=(tst/4-180)*R;
  const el=Math.asin(Math.sin(LAT*R)*Math.sin(decl)+Math.cos(LAT*R)*Math.cos(decl)*Math.cos(ha));
  let az=Math.atan2(Math.sin(ha),Math.cos(ha)*Math.sin(LAT*R)-Math.tan(decl)*Math.cos(LAT*R))+Math.PI;
  return {el,az:((az%(2*Math.PI))+2*Math.PI)%(2*Math.PI)};
}
function dayInfo(){
  const g=2*Math.PI/365*(doy-1);
  const decl=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
  const eot=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
  const cosH=(Math.cos(90.833*R)-Math.sin(LAT*R)*Math.sin(decl))/(Math.cos(LAT*R)*Math.cos(decl));
  const H=Math.acos(clamp(cosH,-1,1))/R;
  const noonMin=720-4*LON-eot;
  return {riseMs:dayUTC+(noonMin-4*H)*60000,setMs:dayUTC+(noonMin+4*H)*60000,noonMs:dayUTC+noonMin*60000};
}
const DI=dayInfo();
const declN=n=>{const g=2*Math.PI/365*(n-1);return .006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g)};
const lenN=n=>{const d=declN(n),c=(Math.cos(90.833*R)-Math.sin(LAT*R)*Math.sin(d))/(Math.cos(LAT*R)*Math.cos(d));return 8*Math.acos(clamp(c,-1,1))/R/60};
const fmtDur=sec=>{const m=Math.floor(sec/60),r=Math.round(sec%60);return m?m+' min '+pad(r)+' s':r+' s'};
const durMs=ms=>{const m=Math.max(1,Math.round(ms/60000));return m>=60?Math.floor(m/60)+' h '+pad(m%60):m+' min'};
function trendText(){
  const en=lang==='en', d=(lenN(doy)-lenN(doy-1))*3600;
  if(Math.abs(d)<1) return en?'As long as yesterday.':'Autant qu’hier.';
  return d<0?(en?fmtDur(-d)+' shorter than yesterday.':fmtDur(-d)+' de moins qu’hier.'):(en?fmtDur(d)+' longer than yesterday.':fmtDur(d)+' de plus qu’hier.');
}
function fillFoot(){
  const en=lang==='en', now=Date.now(); let sNow;
  if(now<DI.riseMs) sNow=(en?'The sun rises in ':'Le soleil se lève dans ')+durMs(DI.riseMs-now)+'.';
  else if(now>DI.setMs) sNow=en?'The sun set '+durMs(now-DI.setMs)+' ago.':'Le soleil est couché depuis '+durMs(now-DI.setMs)+'.';
  else{const sa=sunAt(now), c=COMP[lang][Math.round(sa.az/(Math.PI/8))%16]; sNow=en?`The sun is ${Math.round(sa.el/R)}° above the horizon, ${c}.`:`Le soleil est à ${Math.round(sa.el/R)}° au-dessus de l’horizon, ${c}.`}
  setT('fSunNow',sNow); setT('fTrend',trendText());
  const dt=new Intl.DateTimeFormat(en?'en-GB':'fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Paris'}).format(new Date(localMidnightMs+12*3600000));
  setT('fDate',en?'Sun calculated on '+dt:'Soleil calculé le '+dt);
}
/* blur-text "moyo" */
const mono=$('.monument.blurtext'), btLetters=mono?[...mono.querySelectorAll('.bl')]:[];
function blurText(){
  if(reduce||!btLetters.length) return;
  const r=mono.getBoundingClientRect();
  const p=clamp((innerHeight-r.top)/Math.min(innerHeight*.52,r.height));
  const intensity=parseFloat(getComputedStyle(mono).fontSize)*.07*(1-p), n=btLetters.length;
  btLetters.forEach((el,i)=>{ const t=n===1?0:i/(n-1), dist=1-t, blur=dist>.75?0:intensity*(1-dist/.75); setV(el,'--b',blur.toFixed(1)+'px'); });
}
/* footer parallax reveal */
const foot=$('#foot');
function footPar(){
  if(reduce||!foot) return;
  const r=foot.getBoundingClientRect();
  setV(foot,'--fp',clamp((innerHeight-r.top)/(innerHeight*.6)).toFixed(3));
}
let footRaf=0;
function footFrame(){ footRaf=0; blurText(); footPar(); }
addEventListener('scroll',()=>{ if(!footRaf) footRaf=requestAnimationFrame(footFrame); },{passive:true});
addEventListener('resize',()=>{ if(!footRaf) footRaf=requestAnimationFrame(footFrame); });
fillFoot(); footFrame(); setInterval(fillFoot,30000);
/* newsletter sign-up */
const subForm=$('#subForm');
if(subForm) subForm.addEventListener('submit',async e=>{
  e.preventDefault();
  const en=lang==='en', mail=$('#subMail'), btn=subForm.querySelector('.sub-btn'), msg=$('#subMsg');
  const show=(t,bad)=>{ msg.textContent=t; msg.classList.toggle('err',!!bad); };
  const EMAIL=/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
  if(!EMAIL.test(mail.value.trim())){ show(en?'Please enter a valid email.':'Indiquez une adresse valide.',true); mail.focus(); return; }
  btn.disabled=true; show(en?'Signing up…':'Inscription…');
  try{
    const r=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:mail.value.trim(),website:subForm.website.value,lang})});
    const d=await r.json().catch(()=>({}));
    if(r.ok){ subForm.reset(); show(d.already?(en?'You are already on the list.':'Vous êtes déjà inscrit·e.'):(en?'Thank you, see you soon.':'Merci, à très vite.')); }
    else show(d.message||(en?'Sign-up failed.':'L’inscription a échoué.'),true);
  }catch(_){ show(en?'Sign-up failed. Check your connection.':'L’inscription a échoué. Vérifiez votre connexion.',true); }
  finally{ btn.disabled=false; }
});

/* the content before the footer stays put (bottom aligned) while the footer slides over it */
const under=$('.under');
if(under&&!reduce){ const fit=()=>under.style.setProperty('--st',Math.min(0,innerHeight-under.offsetHeight)+'px'); new ResizeObserver(fit).observe(under); addEventListener('resize',fit); fit(); }
label();
new MutationObserver(()=>{ const l=getLang(); if(l===lang) return; lang=l; label(); fillFoot(); }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
