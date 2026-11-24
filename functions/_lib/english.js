/* The English version of a page, made from the French one: its own #en block, the words of the header and of the footer (shared/i18n.js),
   the texts that are in both languages in the markup (data-fr / data-en), and the links. */
import { CHROME, CHROME_ARIA, FOOT_EN } from '../../shared/i18n.js';
import { rowsHTML } from '../../shared/render.js';

const KEEP = /^\/(en|api|admin|proj|img|fonts|og)(\/|$|\?|#)/;
export const enLink = h => KEEP.test(h) ? h : '/en' + (h === '/' ? '' : h.startsWith('/#') || h.startsWith('/?') ? h.slice(1) : h);

/* head: the English <head> that replaces the one between <!--meta--> and <!--/meta-->. rows: the projects of the page, if it lists any. */
export async function english(res, { head, rows } = {}) {
  let html = await res.text(), D = { ...FOOT_EN, ...CHROME.en };
  const m = html.match(/<script type="application\/json" id="en">([\s\S]*?)<\/script>/);
  if (m) try { D = { ...D, ...JSON.parse(m[1]) }; } catch (_) {}
  if (head) html = html.replace(/<!--meta-->[\s\S]*?<!--\/meta-->/, () => `<!--meta-->${head}<!--/meta-->`);
  const aria = { ...CHROME_ARIA.en, footAria: FOOT_EN.footAria, subBtn: FOOT_EN.subBtn, ...D };
  const out = new HTMLRewriter()
    .on('html', { element: e => { e.setAttribute('lang', 'en'); } })
    .on('[data-i]', { element: e => { const v = D[e.getAttribute('data-i')]; if (v != null) e.setInnerContent(v); } })
    .on('[data-ia]', { element: e => { const v = aria[e.getAttribute('data-ia')]; if (v != null) e.setAttribute('aria-label', v); } })
    .on('[data-ph]', { element: e => { const v = D[e.getAttribute('data-ph')]; if (v != null) e.setAttribute('placeholder', v); } })
    .on('[data-fr][data-en]', { element: e => { e.setInnerContent(e.getAttribute('data-en') || e.getAttribute('data-fr'), { html: true }); } }) // already escaped in the attribute
    .on('span[data-l="fr"]', { element: e => { e.remove(); } }).on('div[data-l="fr"]', { element: e => { e.remove(); } }) // a profile has both biographies
    .on('.foot-cta .q', { element: e => { e.setInnerContent('?'); } })
    .on('.flang button', { element: e => { e.setAttribute('aria-pressed', String(e.getAttribute('data-l') === 'en')); } })
    .on('a[href^="/"]', { element: e => { e.setAttribute('href', enLink(e.getAttribute('href'))); } });
  if (rows) out.on('#projects', { element: e => { e.setInnerContent(rowsHTML(rows, 'en'), { html: true }); } });
  return out.transform(new Response(html, { status: res.status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'Content-Language': 'en' } }));
}
