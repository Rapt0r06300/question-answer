import { normalizeQuestion } from '../core/normalizer.js';
export function parseQuestionCandidate(candidate) { return { ...candidate, normalized: normalizeQuestion(candidate?.questionText ?? '') }; }
