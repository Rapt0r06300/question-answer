import { chooseCooldownAction, shouldPreemptForJustPlay } from './cooldown-window-scheduler.js';

export function createEarnOrchestrator({ openTarget, notify, clock = () => Date.now() } = {}) {
  let currentActivity = null;

  return {
    getCurrentActivity() {
      return currentActivity;
    },

    async tick({ justPlay, opportunities }) {
      const decision = chooseCooldownAction({ justPlay, opportunities, now: clock() });

      if (decision.kind === 'JUSTPLAY_READY') {
        const preemption = shouldPreemptForJustPlay({ currentActivity, justPlay, now: clock() });
        if (preemption.shouldPreempt) {
          notify?.('JustPlay prêt');
          if (decision.launchTarget) await openTarget?.(decision.launchTarget, { kind: 'justplay' });
          currentActivity = null;
        }
        return { ...decision, preemption };
      }

      if (decision.kind === 'ZBD_ACTIVITY') {
        const next = decision.opportunity;
        const changed = !currentActivity || currentActivity.id !== next.id;
        currentActivity = next;
        if (changed && next.launchTarget) {
          await openTarget?.(next.launchTarget, { kind: 'zbd', opportunity: next });
        }
        return decision;
      }

      return decision;
    },

    markSafePoint() {
      if (currentActivity) currentActivity = { ...currentActivity, interruptibility: 'interruptible' };
    },

    stop() {
      currentActivity = null;
    },
  };
}
