/* Every page of the site, from the data of the moment. */
import { getData } from './_lib/store.js';

export async function onRequestGet({ env }) {
  const d = await getData(env), site = 'https://moyo-d0n.pages.dev';
  const pages = ['/', '/projets', ...(d.projects || []).map(p => '/projets/' + encodeURIComponent(p.id)), ...(d.team || []).map(m => '/equipe/' + encodeURIComponent(m.id))];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(p => `<url><loc>${site}${p}</loc></url>`).join('')}</urlset>\n`, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
