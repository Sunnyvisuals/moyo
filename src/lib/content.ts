import { getCollection, getEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

const byOrder = (a: { data: { order?: number } }, b: { data: { order?: number } }) => (a.data.order ?? 0) - (b.data.order ?? 0);

export const getProjects = async () => (await getCollection('projects', (p) => !p.data.draft)).sort(byOrder);
export const getServices = async () => (await getCollection('services', (s) => !s.data.draft)).sort(byOrder);
export const getSectors = async () => (await getCollection('sectors')).sort(byOrder);
export const getTeam = async () => (await getCollection('team')).sort(byOrder);
export const getPartners = async () => (await getCollection('partners')).sort(byOrder);
export const getSettings = async () => (await getEntry('settings', 'site'))!.data;
export const getPage = async (id: string) => (await getEntry('pages', id))!.data as any;

/** Markdown minimal pour les textes légaux : intertitres ## et paragraphes. */
export function miniMarkdown(src: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return src
    .trim()
    .split(/\n\s*\n/)
    .map((block) => {
      const b = block.trim();
      if (b.startsWith('## ')) return `<h2>${esc(b.slice(3))}</h2>`;
      return `<p>${b.split('\n').map(esc).join('<br>')}</p>`;
    })
    .join('\n');
}

export const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2);
export type { Lang };
