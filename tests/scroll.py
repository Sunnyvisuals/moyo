import os
os.makedirs("tests/out", exist_ok=True)
import sys,json
from playwright.sync_api import sync_playwright
W,H=1440,900
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    ctx=b.new_context(viewport={"width":W,"height":H},locale='fr-FR')
    pg=ctx.new_page(); logs=[]
    pg.on("console",lambda m: logs.append(f"[{m.type}] {m.text}"))
    pg.on("pageerror",lambda e: logs.append(f"[pageerror] {e}"))
    pg.goto("file://"+os.path.abspath("index.html"),wait_until="load"); pg.wait_for_timeout(1200)
    print("lenis class:",pg.evaluate("document.documentElement.className"))
    # 1. wheel easing: one notch, sample scrollY
    pg.mouse.move(700,400)
    pg.mouse.wheel(0,500)
    xs=[]
    for i in range(14):
        xs.append(round(pg.evaluate("scrollY")))
        pg.wait_for_timeout(120)
    print("scrollY after one wheel notch:",xs)
    # 2. persiennes mid state on #projT
    pg.evaluate("window.scrollTo({top:document.getElementById('projT').getBoundingClientRect().top+scrollY-H*0.78,behavior:'instant'})".replace('H',str(H)))
    pg.wait_for_timeout(900)
    pg.screenshot(path="tests/out/w_shutters.png")
    print("shut mid:",pg.evaluate("getComputedStyle(document.getElementById('projT')).getPropertyValue('--shut')"))
    # 3. awning hover on 'Voir les projets'
    pg.evaluate("window.scrollTo({top:document.getElementById('approche').offsetTop+0,behavior:'instant'})"); pg.wait_for_timeout(800)
    box=pg.evaluate("(()=>{const r=document.querySelector('.lead-link a').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
    print("link box",box)
    pg.mouse.move(box[0]+box[2]/2,box[1]+box[3]/2)
    pg.wait_for_timeout(450)
    clip={"x":box[0]-20,"y":box[1]-20,"width":box[2]+40,"height":box[3]+50}
    pg.screenshot(path="tests/out/w_awning_mid.png",clip=clip)
    pg.wait_for_timeout(2300)
    pg.screenshot(path="tests/out/w_awning_full.png",clip=clip)
    # paper button
    pg.evaluate("window.scrollTo({top:document.getElementById('studio').offsetTop+document.getElementById('studio').offsetHeight-innerHeight,behavior:'instant'})"); pg.wait_for_timeout(800)
    # 4. menu: lenis stopped, anchor to contact
    pg.click('#menuBtn'); pg.wait_for_timeout(1800)
    print("menu open, html class:",pg.evaluate("document.documentElement.className"))
    y0=pg.evaluate("scrollY"); pg.mouse.wheel(0,800); pg.wait_for_timeout(600); print("scroll moved while menu open:",pg.evaluate("scrollY")-y0)
    pg.screenshot(path="tests/out/w_menu.png")
    pg.click('.menu-list a[href="#contact"]')
    ys=[]
    for i in range(10):
        pg.wait_for_timeout(450); ys.append(round(pg.evaluate("scrollY")))
    print("scroll to contact:",ys, "contact top:",round(pg.evaluate("document.getElementById('contact').getBoundingClientRect().top")),"focus:",pg.evaluate("document.activeElement.id"),"hash:",pg.evaluate("location.hash"))
    pg.wait_for_timeout(2500)
    print("final: contact top",round(pg.evaluate("document.getElementById('contact').getBoundingClientRect().top")),"scrollY",round(pg.evaluate("scrollY")),"max",pg.evaluate("document.documentElement.scrollHeight-innerHeight"))
    pg.screenshot(path="tests/out/w_contact.png")
    # 5. dialog VT
    pg.evaluate("window.scrollTo({top:document.getElementById('projets').offsetTop+300,behavior:'instant'})"); pg.wait_for_timeout(900)
    pg.click('.row[data-p="0"]'); pg.wait_for_timeout(500); pg.screenshot(path="tests/out/w_vt_mid.png")
    pg.wait_for_timeout(3200); pg.screenshot(path="tests/out/w_dialog.png")
    print("dialog open:",pg.evaluate("document.getElementById('proj').open"),"lenis stopped:",pg.evaluate("document.documentElement.classList.contains('lenis-stopped')"))
    pg.keyboard.press("Escape"); pg.wait_for_timeout(500); pg.screenshot(path="tests/out/w_vt_close.png"); pg.wait_for_timeout(2200)
    print("dialog closed:",not pg.evaluate("document.getElementById('proj').open"),"lenis stopped:",pg.evaluate("document.documentElement.classList.contains('lenis-stopped')"))
    print("\n".join(logs) or "no console output")
    b.close()
