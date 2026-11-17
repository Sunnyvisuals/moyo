import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Texte bilingue : chaque champ éditorial existe en FR et en EN. */
const t = z.object({ fr: z.string(), en: z.string() });
const tOpt = z.object({ fr: z.string().optional().default(''), en: z.string().optional().default('') }).optional();

const yaml = (dir: string) => glob({ pattern: '**/*.yaml', base: `./src/content/${dir}` });

const sectors = defineCollection({
  loader: yaml('sectors'),
  schema: z.object({
    order: z.number().default(0),
    title: t,
    line: t,
    /** Ambiance visuelle appliquée aux pages projet de ce secteur. */
    theme: z.enum(['luxe', 'hotellerie', 'yachting', 'evenementiel', 'startup']),
  }),
});

const services = defineCollection({
  loader: yaml('services'),
  schema: z.object({
    order: z.number().default(0),
    title: t,
    short: t,
    description: t,
    deliverables: z.array(t).default([]),
    draft: z.boolean().default(false),
  }),
});


const projects = defineCollection({
  loader: yaml('projects'),
  schema: ({ image }) => {
    const block = z.discriminatedUnion('type', [
      z.object({ type: z.literal('text'), title: tOpt, body: t }),
      z.object({ type: z.literal('quote'), body: t, author: z.string().optional() }),
      z.object({ type: z.literal('image'), src: image(), alt: t, layout: z.enum(['full', 'inset']).default('full') }),
      z.object({ type: z.literal('diptych'), left: image(), right: image(), alt: t }),
      z.object({ type: z.literal('video'), url: z.string(), caption: tOpt }),
    ]);
    return z.object({
      title: z.string(),
      client: z.string(),
      year: z.number(),
      location: t,
      sectors: z.array(reference('sectors')).min(1),
      disciplines: z.array(reference('services')).min(1),
      cover: image(),
      coverAlt: t,
      summary: t,
      blocks: z.array(block).default([]),
      credits: z.array(z.object({ role: t, name: z.string() })).default([]),
      featured: z.boolean().default(false),
      order: z.number().default(0),
      /** Projet d'exemple : affiche une mention « exemple ». À passer à false pour un vrai projet. */
      placeholder: z.boolean().default(false),
      draft: z.boolean().default(false),
    });
  },
});

const team = defineCollection({
  loader: yaml('team'),
  schema: z.object({
    order: z.number().default(0),
    name: z.string(),
    role: t,
    placeholder: z.boolean().default(false),
  }),
});

const partners = defineCollection({
  loader: yaml('partners'),
  schema: z.object({
    order: z.number().default(0),
    name: z.string(),
    kind: z.enum(['client', 'partner']),
    field: t,
    url: z.string().optional(),
    placeholder: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: yaml('pages'),
  schema: z.object({}).passthrough(),
});

const settings = defineCollection({
  loader: yaml('settings'),
  schema: z.object({
    email: z.string(),
    phone: z.string().optional(),
    region: t,
    coordinates: z.string(),
    socials: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    showreel: z.object({
      mode: z.enum(['hidden', 'teaser', 'video']).default('teaser'),
      url: z.string().optional(),
      title: t,
    }),
    seo: z.object({ title: t, description: t }),
  }),
});

export const collections = { sectors, services, projects, team, partners, pages, settings };
