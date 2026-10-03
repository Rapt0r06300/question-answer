import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'src', 'main.js');
const output = path.join(root, 'dist', 'question-answer.user.js');

const metadata = `// ==UserScript==
// @name         Question Answer
// @namespace    https://github.com/Rapt0r06300/question-answer
// @version      0.1.0
// @description  iPhone-first truthful survey assistant for Safari Userscripts
// @match        https://*/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @inject-into  content
// @run-at       document-idle
// ==/UserScript==`;

const importPattern = /^\s*import\s+.*?from\s+['"](.+?)['"];?\s*$/gm;
const sideEffectImportPattern = /^\s*import\s+['"](.+?)['"];?\s*$/gm;

async function bundleModule(file, seen = new Set()) {
  const resolved = path.resolve(file);
  if (seen.has(resolved)) return '';
  seen.add(resolved);
  let source = await readFile(resolved, 'utf8');
  const dependencies = [];
  for (const pattern of [importPattern, sideEffectImportPattern]) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(source))) {
      if (match[1].startsWith('.')) dependencies.push(path.resolve(path.dirname(resolved), match[1]));
    }
  }
  let prefix = '';
  for (const dependency of dependencies) prefix += `${await bundleModule(dependency, seen)}\n`;
  source = source.replace(importPattern, '').replace(sideEffectImportPattern, '');
  source = source.replace(/^\s*export\s+(?=(async\s+)?(function|class|const|let|var)\b)/gm, '');
  source = source.replace(/^\s*export\s*\{[^}]*\};?\s*$/gm, '');
  return `${prefix}\n${source}`;
}

await mkdir(path.dirname(output), { recursive: true });
const code = await bundleModule(entry);
await writeFile(output, `${metadata}\n\n(() => {\n'use strict';\n${code}\n})();\n`, 'utf8');
