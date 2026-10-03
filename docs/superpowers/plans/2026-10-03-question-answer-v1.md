# Question Answer V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an iPhone-first Safari userscript assistant that reduces repetitive rewarded-survey work for the user's truthful profile, pauses for unknown/verification steps, stores all personal data locally, and ranks survey opportunities from local historical outcomes.

**Architecture:** A bundled JavaScript userscript runs in Safari through the Userscripts extension. Core behavior is split into pure modules for normalization, profile consistency, question matching, scoring, and provider adapters; a small runtime state machine coordinates DOM scanning, human-in-the-loop UI, and local GM storage. GitHub hosts source, tests, docs, distributable `.user.js` assets, and a static onboarding/test site; live rewarded-survey execution remains on the user's iPhone.

**Tech Stack:** JavaScript ES modules, Node.js 22 for CI/builds, Vitest, jsdom, esbuild, ESLint, Prettier, GitHub Actions, static HTML/CSS/JS, Safari Userscripts GM APIs.

**Spec:** `docs/superpowers/specs/2026-10-03-question-answer-ios-design.md`

## Global Constraints

- iPhone-first. No dependency on the user's PC.
- Safari is the supported execution browser for V1.
- GitHub hosts source code, documentation, static assets, tests, and optional GitHub Pages.
- Personal profile data and survey-response history must never be committed to the public repository.
- Persistent user data defaults to local Userscripts GM storage using asynchronous `GM.getValue` / `GM.setValue`.
- Preserve the exact ZBD/PrimeEarn URL, including query parameters and fragments, during any handoff to Safari.
- Never solve/bypass CAPTCHAs, anti-bot, anti-fraud, device-attestation, geolocation, VPN/proxy, or identity controls.
- Never fabricate profile attributes or infer a hidden “qualifying answer.”
- Unknown, subjective, sensitive, consent, and verification questions remain human-controlled.
- No remote LLM or telemetry service receives survey content or personal profile data.
- A broader userscript match, if needed for generic provider support, must no-op before DOM inspection on hosts not present in the local allowlist.
- GitHub Actions must never log into ZBD/PrimeEarn or run rewarded surveys.
- V1 includes PrimeEarn + generic standards-based forms only; additional provider adapters require evidence from real use.

## Review Focus

1. **Unapproved hostname:** a broadly matched userscript must return before scanning or reading page text; Task 3 adds a test that DOM scanning is not called when the hostname is absent from the local allowlist.
2. **Time-scoped wording:** “ever” and “last 30 days” must never collapse to the same remembered answer; Task 4 adds explicit scope-mismatch tests.
3. **Cross-origin/inaccessible iframe:** the runtime must surface a limitation and wait rather than throw or attempt evasion; Task 5 adds an inaccessible-frame fixture.
4. **Mutation/navigation loops:** repeated DOM replacements must not cause infinite clicks or scan storms; Task 7 adds debounce and navigation-attempt cap tests.
5. **Corrupt/stale local storage:** schema errors must fall back safely without erasing valid profile data; Task 2 adds malformed-state and migration tests.

---

### Task 1: Project foundation, build, and quality gates

**Files:**
- Create: `package.json`
- Create: `eslint.config.js`
- Create: `.prettierrc.json`
- Create: `.gitignore`
- Create: `scripts/build-userscript.mjs`
- Create: `src/main.js`
- Create: `tests/smoke/build.test.js`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: none.
- Produces: `npm run build`, `npm test`, `npm run lint`, `npm run format:check`, and `dist/question-answer.user.js`.

- [ ] **Step 1: Write the failing build smoke test**

Create `tests/smoke/build.test.js` asserting that the build script produces `dist/question-answer.user.js` containing the userscript metadata keys `@name Question Answer`, `@version`, `@grant GM.getValue`, `@grant GM.setValue`, and `@inject-into content`.

- [ ] **Step 2: Run the smoke test and verify failure**

Run: `npm test -- tests/smoke/build.test.js`  
Expected: FAIL because package/build files do not yet exist.

- [ ] **Step 3: Add the minimal Node/esbuild project foundation**

Use Node.js 22. Add exact scripts:

```json
{
  "build": "node scripts/build-userscript.mjs",
  "test": "vitest run",
  "lint": "eslint .",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "check": "npm run lint && npm run format:check && npm test && npm run build"
}
```

The build script bundles `src/main.js` as one browser IIFE and prepends a deterministic metadata block. Do not add runtime dependencies unless required by a later task.

