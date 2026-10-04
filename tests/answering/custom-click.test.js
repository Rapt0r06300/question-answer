import test from'node:test';import assert from'node:assert/strict';import{applyAnswer}from'../../src/answering/answer.js';
function card(role='option'){return{tagName:'DIV',clicked:false,getAttribute:k=>k==='role'?role:null,click(){this.clicked=true},dispatchEvent(){}}}
test('clicks a matched custom option card',()=>{const control=card();const match={kind:'match',option:{value:'Cadre',control}};const r=applyAnswer({control,match,value:'Cadre'});assert.equal(r.applied,true);assert.equal(r.verified,true);assert.equal(control.clicked,true)});
