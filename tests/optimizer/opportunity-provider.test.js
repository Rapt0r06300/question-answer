import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpportunityProvider } from '../../src/optimizer/opportunity-provider.js';

test('reads persisted opportunityHistory schema without throwing',async()=>{
 const load=createOpportunityProvider({app:{opportunityHistory:{schemaVersion:1,items:[{id:'a',source:'survey'}]}},location:{href:'https://example.com'}});
 assert.deepEqual(await load(),[{id:'a',source:'survey'}]);
});
test('adds current PrimeEarn context without mutating history',async()=>{
 const load=createOpportunityProvider({app:{opportunityHistory:{schemaVersion:1,items:[]}},location:{href:'https://monetize.primeearn.com/x'}});
 const out=await load();assert.equal(out.length,1);assert.equal(out[0].id,'current-zbd-context');assert.equal(out[0].interruptibility,'non-interruptible');
});
