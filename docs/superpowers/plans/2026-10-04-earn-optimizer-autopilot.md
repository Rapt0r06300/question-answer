# Earn Optimizer + Safari Autopilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish Question Answer as an iPhone-first Safari survey assistant with an immediate user kill-switch, plus a local Earn Optimizer that ranks legitimate surveys, games and quests by observed/expected sats per minute.

**Architecture:** Safari Autopilot extends the existing userscript runtime and never escapes the approved web context. Earn Optimizer is a separate pure/local subsystem that normalizes opportunities and histories, computes conservative rankings, and hands native-game/ad actions back to the user.

**Tech Stack:** JavaScript ES modules, Node.js 22 built-in test runner, dependency-free userscript build, GM async storage, static GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-04-earn-optimizer-design.md`

## Global Constraints
- iPhone-first; no PC/self-hosted runtime.
- Safari web automation only on locally approved hosts.
- Personal data/history local by default.
- No fabricated survey answers or hidden qualifying-answer inference.
- No CAPTCHA/anti-bot bypass, fingerprint/IP/geolocation spoofing, native-game automation, ad clicking or automated rewarded-ad viewing.
- Verification, inaccessible frames, ambiguity and sensitive/unknown answers yield control to the user.
- main is the single delivery branch.

## Review Focus
1. Pausing while an answer/navigation is queued must make the callback inert.
2. Resume after navigation must re-scan fresh DOM instead of using stale handles.
3. Decayed history must drive both probability and uncertainty.
4. Loaded historical records must be re-sanitized before ranking.
5. Native/rewarded-ad opportunities must always remain explicit human actions.

---

### Task 1: Autopilot controller and kill-switch

**Files:**
- Create: `src/autopilot/controller.js`
- Create: `src/autopilot/scheduler.js`
- Modify: `src/core/runtime.js`
- Modify: `src/core/state-machine.js`
- Test: `tests/autopilot/controller.test.js`
- Test: `tests/autopilot/scheduler.test.js`

**Interfaces:**
- Produces `createAutopilotController({runtime, scheduler, store}) -> {start,pause,resume,stop,getState}`.
- Produces `createCancelableScheduler() -> {schedule,cancelAll,generation}`.

- [ ] Write failing tests proving start works only in READY/approved context, pause cancels queued work, callbacks from an old generation are inert, resume calls a fresh runtime scan, and stop clears progression state.
- [ ] Run `npm test -- tests/autopilot`; expect FAIL.
- [ ] Implement scheduler/controller and minimal runtime/state transitions.
- [ ] Run `npm test -- tests/autopilot`; expect PASS.
- [ ] Run `npm run check`; expect PASS.
- [ ] Commit `feat: add Safari Autopilot kill switch`.

### Task 2: Persistent mobile Autopilot controls

**Files:**
- Modify: `src/ui/overlay.js`
- Modify: `src/ui/styles.js`
- Modify: `src/main.js`
- Test: `tests/ui/autopilot-controls.test.js`

**Interfaces:**
- Consumes Task 1 controller.
- Produces visible `COMMENCER`, `REPRENDRE LE CONTRÔLE`, `CONTINUER`, `ARRÊTER` actions.

- [ ] Write failing UI tests asserting the kill-switch remains rendered while active, is touch/keyboard accessible, uses a shadow-root fixed layer, and invokes pause synchronously.
- [ ] Run the UI test; expect FAIL.
- [ ] Implement controls and bootstrap wiring.
- [ ] Run UI + full check; expect PASS.
- [ ] Commit `feat: expose persistent Autopilot controls`.

### Task 3: Human-yield integration

**Files:**
- Modify: `src/core/runtime.js`
- Modify: `src/ui/verification-pause.js`
- Modify: `src/matcher/field-discovery.js`
- Test: `tests/autopilot/human-yield.test.js`

**Interfaces:**
- Produces `yieldToUser(reason)` reasons: unknown, ambiguous, sensitive, verification, inaccessible-frame.

- [ ] Write failing tests that every required-human condition pauses Autopilot and no auto-submit/navigation callback remains runnable.
- [ ] Run; expect FAIL.
- [ ] Implement yield wiring.
- [ ] Run tests/check; expect PASS.
- [ ] Commit `feat: yield Autopilot safely to user`.

### Task 4: Historical data hardening

**Files:**
- Modify/Create: `src/scoring/outcome-store.js`
- Modify/Create: `src/scoring/estimator.js`
- Test: `tests/scoring/history-hardening.test.js`

**Interfaces:**
- Produces `sanitizeOutcome(record)`, `effectiveSampleWeight(history, now)`, and estimates whose uncertainty uses effective decayed weight.

- [ ] Write failing tests for stale weighted uncertainty, malformed legacy outcomes, forbidden answer/free-text fields, and future timestamps.
- [ ] Run; expect FAIL.
- [ ] Implement sanitization and effective-weight uncertainty.
- [ ] Run scoring/full checks; expect PASS.
- [ ] Commit `fix: harden local outcome history`.

### Task 5: Opportunity model and survey ranking

**Files:**
- Create: `src/optimizer/opportunity.js`
- Create: `src/optimizer/ranking.js`
- Test: `tests/optimizer/survey-ranking.test.js`

**Interfaces:**
- Produces `normalizeOpportunity(raw)`.
- Produces `rankEarnOpportunities(opportunities, histories, now)`.
- Survey score: reward * completionProbability / estimatedMinutes; missing inputs => unranked.

- [ ] Write failing tests for expected sats/min, conservative small-sample prior, missing reward/time, uncertainty, and profile immutability.
- [ ] Run; expect FAIL.
- [ ] Implement model/ranking using Task 4 estimates.
- [ ] Run optimizer/full checks; expect PASS.
- [ ] Commit `feat: rank survey earning opportunities`.

### Task 6: Games/quests session tracker

**Files:**
- Create: `src/optimizer/game-sessions.js`
- Modify: `src/storage/schema.js`
- Modify: `src/storage/migration.js`
- Test: `tests/optimizer/game-sessions.test.js`

**Interfaces:**
- Produces `recordGameSession(state, session)`.
- Produces `estimateObservedSatsPerMinute(sessions, key)`.
- Stores only game/quest name/key, timestamps, earned sats/reward delta, optional milestone and ad-observed boolean.

- [ ] Write failing tests for session validation, sats/min, zero/negative duration, storage migration and no ad-content/click data.
- [ ] Run; expect FAIL.
- [ ] Implement session model/storage.
- [ ] Run optimizer/storage/full checks; expect PASS.
- [ ] Commit `feat: track game and quest earning sessions`.

### Task 7: Native handoff and rewarded-ad guard

**Files:**
- Create: `src/optimizer/native-handoff.js`
- Test: `tests/optimizer/native-handoff.test.js`

**Interfaces:**
- Produces `createNativeAction(opportunity) -> {kind:'human-native-action', label, target|null, requiresHumanAction:true}`.
- Rewarded-ad opportunities can only return human-native actions.

- [ ] Write failing tests that rewarded-ad/game actions never expose click/watch/simulate APIs and unsafe URL schemes are rejected.
- [ ] Run; expect FAIL.
- [ ] Implement safe handoff.
- [ ] Run checks; expect PASS.
- [ ] Commit `feat: add safe native earning handoff`.

### Task 8: Earn dashboard

**Files:**
- Create: `src/ui/earn-dashboard.js`
- Modify: `src/ui/overlay.js`
- Modify: `src/main.js`
- Test: `tests/ui/earn-dashboard.test.js`

**Interfaces:**
- Displays Best now, Surveys, Games/quests, History with reward, time, probability when applicable, expected/observed sats/min and uncertainty.
- Native cards invoke only Task 7 handoff.

- [ ] Write failing mobile DOM tests for ranked cards, missing-data labels and human-action badge.
- [ ] Run; expect FAIL.
- [ ] Implement dashboard/bootstrap integration using textContent only for dynamic strings.
- [ ] Run UI/full checks; expect PASS.
- [ ] Commit `feat: add Earn Optimizer dashboard`.

### Task 9: Pages onboarding and documentation

**Files:**
- Modify/Create: `site/index.html`
- Modify/Create: `site/test.html`
- Modify/Create: `site/app.js`
- Modify/Create: `README.md`
- Create: `docs/autopilot-ios.md`
- Create: `docs/earn-optimizer.md`
- Modify/Create: `.github/workflows/pages.yml`
- Test: `tests/site/earn-onboarding.test.js`

- [ ] Write failing tests for no-PC wording, Safari Autopilot controls, exact ZBD->Safari URL preservation, manual native/ad handoff, privacy, and troubleshooting path contained in deployed Pages.
- [ ] Run; expect FAIL.
- [ ] Implement site/docs/workflow.
- [ ] Run docs/site/full checks; expect PASS.
- [ ] Commit `docs: add Autopilot and Earn Optimizer onboarding`.

### Task 10: End-to-end production gate

**Files:**
- Create/Modify: `tests/e2e/earn-autopilot-flow.test.js`
- Modify/Create: `scripts/audit-public-data.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Production command `npm run prod`.

- [ ] Write failing synthetic flow: approved survey -> Autopilot -> known truthful answer -> unknown yields -> resume -> verification yields -> completion outcome -> ranking update -> native game card -> human-only rewarded-ad action -> profile unchanged.
- [ ] Run; expect FAIL until integration gaps close.
- [ ] Close integration gaps only.
- [ ] Extend public-data/API audit to reject secrets, committed profile values, CAPTCHA-bypass/ad-watch/click APIs.
- [ ] Run `npm run prod`; expect all tests, build and audit PASS.
- [ ] Verify generated userscript syntax and GitHub tree.
- [ ] Commit `test: complete Earn Optimizer Autopilot acceptance`.
