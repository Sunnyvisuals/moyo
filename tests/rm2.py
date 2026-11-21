import os
os.makedirs("tests/out", exist_ok=True)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    ctx=b.new_context(viewport={"width":1440,"height":900},reduced_motion='reduce',locale='fr-FR'); pg=ctx.new_page(); errs=[]
    pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto("file://"+os.path.abspath("index.html")); pg.wait_for_timeout(1500)
    print("html class:",pg.evaluate("document.documentElement.className"))
    print("anim names:",pg.evaluate("['#svcT','.plate .f','.entry-w .c','.link','.cs b'].map(s=>{const e=document.querySelector(s);return s+':'+(e?getComputedStyle(e).animationName:'-')})"))
    print("shut:",pg.evaluate("getComputedStyle(document.getElementById('svcT')).getPropertyValue('--shut')"))
    for i,t in enumerate(('projets','studio')):
        pg.evaluate(f"document.getElementById('{t}').scrollIntoView({{behavior:'instant'}})"); pg.wait_for_timeout(500)
        pg.screenshot(path=f"tests/out/rm2_{t}.png")
    print(errs or "no errors")
    ctx.close()
    ctx=b.new_context(viewport={"width":1440,"height":900},java_script_enabled=False,locale='fr-FR'); pg=ctx.new_page()
    pg.goto("file://"+os.path.abspath("index.html")); pg.wait_for_timeout(500)
    pg.evaluate("1") if False else None
    b.close()
