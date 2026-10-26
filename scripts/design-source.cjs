const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '..');
const outputs = [
  ['tokens', 'design-tokens.json'],
  ['components', 'design-components.json'],
  ['minecraft', path.join('content', 'minecraft-tokens.json')],
];
const typographyFields = ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing'];
const notice = 'Generated from design.md. DO NOT EDIT; run npm run design:generate.';
const modulePath = /^design\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.md$/;

function moduleIncludes(text, file) {
  const includes = new Map();
  let fence;
  text.replace(/\r\n/g, '\n').split('\n').forEach((line, index) => {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (marker) {
      const [, delimiter, remainder] = marker;
      if (!fence) fence = delimiter;
      else if (delimiter[0] === fence[0] && delimiter.length >= fence.length
        && !remainder.trim()) fence = undefined;
    }
    if (!fence && line.includes('<!-- design:include')) {
      const include = /^- \[[^\]]+\]\(([^)]+)\) <!-- design:include -->$/.exec(line);
      if (!include || !modulePath.test(include[1])) throw new Error(`Invalid design include: ${file}:${index + 1}`);
      if (file !== 'design.md') throw new Error(`Nested design include: ${file}:${index + 1}. List modules in design.md.`);
      includes.set(index, include[1]);
    }
  });
  if (fence) throw new Error(`Unclosed Markdown code fence: ${file}`);
  return includes;
}

