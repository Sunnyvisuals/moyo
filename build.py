"""Assemble the single self-contained page: src/index.src.html + font + Lenis -> index.html."""
import base64, pathlib
root = pathlib.Path(__file__).resolve().parent
font = (root / "fonts/hanken-grotesk-latin-wght-normal.woff2").read_bytes()
lenis = (root / "vendor/lenis.min.js").read_text(encoding="utf-8").replace("//# sourceMappingURL=lenis.min.js.map", "")
assert "</script" not in lenis
src = (root / "src/index.src.html").read_text(encoding="utf-8")
out = src.replace("__FONT__", base64.b64encode(font).decode()).replace("__LENIS__", lenis)
(root / "index.html").write_text(out, encoding="utf-8")
print("built src", len(src), "index", len(out))
