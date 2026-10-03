import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const write = process.argv.includes('--write');
const roots = ['src', 'scripts', 'tests', 'site', '.github'].map((p) => path.resolve(p));
const files = [];
async function walk(dir) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (/\.(?:js|mjs|json|html|css|md|yml|yaml)$/.test(entry.name)) files.push(full);
  }
}
for (const root of roots) await walk(root);
let dirty = 0;
for (const file of files) {
  const original = await readFile(file, 'utf8');
  const normalized = `${original.replace(/[ \t]+$/gm, '').replace(/\n*$/, '')}\n`;
  if (normalized !== original) {
    dirty += 1;
    if (write) await writeFile(file, normalized, 'utf8');
    else console.error(`format check: ${path.relative(process.cwd(), file)}`);
  }
}
if (dirty && !write) process.exit(1);
console.log(write ? `formatted ${dirty} files` : `format check passed for ${files.length} files`);
