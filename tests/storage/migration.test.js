import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEYS, createDefaultState } from '../../src/storage/schema.js';
import { loadAppState, saveAppState, FutureSchemaVersionError } from '../../src/storage/migration.js';

function memoryStore(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    async get(key, fallback) { return data.has(key) ? structuredClone(data.get(key)) : structuredClone(fallback); },
    async set(key, value) { data.set(key, structuredClone(value)); },
    async remove(key) { data.delete(key); },
  };
}

test('first run yields versioned defaults', async () => {
  const state = await loadAppState(memoryStore());
  assert.deepEqual(state.profile, { schemaVersion: 1, fields: {} });
  assert.deepEqual(state.settings.approvedHosts, ['monetize.primeearn.com']);
  assert.equal(state.outcomes.schemaVersion, 1);
});

test('malformed outcomes and settings reset without damaging valid profile', async () => {
  const profile = { schemaVersion: 1, fields: { age: { value: 31, locked: true, source: 'user' } } };
  const state = await loadAppState(memoryStore({
    [STORAGE_KEYS.profile]: profile,
    [STORAGE_KEYS.outcomes]: 'broken',
    [STORAGE_KEYS.settings]: 9,
  }));
  assert.deepEqual(state.profile, profile);
  assert.deepEqual(state.outcomes.items, []);
  assert.deepEqual(state.settings.approvedHosts, ['monetize.primeearn.com']);
});

test('malformed profile fails safe and exposes an in-memory recovery copy', async () => {
  const malformed = { schemaVersion: 1, fields: 'not-an-object' };
  const state = await loadAppState(memoryStore({ [STORAGE_KEYS.profile]: malformed }));
  assert.deepEqual(state.profile, { schemaVersion: 1, fields: {} });
  assert.deepEqual(state.recovery.profileRaw, malformed);
});

test('known v0 state migrates to v1 without changing locked facts', async () => {
  const store = memoryStore({
    [STORAGE_KEYS.profile]: { schemaVersion: 0, fields: { age: { value: 31, locked: true, source: 'user' } } },
  });
  const state = await loadAppState(store);
  assert.equal(state.profile.schemaVersion, 1);
  assert.equal(state.profile.fields.age.value, 31);
  assert.equal(state.profile.fields.age.locked, true);
});

test('unknown future schema fails closed without overwriting stored data', async () => {
  const future = { schemaVersion: 99, fields: {} };
  const store = memoryStore({ [STORAGE_KEYS.profile]: future });
  await assert.rejects(() => loadAppState(store), FutureSchemaVersionError);
  assert.deepEqual(store.data.get(STORAGE_KEYS.profile), future);
});

test('saveAppState persists each public namespace independently', async () => {
  const store = memoryStore();
  const state = createDefaultState();
  state.profile.fields.country = { value: 'FR', source: 'user', locked: true };
  await saveAppState(store, state);
  assert.equal(store.data.get(STORAGE_KEYS.profile).fields.country.value, 'FR');
  assert.ok(store.data.has(STORAGE_KEYS.mappings));
  assert.ok(store.data.has(STORAGE_KEYS.outcomes));
  assert.ok(store.data.has(STORAGE_KEYS.settings));
});
