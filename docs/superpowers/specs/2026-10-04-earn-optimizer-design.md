# Question Answer — Earn Optimizer Design

Date: 2026-10-04
Status: proposed for implementation
Repository: Rapt0r06300/question-answer
Runtime: iPhone-first; Safari for web surveys, native ZBD/game apps for gameplay and rewarded ads

## 1. Goal

Extend Question Answer from a survey assistant into an iPhone-first Earn Optimizer that helps the user choose and complete legitimate ZBD earning opportunities efficiently.

Success means:
- survey questions are understood and matched to stable, user-confirmed truthful profile facts;
- unknown or ambiguous questions stop for user confirmation and may be remembered only after explicit confirmation;
- survey opportunities are ranked using observed completion probability, reward, elapsed time, freshness and uncertainty;
- games/quests can be recorded and ranked by observed sats/minute;
- rewarded-ad opportunities can be surfaced as manual/native-app actions, but the system never simulates ad views, clicks, gameplay, CAPTCHA completion or anti-bot evasion;
- all personal profile/history data remains local to the userscript storage by default;
- no PC or self-hosted runner is required.

## 2. Non-goals and hard boundaries

The product MUST NOT:
- fabricate demographics, employment, household, purchase history, preferences or other survey answers to qualify;
- infer a dishonest screener answer from screenout behavior;
- solve, bypass, outsource or hide CAPTCHA/anti-bot/security challenges;
- spoof device fingerprint, user agent, IP, geolocation, attestation or human interaction;
- auto-watch, auto-click or simulate rewarded ads;
- emulate native games or fake gameplay/time-alive;
- click ads;
- submit answers whose confidence is below the configured safe threshold without user confirmation.

A verification/security challenge always transitions to a human-required paused state.

## 3. Architecture

### 3.1 Survey Assistant

Existing modules remain the base:
- domain allowlist and provider discovery;
- question normalization and FR/EN aliases;
- truthful versioned profile;
- accessible field discovery;
- deterministic option matching;
- confidence threshold;
- local history.

New/finished runtime modules:
- state machine: idle -> scanning -> filling -> needs-user | verification -> observing-outcome -> completed;
- mobile overlay for unknown questions, explanations, profile editing and provider approval;
- DOM filler using normal input/change/click semantics;
- mutation/navigation debounce and loop protection;
- outcome observer recording completed/screened-out/abandoned with elapsed time and reward when observable.

### 3.2 Opportunity model

A normalized opportunity is:
- id
- source: survey | game | quest
- provider
- title
- rewardSats (known or null)
- estimatedMinutes (known or null)
- observedCompletionProbability
- uncertainty
- lastObservedAt
- launchTarget
- requiresNativeApp
- requiresHumanAction

No answer/profile value is part of the optimizer score.

### 3.3 Ranking

For surveys:
expectedSats = rewardSats * completionProbability
expectedSatsPerMinute = expectedSats / expectedMinutes

Completion probability uses local outcomes with time decay and a conservative prior when sample size is small. Old observations lose weight. Uncertainty is displayed separately and prevents false precision.

For games/quests:
observedSatsPerMinute = verifiedRewardDelta / activeElapsedMinutes

The UI distinguishes observed values from estimates. Missing reward or duration yields unranked/insufficient-data rather than invented values.

### 3.4 Games and rewarded ads

Question Answer cannot control a native iOS game from Safari and does not attempt to.

The optimizer stores user-observed sessions:
- game/quest name;
- start/end;
- sats before/after or explicit earned sats;
- optional note that a rewarded ad was available/viewed;
- optional quest milestone.

It can show OPEN GAME / OPEN ZBD actions when a valid universal/deep link is known. Otherwise it gives a manual handoff.

Rewarded ads remain native and human initiated. The optimizer may remind the user that an ad opportunity exists or ask them to record the result after returning, but it never starts, watches, clicks or validates the ad itself.

### 3.5 Local storage

Schema gains:
- opportunityHistory
- gameSessions
- rankingPreferences
- providerMappings

Every loaded record is sanitized/migrated before use. No secrets or personal profile are committed to GitHub or GitHub Pages.

## 4. Mobile UX

Primary overlay:
- current provider/status;
- current question and source of answer;
- Explain answer;
- Needs your answer;
- Verification required;
- opportunity score and uncertainty when known.

Earn dashboard:
- Best now;
- Surveys;
- Games/quests;
- History;
- Profile/settings.

Each ranked card shows reward, expected/observed minutes, completion estimate where relevant, expected/observed sats/min, uncertainty and a launch button.

## 5. Safety and integrity behavior

- Unknown domains: no DOM read before approval.
- Cross-origin inaccessible frames: manual state, no bypass.
- Verification/CAPTCHA: pause immediately.
- Screenout: statistical outcome only; never mutate profile facts.
- Rewarded ad: manual/native-only.
- Native game: no automation.
- No VPN/proxy/fingerprint recommendations.
- No hidden click automation.
- No automatic final submit when user confirmation is required.

## 6. Testing

Required tests:
- storage migration/sanitization;
- unknown-domain zero-DOM-read;
- FR/EN normalization and temporal scope;
- locked profile consistency;
- ambiguous option refusal;
- verification pause;
- cross-origin frame manual fallback;
- unknown-question human mapping persistence;
- outcome persistence without profile mutation;
- decayed completion probability and uncertainty;
- survey expected sats/min ranking;
- game observed sats/min ranking;
- missing-data handling;
- rewarded-ad opportunities always require native/human action;
- no module exposes ad-click/ad-watch/CAPTCHA-bypass APIs;
- mobile overlay uses textContent for dynamic strings;
- built userscript passes syntax and secret/PII audit.

## 7. Delivery

- main is the single branch.
- GitHub Pages hosts onboarding/install/dashboard assets.
- userscript remains the Safari web runtime.
- no PC dependency.
- GitHub Actions may build/test/deploy static assets only; it must not run reward farming or remote browser automation.


## 8. Safari Autopilot and permanent kill-switch

The Safari userscript exposes an explicit Autopilot mode for approved web survey pages.

Controls:
- COMMENCER: starts scanning/filling the current approved Safari survey context.
- REPRENDRE LE CONTRÔLE: permanent visible kill-switch while Autopilot is active. It synchronously disables automatic filling/navigation, disconnects observers, cancels pending timers/actions where possible, and persists PAUSED state.
- CONTINUER: user-only action that resumes from a fresh scan after PAUSED.
- ARRÊTER: ends the current session and clears pending progression state.

Rules:
- Autopilot controls only DOM/content available to the Safari userscript on locally approved hosts.
- It never controls the global iOS interface or another native app.
- Navigation is bounded and loop-protected.
- The kill-switch remains visible above the assistant UI while automatic behavior is active.
- pagehide/visibility/navigation changes invalidate pending actions; continuation requires a fresh runtime check.
- unknown/ambiguous/sensitive questions, inaccessible frames and verification challenges automatically yield control to the user.
- no CAPTCHA solving, anti-bot bypass, fingerprint spoofing, rewarded-ad automation, native-game automation, or hidden clicking.

Acceptance tests:
- COMMENCER enters active Autopilot only on an approved host.
- REPRENDRE LE CONTRÔLE prevents a queued answer/navigation from executing.
- observer/timer callbacks after pause are inert.
- CONTINUER performs a fresh scan rather than replaying stale DOM handles.
- verification and inaccessible-frame states force PAUSED/human control.
- the kill-switch is keyboard/touch accessible and cannot be hidden by survey page CSS (shadow-root/isolated fixed overlay).
