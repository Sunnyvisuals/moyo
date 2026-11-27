/* Words of the header, the menu and the footer, in both languages. Written into dist/chrome.js and dist/footer.js by build.mjs (they follow
   <html lang> in the page), and used by functions/en to serve the English pages. The words of each page are in its own #en block.
   Keep `export` on the last line only. */
const CHROME = {
  fr: { 'sec.top': 'Accueil', 'sec.all': 'Projets', 'sec.services': 'Services', 'sec.studio': 'Studio', 'sec.team': 'Équipe', 'sec.contact': 'Contact', menu: 'Menu', close: 'Fermer' },
  en: { 'sec.top': 'Home', 'sec.all': 'Projects', 'sec.services': 'Services', 'sec.studio': 'Studio', 'sec.team': 'Team', 'sec.contact': 'Contact', menu: 'Menu', close: 'Close' }
};
const CHROME_ARIA = { fr: { homeAria: 'moyo, accueil', menu: 'Menu', langAria: 'Langue' }, en: { homeAria: 'moyo, home', menu: 'Menu', langAria: 'Language' } };
const FOOT_EN = {
  contact: 'Contact', footAria: 'Site footer', langAria: 'Language', fNav: 'Site map', sProj: 'Projects', sSvc: 'Services', sMth: 'Method', sStu: 'Studio', sTeam: 'Team',
  fBy: 'Made by', subH: 'Sign up for a little joy.', subBtn: 'Sign up', subPh: 'you@example.com', top: 'Back to top', fSee: 'What’s your idea', fHold: 'Hold an eye', fCalm: 'Less motion', fPriv: 'Privacy'
};

export { CHROME, CHROME_ARIA, FOOT_EN };
