// Copies the repo's README, LICENSE and CHANGELOG into the built package. ng-packagr only
// picks them up from projects/pada-ds, and the README there would drift from the root one.
import { copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist/pada-ds-angular');

for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
  await copyFile(path.join(rootDir, file), path.join(distDir, file));
}
console.log('Copied README.md, LICENSE and CHANGELOG.md into dist/pada-ds-angular');
