import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { buildDocumentation, categories, isGuideComment, pages, searchableLists } from './reference.mjs';
import { sourceDocument } from './source.mjs';
import { createExplorerModel } from './view-model.mjs';

const require = createRequire(import.meta.url);
const sections = pages.map(page => page.id);
const assets = new Map([
  ['/', ['text/html', new URL('./index.html', import.meta.url)]],
  ['/reference.mjs', ['text/javascript', new URL('./reference.mjs', import.meta.url)]],
  ['/source.mjs', ['text/javascript', new URL('./source.mjs', import.meta.url)]],
  ['/contract.mjs', ['text/javascript', new URL('./contract.mjs', import.meta.url)]],
  ['/canvas.css', ['text/css', new URL('./canvas.css', import.meta.url)]],
  ['/canvas.js', ['text/javascript', new URL('./canvas.js', import.meta.url)]],
]);

class GuidanceError extends Error {}

export function extractPrinciples(guide) {
  const lines = guide.replace(/\r\n/g, '\n').split('\n').filter(line => !isGuideComment(line));
  const section = heading => {
    const start = lines.findIndex(line => line.trimEnd() === `## ${heading}`);
    if (start === -1) throw new GuidanceError(`Missing design guidance section: ${heading}`);
    const remainder = lines.slice(start + 1);
    const end = remainder.findIndex(line => /^#{1,6} /.test(line));
    return remainder.slice(0, end === -1 ? remainder.length : end).join('\n').trim();
  };
  const unwrap = text => text.replace(/\s*\n\s*/g, ' ').trim();
  const intent = section('Overview').split(/\n\s*\n/).map(unwrap).filter(Boolean);
  const rules = section("Do's and Don'ts").split(/\n(?=- )/)
    .map(rule => unwrap(rule.replace(/^- /, ''))).filter(Boolean);
  if (!intent.length || !rules.length || rules.some(rule => !/^(Do |Don't )/.test(rule))) {
    throw new GuidanceError('Invalid design principles: expected overview prose and Do/Don\'t guidance');
  }
  return { intent, rules, sourceSections: ['Overview', "Do's and Don'ts"] };
}

export function loadSnapshot(root, theme) {
  const { createTokenModel, colorHex } = require(path.join(root, 'scripts', 'design-tokens.cjs'));
  const { componentContract } = require(path.join(root, 'scripts', 'design-preview.cjs'));
  const { readDesignSource } = require(path.join(root, 'scripts', 'design-source.cjs'));
  const { tokens: source, components, guide, sourceMap } = readDesignSource(root);
  const model = createTokenModel(source, theme);
  const contract = componentContract(source, components);
  const tokens = [...model.tokens].map(([name, token]) => {
    const resolved = model.resolve(name);
    return {
      name,
      layer: name.split('.')[0],
      type: resolved.type,
      raw: token.value,
      value: resolved.type === 'color' ? colorHex(resolved.value) : resolved.value,
    };
  });
  const sourceIssues = [];
  let principles = null;
  try {
    principles = extractPrinciples(guide);
  } catch (error) {
    if (!(error instanceof GuidanceError)) throw error;
    sourceIssues.push(`Principles unavailable: ${error.message}. Other reference areas are loaded independently.`);
  }
  return createExplorerModel({
    metadata: source.$extensions['ror2.design-system'],
    theme: model.theme,
    activeThemes: model.activeThemes,
    tokens,
    contract,
    guide,
    sourceMap,
    principles,
    sourceIssues,
    documentation: buildDocumentation(guide, contract, sourceMap),
  });
}

function validView(view, snapshot) {
  return view && typeof view === 'object' && !Array.isArray(view)
    && Object.keys(view).length === 4
    && sections.includes(view.section)
    && categories.some(category => category.id === view.category)
    && snapshot.activeThemes.includes(view.theme)
    && view.queries && typeof view.queries === 'object' && !Array.isArray(view.queries)
    && Object.keys(view.queries).length === Object.keys(searchableLists).length
    && Object.keys(searchableLists).every(key => typeof view.queries[key] === 'string' && view.queries[key].length <= 200);
}

export function createDesignServer(root) {
  const initial = loadSnapshot(root);
  const panel = {
    view: { section: 'tokens', category: 'all', theme: initial.theme, queries: { tokens: '', components: '', iconography: '' } },
  };
  panel.server = http.createServer(async (request, response) => {
    const send = (status, type, body, headers = {}) => {
      response.writeHead(status, {
        'Content-Type': `${type}; charset=utf-8`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors *; form-action 'none'",
        ...headers,
      });
      response.end(body);
    };
    try {
      const expectedHost = `127.0.0.1:${panel.server.address().port}`;
      if (request.headers.host !== expectedHost) {
        send(403, 'text/plain', 'Invalid host');
        return;
      }
      const url = new URL(request.url, `http://${expectedHost}`);
      if (request.method === 'POST' && url.pathname === '/api/view') {
        if (request.headers.origin !== `http://${expectedHost}`
          || request.headers['content-type'] !== 'application/json') {
          send(403, 'text/plain', 'Same-origin JSON required');
          return;
        }
        let body = '';
        for await (const chunk of request) {
          body += chunk;
          if (Buffer.byteLength(body) > 4096) {
            send(413, 'text/plain', 'View state is too large');
            return;
          }
        }
        let view;
        try {
          view = JSON.parse(body);
        } catch {
          send(400, 'text/plain', 'Invalid JSON');
          return;
        }
        if (!validView(view, loadSnapshot(root))) {
          send(400, 'text/plain', 'Invalid view state');
          return;
        }
        panel.view = { ...view, queries: { ...view.queries } };
        send(200, 'application/json', JSON.stringify(panel.view));
        return;
      }
      if (request.method !== 'GET') {
        send(405, 'text/plain', 'Method not allowed');
        return;
      }
      if (url.pathname === '/source') {
        if ([...url.searchParams.keys()].some(key => key !== 'file') || url.searchParams.getAll('file').length > 1) {
          send(400, 'text/plain', 'Source view accepts one declared module file');
          return;
        }
        const file = url.searchParams.get('file') || 'design.md';
        const { readDesignFile } = require(path.join(root, 'scripts', 'design-source.cjs'));
        let text;
        try {
          text = readDesignFile(file, root);
        } catch (error) {
          if (!(error instanceof RangeError)) throw error;
          send(404, 'text/plain', error.message);
          return;
        }
        send(200, 'text/html', sourceDocument(text, file));
      } else if (url.pathname === '/api/system') {
        const theme = url.searchParams.get('theme') || panel.view.theme;
        const initialSnapshot = loadSnapshot(root);
        if (!initialSnapshot.activeThemes.includes(theme)) {
          send(400, 'text/plain', 'Unknown or planned theme');
          return;
        }
        const snapshot = theme === initialSnapshot.theme ? initialSnapshot : loadSnapshot(root, theme);
        const tag = `"${createHash('sha256').update(JSON.stringify(snapshot)).digest('hex')}"`;
        if (request.headers['if-none-match'] === tag) {
          send(304, 'application/json', undefined, { ETag: tag });
          return;
        }
        send(200, 'application/json', JSON.stringify({ ...snapshot, view: panel.view }), { ETag: tag });
      } else if (assets.has(url.pathname)) {
        const [type, file] = assets.get(url.pathname);
        send(200, type, fs.readFileSync(file));
      } else {
        send(404, 'text/plain', 'Not found');
      }
    } catch (error) {
      send(500, 'text/plain', `Cannot read design system: ${error.message}`);
    }
  });
  return panel;
}
