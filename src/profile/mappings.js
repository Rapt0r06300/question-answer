function normalize(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function optionFingerprint(options = []) {
  return options.map((option) => normalize(option?.value ?? option?.label ?? option?.text ?? '')).filter(Boolean).sort().join('|');
}
export function mappingKey(questionText, options = []) {
  return normalize(questionText) + '::' + optionFingerprint(options);
}
export function findMapping(state, questionText, options = []) {
  return state?.items?.[mappingKey(questionText, options)] ?? null;
}
export function saveMapping(state, questionText, options = [], answer) {
  const previous = state && typeof state === 'object' ? state : {};
  const items = { ...(previous.items || {}) };
  items[mappingKey(questionText, options)] = { answer: Array.isArray(answer) ? answer.map(String) : String(answer), source: 'user', updatedAt: new Date().toISOString() };
  return { ...previous, schemaVersion: 1, items };
}