- [ ] **Step 4: Run the smoke test and full quality gate**

Run: `npm install && npm run check`  
Expected: PASS and `dist/question-answer.user.js` exists.

- [ ] **Step 5: Add CI**

Create `.github/workflows/ci.yml` on pushes/PRs to `main`, using Node 22, `npm ci`, and `npm run check`. CI must not contain credentials or navigation to ZBD/PrimeEarn.

- [ ] **Step 6: Commit**

```bash
git add package.json eslint.config.js .prettierrc.json .gitignore scripts src tests .github/workflows/ci.yml dist/question-answer.user.js
git commit -m "build: add userscript project foundation"
```

### Task 2: Versioned local storage and migrations

**Files:**
- Create: `src/storage/schema.js`
- Create: `src/storage/gm-store.js`
- Create: `src/storage/migration.js`
- Create: `tests/storage/gm-store.test.js`
- Create: `tests/storage/migration.test.js`

**Interfaces:**
- Consumes: asynchronous `GM.getValue(key, defaultValue)`, `GM.setValue(key, value)`, optional `GM.deleteValue(key)`.
- Produces:
  - `createGMStore(gm) -> { get(namespace, fallback), set(namespace, value), remove(namespace) }`
  - `loadAppState(store) -> Promise<AppState>`
  - `saveAppState(store, state) -> Promise<void>`
  - constants `STORAGE_KEYS` for `qa.profile.v1`, `qa.mappings.v1`, `qa.outcomes.v1`, `qa.settings.v1`, `qa.migrations`.

- [ ] **Step 1: Write failing GM-store tests**

Test asynchronous get/set/remove behavior, JSON-serializable values, and a missing key returning the caller-provided fallback.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/storage/gm-store.test.js`  
Expected: FAIL because `createGMStore` is undefined.

- [ ] **Step 3: Implement `createGMStore(gm)`**

Keep it as a thin adapter around the Userscripts asynchronous GM API. Do not use `localStorage` as the primary profile store.

- [ ] **Step 4: Write migration/state tests**

Cover:
- first run creates default versioned structures;
- malformed outcomes/settings reset only those namespaces;
- malformed profile returns an empty safe profile while preserving a recoverable raw backup in memory for the current session;
- stale known schema versions migrate deterministically;
- unknown future schema versions fail closed and expose a typed error/result rather than overwriting data.

- [ ] **Step 5: Implement `loadAppState` / `saveAppState` and migrations**

Use explicit `schemaVersion` fields. Never silently mutate a locked profile fact during migration.

- [ ] **Step 6: Run storage tests**

Run: `npm test -- tests/storage`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/storage tests/storage
git commit -m "feat: add versioned local GM storage"
```

### Task 3: Runtime hostname allowlist and provider detection

**Files:**
- Create: `src/core/domain-policy.js`
- Create: `src/core/detector.js`
- Create: `src/providers/adapter.js`
- Create: `src/providers/primeearn.js`
- Create: `src/providers/generic.js`
- Create: `tests/core/domain-policy.test.js`
- Create: `tests/providers/detection.test.js`

**Interfaces:**
- Consumes: `AppState.settings.approvedHosts`, current `location`, DOM document.
- Produces:
  - `isHostApproved(hostname, approvedHosts) -> boolean`
  - `approveHost(hostname, settings) -> Settings`
  - `detectProvider({ location, document, approvedHosts }) -> DetectionResult`
  - adapter contract methods: `detect(ctx)`, `capabilities(ctx)`, `scan(ctx)`, `readOpportunity(ctx)`, `detectOutcome(ctx)`.

- [ ] **Step 1: Write allowlist privacy tests**

Assert:
- `monetize.primeearn.com` is approved by the shipped default policy;
- unknown hosts are denied;
- wildcard-like string tricks do not accidentally approve sibling/attacker domains;
- on an unapproved host, `detectProvider` returns `{ kind: "unapproved-host", hostname }` without calling the generic DOM scanner.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/core/domain-policy.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement domain policy and adapter interface**

Default approved host set contains only explicit PrimeEarn hosts required by V1. User-approved downstream hosts are stored locally.

- [ ] **Step 4: Write PrimeEarn/generic detection tests**

Fixtures cover:
- PrimeEarn hostname recognition;
- PrimeEarn DOM signature recognition;
- approved unknown survey host falling back to `generic`;
- unapproved host never falling back to `generic`;
- capability objects never claim unsupported features.

