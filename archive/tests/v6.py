from playwright.sync_api import sync_playwright
W,H=1440,900
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    pg=b.new_context(viewport={"width":W,"height":H},locale='fr-FR').new_page(); logs=[]
    pg.on("console",lambda m: logs.append(f"[{m.type}] {m.text}")); pg.on("pageerror",lambda e: logs.append(f"[pageerror] {e}"))
    pg.goto("file:///home/claude/v2/index.html",wait_until="load"); pg.wait_for_timeout(1500)
    def flow(id): return pg.evaluate(f"(()=>{{const m=document.getElementById('main');let y=m.getBoundingClientRect().top+scrollY;for(const c of m.children){{if(c.id==='{id}')break;y+=c.offsetHeight}}return y}})()")
    for sec,fr in (('projets',.62),('projets',.25),('studio',.55),('contact',.5)):
        y=flow(sec)-H*fr
        pg.evaluate(f"window.scrollTo({{top:{y},behavior:'instant'}})"); pg.wait_for_timeout(900)
        pg.screenshot(path=f"/home/claude/v2/shots/y_stack_{sec}_{int(fr*100)}.png")
        print(sec,fr,pg.evaluate("[...document.querySelectorAll('.stk')].map(e=>e.id+':'+getComputedStyle(e).getPropertyValue('--cov')+' top='+Math.round(e.getBoundingClientRect().top)+' pos='+getComputedStyle(e).position+' H='+getComputedStyle(e).getPropertyValue('--h'))"))
    print("\n".join(logs) or "no console output")
    b.close()
