import sys,json
from playwright.sync_api import sync_playwright
AX=open('/home/claude/v2/fonts/node_modules/axe-core/axe.min.js',encoding='utf-8').read()
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
        pg.goto("file:///home/claude/v2/index.html",wait_until="load"); pg.wait_for_timeout(5000)
        run(pg,f"{W} {loc} top")
        for sec in ():
            pg.evaluate(f"document.getElementById('{sec}').scrollIntoView({{behavior:'instant'}})"); pg.wait_for_timeout(2400); run(pg,f"{W} {loc} {sec}")
        print('skip');ctx.close();continue
        pg.click('#menuBtn'); pg.wait_for_timeout(2000); run(pg,f"{W} {loc} menu open"); pg.keyboard.press("Escape"); pg.wait_for_timeout(1800)
        pg.evaluate("document.getElementById('projets').scrollIntoView({behavior:'instant'})"); pg.wait_for_timeout(300)
        pg.click('.row[data-p=\"0\"]'); pg.wait_for_timeout(2800); run(pg,f"{W} {loc} dialog open")
        print('console/page errors:',errs or 'none')
        ctx.close()
    b.close()