- [ ] **Step 5: Implement detector and adapters**

Keep PrimeEarn-specific selectors/text signatures inside `src/providers/primeearn.js`; shared form discovery remains outside adapters.

- [ ] **Step 6: Run tests**

Run: `npm test -- tests/core/domain-policy.test.js tests/providers/detection.test.js`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/core/domain-policy.js src/core/detector.js src/providers tests/core tests/providers
git commit -m "feat: add safe provider detection and host policy"
```

### Task 4: Profile model, normalization, aliases, and consistency

**Files:**
- Create: `src/core/normalizer.js`
- Create: `src/profile/profile.js`
- Create: `src/profile/aliases.js`
- Create: `src/profile/consistency.js`
- Create: `tests/profile/normalizer.test.js`
- Create: `tests/profile/consistency.test.js`
- Create: `tests/profile/aliases.test.js`

**Interfaces:**
- Consumes: user-entered profile entries `{ value, source, locked, validFrom?, validUntil? }`.
- Produces:
  - `normalizeQuestion(text) -> NormalizedQuestion`
  - `createProfile(raw?) -> Profile`
  - `resolveProfileField(profile, canonicalKey, scope) -> Resolution`
  - `matchAlias(questionText) -> { key, confidence, scope } | null`
  - `checkConsistency(profile, candidate) -> { ok, reasons[] }`.

- [ ] **Step 1: Write normalization tests**

Cover Unicode, punctuation, whitespace, case, French/English boilerplate, and preservation of material time expressions such as `last 30 days`, `past 12 months`, and `ever`.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/profile/normalizer.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement `normalizeQuestion`**

Normalization must preserve semantic time scope and numeric/unit information.

- [ ] **Step 4: Write profile/consistency tests**

Cover:
- locked facts never overwritten;
- DOB and age disagreement is rejected;
- stale time-sensitive values require user input;
- “ever bought brand X” cannot answer “bought brand X in last 30 days” without scoped evidence;
- unknown remains a valid resolution;
- screenout history cannot modify profile facts.

- [ ] **Step 5: Implement profile and consistency modules**

No sensitive category is generated by default. Only explicit user input creates those values.

- [ ] **Step 6: Write and implement deterministic aliases**

Seed only high-confidence generic demographic aliases needed for V1 (age, DOB, country, region, employment status, household size, education) in English/French. Alias entries include canonical key and optional scope.

- [ ] **Step 7: Run profile tests**

Run: `npm test -- tests/profile`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/core/normalizer.js src/profile tests/profile
git commit -m "feat: add truthful profile and consistency engine"
```

### Task 5: DOM field discovery and answer-option matching

**Files:**
- Create: `src/matcher/field-discovery.js`
- Create: `src/matcher/question-parser.js`
- Create: `src/matcher/option-matcher.js`
- Create: `src/matcher/confidence.js`
- Create: `tests/fixtures/forms/*.html`
- Create: `tests/matcher/field-discovery.test.js`
- Create: `tests/matcher/option-matcher.test.js`
- Create: `tests/matcher/frames.test.js`

**Interfaces:**
- Consumes: a DOM root/document and normalized profile resolution.
- Produces:
  - `discoverQuestions(root) -> QuestionCandidate[]`
  - `parseQuestion(candidate) -> ParsedQuestion`
  - `matchOption({ desiredValue, options, aliases }) -> OptionMatch`
  - `scoreQuestionMatch(inputs) -> number` in `[0,1]`.

- [ ] **Step 1: Create synthetic DOM fixtures and failing discovery tests**

Fixtures cover radio groups, checkboxes, select, text input, textarea, button-card answers, `label`, `aria-label`, `aria-labelledby`, and fieldset/legend.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/matcher/field-discovery.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement field discovery and question parsing**

Prefer accessible semantics over CSS layout selectors. Do not scrape unrelated visible page text.

- [ ] **Step 4: Write option-matching/confidence tests**

Cover exact value, normalized aliases, numeric values, ambiguous options, and a strict confidence threshold below which the result is `needs-user`.

- [ ] **Step 5: Implement option matching and confidence scoring**

No probabilistic or remote model dependency in V1.

- [ ] **Step 6: Add iframe tests**

Cover:
- same-origin frame discovery;
- inaccessible/cross-origin frame represented as `{ kind: "inaccessible-frame" }`;
- inaccessible frame never throws and never attempts a bypass.

- [ ] **Step 7: Run matcher tests**

