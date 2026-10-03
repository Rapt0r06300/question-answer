import test from 'node:test';import assert from 'node:assert/strict';import{detectVerification}from'../../src/core/verification.js';
test('detects captcha selectors',()=>{const root={querySelector:s=>s.includes('captcha')?{}:null,body:{innerText:''}};assert.equal(detectVerification(root)?.kind,'verification')});
test('does not flag normal survey copy',()=>{const root={querySelector:()=>null,body:{innerText:'What is your age?'}};assert.equal(detectVerification(root),null)});
