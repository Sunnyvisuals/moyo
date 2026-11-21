from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    pg=b.new_context(viewport={"width":1440,"height":900},locale='fr-FR').new_page()
    pg.goto("file:///home/claude/v2/index.html",wait_until="load"); pg.wait_for_timeout(1500)
    pg.evaluate("window.scrollTo({top:2400,behavior:'instant'})")
    for t in (300,1500,3000,5000):
        pg.wait_for_timeout(t if t==300 else 1500)
        print(t,pg.evaluate("(()=>{const s=document.getElementById('sunui');const h=document.querySelector('.hint');return [getComputedStyle(s).opacity,getComputedStyle(h).opacity,document.getElementById('stage').style.getPropertyValue('--open'),scrollY]})()"))
    b.close()
