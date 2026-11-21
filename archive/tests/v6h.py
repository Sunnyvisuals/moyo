from playwright.sync_api import sync_playwright
W,H=1440,900
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    pg=b.new_context(viewport={"width":W,"height":H},locale='fr-FR').new_page(); logs=[]
    pg.on("console",lambda m: logs.append(f"[{m.type}] {m.text}")); pg.on("pageerror",lambda e: logs.append(f"[pageerror] {e}"))
    pg.goto("file:///home/claude/v2/index.html",wait_until="load"); pg.wait_for_timeout(1500)
    print("fine pointer:",pg.evaluate("matchMedia('(hover:hover) and (pointer:fine)').matches"),"split chars:",pg.evaluate("document.querySelectorAll('.ch').length"),"marquees:",pg.evaluate("document.querySelectorAll('.mq.js').length"))
    # plate tilt + letter proximity on projects
    pg.evaluate("window.scrollTo({top:document.getElementById('projets').offsetTop+60,behavior:'instant'})"); pg.wait_for_timeout(900)
    box=pg.evaluate("(()=>{const r=document.querySelector('.row[data-p=\"0\"] .plate').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
    pg.mouse.move(box[0]+box[2]*.85,box[1]+box[3]*.2); pg.wait_for_timeout(120)
    pg.mouse.move(box[0]+box[2]*.9,box[1]+box[3]*.15,steps=8); pg.wait_for_timeout(1800)
    print("tilt vars:",pg.evaluate("(()=>{const r=document.querySelector('.row[data-p=\"0\"]');return [r.style.getPropertyValue('--tx'),r.style.getPropertyValue('--ty')]})()"))
    pg.screenshot(path="/home/claude/v2/shots/z_tilt.png")
    # letters near pointer on title
    t=pg.evaluate("(()=>{const r=document.querySelector('.row[data-p=\"0\"] .r-title').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
    pg.mouse.move(t[0]+t[2]*.4,t[1]+t[3]*.5,steps=6); pg.wait_for_timeout(1900)
    print("title --p:",pg.evaluate("[...document.querySelectorAll('.row[data-p=\"0\"] .r-title .ch')].map(c=>c.style.getPropertyValue('--p'))"))
    pg.screenshot(path="/home/claude/v2/shots/z_title_hover.png",clip={"x":t[0]-30,"y":t[1]-40,"width":500,"height":120})
    # banner hover slows
    pg.evaluate("window.scrollTo({top:document.getElementById('projets').offsetTop-0,behavior:'instant'})"); pg.wait_for_timeout(800)
    x1=pg.evaluate("document.querySelector('.mq--top .mq-track').style.transform"); pg.wait_for_timeout(500); x2=pg.evaluate("document.querySelector('.mq--top .mq-track').style.transform")
    print("band moving:",x1,x2)
    # footer interactive
    pg.evaluate("window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})"); pg.wait_for_timeout(1200)
    m=pg.evaluate("(()=>{const r=document.querySelector('.monument').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})()")
    pg.mouse.move(m[0]+m[2]*.3,m[1]+m[3]*.5,steps=8); pg.wait_for_timeout(2000)
    pg.screenshot(path="/home/claude/v2/shots/z_footer.png")
    print("monument --p:",pg.evaluate("[...document.querySelectorAll('.monument .ch')].map(c=>c.style.getPropertyValue('--p'))"))
    # header roll up / down
    pg.evaluate("window.scrollTo({top:0,behavior:'instant'})"); pg.wait_for_timeout(500)
    print("header up at top:",pg.evaluate("document.getElementById('awn').classList.contains('up')"))
    pg.mouse.wheel(0,600); pg.wait_for_timeout(1500); print("header up after scroll down:",pg.evaluate("document.getElementById('awn').classList.contains('up')"))
    pg.mouse.wheel(0,-200); pg.wait_for_timeout(1500); print("header up after scroll up:",pg.evaluate("document.getElementById('awn').classList.contains('up')"))
    print("\n".join(logs) or "no console output")
    b.close()
