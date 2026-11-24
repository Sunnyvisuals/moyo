/* Footer, the same on every page: FR/EN labels, sign-up, parallax. The wordmark that looks back is in eyes.js.
   The page owns the language: it sets <html lang>; this file follows it. */
(() => {
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const getLang=()=>document.documentElement.lang==='en'?'en':'fr';
let lang=getLang();
const EN={contact:'Contact',footAria:'Site footer',langAria:'Language',fNav:'Site map',sProj:'Projects',sSvc:'Services',sMth:'Method',sStu:'Agency',sTeam:'Team',
  fBy:'Made by',subH:'Sign up for a little joy.',subBtn:'Sign up',subPh:'you@example.com',top:'Back to top',fSee:'See you soon',fHold:'Hold an eye'};
function label(){
  const ft=document.getElementById('foot'); if(!ft) return;
  const put=(el,k,store,get,set)=>{ if(!(store in el.dataset)) el.dataset[store]=get(); set(lang==='en'&&EN[k]?EN[k]:el.dataset[store]); };
  ft.querySelectorAll('[data-i]').forEach(el=>put(el,el.dataset.i,'fr',()=>el.textContent,v=>{el.textContent=v}));
  [ft,...ft.querySelectorAll('[data-ia]')].forEach(el=>put(el,el.dataset.ia,'frA',()=>el.getAttribute('aria-label'),v=>el.setAttribute('aria-label',v)));
  ft.querySelectorAll('[data-ph]').forEach(el=>put(el,el.dataset.ph,'frP',()=>el.placeholder,v=>{el.placeholder=v}));
  const q=ft.querySelector('.foot-cta .q'); if(q&&q.firstChild) q.firstChild.nodeValue=lang==='en'?'?':'\u00a0?'; // no space before the question mark in English
  ft.querySelectorAll('.flang button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.l===lang)));
}
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const setV=(el,k,v)=>{ if(el&&el.style.getPropertyValue(k)!==v) el.style.setProperty(k,v) };
/* footer parallax reveal */
const foot=$('#foot');
function footPar(){
  if(reduce||!foot) return;
  const r=foot.getBoundingClientRect();
  setV(foot,'--fp',clamp((innerHeight-r.top)/(innerHeight*.6)).toFixed(3));
}
let footRaf=0;
function footFrame(){ footRaf=0; footPar(); }
addEventListener('scroll',()=>{ if(!footRaf) footRaf=requestAnimationFrame(footFrame); },{passive:true});
addEventListener('resize',()=>{ if(!footRaf) footRaf=requestAnimationFrame(footFrame); });
footFrame();
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
    if(r.ok){ subForm.reset(); dispatchEvent(new Event('moyo:joy')); show(d.already?(en?'You are already on the list.':'Vous êtes déjà inscrit·e.'):(en?'Thank you, see you soon.':'Merci, à très vite.')); }
    else show(d.message||(en?'Sign-up failed.':'L’inscription a échoué.'),true);
  }catch(_){ show(en?'Sign-up failed. Check your connection.':'L’inscription a échoué. Vérifiez votre connexion.',true); }
  finally{ btn.disabled=false; }
});

/* the content before the footer stays put (bottom aligned) while the footer slides over it */
const under=$('.under');
if(under&&!reduce){ const fit=()=>under.style.setProperty('--st',Math.min(0,innerHeight-under.offsetHeight)+'px'); new ResizeObserver(fit).observe(under); addEventListener('resize',fit); fit(); }
label();
new MutationObserver(()=>{ const l=getLang(); if(l===lang) return; lang=l; label(); }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
