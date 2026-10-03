import { normalizeQuestion } from '../core/normalizer.js';

const GROUPS = [
  { key: 'demographics.age', aliases: ['quel age avez vous', 'quel est votre age', 'what is your age', 'how old are you'] },
  { key: 'demographics.dob', aliases: ['quelle est votre date de naissance', 'date de naissance', 'what is your date of birth', 'date of birth'] },
  { key: 'demographics.country', aliases: ['dans quel pays vivez vous', 'quel est votre pays de residence', 'what country do you live in', 'country of residence'] },
  { key: 'demographics.region', aliases: ['dans quelle region vivez vous', 'quelle est votre region', 'what region do you live in', 'region of residence'] },
  { key: 'employment.status', aliases: ['quelle est votre situation professionnelle', 'quel est votre statut professionnel', 'which best describes your employment status', 'what is your employment status'] },
  { key: 'household.size', aliases: ['combien de personnes vivent dans votre foyer', 'combien de personnes composent votre foyer', 'how many people live in your household', 'household size'] },
  { key: 'education.level', aliases: ['quel est votre niveau d etudes', 'niveau d etudes', 'what is your highest level of education', 'education level'] },
];

const INDEX = new Map();
for (const group of GROUPS) for (const alias of group.aliases) INDEX.set(normalizeQuestion(alias).text, group.key);

export function matchAlias(questionText) {
  const normalized = normalizeQuestion(questionText);
  let key = INDEX.get(normalized.text);
  let confidence = 1;
  if (!key) { const matches = new Set(); for (const [alias, candidate] of INDEX) if (alias.length >= 8 && (normalized.text.includes(alias) || alias.includes(normalized.text))) matches.add(candidate); if (matches.size !== 1) return null; [key] = matches; confidence = 0.97; }
  return { key, confidence, scope: normalized.scope };
}

export const PROFILE_ALIAS_GROUPS = Object.freeze(GROUPS.map((group) => Object.freeze({ ...group, aliases: Object.freeze([...group.aliases]) })));
