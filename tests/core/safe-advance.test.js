import test from'node:test';import assert from'node:assert/strict';import{findSafeAdvance,safeAdvance}from'../../src/core/safe-advance.js';
const el=(text)=>({textContent:text,disabled:false,getAttribute:()=>null,click(){this.clicked=true}});
test('advances only an unambiguous next control',()=>{const next=el('Continuer');const root={querySelectorAll:()=>[next]};assert.equal(findSafeAdvance(root),next);assert.equal(safeAdvance(root).advanced,true);assert.equal(next.clicked,true)});
test('never treats final submit as next',()=>{const submit=el('Terminer');const root={querySelectorAll:()=>[submit]};assert.equal(findSafeAdvance(root),null)});
test('refuses ambiguous navigation',()=>{const root={querySelectorAll:()=>[el('Next'),el('Continue')]};assert.equal(findSafeAdvance(root),null)});
