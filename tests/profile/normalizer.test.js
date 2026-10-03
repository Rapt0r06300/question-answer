import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuestion } from '../../src/core/normalizer.js';

test('normalizes Unicode, punctuation, accents, case and whitespace', () => {
  const result = normalizeQuestion('  QUELLE   est votre ÂGE ?!  ');
  assert.equal(result.text, 'quelle est votre age');
  assert.equal(result.scope, null);
});

test('preserves and extracts material time scopes', () => {
  assert.deepEqual(normalizeQuestion('Bought in the last 30 days?'), { text: 'bought in the last 30 days', scope: 'last:30:days' });
  assert.equal(normalizeQuestion('Used in the past 12 months?').scope, 'last:12:months');
  assert.equal(normalizeQuestion('Have you ever purchased this?').scope, 'ever');
});

test('keeps numeric and unit information', () => {
  assert.equal(normalizeQuestion('How many km in 7 days?').text, 'how many km in 7 days');
});