Run: `npm test -- tests/matcher`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/matcher tests/matcher tests/fixtures/forms
git commit -m "feat: add accessible survey field matcher"
```

### Task 6: Mobile overlay, profile editor, and human gates

**Files:**
- Create: `src/ui/overlay.js`
- Create: `src/ui/profile-editor.js`
- Create: `src/ui/unknown-question.js`
- Create: `src/ui/verification-pause.js`
- Create: `src/ui/styles.js`
- Create: `tests/ui/overlay.test.js`
- Create: `tests/ui/profile-editor.test.js`
- Create: `tests/ui/verification-pause.test.js`

**Interfaces:**
- Consumes: runtime state, parsed question, answer options, profile/store callbacks.
- Produces:
  - `createOverlay({ document, actions }) -> OverlayController`
  - `showUnknownQuestion(question, options) -> Promise<UserAnswer>`
  - `showVerificationPause(details) -> void`
  - `openProfileEditor(profile) -> Promise<ProfileEditResult>`.

- [ ] **Step 1: Write overlay DOM tests**

Assert one compact shadow-root-based controller renders Start/Resume, Pause, Stop, provider/state, Answer myself, Remember mapping, Do not remember, Edit profile, History, and “Why this answer?” without using unsanitized `innerHTML`.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/ui/overlay.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement the base overlay**

Use `textContent` and DOM APIs for dynamic strings. Keep controls usable at iPhone viewport widths.

- [ ] **Step 4: Write unknown/sensitive question tests**

Unknown questions require user input. Remembering is opt-in. Sensitive/subjective prompts default to “do not remember.”

- [ ] **Step 5: Implement unknown-question and profile-editor flows**

Profile edits must respect locked facts unless the user explicitly unlocks/edits them.

- [ ] **Step 6: Write verification-pause tests**

Visible CAPTCHA/challenge/identity-verification fixtures trigger `WAITING_FOR_VERIFICATION`; no automatic click/submit callback is exposed from this component.

- [ ] **Step 7: Implement verification pause**

Resume becomes available only when the runtime confirms ordinary survey content has returned.

- [ ] **Step 8: Run UI tests**

Run: `npm test -- tests/ui`  
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/ui tests/ui
git commit -m "feat: add iPhone human-in-the-loop overlay"
```

### Task 7: Runtime state machine, safe answering, mutation handling

**Files:**
- Create: `src/core/state-machine.js`
- Create: `src/core/runtime.js`
- Create: `src/core/logger.js`
- Create: `src/answering/answer.js`
- Create: `tests/core/state-machine.test.js`
- Create: `tests/core/runtime.test.js`
- Create: `tests/answering/answer.test.js`

**Interfaces:**
- Consumes: store, detector, adapters, matcher, profile engine, overlay.
- Produces:
  - `createStateMachine(initialState) -> StateMachine`
  - `createRuntime(deps) -> { start(), pause(), resume(), stop(), rescan() }`
  - `applyAnswer({ control, match }) -> AnswerResult`
  - local debug events excluding answer values by default.

- [ ] **Step 1: Write state-transition tests**

Pin legal states from the spec: `BOOTING`, `UNSUPPORTED_CONTEXT`, `READY`, `SCANNING`, `ANSWERING`, `WAITING_FOR_USER`, `WAITING_FOR_VERIFICATION`, `SUBMIT_READY`, `NAVIGATING`, `SCREENED_OUT`, `COMPLETED`, `ERROR`, `PAUSED`.

Assert no transition from verification directly to automatic submission without returning through ordinary scanning/ready logic.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/core/state-machine.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement state machine**

Illegal transitions return a typed failure and enter neither navigation nor answering.

- [ ] **Step 4: Write answering tests**

For radio/select/text/button-card fixtures:
- dispatch normal `input` / `change` events;
- re-read the resulting value;
- return `verified: true` only when the DOM reflects the intended value;
- ambiguous/low-confidence answers do not mutate the control.

- [ ] **Step 5: Implement `applyAnswer`**

Use ordinary DOM interactions only. Do not add stealth patches or browser fingerprint modifications.

- [ ] **Step 6: Write runtime loop-safety tests**

Cover:
- MutationObserver rescans are debounced;
- identical-page fingerprint prevents repeated Next-click loops;
- automatic navigation attempts are capped per page state;
- `pause()` cancels pending automatic progression;
- unknown host returns before DOM scan;
- inaccessible iframe routes to manual state;
- verification detection pauses immediately.

