from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    pg=b.new_page(viewport={"width":1440,"height":900})
    errs=[]; pg.on("pageerror",lambda e: errs.append(str(e))); pg.on("console",lambda m: errs.append(m.text) if m.type in('error','warning') else None)
    pg.goto("file:///home/claude/v2/index.html"); pg.wait_for_timeout(800)
    r=pg.evaluate("""(()=>{const m=document.querySelector('.monument');const fs=parseFloat(getComputedStyle(m).fontSize);
      const rg=document.createRange();rg.selectNodeContents(m);const w=rg.getBoundingClientRect().width;
      return {fs,textW:w,ratio:w/fs,wrapW:m.parentElement.clientWidth}})()""")
    print(r, errs or 'no errors')
    b.close()
