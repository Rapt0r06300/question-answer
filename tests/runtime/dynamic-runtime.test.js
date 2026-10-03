import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntime } from '../../src/core/runtime.js';

function state(){return{value:'BOOTING',transition(next){this.value=next;return{ok:true,state:next}}}}
function documentWith(controls=[]){return{
  documentElement:{},
  querySelector(){return null},
  querySelectorAll(selector){
    if(selector==='iframe') return [];
    if(selector.includes('input')) return controls;
    return [];
  },
}}

test('start waits safely when no questionnaire is present', async()=>{
  const overlay={messages:[],setStatus(x){this.messages.push(x)}};
  const runtime=createRuntime({location:{hostname:'monetize.primeearn.com'},document:documentWith([]),state:state(),profile:{fields:{}},overlay,approvedHosts:['monetize.primeearn.com']});
  assert.equal(await runtime.canStart(),true);
  const result=await runtime.start();
  assert.equal(result.kind,'waiting-for-questionnaire');
  assert.equal(overlay.messages.at(-1),'En attente d’un questionnaire…');
  runtime.stop();
});
