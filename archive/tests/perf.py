from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    ctx=b.new_context(viewport={"width":1440,"height":900},locale='fr-FR'); pg=ctx.new_page()
    pg.add_init_script("window.__lt=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({entryTypes:['longtask']});")
    pg.goto("file:///home/claude/v2/index.html",wait_until="load"); pg.wait_for_timeout(2500)
    print("long tasks during load:",pg.evaluate("__lt"))
    # frame times during wheel scrolling through the page
    pg.evaluate("window.__f=[];let l=performance.now();(function t(n){__f.push(n-l);l=n;requestAnimationFrame(t)})(l)")
    pg.mouse.move(700,450)
    for i in range(40):
        pg.mouse.wheel(0,260); pg.wait_for_timeout(60)
    pg.wait_for_timeout(1200)
    f=pg.evaluate("__f")
    f.sort()
    print("frames:",len(f),"median ms",round(f[len(f)//2],1),"p95",round(f[int(len(f)*.95)],1),"max",round(f[-1],1))
    print("scrollY",pg.evaluate("scrollY"),"long tasks total:",pg.evaluate("__lt.length"),pg.evaluate("__lt.slice(-6)"))
    b.close()
