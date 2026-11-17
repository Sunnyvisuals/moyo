"""
Génère les visuels d'exemple (placeholders) de moyo : études de lumière abstraites,
une famille de rendu par secteur. À remplacer par les vrais visuels via /admin.

Usage : python3 scripts/generate-placeholders.py
"""
import math, os, random
import numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter

OUT = os.path.join(os.path.dirname(__file__), "..", "src", "assets", "uploads")
os.makedirs(OUT, exist_ok=True)
W, H = 1800, 1200


def hexrgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32) / 255.0


def grid(w=W, h=H):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    return x / w, y / h


def gradient(c1, c2, angle=90, w=W, h=H):
    x, y = grid(w, h)
    a = math.radians(angle)
    t = (x * math.cos(a) + y * math.sin(a))
    t = (t - t.min()) / (t.max() - t.min())
    return c1[None, None, :] * (1 - t[..., None]) + c2[None, None, :] * t[..., None]


def radial(cx, cy, r, w=W, h=H):
    x, y = grid(w, h)
    d = np.sqrt(((x - cx) * w / h) ** 2 + (y - cy) ** 2)
    return np.clip(1 - d / r, 0, 1) ** 2


def bokeh(img, rng, n, colors, rmin, rmax, blur, ymin=0.0, ymax=1.0, alpha=0.6):
    layer = np.zeros_like(img)
    x, y = grid()
    for _ in range(n):
        cx, cy = rng.uniform(-0.05, 1.05), rng.uniform(ymin, ymax)
        r = rng.uniform(rmin, rmax)
        c = colors[rng.integers(len(colors))]
        d = np.sqrt(((x - cx) * W / H) ** 2 + (y - cy) ** 2)
        disc = np.clip((r - d) / (r * 0.12 + 1e-4), 0, 1)
        rim = np.exp(-((d - r * 0.92) ** 2) / (2 * (r * 0.05) ** 2)) * 0.35
        layer += (disc * 0.65 + rim * disc.max())[..., None] * c * rng.uniform(0.25, 1.0)
    layer = gaussian_filter(layer, sigma=(blur, blur, 0))
    return img + layer * alpha


def shutters(img, rng, color, angle=-28, freq=22, duty=0.55, soft=0.08, strength=0.9):
    x, y = grid()
    a = math.radians(angle)
    u = x * math.cos(a) * W / H + y * math.sin(a)
    s = 0.5 + 0.5 * np.sin(u * freq * math.pi * 2)
    stripes = np.clip((s - (1 - duty)) / soft, 0, 1)
    window = radial(rng.uniform(0.35, 0.7), rng.uniform(0.3, 0.6), rng.uniform(0.7, 1.1))
    light = gaussian_filter(stripes * window, sigma=3)
    return img * (1 - 0.25 * light[..., None]) + light[..., None] * color * strength


def blobs(img, rng, colors, n=6, scale=0.35, alpha=0.9):
    x, y = grid()
    for _ in range(n):
        cx, cy = rng.uniform(0.1, 0.9), rng.uniform(0.1, 0.9)
        sx, sy = rng.uniform(0.1, scale), rng.uniform(0.1, scale)
        th = rng.uniform(0, math.pi)
        dx, dy = (x - cx) * W / H, y - cy
        u = dx * math.cos(th) + dy * math.sin(th)
        v = -dx * math.sin(th) + dy * math.cos(th)
        g = np.exp(-(u ** 2 / (2 * sx ** 2) + v ** 2 / (2 * sy ** 2)))
        c = colors[rng.integers(len(colors))]
        img = img * (1 - g[..., None] * alpha * 0.6) + g[..., None] * c * alpha
    return img


def arc(img, rng, color, cx, cy, r, width=0.004, glow=0.05, strength=1.0):
    x, y = grid()
    d = np.sqrt(((x - cx) * W / H) ** 2 + (y - cy) ** 2)
    line = np.exp(-((d - r) ** 2) / (2 * width ** 2))
    halo = np.exp(-((d - r) ** 2) / (2 * glow ** 2)) * 0.35
    inside = (d < r).astype(np.float32)
    shade = gaussian_filter(inside, 18)
    img = img * (1 - 0.55 * shade[..., None])
    return img + (line + halo)[..., None] * color * strength


def finish(img, rng, grain=0.045, vignette=0.55, name="x"):
    x, y = grid()
    v = 1 - vignette * (((x - 0.5) * 1.2) ** 2 + ((y - 0.5) * 1.4) ** 2)
    img = img * np.clip(v, 0, 1)[..., None]
    img = img / (1 + img * 0.35)  # tonemap doux
    noise = rng.normal(0, grain, img.shape[:2]).astype(np.float32)
    img = img + noise[..., None]
    img = np.clip(img, 0, 1) ** (1 / 1.08)
    im = Image.fromarray((img * 255).astype(np.uint8))
    im.save(os.path.join(OUT, f"{name}.jpg"), quality=84, optimize=True, progressive=True)
    print("ok", name)


P = {k: hexrgb(v) for k, v in dict(
    nuit="#07101e", nuit2="#0d1a30", laiton="#d9b27a", ambre="#f0a24a", ivoire="#efe6d6",
    bleu="#6f9fd8", glace="#bcd6f0", porphyre="#b45a45", rose="#e3a58f", calcaire="#d9d3c6",
    sable="#c9b490", olive="#59603f", magenta="#d6457a", violet="#3a2a6a", scene="#ff7a3d",
    graphite="#15181c", acier="#8a949e", menthe="#8cc7c2", blanc="#f4f5f6", encre="#0a0d14",
    vert="#2f4a3a", or_="#c7963f", noir="#050608",
).items()}


