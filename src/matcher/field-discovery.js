import { normalizeQuestion } from '../core/normalizer.js';

function textOf(node) { return String(node?.textContent ?? '').replace(/\s+/g, ' ').trim(); }
function labelledText(control, root) {
  const ariaLabel = control?.getAttribute?.('aria-label'); if (ariaLabel?.trim()) return ariaLabel.trim();
  const labelledBy = control?.getAttribute?.('aria-labelledby');
  if (labelledBy?.trim() && root?.getElementById) {
    const text = labelledBy.trim().split(/\s+/).map((id) => textOf(root.getElementById(id))).filter(Boolean).join(' '); if (text) return text;
  }
  const fieldset = control?.closest?.('fieldset'); const legend = fieldset?.querySelector?.('legend'); if (textOf(legend)) return textOf(legend);
  if (control?.labels?.length) { const text = [...control.labels].map(textOf).filter(Boolean).join(' '); if (text) return text; }
  if (control?.id && root?.querySelector) { const escaped = String(control.id).replace(/["\\]/g, '\\$&'); const label = root.querySelector(`label[for="${escaped}"]`); if (textOf(label)) return textOf(label); }
  const questionContainer = control?.closest?.('[data-question], [role="group"]');
  if (questionContainer) { const explicit = questionContainer.getAttribute?.('data-question'); if (explicit?.trim()) return explicit.trim(); }
  return '';
}
function optionLabel(control, root) {
  if (control?.labels?.length) { const text = [...control.labels].map(textOf).filter(Boolean).join(' '); if (text) return text; }
  const ariaLabel = control?.getAttribute?.('aria-label'); if (ariaLabel?.trim()) return ariaLabel.trim();
  if (control?.id && root?.querySelector) { const escaped = String(control.id).replace(/["\\]/g, '\\$&'); const label = root.querySelector(`label[for="${escaped}"]`); if (textOf(label)) return textOf(label); }
  return textOf(control) || String(control?.value ?? '');
}
function controlKind(control) {
  const tag = String(control?.tagName ?? '').toUpperCase(); const type = String(control?.type ?? '').toLowerCase();
  if (tag === 'TEXTAREA') return 'textarea'; if (tag === 'SELECT') return 'select'; if (tag === 'BUTTON' || control?.getAttribute?.('data-answer') != null) return 'button-card'; if (tag === 'INPUT' && type === 'radio') return 'radio-group'; if (tag === 'INPUT' && type === 'checkbox') return 'checkbox-group'; if (tag === 'INPUT') return 'input'; return null;
}
export function discoverQuestions(root) {
  if (!root?.querySelectorAll) return [];
  const controls = [...root.querySelectorAll('input, select, textarea, button[data-answer], button[role="radio"], button[role="checkbox"]')]; const results = []; const grouped = new Map();
  controls.forEach((control, index) => {
    const kind = controlKind(control); if (!kind) return;
    if (kind === 'radio-group' || kind === 'checkbox-group') {
      const groupKey = `${kind}:${control.name || control.id || `anon-${index}`}`; let group = grouped.get(groupKey);
      if (!group) { group = { kind, questionText: labelledText(control, root), controls: [], options: [] }; grouped.set(groupKey, group); results.push(group); }
      group.controls.push(control); group.options.push({ label: optionLabel(control, root), value: control.value, control }); if (!group.questionText) group.questionText = labelledText(control, root); return;
    }
    const options = kind === 'select' ? [...(control.options ?? [])].map((option) => ({ label: textOf(option) || String(option.label ?? ''), value: option.value, control: option })) : kind === 'button-card' ? [{ label: optionLabel(control, root), value: control.value || control.getAttribute?.('data-answer') || optionLabel(control, root), control }] : [];
    results.push({ kind, questionText: labelledText(control, root), controls: [control], options });
  }); return results;
}
export function parseQuestion(candidate) { return { ...candidate, normalized: normalizeQuestion(candidate?.questionText ?? '') }; }
export function discoverFrames(root) {
  if (!root?.querySelectorAll) return [];
  return [...root.querySelectorAll('iframe')].map((frame) => { try { const document = frame.contentDocument; if (document) return { kind: 'accessible-frame', document, frame }; } catch { return { kind: 'inaccessible-frame', frame }; } return { kind: 'inaccessible-frame', frame }; });
}
