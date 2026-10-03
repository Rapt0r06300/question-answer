import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';

const root = new URL('../..', import.meta.url);
const output = new URL('../../dist/question-answer.user.js', import.meta.url);

test('build emits installable Safari Userscripts metadata', () => {
  rmSync(output, { force: true });
  execFileSync(process.execPath, ['scripts/build-userscript.mjs'], { cwd: root, stdio: 'pipe' });
  const built = readFileSync(output, 'utf8');
  for (const expected of ['@name         Question Answer','@version      0.5.0','@match        https://monetize.primeearn.com/*','@match        https://*.primeearn.com/*','@grant        GM.getValue','@grant        GM.setValue','@inject-into  content']) {
    assert.match(built, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(built, /\\bimport\\s*[^;]*?\\s*from\\s*['\"]/);
  assert.doesNotMatch(built, /\\bexport\\s+(?=(?:async\\s+)?(?:function|class|const|let|var|\\{))/);
  assert.match(built, /createGMStore/);
  assert.match(built, /createOverlay/);
});
