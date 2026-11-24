/* The static pages (built from the seed) with the projects and the team of the moment: once the admin has saved, the lists are replaced on the fly,
   so the pages stay complete without JavaScript. page: 'home' or 'all'. */
import { getData, hasStored } from './store.js';
import seed from '../../data/projects.json';
import { rowsHTML, featuredOf, dataJSON } from '../../shared/render.js';
import { creditLinks, teamRows } from '../../shared/chrome.js';
import { ldHome, ldList, sample } from '../../shared/seo.js';

export async function fresh(res, page, env) {
  if (!(await hasStored(env))) return res;
  const data = await getData(env), list = page === 'home' ? featuredOf(data) : data.projects;
  const ld = page === 'home' ? ldHome(data.team) : ldList(data.projects.filter(p => !sample(p, seed)));
  return new HTMLRewriter()
    .on('#projects', { element: el => { el.setInnerContent(rowsHTML(list, 'fr'), { html: true }); } })
    .on('.fby', { element: el => { el.setInnerContent(creditLinks(data.team), { html: true }); } })
    .on('.names', { element: el => { el.setInnerContent(teamRows(data.team), { html: true }); } })
    .on('a.la', { element: el => { const c = el.getAttribute('data-cat'); if (data.projects.some(p => p.category === c)) el.setAttribute('href', '/projets?cat=' + c); else el.removeAttribute('href'); } })
    .on('script#moyo-data', { element: el => { el.setInnerContent(dataJSON(data), { html: true }); } })
    .on('script[type="application/ld+json"]', { element: el => { el.setInnerContent(dataJSON(ld), { html: true }); } })
    .transform(res);
}
