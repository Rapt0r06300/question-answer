function clamp(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(1, Math.max(0, numeric));
}

export function scoreQuestionMatch({ aliasConfidence = 0, structureConfidence = 0, optionConfidence = 0 }) {
  const alias = clamp(aliasConfidence);
  const structure = clamp(structureConfidence);
  const option = clamp(optionConfidence);
  return Math.round(((alias * 0.5) + (structure * 0.2) + (option * 0.3)) * 1000) / 1000;
}

export function isAutoAnswerConfidence(score, threshold = 0.9) {
  return clamp(score) >= threshold;
}