def luxe(name, seed, variant):
    rng = np.random.default_rng(seed)
    img = gradient(P["encre"], P["nuit2"] * 0.6, 120 + 40 * variant)
    if variant % 2 == 0:
        img = arc(img, rng, P["laiton"], 0.62, 0.62, 0.38, strength=0.9)
        img = bokeh(img, rng, 30, [P["laiton"], P["ambre"]], 0.01, 0.05, 6, 0.1, 0.9, 0.45)
    else:
        img = blobs(img, rng, [P["or_"] * 0.8, P["laiton"], P["nuit2"]], 5, 0.25, 0.75)
        img = gaussian_filter(img, sigma=(14, 14, 0))
        img = shutters(img, rng, P["ivoire"], angle=-62, freq=9, duty=0.3, strength=0.25)
    finish(img, rng, name=name)


def hotel(name, seed, variant):
    rng = np.random.default_rng(seed)
    img = gradient(P["calcaire"] * 0.78, P["sable"] * 0.55, 70 + 30 * variant)
    img = shutters(img, rng, P["ivoire"] * 1.05, angle=-30 + 10 * variant, freq=18 + 4 * variant, duty=0.5, strength=0.55)
    img = blobs(img, rng, [P["porphyre"], P["rose"], P["olive"] * 1.4, P["porphyre"] * 0.7], 4 + variant % 2, 0.2, 0.8)
    img = gaussian_filter(img, sigma=(3, 3, 0))
    finish(img, rng, grain=0.035, vignette=0.4, name=name)


def yacht(name, seed, variant):
    rng = np.random.default_rng(seed)
    img = gradient(P["nuit"], P["nuit2"], 95)
    if variant % 2 == 0:
        img = bokeh(img, rng, 70, [P["glace"], P["bleu"], P["ambre"], P["ivoire"]], 0.01, 0.06, 4, 0.35, 0.8, 0.7)
        # reflet horizontal
        hz = int(H * 0.66)
        rows = np.clip(2 * hz - np.arange(H), 0, H - 1)
        refl = gaussian_filter(img[rows], sigma=(26, 3, 0))
        x, y = grid()
        m = np.clip((y - 0.66) / 0.02, 0, 1)[..., None]
        img = img * (1 - m) + refl * m * 0.5
    else:
        img = arc(img, rng, P["glace"], 0.5, 2.15, 1.55, width=0.003, glow=0.03)
        img = bokeh(img, rng, 18, [P["glace"], P["ivoire"]], 0.004, 0.02, 2, 0.1, 0.5, 0.6)
    finish(img, rng, name=name)


def event(name, seed, variant):
    rng = np.random.default_rng(seed)
    img = gradient(P["noir"], P["violet"] * 0.6, 100)
    x, y = grid()
    for i in range(3 + variant):
        cx = rng.uniform(0.15, 0.85)
        a = rng.uniform(-0.4, 0.4)
        u = (x - cx - (y) * a) * W / H
        beam = np.exp(-(u ** 2) / (2 * (0.03 + 0.08 * y) ** 2)) * (0.3 + 0.7 * y)
        c = [P["magenta"], P["scene"], P["glace"]][i % 3]
        img = img + beam[..., None] * c * 0.55
    img = bokeh(img, rng, 25, [P["magenta"], P["scene"]], 0.01, 0.04, 8, 0.0, 0.5, 0.35)
    img = gaussian_filter(img, sigma=(2, 2, 0))
    finish(img, rng, grain=0.06, name=name)


def startup(name, seed, variant):
    rng = np.random.default_rng(seed)
    img = gradient(P["graphite"], P["graphite"] * 1.6, 135)
    x, y = grid()
    # métal liquide : bruit de domaine déformé
    n = gaussian_filter(rng.normal(0, 1, (H // 8, W // 8)), 6)
    n = np.array(Image.fromarray(((n - n.min()) / (n.max() - n.min()) * 255).astype(np.uint8)).resize((W, H), Image.BICUBIC)) / 255.0
    band = 0.5 + 0.5 * np.sin((n * 9 + x * 2 + variant) * math.pi)
    chrome = (band ** 3)[..., None] * P["blanc"] * 0.85 + (band ** 0.6)[..., None] * P["acier"] * 0.4
    mask = radial(0.5 + 0.15 * (variant - 1), 0.5, 0.75)[..., None]
    img = img * (1 - mask) + chrome * mask + mask * P["menthe"] * 0.05
    finish(img, rng, grain=0.03, vignette=0.6, name=name)


def studio(name, seed):
    rng = np.random.default_rng(seed)
    img = gradient(P["nuit"], P["encre"], 90)
    img = shutters(img, rng, P["laiton"], angle=-35, freq=14, duty=0.45, strength=0.6)
    img = bokeh(img, rng, 12, [P["ambre"]], 0.02, 0.06, 12, 0.6, 0.9, 0.4)
    finish(img, rng, name=name)


PROJECTS = {
    "orsane": luxe, "sauvan": luxe, "calcaire": hotel, "antheor": hotel,
    "saint-elme": yacht, "velarium": yacht, "esterel": event, "hors-champ": event, "nebule": startup,
}

import sys
if __name__ == "__main__":
    only = sys.argv[1:]
    for i, (slug, fn) in enumerate(PROJECTS.items()):
        if only and slug not in only: continue
        for v in range(4):
            fn(f"{slug}-{v}", 100 * i + v, v)
    studio("studio-0", 9001)
    studio("studio-1", 9002)
