/* The legal notice: who publishes the site, two sole traders who work under one name. Written in the admin and kept in KV under "legal" (never in the
   code: addresses and telephones are theirs). The page, its link in the footer and its line in the site map only exist once it is complete and put
   online from the admin. data/mentions.json gives the names to start from. */
import base from '../../data/mentions.json';
import { escHTML as e } from '../../shared/render.js';
import { MAIL } from '../../shared/seo.js';

const FIELDS = { nom: 80, adresse: 200, telephone: 30, siren: 20, tva: 30 };
const NEED = { nom: 'le nom', adresse: 'l’adresse', telephone: 'le téléphone', siren: 'le SIREN' };

export async function legalOf(env) {
  const kept = env.MOYO ? await env.MOYO.get('legal', 'json') : null;
  return kept || { ...base, online: false };
}
/* what is still to be given, in words */
export function legalMissing(info) {
  const out = [];
  info.editeurs.forEach((p, i) => { for (const [k, label] of Object.entries(NEED)) if (!p[k]) out.push(`${label} de ${p.nom || 'l’éditeur ' + (i + 1)}`); });
  if (!info.directeur) out.push('le responsable de la publication');
  return out;
}
/* keeps only known fields; throws a message when something is not what it should be */
export function legalClean(input) {
  const str = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');
  const editeurs = base.editeurs.map((_, i) => Object.fromEntries(Object.entries(FIELDS).map(([k, max]) => [k, str(input?.editeurs?.[i]?.[k], max)])));
  for (const p of editeurs) if (p.siren && !/^\d{9}$/.test(p.siren.replace(/ /g, ''))) throw new Error(`Le SIREN de ${p.nom || 'l’éditeur'} doit avoir neuf chiffres.`);
  const info = { editeurs, directeur: str(input?.directeur, 80), online: !!input?.online };
  const missing = legalMissing(info);
  if (info.online && missing.length) throw new Error(`Pour mettre la page en ligne, il manque encore ${missing.join(', ')}.`);
  return info;
}
export function legalHTML(info, lang) {
  const en = lang === 'en', colon = en ? ':' : ' :';
  const line = (label, value) => (value ? `<li>${label}${colon} ${e(value)}</li>` : '');
  const who = info.editeurs.map(p => `<h3>${e(p.nom)} EI</h3><ul><li>${en ? 'Status: sole trader (French “auto-entrepreneur” scheme)' : 'Statut : entrepreneur individuel (auto-entrepreneur)'}</li>${line(en ? 'Address' : 'Adresse', p.adresse)}${line(en ? 'Telephone' : 'Téléphone', p.telephone)}${line('SIREN', p.siren)}${line(en ? 'VAT number' : 'TVA intracommunautaire', p.tva)}</ul>`).join('');
  const intro = en ? 'moyo is the name under which two independent sole traders work together. They publish this site jointly.' : 'moyo est le nom sous lequel deux entrepreneurs individuels indépendants travaillent ensemble. Ils publient ce site conjointement.';
  return `<p>${intro}</p>${who}<h3>${en ? 'For both' : 'Pour les deux'}</h3><ul><li>${en ? 'Email:' : 'E-mail :'} <a href="mailto:${MAIL}">${MAIL}</a></li>${line(en ? 'Publication director' : 'Direction de la publication', info.directeur)}</ul>`;
}
