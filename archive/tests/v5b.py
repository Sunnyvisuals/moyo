from playwright.sync_api import sync_playwright
W,H=1440,900
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    pg=b.new_context(viewport={"width":W,"height":H},locale='fr-FR').new_page(); logs=[]
    pg.on("console",lambda m: logs.append(f"[{m.type}] {m.text}")); pg.on("pageerror",lambda e: logs.append(f"[pageerror] {e}"))
    pg.goto("file:///home/claude/v2/index.html",wait_until="load"); pg.wait_for_timeout(1200)
    for frac,tag in ((0.92,'a'),(0.80,'b'),(0.66,'c')):
        pg.evaluate(f"window.scrollTo({{top:document.getElementById('svcT').getBoundingClientRect().top+scrollY-{H*frac},behavior:'instant'}})"); pg.wait_for_timeout(700)
        print(tag,"shut",pg.evaluate("getComputedStyle(document.getElementById('svcT')).getPropertyValue('--shut')"))
        pg.screenshot(path=f"/home/claude/v2/shots/x_shut_{tag}.png",clip={"x":0,"y":int(H*frac)-60,"width":W,"height":160})
    # words in the approach
    pg.evaluate("window.scrollTo({top:document.getElementById('approche').offsetTop-300,behavior:'instant'})"); pg.wait_for_timeout(800)
    pg.screenshot(path="/home/claude/v2/shots/x_words.png")
    # hero parallax at 35%
    pg.evaluate("window.scrollTo({top:0,behavior:'instant'})"); pg.wait_for_timeout(300)
    pg.evaluate("window.scrollTo({top:620,behavior:'instant'})"); pg.wait_for_timeout(2600)
    pg.screenshot(path="/home/claude/v2/shots/x_hero35.png")
    # dialog with plate
    pg.evaluate("window.scrollTo({top:document.getElementById('projets').offsetTop+200,behavior:'instant'})"); pg.wait_for_timeout(700)
    pg.click('.row[data-p="2"]'); pg.wait_for_timeout(4200)
    pg.evaluate("document.getElementById('proj').scrollTo({top:240,behavior:'instant'})"); pg.wait_for_timeout(500)
    pg.screenshot(path="/home/claude/v2/shots/x_dialog_plate.png")
    print("\n".join(logs) or "no console output")
    b.close()
