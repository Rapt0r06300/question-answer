import test from'node:test';import assert from'node:assert/strict';import{matchAlias}from'../../src/profile/aliases.js';
test('matches harmless wording around a known question',()=>{const m=matchAlias('Please tell us: what is your age?');assert.equal(m.key,'demographics.age');assert.ok(m.confidence>=.95)});
test('does not guess unrelated unknown questions',()=>{assert.equal(matchAlias('Which brands did you buy yesterday?'),null)});

test('matches expanded truthful profile fields',()=>{assert.equal(matchAlias('What is your postal code?').key,'demographics.postalCode');assert.equal(matchAlias('Do you own a car?').key,'transport.vehicleOwnership');assert.equal(matchAlias('What operating system does your phone use?').key,'technology.mobileOS')});
