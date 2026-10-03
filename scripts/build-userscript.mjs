import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'src', 'main.js');
const output = path.join(root, 'dist', 'question-answer.user.js');
const metaOutput = path.join(root, 'dist', 'question-answer.meta.js');

const metadata = `// ==UserScript==
// @name         Question Answer
// @namespace    https://github.com/Rapt0r06300/question-answer
// @version      0.5.3
// @description  iPhone-first truthful survey assistant for Safari Userscripts
// @updateURL    https://rapt0r06300.github.io/question-answer/dist/question-answer.meta.js
// @downloadURL  https://rapt0r06300.github.io/question-answer/dist/question-answer.user.js
// @match        https://monetize.primeearn.com/*
// @match        https://*.primeearn.com/*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @grant        GM.listValues
// @inject-into  content
// @run-at       document-idle
// ==/UserScript==`;

const importPattern = /import\s*[^;]*?\s*from\s*['"](.+?)['"]\s*;?/g;
const sideEffectImportPattern = /import\s*['"](.+?)['"]\s*;?/g;

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
  source = source.replace(/\bexport\s+(?=(?:async\s+)?(?:function|class|const|let|var)\b)/g, '');
  source = source.replace(/\bexport\s*\{[^}]*\};?/g, '');
  return `${prefix}\n${source}`;
}

await mkdir(path.dirname(output), { recursive: true });
const code = await bundleModule(entry);
if (/\bimport\s+[^;]+\s+from\s+['\"]/m.test(code) || /\bexport\s+(?=(?:async\s+)?(?:function|class|const|let|var|\{))/m.test(code)) throw new Error('Bundled userscript still contains ESM syntax');
await writeFile(output, `${metadata}\n\n(() => {\n'use strict';\n${code}\n})();\n`, 'utf8');
execFileSync(process.execPath, ['--check', output], { stdio: 'inherit' });
await writeFile(metaOutput, `${metadata}\n`, 'utf8');
