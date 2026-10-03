import { createAdapter, makeCapabilities } from './adapter.js';

const PRIME_HOSTS = new Set(['monetize.primeearn.com']);

function hasPrimeSignature(document) {
  return Boolean(document?.querySelector?.('[data-primeearn], #primeearn-root'));
}

export const primeEarnAdapter = createAdapter({
  name: 'primeearn',
  detect({ location, document }) {
    const hostname = String(location?.hostname ?? '').toLowerCase();
    return PRIME_HOSTS.has(hostname) || hasPrimeSignature(document);
  },
  capabilities() {
    return makeCapabilities({
      canScan: true,
      canFill: true,
      canAdvance: false,
      canReadReward: true,
      canDetectCompletion: true,
    });
  },
  scan() {
    return { questions: [] };
  },
  readOpportunity() {
    return null;
  },
  detectOutcome() {
    return null;
  },
});
