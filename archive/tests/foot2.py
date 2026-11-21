from playwright.sync_api import sync_playwright
from PIL import Image
import sys
W,H=int(sys.argv[1]),int(sys.argv[2]); mb=sys.argv[3] if len(sys.argv)>3 else None
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    pg=b.new_page(viewport={"width":W,"height":H})
    pg.goto("file:///home/claude/v2/index.html"); pg.wait_for_timeout(600)
    if mb: pg.evaluate(f"document.querySelector('.monument').style.marginBottom='{mb}'")
    pg.evaluate("window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})"); pg.wait_for_timeout(2600)
    fs=pg.evaluate("parseFloat(getComputedStyle(document.querySelector('.monument')).fontSize)")
    pg.screenshot(path=f"/home/claude/v2/shots/foot2_{W}.png")
    b.close()
im=Image.open(f"/home/claude/v2/shots/foot2_{W}.png").convert('RGB'); w,h=im.size
paper=lambda px: px[0]>200 and px[1]>200 and px[2]>200
# ink bounds restricted to lower 60% of screen (monument region)
rows=range(int(h*.45),h)
lowest=max((y for y in rows if any(paper(im.getpixel((x,y))) for x in range(0,w,2))),default=None)
xs=[x for y in range(int(h*.5),h,5) for x in range(w) if paper(im.getpixel((x,y)))]
print('fs',round(fs,1),'lowest ink row',lowest,'gap to bottom',h-1-lowest,'gap em',round((h-1-lowest)/fs,3),'ink x',min(xs),max(xs),'of',w)
