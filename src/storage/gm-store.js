export function createGMStore(gm) {
  if (!gm || typeof gm.getValue !== 'function' || typeof gm.setValue !== 'function') {
    throw new TypeError('Userscripts GM.getValue and GM.setValue are required');
  }
  return {
    async get(namespace, fallback) {
      return gm.getValue(namespace, fallback);
    },
    async set(namespace, value) {
      await gm.setValue(namespace, value);
    },
    async remove(namespace) {
      if (typeof gm.deleteValue === 'function') await gm.deleteValue(namespace);
      else await gm.setValue(namespace, undefined);
    },
  };
}
