import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// URL de production : à remplacer par le domaine final (ex. https://moyo.studio)
const site = process.env.SITE_URL || 'https://moyo.example';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { inlineStylesheets: 'auto', assets: 'assets' },
  i18n: { locales: ['fr', 'en'], defaultLocale: 'fr', routing: { prefixDefaultLocale: false } },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'fr', locales: { fr: 'fr-FR', en: 'en-GB' } },
      filter: (page) => !page.includes('/admin/'),
    }),
  ],
  image: { responsiveStyles: false },
});
