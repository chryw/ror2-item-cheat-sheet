const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readContent = file => JSON.parse(fs.readFileSync(path.join(root, ...file.split('/')), 'utf8'));
const sourcePath = value => typeof value === 'string' && value.length > 0
  && !value.startsWith('/') && !value.includes('\\')
  && value.split('/').every(part => part && part !== '.' && part !== '..');

function contentContract(specification = readContent('design-content.json')) {
  if (specification.version !== 1 || specification.policy.generation !== 'forbidden'
    || specification.policy.networkEnrichment !== 'forbidden'
    || specification.policy.missingRequiredData !== 'fail-build') {
    throw new Error('Unsupported definitive-content policy');
  }
  Object.entries(specification.tenants).forEach(([id, tenant]) => {
    const authoritative = tenant.authority === 'authoritative';
    if ((!authoritative && tenant.authority !== 'illustrative-only')
      || (authoritative && (!/^[a-f0-9]{40}$/.test(tenant.revision)
        || typeof tenant.repository !== 'string' || !tenant.repository
        || !tenant.files || !Object.keys(tenant.files).length))) {
      throw new Error(`Invalid catalog authority/revision: ${id}`);
    }
    const paths = authoritative
      ? [...Object.values(tenant.files), ...Object.values(tenant.assets || {}),
        ...(tenant.composition === undefined ? [] : [tenant.composition])]
      : [tenant.file, ...(tenant.tokenExtension === undefined ? [] : [tenant.tokenExtension])];
    if (!paths.every(sourcePath)) throw new Error('Content sources require repository-relative paths');
  });
  return specification;
}

function validateCatalog(fixture, specification) {
  const spec = contentContract(specification);
  const tenant = spec.tenants[fixture.id];
  if (!tenant || !fixture.provenance || fixture.provenance.authority !== tenant.authority
    || (tenant.authority === 'authoritative' && (!/^[a-f0-9]{40}$/.test(fixture.provenance.revision)
      || fixture.provenance.repository !== tenant.repository))) {
    throw new Error(`Invalid catalog provenance: ${fixture.id}`);
  }
  const ids = new Set();
  fixture.entries.forEach(entry => {
    spec.record.required.forEach(field => {
      if (typeof entry[field] !== 'string' || !entry[field].trim()) {
        throw new Error(`Missing required catalog field ${field}: ${entry.id}`);
      }
    });
    if (ids.has(entry.id)) throw new Error(`Duplicate catalog identity: ${entry.id}`);
    ids.add(entry.id);
    if (!fixture.sections.includes(entry.section)) throw new Error(`Unknown catalog section: ${entry.id}`);
    if (tenant.authority === 'authoritative' && (typeof entry.image !== 'string' || !entry.image)) {
      throw new Error(`Missing authoritative artwork: ${entry.id}`);
    }
    fixture.filters.forEach(filter => {
      const actual = Array.isArray(entry[filter.key]) ? entry[filter.key] : [entry[filter.key]];
      if (actual.some(value => !filter.options.some(option => option.value === value))) {
        throw new Error(`Unknown catalog taxonomy ${filter.key}: ${entry.id}`);
      }
    });
  });
  if (!ids.size) throw new Error(`Empty source catalog: ${fixture.id}`);
  return fixture;
}

module.exports = { contentContract, readContent, validateCatalog };
