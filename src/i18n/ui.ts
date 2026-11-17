export const langs = ['fr', 'en'] as const;
export type Lang = (typeof langs)[number];
export type T = { fr: string; en: string };

/** Routes localisées. Les pages projet ajoutent leur slug à `projects`. */
export const routes = {
  home: { fr: '/', en: '/en/' },
  projects: { fr: '/projets/', en: '/en/projects/' },
  services: { fr: '/services/', en: '/en/services/' },
  studio: { fr: '/studio/', en: '/en/studio/' },
  contact: { fr: '/contact/', en: '/en/contact/' },
  legal: { fr: '/mentions-legales/', en: '/en/legal-notice/' },
  privacy: { fr: '/confidentialite/', en: '/en/privacy/' },
} satisfies Record<string, T>;
export type RouteKey = keyof typeof routes;

export const projectUrl = (slug: string, lang: Lang) => `${routes.projects[lang]}${slug}/`;
export const tr = (v: T | undefined, lang: Lang) => (v ? v[lang] || v.fr : '');

const dict = {
  nav: { projects: { fr: 'Projets', en: 'Work' }, services: { fr: 'Services', en: 'Services' }, studio: { fr: 'Studio', en: 'Studio' }, contact: { fr: 'Contact', en: 'Contact' } },
  skip: { fr: 'Aller au contenu', en: 'Skip to content' },
  menu: { fr: 'Menu', en: 'Menu' },
  close: { fr: 'Fermer', en: 'Close' },
  themeToggle: { fr: 'Basculer entre mode clair et sombre', en: 'Switch between light and dark mode' },
  langLabel: { fr: 'Langue', en: 'Language' },
  localTime: { fr: 'Heure locale', en: 'Local time' },
  view: { fr: 'Voir', en: 'View' },
  sample: { fr: 'Exemple', en: 'Sample' },
  onQuote: { fr: 'Sur devis', en: 'On quote' },
  allServices: { fr: 'Tous les services', en: 'All services' },
  writeUs: { fr: 'Écrire au studio', en: 'Write to the studio' },
  projectsCount: { fr: 'projets', en: 'projects' },
  filters: {
    discipline: { fr: 'Discipline', en: 'Discipline' },
    sector: { fr: 'Secteur', en: 'Sector' },
    all: { fr: 'Tout', en: 'All' },
    empty: { fr: 'Aucun projet ne correspond à ces filtres. Retirez-en un pour en voir davantage.', en: 'No project matches these filters. Remove one to see more.' },
    status: { fr: '{n} projets affichés', en: '{n} projects shown' },
  },
  case: {
    client: { fr: 'Client', en: 'Client' }, year: { fr: 'Année', en: 'Year' }, location: { fr: 'Lieu', en: 'Location' },
    disciplines: { fr: 'Disciplines', en: 'Disciplines' }, sector: { fr: 'Secteur', en: 'Sector' },
    credits: { fr: 'Crédits', en: 'Credits' }, next: { fr: 'Projet suivant', en: 'Next project' },
  },
  showreelSoon: { fr: 'Bientôt ici', en: 'Coming soon' },
  footer: { studio: { fr: 'Studio', en: 'Studio' }, follow: { fr: 'Suivre', en: 'Follow' }, write: { fr: 'Écrire', en: 'Write' }, rights: { fr: 'Tous droits réservés', en: 'All rights reserved' }, line: { fr: 'Studio de création pluridisciplinaire. Image, mouvement, espace et web, depuis la Côte d\'Azur.', en: 'Multidisciplinary creative studio. Image, motion, space and web, from the French Riviera.' } },
  form: {
    name: { fr: 'Nom', en: 'Name' }, email: { fr: 'E-mail', en: 'Email' }, company: { fr: 'Société (facultatif)', en: 'Company (optional)' },
    sector: { fr: 'Secteur', en: 'Sector' }, sectorOther: { fr: 'Autre', en: 'Other' }, choose: { fr: 'Choisir', en: 'Choose' },
    needs: { fr: 'Ce dont vous avez besoin (facultatif)', en: 'What you need (optional)' },
    message: { fr: 'Votre projet', en: 'Your project' },
    consent: { fr: 'J\'accepte que moyo utilise ces informations pour me répondre. Voir la', en: 'I agree that moyo may use this information to reply to me. See the' },
    privacy: { fr: 'politique de confidentialité', en: 'privacy policy' },
    send: { fr: 'Envoyer le message', en: 'Send message' },
    sending: { fr: 'Envoi en cours…', en: 'Sending…' },
    sent: { fr: 'Message envoyé. Nous revenons vers vous sous 48 heures.', en: 'Message sent. We\'ll get back to you within 48 hours.' },
    failed: { fr: 'Le message n\'est pas parti. Réessayez, ou écrivez-nous directement à', en: 'The message didn\'t go through. Try again, or write to us directly at' },
    required: { fr: 'Ce champ est requis.', en: 'This field is required.' },
    invalidEmail: { fr: 'Cette adresse e-mail n\'est pas valide.', en: 'This email address isn\'t valid.' },
    consentRequired: { fr: 'Cochez cette case pour que nous puissions vous répondre.', en: 'Tick this box so we can reply to you.' },
    preview: { fr: 'Aperçu : l\'envoi sera actif une fois le site en ligne sur Cloudflare. Rien n\'a été envoyé.', en: 'Preview: sending will work once the site is live on Cloudflare. Nothing was sent.' },
    direct: { fr: 'Ou directement', en: 'Or directly' },
  },
  notFound: { home: { fr: 'Retour à l\'accueil', en: 'Back to home' }, work: { fr: 'Voir les projets', en: 'See the work' } },
} as const;

type Dict = typeof dict;
/** ui('nav.projects', 'fr') */
export function ui(path: string, lang: Lang): string {
  const v = path.split('.').reduce<any>((o, k) => (o ? o[k] : undefined), dict as Dict);
  return v ? v[lang] : path;
}
