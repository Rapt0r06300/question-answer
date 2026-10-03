import test from 'node:test';
import assert from 'node:assert/strict';
import { matchAlias } from '../../src/profile/aliases.js';

test('matches high-confidence French and English demographic aliases', () => {
  assert.equal(matchAlias('Quel âge avez-vous ?').key, 'demographics.age');
  assert.equal(matchAlias('What is your date of birth?').key, 'demographics.dob');
  assert.equal(matchAlias('Dans quel pays vivez-vous ?').key, 'demographics.country');
  assert.equal(matchAlias('Which best describes your employment status?').key, 'employment.status');
  assert.equal(matchAlias('Combien de personnes vivent dans votre foyer ?').key, 'household.size');
});

test('does not guess on unrelated wording', () => { assert.equal(matchAlias('Which snack tastes best?'), null); });