function readSourceFile(directory, file) {
  const base = fs.realpathSync(directory);
  const target = fs.realpathSync(path.join(directory, ...file.split('/')));
  const relative = path.relative(base, target);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Design module escapes repository: ${file}`);
  }
  return fs.readFileSync(target, 'utf8');
}

function readDesignFile(file, directory = root) {
  const index = readSourceFile(directory, 'design.md');
  if (file === 'design.md') return index;
  if (!modulePath.test(file) || ![...moduleIncludes(index, 'design.md').values()].includes(file)) {
    throw new RangeError(`Unknown design source: ${file}`);
  }
  return readSourceFile(directory, file);
}

function readDesignDocuments(directory = root) {
  const documents = [];
  const sourceMap = [];
  const compiled = [];
  const seen = new Set();
  const append = (file, text, line) => {
    const previous = sourceMap[sourceMap.length - 1];
    const position = compiled.length + 1;
    if (previous && previous.file === file
      && previous.line + previous.end - previous.start + 1 === line) previous.end = position;
    else sourceMap.push({ file, line, start: position, end: position });
    compiled.push(text);
  };
  const read = file => {
    if (seen.has(file)) throw new Error(`Duplicate design module: ${file}`);
    seen.add(file);
    const text = readSourceFile(directory, file);
    documents.push({ file, text });
    const includes = moduleIncludes(text, file);
    text.replace(/\r\n/g, '\n').split('\n').forEach((line, index) => {
      if (includes.has(index)) read(includes.get(index));
      else append(file, line, index + 1);
    });
  };
  read('design.md');
  return { guide: compiled.join('\n'), documents, sourceMap };
}

function sourcePosition(sourceMap, line) {
  const segment = sourceMap.find(entry => line >= entry.start && line <= entry.end);
  return segment ? { file: segment.file, line: segment.line + line - segment.start } : { file: 'design.md', line };
}

function define(target, parts, value) {
  const parent = parts.slice(0, -1).reduce((node, key) => {
    if (!Object.hasOwn(node, key)) {
      Object.defineProperty(node, key, {
        value: {},
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    if (!node[key] || typeof node[key] !== 'object' || Array.isArray(node[key])
      || Object.hasOwn(node[key], '$value')) throw new Error(`Conflicting design path: ${parts.join('.')}`);
    return node[key];
  }, target);
  const key = parts[parts.length - 1];
  if (Object.hasOwn(parent, key)) throw new Error(`Duplicate design definition: ${parts.join('.')}`);
  Object.defineProperty(parent, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

function cellValue(cell) {
  const value = cell.trim().replace(/\\\|/g, '|');
  return value.startsWith('`') && value.endsWith('`') ? value.slice(1, -1) : value;
}

function cells(line) {
  if (typeof line !== 'string' || !line.startsWith('|') || !line.trimEnd().endsWith('|')) {
    throw new Error('Expected a Markdown table row');
  }
  return line.trimEnd().slice(1, -1).split(/(?<!\\)\|/).map(cellValue);
}

function tokenValue(text, type) {
  if (/^\{[a-z0-9.-]+\}$/.test(text)) return text;
  if (type === 'dimension') {
    const match = text.match(/^(-?\d+(?:\.\d+)?)(px|rem|em)$/);
    if (!match) throw new Error(`Expected a dimension with px/rem/em unit: ${text}`);
    return { value: Number(match[1]), unit: match[2] };
  }
  if (['number', 'fontWeight', 'fontFamily'].includes(type)) return JSON.parse(text);
  if (type === 'color') return text;
  throw new Error(`Expected an alias for ${type}: ${text}`);
}

function parseDesign(document, { documents = [{ file: 'design.md', text: document }], sourceMap = [] } = {}) {
  const result = Object.fromEntries(outputs.map(([key]) => [key, {}]));
  const lines = document.replace(/\r\n/g, '\n').split('\n');
  const groups = new Set();
  let fence = null;
  for (let index = 0; index < lines.length; index++) {
    try {
      const line = lines[index];
      const block = line.match(/^```yaml design:([a-z][a-zA-Z0-9-]*(?:\.[a-z][a-zA-Z0-9-]*)*)$/);
      if (block && !fence) {
        const start = index + 1;
        const end = lines.indexOf('```', start);
        if (end === -1) throw new Error(`Unclosed design block: ${block[1]}`);
        const parts = block[1].split('.');
        if (!Object.hasOwn(result, parts[0])) throw new Error(`Unknown design output: ${parts[0]}`);
        const value = yaml.load(lines.slice(start, end).join('\n'), {
          schema: yaml.JSON_SCHEMA,
          filename: (() => {
            const position = sourcePosition(sourceMap, start + 1);
            return `${position.file}:${position.line}`;
          })(),
          onWarning(error) { throw error; },
        });
        if (value === undefined || value === null
        || (parts.length === 1 && (typeof value !== 'object' || Array.isArray(value)))) {
          throw new Error(`Empty or invalid design block: ${block[1]}`);
        }
        if (parts.length === 1) {
          Object.entries(value).forEach(([key, entry]) => define(result, [...parts, key], entry));
        } else {
          define(result, parts, value);
        }
        index = end;
      } else if (/^\s*(`{3,}|~{3,})/.test(line)) {
        if (!fence && /\bdesign:/.test(line)) throw new Error(`Malformed design block: ${line}`);
        const marker = line.trim().match(/^(`{3,}|~{3,})/)[1];
        if (!fence) fence = marker;
        else if (line.trim() === fence) fence = null;
      } else if (!fence) {
        const group = line.match(/^### Token group: ([a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*) \(([a-zA-Z]+)\)$/);
        if (!group && line.startsWith('### Token group:')) throw new Error(`Malformed token group: ${line}`);
        if (group) {
          const [, name, type] = group;
          const parts = name.split('.');
          if (!Object.hasOwn(result, parts[0])) throw new Error(`Unknown design output: ${parts[0]}`);
          if (parts.length < 2 || groups.has(name)) throw new Error(`Duplicate or invalid token group: ${name}`);
          groups.add(name);
          if (type !== 'alias') define(result, [...parts, '$type'], type);
          while (lines[index + 1] === '') index++;
          const header = cells(lines[++index]);
          const expected = type === 'typography'
            ? ['Token', 'Font family', 'Font size', 'Weight', 'Line height', 'Letter spacing', 'Description']
            : ['Token', 'Value', 'Description'];
          const separator = cells(lines[++index]);
          if (JSON.stringify(header) !== JSON.stringify(expected)
        || separator.length !== expected.length || !separator.every(cell => /^:?-{3,}:?$/.test(cell))) {
            throw new Error(`Invalid token table header: ${name}`);
          }
          let count = 0;
          while (lines[index + 1] && lines[index + 1].startsWith('|')) {
            const row = cells(lines[++index]);
            if (row.length !== expected.length || !/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)*$/.test(row[0])) {
              throw new Error(`Invalid token row in ${name}`);
            }
            const value = type === 'typography'
              ? Object.fromEntries(typographyFields.map(
                (field, offset) => [field, row[offset + 1]],
              ))
              : tokenValue(row[1], type);
            const token = { $value: value };
            if (row[row.length - 1]) token.$description = row[row.length - 1];
            define(result, [...parts, ...row[0].split('.')], token);
            count++;
          }
          if (!count) throw new Error(`Empty token table: ${name}`);
        }
      }
    } catch (error) {
      const position = sourcePosition(sourceMap, Math.min(index + 1, lines.length));
      throw new Error(`${position.file}:${position.line}: ${error.message}`, { cause: error });
    }
  }
  if (fence) throw new Error('Unclosed Markdown code fence');
  if (!result.tokens.$extensions || !result.components.version || !result.minecraft.$extensions) {
    throw new Error('Missing required design definitions in design.md');
  }
  return { ...result, guide: document, documents, sourceMap };
}

function readDesignSource(directory = root) {
  const source = readDesignDocuments(directory);
  return parseDesign(source.guide, source);
}

function readDesignArtifact(file, directory = root) {
  const output = outputs.find(([, target]) => target === path.normalize(file));
  if (!output) throw new Error(`Unknown compiled design artifact: ${file}`);
  return readDesignSource(directory)[output[0]];
}

function generatedArtifacts(source) {
  return new Map(outputs.map(([key, file]) => [file, `${JSON.stringify({
    ...source[key],
    $description: `${notice}${source[key].$description ? ` ${source[key].$description}` : ''}`,
  }, null, 2)}\n`]));
}

function checkArtifacts(source, directory = root) {
  let count = 0;
  generatedArtifacts(source).forEach((expected, file) => {
    const target = path.join(directory, file);
    if (!fs.existsSync(target)) return;
    if (fs.readFileSync(target, 'utf8') !== expected) {
      throw new Error(`Stale generated artifact: ${file}. Edit design.md, then run npm run design:generate.`);
    }
    count++;
  });
  return count;
}

module.exports = {
  parseDesign,
  readDesignSource,
  readDesignDocuments,
  readDesignFile,
  readDesignArtifact,
  generatedArtifacts,
  checkArtifacts,
};
