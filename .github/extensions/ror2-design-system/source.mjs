export function sourceHref(line, file = 'design.md') {
  if (file !== 'design.md' && !/^design\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.md$/.test(file)) {
    throw new RangeError('Invalid design source file');
  }
  const base = file === 'design.md' ? '/source' : `/source?file=${encodeURIComponent(file)}`;
  if (line === undefined) return base;
  if (!Number.isInteger(line) || line < 1) throw new RangeError('Source line must be a positive integer');
  return `${base}#L${line}`;
}

export function sourceDocument(guide, file = 'design.md') {
  const escape = value => value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
  const lines = guide.replace(/\r\n/g, '\n').split('\n').map((text, index) => {
    const line = index + 1;
    return `<li id="L${line}"><a class="source-line-number" href="#L${line}" aria-label="Line ${line}">${line}</a><code>${escape(text) || ' '}</code></li>`;
  }).join('\n');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(file)} · Source</title><link rel="stylesheet" href="/canvas.css"></head>
<body class="source-view"><a class="skip-link" href="#source-lines">Skip to source</a>
<header><div><h1>${escape(file)}</h1><p>Local authored source · read-only · reload this page for saved changes</p></div>${file === 'design.md' ? '' : '<a href="/source">Source index</a>'}<a href="/">Open Explorer</a></header>
<main><ol id="source-lines" class="source-lines" aria-label="Source lines">${lines}</ol></main>
</body></html>`;
}
