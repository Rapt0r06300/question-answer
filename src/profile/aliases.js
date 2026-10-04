import { normalizeQuestion } from '../core/normalizer.js';

const GROUPS = [
  { key: 'demographics.age', aliases: ['quel age avez vous', 'quel est votre age', 'what is your age', 'how old are you'] },
  { key: 'demographics.dob', aliases: ['quelle est votre date de naissance', 'date de naissance', 'what is your date of birth', 'date of birth'] },
  { key: 'demographics.country', aliases: ['dans quel pays vivez vous', 'quel est votre pays de residence', 'what country do you live in', 'country of residence'] },
  { key: 'demographics.region', aliases: ['dans quelle region vivez vous', 'quelle est votre region', 'what region do you live in', 'region of residence'] },
  { key: 'demographics.city', aliases: ['dans quelle ville vivez vous','quelle est votre ville','what city do you live in','city of residence'] },
  { key: 'demographics.postalCode', aliases: ['quel est votre code postal','code postal','what is your postal code','zip code','postal code'] },
  { key: 'demographics.gender', aliases: ['quel est votre sexe','quel est votre genre','what is your gender','what is your sex','gender'] },
  { key: 'household.children', aliases: ['avez vous des enfants','combien d enfants vivent dans votre foyer','do you have children','how many children live in your household'] },
  { key: 'household.income', aliases: ['quel est le revenu de votre foyer','revenu du foyer','what is your household income','household income'] },
  { key: 'employment.status', aliases: ['quelle est votre situation professionnelle', 'quel est votre statut professionnel', 'which best describes your employment status', 'what is your employment status'] },
  { key: 'employment.occupationCategory', aliases: ['laquelle decrit le mieux votre activite professionnelle','parmi les propositions suivantes laquelle decrit le mieux votre activite professionnelle','parmi les propositions suivantes laquelle decrit le mieux votre categorie professionnelle','laquelle decrit le mieux votre profession','quelle categorie socioprofessionnelle vous correspond le mieux','quelle est votre categorie socioprofessionnelle','which best describes your occupation','which best describes your profession','what is your occupational category'] },
  { key: 'household.size', aliases: ['combien de personnes vivent dans votre foyer', 'combien de personnes composent votre foyer', 'how many people live in your household', 'household size'] },
  { key: 'education.level', aliases: ['quel est votre niveau d etudes', 'niveau d etudes', 'what is your highest level of education', 'education level'] },
  { key: 'transport.vehicleOwnership', aliases: ['possedez vous une voiture','avez vous un vehicule','do you own a car','do you own a vehicle'] },
  { key: 'technology.mobileOS', aliases: ['quel systeme utilise votre telephone','quel est le systeme de votre smartphone','what operating system does your phone use','mobile operating system'] },
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
