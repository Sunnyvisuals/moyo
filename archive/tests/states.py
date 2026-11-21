import sys
from playwright.sync_api import sync_playwright
W,H=int(sys.argv[1]),int(sys.argv[2]); tag=sys.argv[3]; lang=sys.argv[4] if len(sys.argv)>4 else 'fr-FR'
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    ctx=b.new_context(viewport={"width":W,"height":H},locale=lang)
    pg=ctx.new_page()
    logs=[]
    pg.on("console",lambda m: logs.append(f"[{m.type}] {m.text}"))
    pg.on("pageerror",lambda e: logs.append(f"[pageerror] {e}"))
    pg.goto("file:///home/claude/v2/index.html",wait_until="load"); pg.wait_for_timeout(600)
    print("lang",pg.evaluate("document.documentElement.lang"),"h1:",pg.evaluate("document.getElementById('h1').textContent"))
    pg.screenshot(path=f"/home/claude/v2/shots/{tag}_hero.png")
    # hero with sun at 8:00 and 16:30 via slider
    for t,lab in ((480,'am'),(990,'pm')):
        pg.evaluate(f"(()=>{{const s=document.getElementById('sun');s.value={t};s.dispatchEvent(new Event('input',{{bubbles:true}}))}})()")
        pg.wait_for_timeout(200); pg.screenshot(path=f"/home/claude/v2/shots/{tag}_sun_{lab}.png")
        print(lab,pg.evaluate("[...['--sx','--sy','--a'].map(k=>document.getElementById('stage').style.getPropertyValue(k)),document.getElementById('sunInfo').textContent]"))
    # menu
    pg.click('#menuBtn'); pg.wait_for_timeout(2000)
    print("menu open:",pg.evaluate("document.getElementById('menu').matches(':popover-open')"),"focus:",pg.evaluate("document.activeElement.textContent"))
    pg.screenshot(path=f"/home/claude/v2/shots/{tag}_menu.png")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(1800)
    print("menu closed:",not pg.evaluate("document.getElementById('menu').matches(':popover-open')"),"main inert:",pg.evaluate("document.getElementById('main').inert"),"focus:",pg.evaluate("document.activeElement.id"))
    # project dialog
    pg.evaluate("document.getElementById('projets').scrollIntoView({behavior:'instant'})"); pg.wait_for_timeout(500)
    pg.hover('.row[data-p=\"1\"]'); pg.wait_for_timeout(500); pg.screenshot(path=f"/home/claude/v2/shots/{tag}_rowhover.png")
    pg.click('.row[data-p=\"1\"]'); pg.wait_for_timeout(600); pg.screenshot(path=f"/home/claude/v2/shots/{tag}_vt_mid.png")
    pg.wait_for_timeout(2400); pg.screenshot(path=f"/home/claude/v2/shots/{tag}_dialog.png")
    print("dialog open:",pg.evaluate("document.getElementById('proj').open"),"title:",pg.evaluate("document.getElementById('pTitle').textContent"))
    pg.click('#pNext'); pg.wait_for_timeout(300); print("next:",pg.evaluate("document.getElementById('pTitle').textContent"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(2000)
    print("dialog closed:",not pg.evaluate("document.getElementById('proj').open"),"focus:",pg.evaluate("document.activeElement.className"))
    # lang toggle
    pg.evaluate("window.scrollTo({top:0,behavior:'instant'})"); pg.wait_for_timeout(300)
    pg.click('#langBtn'); pg.wait_for_timeout(300)
    print("after toggle lang:",pg.evaluate("document.documentElement.lang"),pg.evaluate("document.getElementById('h1').textContent"))
    print("\n".join(logs) or "no console output")
    b.close()