- [ ] **Step 7: Implement runtime controller and bounded local logger**

Debug logs include state/provider/confidence/scan counts, not answer values by default.

- [ ] **Step 8: Run runtime/answering tests**

Run: `npm test -- tests/core tests/answering`  
Expected: PASS.

- [ ] **Step 9: Wire `src/main.js`**

Bootstrap GM storage, domain policy, detector, overlay, profile, matcher, and runtime. On unapproved hosts, exit before inspecting the DOM.

- [ ] **Step 10: Run full tests/build**

Run: `npm run check`  
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add src/core src/answering src/main.js tests/core tests/answering dist/question-answer.user.js
git commit -m "feat: wire safe survey runtime"
```

### Task 8: Outcome tracking and expected sats-per-minute ranking

**Files:**
- Create: `src/scoring/outcome-store.js`
- Create: `src/scoring/estimator.js`
- Create: `src/scoring/ranking.js`
- Create: `tests/scoring/outcome-store.test.js`
- Create: `tests/scoring/estimator.test.js`
- Create: `tests/scoring/ranking.test.js`

**Interfaces:**
- Consumes: local attempt events and opportunity metadata from provider adapters.
- Produces:
  - `recordOutcome(state, outcome) -> OutcomesState`
  - `estimateCompletionProbability(history, context) -> Estimate`
  - `estimateExpectedSatsPerMinute(opportunity, estimate) -> Estimate`
  - `rankOpportunities(opportunities, history) -> RankedOpportunity[]`.

- [ ] **Step 1: Write outcome-store tests**

Persist only: local attempt ID, timestamp, provider, visible survey ID, advertised reward/duration, elapsed time, outcome, stage/question count, adapter version, and anonymous question fingerprint when feasible.

Assert CAPTCHA contents, identity documents, passwords, payout credentials, biometrics, and free-text answers are rejected/not stored.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/scoring/outcome-store.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement outcome store**

Separate outcomes: `completed`, `screened_out`, `abandoned`, `error`.

- [ ] **Step 4: Write estimator/ranking tests**

Pin:
- `expected_sats_per_minute = advertised_sats * estimated_completion_probability / max(estimated_minutes, floor_minutes)`;
- uncertainty is returned alongside point estimates;
- minimum sample size prevents small-history overfitting;
- old observations decay;
- technical failures do not count as screenouts;
- ranking never modifies profile state.

- [ ] **Step 5: Implement estimator and ranking**

Use deterministic local arithmetic. No remote calls.

- [ ] **Step 6: Integrate opportunity/history view into overlay**

Show advertised sats, minutes, estimated completion probability, expected sats/minute, and uncertainty only when inputs are available. Label estimates explicitly as estimates.

- [ ] **Step 7: Run scoring + UI tests**

Run: `npm test -- tests/scoring tests/ui`  
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/scoring src/ui tests/scoring tests/ui
git commit -m "feat: add local survey outcome ranking"
```

### Task 9: Installation site, synthetic test page, and update flow

**Files:**
- Create: `site/index.html`
- Create: `site/styles.css`
- Create: `site/app.js`
- Create: `site/test.html`
- Create: `site/version.json`
- Create: `dist/question-answer.meta.js`
- Modify: `scripts/build-userscript.mjs`
- Create: `tests/site/site.test.js`
- Create: `tests/smoke/metadata.test.js`

**Interfaces:**
- Consumes: built dist version.
- Produces:
  - a static onboarding page;
  - stable install link to `question-answer.user.js`;
  - raw-GitHub fallback instructions;
  - synthetic form test page;
  - non-sensitive version metadata;
  - userscript `@updateURL` / `@downloadURL` where compatible.

- [ ] **Step 1: Write static-site tests**

Assert onboarding contains:
- iPhone + Safari requirement;
- Userscripts installation/permission steps;
- install button/link ending in `.user.js`;
- raw GitHub fallback;
- WebView-to-Safari handoff instructions that say to preserve the exact URL;
- privacy statement that profile/history stay local;
- troubleshooting link;
- synthetic test link.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/site/site.test.js`  
Expected: FAIL.

- [ ] **Step 3: Implement the static site and synthetic test form**

The synthetic form must exercise radio/select/text/unknown-question flow without contacting ZBD/PrimeEarn.

- [ ] **Step 4: Write metadata/update tests**

Assert `question-answer.meta.js` exposes the same semantic version as the built userscript and that version checking fetches only `site/version.json`, never profile/outcome data.

- [ ] **Step 5: Implement update/version assets**

Keep update endpoints static. Do not embed GitHub tokens.

- [ ] **Step 6: Run site/build tests**

Run: `npm test -- tests/site tests/smoke && npm run build`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add site dist scripts/build-userscript.mjs tests/site tests/smoke
git commit -m "feat: add iPhone installer and test site"
```

