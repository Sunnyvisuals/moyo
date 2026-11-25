/* Texts with a form, written in the admin (the description of a project, a biography) and kept as plain words:
   - paragraphs, titles and lists, separated by an empty line; each may begin with {c} centred, {r} on the right, {j} justified,
   - "# " a title, "- " each line of a list,
   - **bold**, ==Klein==, [words](address).
   Everything else is text: nothing is ever read as HTML, and an address is only http(s), mailto or a place of the site. A text without any of this is a
   text as before. Shared by the pages, the server and the admin (src/admin.js writes it). No dependency, and `export` on the last line only: build.mjs
   strips that line to put the file inside the scripts. */

const RICH_ALIGN = { c: 'center', r: 'right', j: 'justify' };
const richURL = u => /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(u);
const richEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* the blocks of a text */
function richBlocks(s) {
  return String(s ?? '').replace(/\r\n?/g, '\n').split(/\n[ \t]*\n+/).map(t => t.trim()).filter(Boolean).map(t => {
    const m = /^\{([crj])\}\s?/.exec(t), align = m ? RICH_ALIGN[m[1]] : '', x = m ? t.slice(m[0].length) : t, lines = x.split('\n');
    if (lines.every(l => /^- /.test(l))) return { kind: 'ul', align, lines: lines.map(l => l.slice(2)) };
    return /^# /.test(x) ? { kind: 'h', align, lines: [x.slice(2)] } : { kind: 'p', align, lines: [x] };
  });
}
/* in French no line starts with : ; ? ! or a closing quote */
function richInline(s) {
  return richEsc(String(s).replace(/ ([:;?!»])/g, ' $1').replace(/« /g, '« '))
    .replace(/\[([^\[\]\n]+)\]\(([^()\s]+)\)/g, (m, t, u) => richURL(u) ? `<a href="${u}"${/^https?:/i.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>` : t)
    .replace(/\*\*(?=\S)([^]*?\S)\*\*/g, '<b>$1</b>').replace(/==(?=\S)([^]*?\S)==/g, '<em>$1</em>').replace(/\n/g, '<br>');
}
const richHTML = (s, h = 'h2') => richBlocks(s).map(b => {
  const a = b.align ? ` style="text-align:${b.align}"` : '', tag = b.kind === 'h' ? h : b.kind, li = b.lines.map(richInline);
  return `<${tag}${a}>${tag === 'ul' ? li.map(l => `<li>${l}</li>`).join('') : li[0]}</${tag}>`;
}).join('');
/* the words alone: cards, search engines, previews of links */
const richWords = s => richBlocks(s).map(b => b.lines.join(', ')).join(' ').replace(/\[([^\[\]\n]+)\]\([^()\s]+\)/g, '$1').replace(/\*\*(?=\S)([^]*?\S)\*\*/g, '$1').replace(/==(?=\S)([^]*?\S)==/g, '$1').replace(/⁠/g, '').replace(/\s+/g, ' ').trim();
/* … cut at a word */
const richShort = (s, n = 220) => { const t = richWords(s); return t.length <= n ? t : t.slice(0, n).replace(/[\s,;:.]+\S*$/, '') + '…'; };

export { richHTML, richWords, richShort };
