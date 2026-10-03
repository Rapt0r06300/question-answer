import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_APPROVED_HOSTS,
  approveHost,
  armProviderDiscovery,
  canOfferHostApproval,
  isHostApproved,
  normalizeHostname,
} from '../../src/core/domain-policy.js';

test('PrimeEarn default host is approved and unknown hosts are denied', () => {
  assert.equal(isHostApproved('monetize.primeearn.com', DEFAULT_APPROVED_HOSTS), true);
  assert.equal(isHostApproved('example.com', DEFAULT_APPROVED_HOSTS), false);
});

test('hostname matching is exact and resists suffix tricks', () => {
  assert.equal(isHostApproved('monetize.primeearn.com.evil.test', DEFAULT_APPROVED_HOSTS), false);
  assert.equal(isHostApproved('evilmonetize.primeearn.com', DEFAULT_APPROVED_HOSTS), false);
  assert.equal(normalizeHostname('MONETIZE.PRIMEEARN.COM.'), 'monetize.primeearn.com');
});

test('approving a host stores exactly the normalized hostname without wildcard', () => {
  const settings = { approvedHosts: ['monetize.primeearn.com'] };
  const next = approveHost('Survey.Example.COM.', settings);
  assert.deepEqual(next.approvedHosts, ['monetize.primeearn.com', 'survey.example.com']);
  assert.equal(next.approvedHosts.some((host) => host.includes('*')), false);
});

test('provider discovery window is armed for ten minutes by default', () => {
  const now = 1_000_000;
  const armed = armProviderDiscovery({ approvedHosts: [] }, now);
  assert.equal(armed.providerDiscoveryUntil, now + 600_000);
  assert.equal(canOfferHostApproval(armed, now + 599_999), true);
  assert.equal(canOfferHostApproval(armed, now + 600_001), false);
});
