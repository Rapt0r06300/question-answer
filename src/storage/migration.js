import { STORAGE_KEYS, createDefaultState, isPlainObject } from './schema.js';

export class FutureSchemaVersionError extends Error {
  constructor(namespace, version) {
    super(`Unsupported future schema version ${version} for ${namespace}`);
    this.name = 'FutureSchemaVersionError';
    this.namespace = namespace;
    this.version = version;
  }
}

function assertNotFuture(namespace, raw) {
  if (isPlainObject(raw) && Number.isInteger(raw.schemaVersion) && raw.schemaVersion > 1) {
    throw new FutureSchemaVersionError(namespace, raw.schemaVersion);
  }
}

function migrateProfile(raw, recovery) {
  if (raw == null) return { schemaVersion: 1, fields: {} };
  assertNotFuture('profile', raw);
  if (!isPlainObject(raw) || !isPlainObject(raw.fields)) {
    recovery.profileRaw = structuredClone(raw);
    return { schemaVersion: 1, fields: {} };
  }
  if (raw.schemaVersion === 0 || raw.schemaVersion === 1 || raw.schemaVersion == null) {
    return { schemaVersion: 1, fields: structuredClone(raw.fields) };
  }
  recovery.profileRaw = structuredClone(raw);
  return { schemaVersion: 1, fields: {} };
}

function migrateMappings(raw) {
  if (raw == null) return { schemaVersion: 1, items: {} };
  assertNotFuture('mappings', raw);
  if (!isPlainObject(raw) || !isPlainObject(raw.items)) return { schemaVersion: 1, items: {} };
  return { schemaVersion: 1, items: structuredClone(raw.items) };
}

function migrateOutcomes(raw) {
  if (raw == null) return { schemaVersion: 1, items: [] };
  assertNotFuture('outcomes', raw);
  if (!isPlainObject(raw) || !Array.isArray(raw.items)) return { schemaVersion: 1, items: [] };
  return { schemaVersion: 1, items: structuredClone(raw.items) };
}

function migrateSettings(raw) {
  const defaults = createDefaultState().settings;
  if (raw == null) return defaults;
  assertNotFuture('settings', raw);
  if (!isPlainObject(raw) || !Array.isArray(raw.approvedHosts)) return defaults;
  return {
    ...defaults,
    ...structuredClone(raw),
    schemaVersion: 1,
    approvedHosts: raw.approvedHosts.filter((host) => typeof host === 'string'),
  };
}

function migrateMigrations(raw) {
  if (raw == null) return { schemaVersion: 1, applied: [] };
  assertNotFuture('migrations', raw);
  if (!isPlainObject(raw) || !Array.isArray(raw.applied)) return { schemaVersion: 1, applied: [] };
  return { schemaVersion: 1, applied: structuredClone(raw.applied) };
}

export async function loadAppState(store) {
  const recovery = {};
  const [profileRaw, mappingsRaw, outcomesRaw, settingsRaw, migrationsRaw] = await Promise.all([
    store.get(STORAGE_KEYS.profile, null),
    store.get(STORAGE_KEYS.mappings, null),
    store.get(STORAGE_KEYS.outcomes, null),
    store.get(STORAGE_KEYS.settings, null),
    store.get(STORAGE_KEYS.migrations, null),
  ]);
  return {
    profile: migrateProfile(profileRaw, recovery),
    mappings: migrateMappings(mappingsRaw),
    outcomes: migrateOutcomes(outcomesRaw),
    settings: migrateSettings(settingsRaw),
    migrations: migrateMigrations(migrationsRaw),
    recovery,
  };
}

export async function saveAppState(store, state) {
  await Promise.all([
    store.set(STORAGE_KEYS.profile, state.profile),
    store.set(STORAGE_KEYS.mappings, state.mappings),
    store.set(STORAGE_KEYS.outcomes, state.outcomes),
    store.set(STORAGE_KEYS.settings, state.settings),
    store.set(STORAGE_KEYS.migrations, state.migrations ?? { schemaVersion: 1, applied: [] }),
  ]);
}
