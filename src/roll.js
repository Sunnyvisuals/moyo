/* Names of the team (home): the same hover as the language button. The name lifts out and the same name comes back from below.
   The real text stays for screen readers; the second copy is decoration. Nothing happens with reduced motion or on touch screens. */
(() => {
  const names = [...document.querySelectorAll('.nm')];
  if (!names.length) return;
  const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  names.forEach(n => {
    if (n.querySelector('.rl')) return;
    const t = n.textContent.trim();
    n.innerHTML = `<span class="rl"><span class="r1">${esc(t)}</span><span class="r2" aria-hidden="true">${esc(t)}</span></span>`;
  });
  const st = document.createElement('style');
  st.textContent = `.nm .rl{display:block;position:relative;overflow:hidden;padding-bottom:.14em;margin-bottom:-.14em}
.nm .r1,.nm .r2{display:block;transition:translate .6s cubic-bezier(.65,0,.15,1),clip-path .6s cubic-bezier(.65,0,.15,1)}
.nm .r1{clip-path:inset(0)}
.nm .r2{position:absolute;left:0;top:0;width:100%;translate:0 100%;clip-path:inset(0 0 100%)}
@media (hover:hover) and (prefers-reduced-motion:no-preference){
  .nm-link:hover .r1,.nm-link:focus-visible .r1{translate:0 -100%;clip-path:inset(100% 0 0)}
  .nm-link:hover .r2,.nm-link:focus-visible .r2{translate:0 0;clip-path:inset(0)}
  .nm-link:hover .nm{letter-spacing:-.045em;font-style:normal}
}`;
  document.head.appendChild(st);
})();
