function isEntry(value) {
  return value && typeof value === 'object' && !Array.isArray(value) && Object.hasOwn(value, 'value');
}

function flatten(source, prefix = '', target = {}) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return target;
  for (const [key, value] of Object.entries(source)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isEntry(value)) target[path] = structuredClone(value);
    else if (value && typeof value === 'object' && !Array.isArray(value)) flatten(value, path, target);
  }
  return target;
}

export function createProfile(raw = {}) {
  if (raw?.schemaVersion === 1 && raw.fields && typeof raw.fields === 'object' && !Array.isArray(raw.fields)) {
    return { schemaVersion: 1, fields: structuredClone(raw.fields) };
  }
  return { schemaVersion: 1, fields: flatten(raw) };
}

export function updateProfileField(profile, canonicalKey, nextEntry, { unlock = false } = {}) {
  const copy = createProfile(profile);
  const current = copy.fields[canonicalKey];
  if (current?.locked && !unlock) return copy;
  copy.fields[canonicalKey] = {
    source: 'user',
    locked: false,
    ...structuredClone(nextEntry),
  };
  return copy;
}

export function resolveProfileField(profile, canonicalKey, scope = null, now = Date.now()) {
  const entry = profile?.fields?.[canonicalKey];
  if (!entry) return { status: 'unknown', key: canonicalKey };
  if (entry.validFrom && Date.parse(entry.validFrom) > now) return { status: 'not-yet-valid', key: canonicalKey, entry };
  if (entry.validUntil && Date.parse(entry.validUntil) < now) return { status: 'stale', key: canonicalKey, entry };
  if (scope && entry.scope !== scope) return { status: 'scope-mismatch', key: canonicalKey, entry, requestedScope: scope };
  return { status: 'known', key: canonicalKey, value: entry.value, entry };
}
