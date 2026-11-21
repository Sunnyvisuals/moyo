import os
os.makedirs("tests/out", exist_ok=True)
import sys,json
from playwright.sync_api import sync_playwright
AX=open('node_modules/axe-core/axe.min.js',encoding='utf-8').read()
def run(pg,label):
    pg.evaluate(AX)
    r=pg.evaluate("axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21aa','wcag22aa','best-practice']})")
    v=r['violations']
    print(f"[{label}] violations: {len(v)}")
    for x in v:
        print('  -',x['id'],x['impact'],len(x['nodes']),'|',x['help'])
        for n in x['nodes'][:3]: print('      ',n['target'],(n.get('failureSummary') or '')[:160].replace('\n',' '))
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    for (W,H,loc) in ((1440,900,'fr-FR'),(390,844,'en-US')):
        ctx=b.new_context(viewport={"width":W,"height":H},locale=loc); pg=ctx.new_page()
        errs=[]; pg.on("pageerror",lambda e: errs.append(str(e))); pg.on("console",lambda m: errs.append(m.text) if m.type in('error','warning') else None)
        pg.goto("file://"+os.path.abspath("index.html"),wait_until="load"); pg.wait_for_timeout(5000)
        pg.evaluate("window.__ft=id=>{const m=document.getElementById('main');let y=m.getBoundingClientRect().top+scrollY;for(const c of m.children){if(c.id===id)break;y+=c.offsetHeight}return y}")
        run(pg,f"{W} {loc} top")
        for sec in ('approche','projets','services','studio','contact'):
            pg.evaluate(f"scrollTo({{top:__ft('{sec}'),behavior:'instant'}})"); pg.wait_for_timeout(2400); run(pg,f"{W} {loc} {sec}")
        pg.evaluate("scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})"); pg.wait_for_timeout(2400); run(pg,f"{W} {loc} footer")
        pg.evaluate("scrollTo({top:__ft('lumiere'),behavior:'instant'})"); pg.wait_for_timeout(2400)
        pg.evaluate("document.querySelector('details.tbl').open=true"); pg.wait_for_timeout(200)
        run(pg,f"{W} {loc} riviera+table")
        pg.click('#menuBtn'); pg.wait_for_timeout(2000); run(pg,f"{W} {loc} menu open"); pg.keyboard.press("Escape"); pg.wait_for_timeout(1800)
        pg.evaluate("scrollTo({top:__ft('projets'),behavior:'instant'})"); pg.wait_for_timeout(300)
        pg.click('.row[data-p=\"0\"]'); pg.wait_for_timeout(2800); run(pg,f"{W} {loc} dialog open")
        print('console/page errors:',errs or 'none')
        ctx.close()
    b.close()
