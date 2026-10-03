import { getJustPlayStatus } from './justplay-timer.js';

function clamp01(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function interruptibilityFactor(kind) {
  if (kind === 'interruptible') return 1;
  if (kind === 'semi') return 0.72;
  if (kind === 'non-interruptible') return 0.35;
  return 0.6;
}

function fitFactor(minutes, windowMinutes, interruptibility) {
  if (!Number.isFinite(minutes) || minutes <= 0) return interruptibility === 'interruptible' ? 0.8 : 0.35;
  if (minutes <= windowMinutes) return 1;
  const ratio = windowMinutes / minutes;
  if (interruptibility === 'interruptible') return Math.max(0.45, ratio);
  if (interruptibility === 'semi') return Math.max(0.2, ratio * 0.75);
  return Math.max(0.05, ratio * 0.35);
}

export function classifyInterruptibility(opportunity) {
  if (opportunity?.interruptibility) return opportunity.interruptibility;
  if (opportunity?.source === 'game') return 'interruptible';
  if (opportunity?.source === 'quest') return 'semi';
  return 'non-interruptible';
}

export function scoreForCooldown(opportunity, windowMs) {
  const windowMinutes = Math.max(0, Number(windowMs) || 0) / 60000;
  const rate = Number.isFinite(Number(opportunity?.satsPerMinute)) ? Math.max(0, Number(opportunity.satsPerMinute)) : 0;
  const minutes = Number.isFinite(Number(opportunity?.estimatedMinutes)) ? Math.max(0, Number(opportunity.estimatedMinutes)) : null;
  const completion = opportunity?.completionProbability == null ? 1 : clamp01(opportunity.completionProbability);
  const interruptibility = classifyInterruptibility(opportunity);
  const score = rate * fitFactor(minutes, windowMinutes, interruptibility) * completion * interruptibilityFactor(interruptibility);
  return { score, interruptibility, windowMinutes };
}

export function chooseCooldownAction({ justPlay, opportunities = [], now = Date.now(), safeSwitchBufferMs = 15000 } = {}) {
  const jp = getJustPlayStatus(justPlay ?? {}, now);
  if (jp.status === 'READY') {
    return {
      kind: 'JUSTPLAY_READY',
      priority: 1000000,
      requiresHumanAction: true,
      launchTarget: jp.launchTarget,
      remainingMs: 0,
      reason: 'JustPlay video window is ready',
    };
  }

  const usableWindowMs = Math.max(0, jp.remainingMs - Math.max(0, Number(safeSwitchBufferMs) || 0));
  const scored = opportunities
    .filter((item) => item?.availableNow !== false)
    .map((item) => ({ ...item, ...scoreForCooldown(item, usableWindowMs) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return {
      kind: 'WAIT_FOR_JUSTPLAY',
      priority: 0,
      remainingMs: jp.remainingMs,
      requiresHumanAction: false,
    };
  }

  return {
    kind: 'ZBD_ACTIVITY',
    priority: scored[0].score,
    opportunity: scored[0],
    remainingMs: jp.remainingMs,
    usableWindowMs,
    requiresHumanAction: Boolean(scored[0].requiresHumanAction),
  };
}

export function shouldPreemptForJustPlay({ currentActivity, justPlay, now = Date.now(), switchBufferMs = 15000 } = {}) {
  const jp = getJustPlayStatus(justPlay ?? {}, now);
  if (jp.status === 'READY') {
    if (!currentActivity) return { shouldPreempt: true, atSafePoint: true };
    const kind = classifyInterruptibility(currentActivity);
    return {
      shouldPreempt: kind !== 'non-interruptible',
      atSafePoint: kind === 'interruptible',
      reason: kind === 'non-interruptible' ? 'finish-current-step' : 'switch-to-justplay',
    };
  }
  return {
    shouldPreempt: jp.remainingMs <= Math.max(0, Number(switchBufferMs) || 0),
    atSafePoint: classifyInterruptibility(currentActivity) === 'interruptible',
    reason: 'justplay-near-ready',
  };
}
