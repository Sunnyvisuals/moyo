import os
os.makedirs("tests/out", exist_ok=True)
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    # 1 no-JS
    ctx=b.new_context(viewport={"width":1440,"height":900},java_script_enabled=False,locale='fr-FR'); pg=ctx.new_page()
    pg.goto("file://"+os.path.abspath("index.html")); pg.wait_for_timeout(500)
    pg.screenshot(path="tests/out/nojs_0.png")
    pg.evaluate("1") if False else None
    vis=pg.evaluate("[...document.querySelectorAll('h1,h2,h3')].map(e=>e.textContent.trim().slice(0,30)+' | '+getComputedStyle(e).visibility+' '+getComputedStyle(e).opacity).slice(0,6)") if False else None
    # popover works without JS?
    pg.click('#menuBtn'); pg.wait_for_timeout(2000)
    print('no-JS menu open:',pg.evaluate("document.getElementById('menu').matches(':popover-open')"))
    pg.screenshot(path="tests/out/nojs_menu.png")
    ctx.close()
    # 2 reduced motion
    ctx=b.new_context(viewport={"width":1440,"height":900},reduced_motion='reduce',locale='fr-FR'); pg=ctx.new_page()
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e)))
    pg.goto("file://"+os.path.abspath("index.html")); pg.wait_for_timeout(500)
    print('reduced: hero height',pg.evaluate("document.getElementById('top').offsetHeight"),'open',pg.evaluate("getComputedStyle(document.getElementById('stage')).getPropertyValue('--open')"))
    pg.screenshot(path="tests/out/rm_0.png")
    pg.evaluate("document.getElementById('projets').scrollIntoView({behavior:'instant'})"); pg.wait_for_timeout(300)
    pg.click('.row[data-p=\"2\"]'); pg.wait_for_timeout(300)
    print('reduced: dialog open instantly',pg.evaluate("document.getElementById('proj').open"),errs or 'no errors')
    ctx.close()
    b.close()
