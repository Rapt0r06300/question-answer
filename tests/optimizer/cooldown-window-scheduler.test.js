import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseCooldownAction, scoreForCooldown, shouldPreemptForJustPlay } from '../../src/optimizer/cooldown-window-scheduler.js';

test('JustPlay ready always wins the scheduler', () => {
  const decision = chooseCooldownAction({
    justPlay: { lastViewedAt: null, launchTarget: 'justplay://' },
    opportunities: [{ id: 'survey', satsPerMinute: 999, estimatedMinutes: 1 }],
    now: 1000,
  });
  assert.equal(decision.kind, 'JUSTPLAY_READY');
});

test('short quest beats long non-interruptible survey in a four minute window', () => {
  const justPlay = { lastViewedAt: 0, cooldownMs: 300000 };
  const now = 60000;
  const decision = chooseCooldownAction({
    justPlay,
    now,
    safeSwitchBufferMs: 0,
    opportunities: [
      { id: 'quest', source: 'quest', satsPerMinute: 60, estimatedMinutes: 2.3, completionProbability: 0.95 },
      { id: 'survey', source: 'survey', satsPerMinute: 80, estimatedMinutes: 13, completionProbability: 0.8 },
      { id: 'game', source: 'game', satsPerMinute: 51, estimatedMinutes: 10 },
    ],
  });
  assert.equal(decision.kind, 'ZBD_ACTIVITY');
  assert.equal(decision.opportunity.id, 'quest');
});

test('interruptible game remains viable when it cannot finish before cooldown ends', () => {
  const result = scoreForCooldown({ source: 'game', satsPerMinute: 50, estimatedMinutes: 20 }, 120000);
  assert.ok(result.score > 10);
  assert.equal(result.interruptibility, 'interruptible');
});

test('non-interruptible survey is not preempted immediately when JustPlay becomes ready', () => {
  const result = shouldPreemptForJustPlay({
    currentActivity: { source: 'survey', interruptibility: 'non-interruptible' },
    justPlay: { lastViewedAt: null },
    now: 1000,
  });
  assert.equal(result.shouldPreempt, false);
  assert.equal(result.reason, 'finish-current-step');
});
