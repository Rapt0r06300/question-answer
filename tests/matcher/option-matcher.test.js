import test from'node:test';import assert from'node:assert/strict';import{matchOption}from'../../src/matcher/option-matcher.js';
test('matches conservative cross-language equivalents',()=>{const r=matchOption({desiredValue:'France',options:[{label:'France',value:'FR'},{label:'Germany',value:'DE'}]});assert.equal(r.kind,'match')});
test('does not guess unknown semantic mappings',()=>{const r=matchOption({desiredValue:'some niche answer',options:[{label:'A',value:'a'},{label:'B',value:'b'}]});assert.equal(r.kind,'needs-user')});
