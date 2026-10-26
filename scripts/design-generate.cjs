const fs = require('node:fs');
const path = require('node:path');
const { readDesignSource, generatedArtifacts } = require('./design-source.cjs');
const { validateTokens } = require('./design-tokens.cjs');
const { componentContract, previewSource } = require('./design-preview.cjs');

if (process.argv.length !== 2) throw new Error('Usage: npm run design:generate');
const source = readDesignSource();
validateTokens(source.tokens);
componentContract(source.tokens, source.components);
validateTokens(previewSource(source.tokens, source.minecraft));
generatedArtifacts(source).forEach((content, file) => {
  fs.writeFileSync(path.join(__dirname, '..', file), content);
});
process.stdout.write('Generated JSON contracts from design.md. The authored specification was not modified.\n');
