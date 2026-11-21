from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    pg=b.new_context(viewport={"width":1440,"height":900},locale='fr-FR').new_page(); logs=[]
    pg.on("pageerror",lambda e: logs.append(str(e)))
    pg.goto("file:///home/claude/v2/index.html",wait_until="load"); pg.wait_for_timeout(1500)
    # seam between hero window and approach
    pg.evaluate("window.scrollTo({top:document.getElementById('approche').offsetTop-300,behavior:'instant'})"); pg.wait_for_timeout(2800)
    pg.screenshot(path="/home/claude/v2/shots/seam_hero_intro.png")
    # seam paper -> blue (studio top) to see the fixed sheet reveal
    pg.evaluate("window.scrollTo({top:document.getElementById('studio').offsetTop-450,behavior:'instant'})"); pg.wait_for_timeout(2800)
    pg.screenshot(path="/home/claude/v2/shots/seam_studio_in.png")
    print(logs or "ok")
    b.close()
