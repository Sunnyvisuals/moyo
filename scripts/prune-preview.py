"""Allège le build d'aperçu (artefact) : retire l'admin, les fichiers non référencés et les sous-ensembles de polices non latins."""
import os, re, glob, shutil, sys
os.chdir(sys.argv[1] if len(sys.argv) > 1 else 'dist-preview')
shutil.rmtree('admin', ignore_errors=True)
for f in glob.glob('sitemap-*.xml') + ['robots.txt', '_headers']:
    if os.path.exists(f): os.remove(f)
for c in glob.glob('assets/*.css'):
    s = open(c).read()
    s = re.sub(r'@font-face\{[^}]*?(cyrillic|vietnamese|greek|latin-ext)[^}]*\}', '', s)
    s = re.sub(r',url\([^)]*\.woff\) format\("woff"\)', '', s)
    open(c, 'w').write(s)
texts = ''.join(open(f, errors='ignore').read() for f in glob.glob('**/*', recursive=True) if f.endswith(('.html', '.css', '.js')))
for f in os.listdir('assets'):
    if not f.endswith(('.html', '.css', '.js')) and f not in texts: os.remove('assets/' + f)
print('files:', sum(len(ff) for _, _, ff in os.walk('.')))
