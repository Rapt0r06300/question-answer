import { isHostApproved, normalizeHostname } from './domain-policy.js';
import { primeEarnAdapter } from '../providers/primeearn.js';
import { genericAdapter } from '../providers/generic.js';

export function detectProvider({ location, document, approvedHosts, adapters } = {}) {
  const hostname = normalizeHostname(location?.hostname ?? '');
  if (!isHostApproved(hostname, approvedHosts)) {
    return { kind: 'unapproved-host', hostname };
  }

  const candidates = adapters ?? [primeEarnAdapter, genericAdapter];
  for (const adapter of candidates) {
    if (adapter.detect({ location: { ...location, hostname }, document })) {
      return {
        kind: 'provider',
        provider: adapter.name,
        adapter,
        capabilities: adapter.capabilities({ location, document }),
      };
    }
  }
  return { kind: 'unsupported', hostname };
}
