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
  const questionContainer = control?.closest?.('[data-question], [role="group"], fieldset, form, section, article, li, div');
  if (questionContainer) { const explicit = questionContainer.getAttribute?.('data-question'); if (explicit?.trim()) return explicit.trim(); const heading=questionContainer.querySelector?.('legend,h1,h2,h3,h4,h5,h6,[role="heading"],p,label'); const text=textOf(heading); if(text&&text.length<=300)return text; }
  const placeholder=control?.getAttribute?.('placeholder'); if(placeholder?.trim())return placeholder.trim();
  return '';
}
function groupQuestionText(control,root){const container=control?.closest?.('[role="group"],[data-question],fieldset');if(container){const explicit=container.getAttribute?.('data-question');if(explicit?.trim())return explicit.trim();const by=container.getAttribute?.('aria-labelledby');if(by?.trim()&&root?.getElementById){const t=by.trim().split(/\s+/).map(id=>textOf(root.getElementById(id))).filter(Boolean).join(' ');if(t)return t}const heading=container.querySelector?.('legend,h1,h2,h3,h4,h5,h6,[role="heading"],p');const t=textOf(heading);if(t)return t}return labelledText(control,root)}
function optionLabel(control, root) {
  if (control?.labels?.length) { const text = [...control.labels].map(textOf).filter(Boolean).join(' '); if (text) return text; }
  const ariaLabel = control?.getAttribute?.('aria-label'); if (ariaLabel?.trim()) return ariaLabel.trim();
  if (control?.id && root?.querySelector) { const escaped = String(control.id).replace(/["\\]/g, '\\$&'); const label = root.querySelector(`label[for="${escaped}"]`); if (textOf(label)) return textOf(label); }
  return textOf(control) || String(control?.value ?? '');
}
function controlKind(control) {
  const tag = String(control?.tagName ?? '').toUpperCase(); const type = String(control?.type ?? '').toLowerCase();
  if (tag === 'TEXTAREA') return 'textarea'; if (tag === 'SELECT') return 'select'; if (control?.getAttribute?.('role')==='radio') return 'radio-group'; if (control?.getAttribute?.('role')==='checkbox') return 'checkbox-group'; if (tag === 'BUTTON' || control?.getAttribute?.('data-answer') != null) return 'button-card'; if (tag === 'INPUT' && type === 'radio') return 'radio-group'; if (tag === 'INPUT' && type === 'checkbox') return 'checkbox-group'; if (tag === 'INPUT') return 'input'; return null;
}
export function discoverQuestions(root) {
  if (!root?.querySelectorAll) return [];
  const controls = [...root.querySelectorAll('input:not([type="hidden"]), select, textarea, button[data-answer], button[role="radio"], button[role="checkbox"], [role="radio"], [role="checkbox"]')]; const results = []; const grouped = new Map();
  controls.forEach((control, index) => {
    const kind = controlKind(control); if (!kind) return;
    if (kind === 'radio-group' || kind === 'checkbox-group' || kind === 'button-card') {
      const nativeName=String(control.name||'').trim();const question=groupQuestionText(control,root);const container=control.closest?.('[role="group"],[data-question],fieldset');const containerKey=container?.id||container?.getAttribute?.('data-question')||question;const groupKey=`${kind}:${nativeName||containerKey||`anon-${index}`}`; let group = grouped.get(groupKey);
      if (!group) { group = { kind, questionText: question, controls: [], options: [] }; grouped.set(groupKey, group); results.push(group); }
      group.controls.push(control); group.options.push({ label: optionLabel(control, root), value: control.value || control.getAttribute?.('data-answer') || optionLabel(control, root), control }); if (!group.questionText) group.questionText = question; return;
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

export function discoverOpenShadowRoots(root){if(!root?.querySelectorAll)return[];const out=[];for(const el of root.querySelectorAll('*')){const sr=el?.shadowRoot;if(sr&&sr.mode!=='closed')out.push(sr)}return out;}
