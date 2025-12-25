import fs from 'node:fs/promises';
import path from 'node:path';
import glob from 'fast-glob';
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMPONENTS_DIR = path.join(__dirname, 'components');

export async function buildComponents() {
  const files = (await glob('**/*.hbs', { cwd: COMPONENTS_DIR, absolute: true }))

  const partials = {};
  let configBundle = `{{!-- Auto-generated; do not edit --}}\n`;

  const inlineRE = /{{#\*inline\s+"([^"]+)"}}([\s\S]*?){{\/inline}}/g;

  for (const abs of files) {
    const name = path
      .relative(COMPONENTS_DIR, abs)
      .replace(/\\/g, '/')
      .replace(/\.hbs$/, '');

    const src = await fs.readFile(abs, 'utf8');

    // collect inline blocks
    const blocks = {};
    let m;
    while ((m = inlineRE.exec(src))) blocks[m[1]] = m[2].trim();

    const templateBlock = blocks['het:template'];
    const configBlock = blocks['het:config'];

    if (!templateBlock) throw new Error(`Missing het:template in ${abs}`);
    if (!configBlock) throw new Error(`Missing het:config in ${abs}`);

    partials[`components/${name}`] = templateBlock;

    configBundle += `\n{{!-- ${name} --}}\n${configBlock}\n`;
  }

  return {
    partials,
    configBundle,
  };
}
