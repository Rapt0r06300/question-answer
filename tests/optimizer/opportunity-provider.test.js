import test from 'node:test';
import assert from 'node:assert/strict';
import { createOpportunityProvider } from '../../src/optimizer/opportunity-provider.js';

test('reads persisted opportunityHistory schema without throwing',async()=>{
 const load=createOpportunityProvider({app:{opportunityHistory:{schemaVersion:1,items:[{id:'a',source:'survey'}]}},location:{href:'https://example.com'}});
 assert.deepEqual(await load(),[{id:'a',source:'survey'}]);
});
test('PrimeEarn with no visible cards does not invent a launch opportunity',async()=>{
 const document={querySelectorAll:()=>[]};const load=createOpportunityProvider({app:{opportunityHistory:{schemaVersion:1,items:[]}},document,location:{href:'https://monetize.primeearn.com/x'}});
 const out=await load();assert.deepEqual(out,[]);
});
