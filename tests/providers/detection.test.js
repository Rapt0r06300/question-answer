import test from 'node:test';
import assert from 'node:assert/strict';
import { detectProvider } from '../../src/core/detector.js';

function guardedDocument({ primeSignature = false } = {}) {
  let queries = 0;
  return {
    get queries() { return queries; },
    querySelector(selector) {
      queries += 1;
      if (primeSignature && selector === '[data-primeearn], #primeearn-root') return {};
      return null;
    },
  };
}

test('unapproved host returns before any DOM inspection', () => {
  const document = guardedDocument({ primeSignature: true });
  const result = detectProvider({
    location: { hostname: 'unapproved.example' },
    document,
    approvedHosts: ['monetize.primeearn.com'],
  });
  assert.deepEqual(result, { kind: 'unapproved-host', hostname: 'unapproved.example' });
  assert.equal(document.queries, 0);
});

test('PrimeEarn hostname is recognized with conservative capabilities', () => {
  const document = guardedDocument();
  const result = detectProvider({
    location: { hostname: 'monetize.primeearn.com' },
    document,
    approvedHosts: ['monetize.primeearn.com'],
  });
  assert.equal(result.kind, 'provider');
  assert.equal(result.provider, 'primeearn');
  assert.deepEqual(result.capabilities, {
    canScan: true,
    canFill: true,
    canAdvance: false,
    canReadReward: true,
    canDetectCompletion: true,
  });
});

test('approved host with PrimeEarn DOM signature uses PrimeEarn adapter', () => {
  const document = guardedDocument({ primeSignature: true });
  const result = detectProvider({
    location: { hostname: 'survey.example' },
    document,
    approvedHosts: ['survey.example'],
  });
  assert.equal(result.provider, 'primeearn');
  assert.ok(document.queries > 0);
});

test('approved unknown survey host falls back to generic adapter', () => {
  const result = detectProvider({
    location: { hostname: 'survey.example' },
    document: guardedDocument(),
    approvedHosts: ['survey.example'],
  });
  assert.equal(result.provider, 'generic');
  assert.deepEqual(result.capabilities, {
    canScan: true,
    canFill: true,
    canAdvance: false,
    canReadReward: false,
    canDetectCompletion: false,
  });
});
