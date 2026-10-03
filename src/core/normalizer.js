function extractScope(text) {
  const normalized = text.toLowerCase();
  const last = normalized.match(/\b(?:last|past)\s+(\d+)\s+(day|days|week|weeks|month|months|year|years)\b/);
  if (last) {
    const unit = last[2].replace(/s$/, '');
    return `last:${last[1]}:${unit}s`;
  }
  const french = normalized.match(/\b(?:derniers?|dernieres?)\s+(\d+)\s+(jour|jours|semaine|semaines|mois|an|ans|annee|annees)\b/);
  if (french) {
    const map = { jour: 'days', jours: 'days', semaine: 'weeks', semaines: 'weeks', mois: 'months', an: 'years', ans: 'years', annee: 'years', annees: 'years' };
    return `last:${french[1]}:${map[french[2]]}`;
  }
  if (/\bever\b|\bdeja\b|\bau moins une fois\b/.test(normalized)) return 'ever';
  return null;
}

export function normalizeQuestion(input) {
  const source = String(input ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const text = source
    .replace(/[’']/g, ' ')
    .replace(/[^\p{L}\p{N}%+./:]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { text, scope: extractScope(text) };
}
