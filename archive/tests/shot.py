import sys
from playwright.sync_api import sync_playwright
W,H=int(sys.argv[1]),int(sys.argv[2]); tag=sys.argv[3]
ids=sys.argv[4].split(',')   # element ids / 'y:<px>' to scroll to
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    pg=b.new_page(viewport={"width":W,"height":H})
    logs=[]
    pg.on("console",lambda m: logs.append(f"[{m.type}] {m.text}"))
    pg.on("pageerror",lambda e: logs.append(f"[pageerror] {e}"))
    pg.goto("file:///home/claude/v2/index.html",wait_until="load")
    pg.wait_for_timeout(800)
    print("scrollH",pg.evaluate("document.documentElement.scrollHeight"),"overflowX",pg.evaluate("document.documentElement.scrollWidth>innerWidth"))
    for i,t in enumerate(ids):
        if t.startswith('y:'): y=int(t[2:])
        else: y=pg.evaluate(f"document.getElementById('{t}').getBoundingClientRect().top+scrollY")
        pg.evaluate(f"window.scrollTo({{top:{y},behavior:'instant'}})")
        pg.wait_for_timeout(2600)
        pg.screenshot(path=f"/home/claude/v2/shots/{tag}_{i}_{t.replace(':','')}.png")
    print("\n".join(logs[:30]) or "no console output")
    b.close()
