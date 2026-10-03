import test from 'node:test';
import assert from 'node:assert/strict';
import { createGMStore } from '../../src/storage/gm-store.js';

function fakeGM(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    async getValue(key, fallback) { return values.has(key) ? structuredClone(values.get(key)) : fallback; },
    async setValue(key, value) { values.set(key, structuredClone(value)); },
    async deleteValue(key) { values.delete(key); },
  };
}

test('GM store gets fallback, persists JSON values, and removes keys', async () => {
  const gm = fakeGM();
  const store = createGMStore(gm);
  assert.deepEqual(await store.get('missing', { ok: true }), { ok: true });
  await store.set('profile', { schemaVersion: 1, nested: ['x'] });
  assert.deepEqual(await store.get('profile', null), { schemaVersion: 1, nested: ['x'] });
  await store.remove('profile');
  assert.equal(await store.get('profile', null), null);
});


test('localStorage fallback works when Userscripts GM object is unavailable', async () => {
  const values = new Map();
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
  const store = createGMStore(undefined, localStorage);
  assert.deepEqual(await store.get('missing', { ok: true }), { ok: true });
  await store.set('profile', { schemaVersion: 1, nested: ['ios'] });
  assert.deepEqual(await store.get('profile', null), { schemaVersion: 1, nested: ['ios'] });
  await store.remove('profile');
  assert.equal(await store.get('profile', null), null);
});
