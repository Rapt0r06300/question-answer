export function makeCapabilities(overrides = {}) {
  return Object.freeze({
    canScan: false,
    canFill: false,
    canAdvance: false,
    canReadReward: false,
    canDetectCompletion: false,
    ...overrides,
  });
}

export function createAdapter(definition) {
  for (const name of ['name', 'detect', 'capabilities', 'scan', 'readOpportunity', 'detectOutcome']) {
    if (definition?.[name] == null) throw new TypeError(`Adapter requires ${name}`);
  }
  return Object.freeze({ ...definition });
}
