// This script replaces imports of svelte-i18n with @konemono/svelte5-i18n in all .svelte files in the src directory.
import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const targetDir = './src';

const pattern = /import\s+\{\s*_\s*\}\s+from\s+['"]svelte-i18n['"];?/g;
const replacement = `import { t as _ } from '@konemono/svelte5-i18n';`;

const files = await glob(`${targetDir}/**/*.svelte`);

for (const file of files) {
  const content = await fs.readFile(file, 'utf-8');
  const updated = content.replace(pattern, replacement);

  if (content !== updated) {
    await fs.writeFile(file, updated, 'utf-8');
    console.log(`✅ Updated: ${file}`);
  }
}
