import os
os.makedirs("tests/out", exist_ok=True)
from playwright.sync_api import sync_playwright
from PIL import Image
import sys
W,H=int(sys.argv[1]),int(sys.argv[2])
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",headless=True,args=["--no-sandbox"])
    pg=b.new_page(viewport={"width":W,"height":H})
    pg.goto("file://"+os.path.abspath("index.html")); pg.wait_for_timeout(600)
    pg.evaluate("window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})"); pg.wait_for_timeout(2500)
    pg.screenshot(path=f"tests/out/foot_{W}.png")
    print('scrollH',pg.evaluate("document.documentElement.scrollHeight"),'contact h',pg.evaluate("document.getElementById('contact').offsetHeight"))
    b.close()
im=Image.open(f"tests/out/foot_{W}.png").convert('RGB'); w,h=im.size
paper=lambda px: px[0]>200 and px[1]>200 and px[2]>200
for y in range(h-1,h-200,-1):
    if any(paper(im.getpixel((x,y))) for x in range(0,w,2)): print('last paper row',y,'gap',h-1-y); break
xs=[x for y in range(h//2,h,6) for x in range(w) if paper(im.getpixel((x,y)))]
print('ink x',min(xs),max(xs),'of',w)
