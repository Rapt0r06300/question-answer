import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAnswer } from '../../src/answering/answer.js';

test('uses native value setter and emits input/change',()=>{
 const events=[];let internal='';const proto={};Object.defineProperty(proto,'value',{set(v){internal=v},get(){return internal}});const control=Object.create(proto);Object.assign(control,{tagName:'INPUT',type:'text',dispatchEvent(e){events.push(e.type)},getAttribute(){return null}});
 const result=applyAnswer({control,match:{kind:'match',option:{value:'France'}},value:'France'});
 assert.equal(result.verified,true);assert.equal(control.value,'France');assert.deepEqual(events,['input','change']);
});

test('does not double-toggle an already selected checkbox',()=>{
 let clicks=0;const control={tagName:'INPUT',type:'checkbox',checked:true,click(){clicks++;this.checked=!this.checked},dispatchEvent(){},getAttribute(){return null}};
 const result=applyAnswer({control,match:{kind:'match',option:{value:'yes'}},value:true});assert.equal(clicks,0);assert.equal(result.verified,true);
});
