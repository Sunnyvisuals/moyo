"""Régénère la section « Textes des pages » de public/admin/config.yml à partir des fichiers
src/content/pages/*.yaml, pour que chaque champ existant soit éditable (et jamais perdu).
Usage : python3 scripts/cms-page-fields.py"""
import yaml, glob, os, re
LABELS = {"home": "Accueil", "services": "Services", "studio": "Studio", "contact": "Contact",
          "notfound": "Page 404", "legal": "Mentions légales", "privacy": "Confidentialité"}

def is_t(v): return isinstance(v, dict) and set(v) == {"fr", "en"}

def field(name, v):
    label = name.replace("_", " ").capitalize()
    if is_t(v):
        long = any(len(str(x)) > 90 or "\n" in str(x) for x in v.values())
        md = any("##" in str(x) for x in v.values())
        w = "markdown" if md else ("text" if long else "string")
        return {"name": name, "label": label, "widget": "object", "fields": [
            {"name": "fr", "label": "FR", "widget": w}, {"name": "en", "label": "EN", "widget": w}]}
    if isinstance(v, dict):
        return {"name": name, "label": label, "widget": "object", "fields": [field(k, x) for k, x in v.items()]}
    if isinstance(v, list) and v and isinstance(v[0], dict):
        return {"name": name, "label": label, "widget": "list", "fields": [field(k, x) for k, x in v[0].items()]}
    return {"name": name, "label": label, "widget": "string"}

files = []
for p in sorted(glob.glob("src/content/pages/*.yaml")):
    key = os.path.basename(p)[:-5]
    data = yaml.safe_load(open(p))
    files.append({"name": key, "label": LABELS.get(key, key), "file": p, "fields": [field(k, v) for k, v in data.items()]})

cfg_path = "public/admin/config.yml"
src = open(cfg_path).read()
head = src[: src.index("  - name: pages")]
block = yaml.safe_dump([{"name": "pages", "label": "Textes des pages", "files": files}], allow_unicode=True, sort_keys=False, width=200)
block = "\n".join("  " + l if l else l for l in block.splitlines())
open(cfg_path, "w").write(head + block + "\n")
print("pages:", [f["name"] for f in files])
