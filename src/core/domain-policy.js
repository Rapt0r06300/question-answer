export const DEFAULT_APPROVED_HOSTS = Object.freeze(['monetize.primeearn.com']);

export function normalizeHostname(hostname) {
  if (typeof hostname !== 'string') return '';
  return hostname.trim().toLowerCase().replace(/\.+$/, '');
}

export function isHostApproved(hostname, approvedHosts = DEFAULT_APPROVED_HOSTS) {
  const normalized = normalizeHostname(hostname);
  if (!normalized) return false;
  return approvedHosts.some((host) => normalizeHostname(host) === normalized);
}

export function approveHost(hostname, settings) {
  const normalized = normalizeHostname(hostname);
  if (!normalized || normalized.includes('*') || normalized.includes('/')) {
    throw new TypeError('A concrete hostname is required');
  }
  const approvedHosts = Array.isArray(settings?.approvedHosts) ? [...settings.approvedHosts] : [];
  if (!isHostApproved(normalized, approvedHosts)) approvedHosts.push(normalized);
  return { ...settings, approvedHosts };
}

export function armProviderDiscovery(settings, now = Date.now(), ttlMs = 600_000) {
  const safeTtl = Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : 600_000;
  return { ...settings, providerDiscoveryUntil: now + safeTtl };
}

export function canOfferHostApproval(settings, now = Date.now()) {
  return Number.isFinite(settings?.providerDiscoveryUntil) && settings.providerDiscoveryUntil >= now;
}