### Task 10: Documentation, privacy, iPhone acceptance guide, and Pages deployability

**Files:**
- Create: `README.md`
- Create: `docs/installation-ios.md`
- Create: `docs/privacy.md`
- Create: `docs/troubleshooting.md`
- Create: `docs/acceptance-ios.md`
- Create: `.github/workflows/pages.yml`
- Create: `tests/docs/docs.test.js`

**Interfaces:**
- Consumes: final install paths and runtime behavior.
- Produces: complete user/operator documentation and deployable Pages workflow.

- [ ] **Step 1: Write docs completeness tests**

Assert docs mention:
- no PC required;
- Safari + Userscripts;
- enabling Safari extension permissions;
- installing `.user.js`;
- handling ZBD in-app WebView by opening the exact current URL in Safari;
- manual CAPTCHA/verification pause;
- how to add/approve a downstream provider host;
- local-only profile/history;
- how to clear/export local data;
- raw-GitHub installer fallback if Pages is unavailable.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/docs/docs.test.js`  
Expected: FAIL.

- [ ] **Step 3: Write README and user docs**

README leads with the shortest iPhone workflow. Privacy doc enumerates exactly what is and is not stored.

- [ ] **Step 4: Add GitHub Pages workflow**

Deploy the `site/` directory plus `dist/` installer assets as a static Pages artifact. If repository Settings still require manually selecting GitHub Actions as the Pages source, document that one-time user step; the code must remain fully usable through the raw-GitHub fallback meanwhile.

- [ ] **Step 5: Write iPhone acceptance checklist**

Include:
1. install Userscripts;
2. allow extension in Safari;
3. install Question Answer;
4. pass synthetic test;
5. persist a test profile value;
6. pause/resume;
7. unknown question;
8. manual verification pause;
9. screenout/completion logging;
10. version check.

- [ ] **Step 6: Run docs/full quality gate**

Run: `npm run check`  
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add README.md docs .github/workflows/pages.yml tests/docs
git commit -m "docs: add iPhone install privacy and acceptance flow"
```

### Task 11: End-to-end synthetic acceptance and release audit

**Files:**
- Create: `tests/e2e/synthetic-flow.test.js`
- Create: `scripts/audit-public-data.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: complete V1 modules.
- Produces:
  - one deterministic synthetic end-to-end test;
  - public-data leakage audit;
  - final `npm run prod` quality gate.

- [ ] **Step 1: Write failing synthetic end-to-end test**

The test must simulate:
- approved PrimeEarn-like host;
- known high-confidence demographic question autofilled from a synthetic profile;
- unknown question pauses for simulated user input;
- verification fixture pauses and does not auto-submit;
- resume after verification;
- screenout/completion outcome stored locally;
- ranking history updated without changing the profile.

- [ ] **Step 2: Run and verify failure**

Run: `npm test -- tests/e2e/synthetic-flow.test.js`  
Expected: FAIL until integration gaps are closed.

- [ ] **Step 3: Close only the integration gaps exposed by the test**

Do not add speculative provider behavior.

- [ ] **Step 4: Add public-data leakage audit**

Create `scripts/audit-public-data.mjs` that scans committed project fixtures/assets for forbidden classes of accidental personal data patterns and known secret formats. It must fail CI on matches while allowing explicitly synthetic fixture values.

- [ ] **Step 5: Add production gate**

Add:

```json
{
  "prod": "npm run lint && npm run format:check && npm test && npm run build && node scripts/audit-public-data.mjs"
}
```

Update CI to run `npm run prod`.

- [ ] **Step 6: Run final release gate**

Run: `npm run prod`  
Expected: PASS with all tests green and dist assets regenerated.

- [ ] **Step 7: Verify repository state**

Run: `git status --short`  
Expected: clean after committing generated dist assets.

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "test: complete synthetic V1 acceptance gate"
```

- [ ] **Step 9: Final GitHub verification**

Verify on `main`:
- latest commit contains all source/tests/docs/dist assets;
- CI workflow is present;
- Pages workflow is present;
- no personal profile data or secrets are committed;
- spec and plan remain in `docs/superpowers/`.

