import test from'node:test';import assert from'node:assert/strict';import{matchAlias}from'../../src/profile/aliases.js';
test('matches harmless wording around a known question',()=>{const m=matchAlias('Please tell us: what is your age?');assert.equal(m.key,'demographics.age');assert.ok(m.confidence>=.95)});
test('does not guess unrelated unknown questions',()=>{assert.equal(matchAlias('Which brands did you buy yesterday?'),null)});
