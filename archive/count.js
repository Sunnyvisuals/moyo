/* Project numbers (01 to 05 on the home accordion): they appear for real when the section arrives.
   Each one slides in and counts up from 00, one after the other, and they reset when the section has left (so they play again). */
(() => {
  const nums = [...document.querySelectorAll('.acard-no')];
  const acc = nums[0] && nums[0].closest('.acc');
  if (!acc || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const end = nums.map(n => n.textContent.trim());
  const st = document.createElement('style');
  st.textContent = '.acard-no{font-variant-numeric:tabular-nums;transition:opacity .6s ease,translate .9s cubic-bezier(.2,.9,.2,1)}.acc.pre .acard-no{opacity:0;translate:0 14px}';
  document.head.appendChild(st);
  const pad = v => String(v).padStart(2, '0');
  const ease = t => 1 - (1 - t) ** 3;
  let runs = [];
  const reset = () => { runs.forEach(cancelAnimationFrame); runs = []; acc.classList.add('pre'); nums.forEach(n => { n.textContent = '00'; }); };
  const play = () => {
    acc.classList.remove('pre');
    nums.forEach((n, i) => {
      const to = parseInt(end[i], 10) || 0, t0 = performance.now() + i * 170, dur = 700 + to * 90;
      const step = now => { const t = Math.min(1, Math.max(0, (now - t0) / dur)); n.textContent = pad(Math.round(to * ease(t))); if (t < 1) runs[i] = requestAnimationFrame(step); else n.textContent = end[i]; };
      runs[i] = requestAnimationFrame(step);
    });
  };
  reset();
  let inside = false;
  new IntersectionObserver(es => es.forEach(e => {
    const now = e.intersectionRatio > .3;
    if (now && !inside) { inside = true; play(); }
    else if (!now && e.intersectionRatio === 0 && inside) { inside = false; reset(); }
  }), { threshold: [0, .3] }).observe(acc);
})();
