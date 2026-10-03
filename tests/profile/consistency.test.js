import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfile, resolveProfileField, updateProfileField } from '../../src/profile/profile.js';
import { checkConsistency } from '../../src/profile/consistency.js';

test('locked facts are not overwritten unless explicitly unlocked', () => {
  const profile = createProfile({ demographics: { age: { value: 31, source: 'user', locked: true } } });
  const next = updateProfileField(profile, 'demographics.age', { value: 44, source: 'derived' });
  assert.equal(next.fields['demographics.age'].value, 31);
  assert.equal(next.fields['demographics.age'].locked, true);
});

test('DOB and age disagreement is rejected', () => {
  const profile = createProfile({ demographics: { dob: { value: '1995-01-01', source: 'user', locked: true }, age: { value: 31, source: 'user', locked: true } } });
  const result = checkConsistency(profile, { key: 'demographics.age', value: 40, now: '2026-10-03' });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.some((reason) => reason.includes('locked')));
});

test('stale time-sensitive values require user input', () => {
  const profile = createProfile({ purchases: { brandX: { value: true, source: 'user', validUntil: '2026-09-01', scope: 'last:30:days' } } });
  assert.equal(resolveProfileField(profile, 'purchases.brandX', 'last:30:days', Date.parse('2026-10-03')).status, 'stale');
});

test('timeless ever answer cannot answer a last-30-days question', () => {
  const profile = createProfile({ purchases: { brandX: { value: true, source: 'user', scope: 'ever' } } });
  assert.equal(resolveProfileField(profile, 'purchases.brandX', 'last:30:days').status, 'scope-mismatch');
});

test('missing field remains unknown', () => { assert.equal(resolveProfileField(createProfile(), 'education.level').status, 'unknown'); });

test('screenout observations cannot modify profile facts', () => {
  const profile = createProfile({ demographics: { country: { value: 'FR', source: 'user', locked: true } } });
  const snapshot = structuredClone(profile);
  const result = checkConsistency(profile, { kind: 'screenout', provider: 'x' });
  assert.equal(result.ok, true);
  assert.deepEqual(profile, snapshot);
});
