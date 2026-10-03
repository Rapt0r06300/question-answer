# Question Answer — iPhone Survey Assistant Design

Date: 2026-10-03
Status: WRITTEN SPEC READY FOR USER REVIEW
Repository: Rapt0r06300/question-answer
Default branch: main

## 1. Product intent

Question Answer is an iPhone-first survey assistant for rewarded survey flows reached from ZBD and PrimeEarn.

The north-star user experience is:

1. The user starts from ZBD on an iPhone.
2. The survey flow opens PrimeEarn or a downstream survey provider.
3. If the page is inside an in-app browser/WebView where Safari extensions cannot run, the user hands the exact URL to Safari without altering attribution/query parameters.
4. A Safari userscript recognizes the page, loads the user's locally stored truthful profile, fills recurring answers, and advances only where safe.
5. Unknown or subjective questions are surfaced to the user in a compact overlay and may be remembered after explicit user choice.
6. CAPTCHA, identity verification, anti-bot challenges, consent prompts requiring judgement, and other human-verification gates pause automation and require user action.
7. The assistant records local outcome telemetry (completion, screenout, elapsed time, advertised reward when visible) and uses it to rank future survey opportunities by expected value for the user's real profile.

The product exists to reduce repetitive work and wasted time, not to fabricate eligibility.

## 2. Hard constraints and non-goals

### Hard constraints

- iPhone-first. No dependency on the user's PC.
- GitHub hosts source code, documentation, static assets, tests, and optional GitHub Pages.
- Personal profile data and survey-response history must not be committed to the public repository.
- Persistent user data must default to local device storage exposed by the userscript manager (prefer asynchronous `GM.getValue` / `GM.setValue`).
- The system must preserve ZBD/PrimeEarn attribution parameters when handing a URL from an in-app browser to Safari.
- The assistant must remain useful when a provider changes markup by using a layered generic matcher plus provider adapters.
- The user remains in control of unknown, subjective, sensitive, consent, and verification questions.

### Explicit non-goals

Question Answer must not:

- solve or bypass CAPTCHAs;
- bypass anti-bot, anti-fraud, device-attestation, geolocation, VPN/proxy, or identity controls;
- spoof browser/device fingerprints;
- fabricate age, location, household, employment, income, purchases, health, ownership, or any other profile attribute to qualify for a survey;
- infer “the answer that gets accepted” and submit it when it conflicts with the user's profile;
- automate duplicate accounts or repeated participation that violates provider rules;
- disguise cloud/datacenter automation as a real user device;
- intentionally manipulate reward attribution or completion callbacks.

If a provider requires a human-only interaction, the assistant pauses.

## 3. Why execution runs on the iPhone

ZBD documents fraud protections including device attestation, bot/emulator detection, network signals, geolocation, VPN/proxy detection, datacenter-related controls, withdrawal locks, limited-earnings states, and account disabling.

Therefore the execution architecture is deliberately split:

- GitHub/cloud: source, static site, release metadata, tests, documentation, optional build/release automation.
- iPhone/Safari: actual survey-page interaction.

A GitHub-hosted browser may be used only for deterministic test fixtures or synthetic demo pages owned by this project, never to masquerade as the user's real survey session.

## 4. External runtime dependency

The preferred iPhone runtime is the open-source “Userscripts” Safari extension.

The project will ship a userscript with:

Privacy rule: even if Safari/Userscripts permissions are broad enough to allow injection on multiple websites, Question Answer must not inspect page content on an unapproved hostname. The runtime checks the local allowlist before scanning the DOM. New provider domains require explicit user approval before generic scanning is enabled.

- `@match` rules sufficient for known providers and, only if generic cross-provider support requires it, a broader match combined with a strict local runtime domain allowlist that defaults to PrimeEarn/explicitly approved survey hosts and immediately no-ops everywhere else;
- `@grant GM.getValue`;
- `@grant GM.setValue`;
- `@grant GM.deleteValue` where supported/needed;
- `@grant GM.listValues` where supported/needed;
- `@version`;
- optional `@updateURL` and `@downloadURL` metadata;
- `@inject-into content` by default when GM APIs are required.

Because Safari CSP and cross-origin frame restrictions can prevent direct page-world access, adapters must degrade gracefully rather than attempting evasion.

## 5. High-level architecture

```text
ZBD app
  |
  v
PrimeEarn / provider page
  |
  +-- In Safari --------------------------+
  |                                      |
  |                                  Userscript
  |                                      |
  +-- In in-app WebView --> Safari handoff|
                                         v
                               Runtime controller
                                   /    |    \
                                  /     |     \
                           Detector  Matcher  UI overlay
                               |       |        |
                               v       v        v
                           Adapter   Profile   Human input
                               \       |       /
                                \      |      /
                                  State machine
                                      |
                               Local GM storage
                                      |
                       Outcomes / scoring / history
```

## 6. Repository layout

```text
question-answer/
├── docs/
│   ├── superpowers/specs/
│   │   └── 2026-10-03-question-answer-ios-design.md
│   ├── installation-ios.md
│   ├── privacy.md
│   └── troubleshooting.md
├── site/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── src/
│   ├── main.js
│   ├── core/
│   │   ├── runtime.js
│   │   ├── state-machine.js
│   │   ├── detector.js
│   │   ├── normalizer.js
│   │   └── logger.js
│   ├── storage/
│   │   ├── gm-store.js
│   │   ├── schema.js
│   │   └── migration.js
│   ├── profile/
│   │   ├── profile.js
│   │   ├── consistency.js
│   │   └── aliases.js
│   ├── matcher/
│   │   ├── field-discovery.js
│   │   ├── question-parser.js
│   │   ├── option-matcher.js
│   │   └── confidence.js
│   ├── scoring/
│   │   ├── outcome-store.js
│   │   ├── estimator.js
│   │   └── ranking.js
│   ├── ui/
│   │   ├── overlay.js
│   │   ├── profile-editor.js
│   │   ├── unknown-question.js
│   │   └── verification-pause.js
│   └── providers/
│       ├── adapter.js
│       ├── primeearn.js
│       └── generic.js
├── dist/
│   ├── question-answer.user.js
│   └── question-answer.meta.js
├── tests/
│   ├── fixtures/
│   ├── matcher/
│   ├── profile/
│   ├── scoring/
│   └── providers/
├── package.json
├── README.md
└── .github/workflows/
    └── ci.yml
```

Provider-specific files are adapters only. Shared logic belongs in core/matcher/profile/scoring.

## 7. Runtime state machine

The assistant must use an explicit state machine.

Suggested states:

- `BOOTING`
- `UNSUPPORTED_CONTEXT`
- `READY`
- `SCANNING`
- `ANSWERING`
- `WAITING_FOR_USER`
- `WAITING_FOR_VERIFICATION`
- `SUBMIT_READY`
- `NAVIGATING`
- `SCREENED_OUT`
- `COMPLETED`
- `ERROR`
- `PAUSED`

Important rules:

- No state may silently jump through a verification gate.
- Low-confidence matches must go to `WAITING_FOR_USER`.
- Provider adapter exceptions fall back to generic scanning where safe.
- DOM mutations trigger debounced rescans.
- Navigation and history changes trigger state reevaluation.

## 8. Page and provider detection

Detection is layered:

1. Hostname/path recognition.
2. DOM signatures.
3. Visible textual landmarks.
4. iframe inventory and accessibility checks.
5. form/question structure heuristics.

Each adapter returns a typed capability object conceptually equivalent to:

```js
{
  provider: "primeearn",
  canScan: true,
  canFill: true,
  canAdvance: true,
  canReadReward: true,
  canDetectCompletion: true
}
```

Adapters must not claim capabilities they cannot verify.

## 9. Generic field discovery

The generic engine supports:

- radio groups;
- checkboxes;
- selects;
- text inputs;
- textareas;
- button-card answers;
- accessible labels;
- ARIA labelling;
- nearby question text;
- Shadow DOM only where browser access permits;
- same-origin iframes where browser access permits.

Cross-origin iframes are treated as independent pages only if the userscript manager injects there under valid match permissions. Otherwise the assistant displays a limitation and waits.

The engine must prefer accessibility semantics (`label`, `aria-label`, `aria-labelledby`, fieldset/legend) over brittle CSS selectors.

## 10. Question normalization

Normalize question text before matching:

- lowercase;
- whitespace normalization;
- punctuation normalization;
- Unicode normalization;
- common boilerplate stripping;
- language-aware aliases where explicitly configured;
- numeric/unit normalization.

Do not remove wording that materially changes meaning, such as time windows (“last 30 days” vs “ever”).

## 11. Profile model

The profile is a local structured object with provenance and confidence.

Example conceptual shape:

```js
{
  demographics: {
    age: { value: 31, source: "user", locked: true },
    country: { value: "FR", source: "user", locked: true }
  },
  employment: {
    status: { value: "...", source: "user", locked: true }
  },
  preferences: {},
  purchases: {}
}
```

Rules:

- User-entered immutable facts may be marked `locked`.
- The assistant never changes a locked fact based on a survey screenout.
- Time-sensitive answers may carry `validFrom` / `validUntil`.
- Sensitive categories should not be pre-populated unless the user explicitly adds them.
- “Unknown” is a valid state.

## 12. Consistency engine

Before filling a known question, the engine checks:

- canonical field identity;
- time scope;
- incompatible prior facts;
- stale values;
- provider-specific answer vocabulary.

Examples:

- Date of birth and age must agree.
- Country/region fields must not contradict one another.
- Employment status must not be inferred from unrelated screenouts.
- A “purchased in last 30 days” response must not reuse a timeless brand-preference answer.

If consistency cannot be proven, ask the user.

## 13. Semantic matching without deceptive optimization

Question matching uses a confidence ladder:

1. exact known alias;
2. normalized alias;
3. deterministic token/phrase rules;
4. structural context;
5. optional local fuzzy similarity;
6. otherwise ask.

The production userscript should not depend on a remote LLM to transmit survey content or personal profile data.

A question mapping is accepted automatically only above a strict confidence threshold and when the canonical profile field is unambiguous.

Learning means storing a user-confirmed mapping such as:

```text
“Which best describes your work situation?”
 -> employment.status
```

Learning must never mean:

```text
“This answer previously passed a screener, therefore use it.”
```

## 14. Answering engine

For a high-confidence match:

1. identify candidate field/control;
2. resolve profile value;
3. map profile value to available options;
4. verify semantic compatibility;
5. set the value using normal DOM events;
6. re-read the control to verify the selected value;
7. record a local non-sensitive trace;
8. advance only when configured and safe.

The engine must not use synthetic techniques intended to conceal automation.

## 15. Human overlay

A small mobile-first overlay is always available.

Core controls:

- Start / Resume
- Pause
- Stop
- Current provider
- Current state
- Known/unknown question status
- “Answer myself”
- “Remember this mapping”
- “Do not remember”
- “Edit profile”
- “History”
- “Why did you choose this answer?”

Unknown-question flow:

- show exact detected question;
- show detected answer options;
- allow the user to select/type an answer;
- optionally associate it with an existing canonical profile field;
- optionally create a new local profile field;
- do not remember by default for sensitive/subjective questions.

## 16. Verification and anti-bot handling

The assistant detects likely verification gates using conservative signals such as:

- visible CAPTCHA labels/containers;
- challenge pages;
- verification/identity language;
- provider-specific known verification states.

On detection:

- stop all automatic progression;
- enter `WAITING_FOR_VERIFICATION`;
- show a clear overlay;
- let the user complete the verification manually;
- resume only after the verification element disappears and normal survey content returns.

No CAPTCHA solving service, token injection, challenge replay, fingerprint spoofing, stealth patching, or anti-detection package is part of the project.

## 17. ZBD in-app browser / Safari handoff

Safari extensions generally do not execute inside another app's private WKWebView.

Therefore the product must include a handoff guide, not pretend this can always be automated.

Requirements:

- preserve the exact current URL, including query parameters and fragments;
- never rewrite or strip ZBD/PrimeEarn attribution parameters;
- provide a one-screen instruction for opening the current page in Safari using the platform's available share/open controls;
- once Safari loads the URL, the userscript resumes detection;
- if the exact URL cannot be transferred by the host app, the assistant cannot safely invent a replacement URL.

The static site can provide onboarding and diagnostic instructions, but cannot inspect a private ZBD WebView directly.

## 18. Outcome tracking

Store locally per attempt:

- local attempt ID;
- timestamp;
- provider;
- survey identifier when visible;
- advertised reward when visible;
- advertised duration when visible;
- observed elapsed time;
- outcome: completed / screened_out / abandoned / error;
- stage/question count at screenout when observable;
- adapter version;
- anonymous question fingerprints rather than full sensitive free-text where feasible.

Do not store CAPTCHA contents, identity documents, passwords, payout credentials, or biometric data.

## 19. Ranking and sats-per-minute optimization

The ranking engine optimizes survey selection using observed outcomes without manipulating answers.

Candidate score may include:

- advertised reward;
- estimated completion time;
- historical completion probability for the provider/category;
- screenout rate;
- historical actual duration;
- recency-weighted provider reliability;
- confidence in the reward/duration extraction.

Conceptual expected-value metric:

```text
expected_sats_per_minute =
  advertised_sats
  * estimated_completion_probability
  / max(estimated_minutes, floor_minutes)
```

Requirements:

- show uncertainty;
- do not present a score as guaranteed earnings;
- require a minimum sample size before provider-specific history strongly affects ranking;
- decay old observations;
- separate “screened out” from “technical failure”;
- never change profile answers in response to ranking.

## 20. Screenout learning

Screenout learning is descriptive, not deceptive.

Allowed learning:

- provider X screens out this user frequently;
- survey category Y historically has low completion probability;
- reward estimate was inaccurate;
- advertised 5 minutes historically takes 11 minutes.

Disallowed learning:

- answer B passed where answer A failed, so automatically lie with B next time;
- modify demographic facts to maximize completion;
- infer hidden screener keys and replay them.

## 21. Storage

Primary storage: Userscripts asynchronous GM storage.

Namespaces:

- `qa.profile.v1`
- `qa.mappings.v1`
- `qa.outcomes.v1`
- `qa.settings.v1`
- `qa.migrations`

All stored objects use explicit schema versions.

Optional encrypted export:

- JSON export generated on-device;
- encryption using Web Crypto with a passphrase chosen by the user;
- file saved manually to Files/iCloud;
- no GitHub upload of personal exports.

## 22. GitHub Pages

GitHub Pages is an onboarding/status surface, not the survey execution engine.

Planned site capabilities:

- explain installation;
- link to the `.user.js` installer;
- show current release/version;
- show changelog;
- provide troubleshooting;
- provide a synthetic test form to verify injection and local storage;
- explain Safari permissions;
- explain the WebView-to-Safari handoff.

No GitHub token is embedded in browser JavaScript.

## 23. Distribution and updates

Distribution files:

- `dist/question-answer.user.js`
- `dist/question-answer.meta.js`

The preferred install URL is a stable GitHub Pages path ending in `.user.js`. A raw GitHub file URL ending in `.user.js` is the documented fallback when Pages is not yet enabled or temporarily unavailable.

Because automatic userscript update implementations can vary, the assistant must also include a visible local “Check version” function that compares only non-sensitive version metadata from the static site.

No personal data is included in update requests.

## 24. Privacy and security

Default rules:

- local-only personal profile;
- no analytics;
- no third-party telemetry;
- no remote logging;
- no secrets in repository;
- no GitHub personal access token in Pages;
- no eval;
- no dynamically downloaded executable code from untrusted origins;
- sanitize all strings inserted into overlay HTML;
- prefer textContent over innerHTML;
- limit host permissions/matches where practical.

Because the repository is public, everything committed must be safe to disclose.

## 25. Testing strategy

### Unit tests

- text normalization;
- alias matching;
- profile consistency;
- option mapping;
- confidence thresholds;
- scoring;
- schema migration.

### DOM fixture tests

Synthetic fixtures for:

- radio survey;
- checkbox survey;
- dropdown;
- button cards;
- multi-page dynamic form;
- DOM replacement;
- same-origin iframe;
- inaccessible cross-origin iframe fallback;
- screenout page;
- completion page;
- verification page.

### Provider adapter tests

Provider-specific fixtures captured as sanitized structural HTML, never personal survey responses.

### iPhone acceptance tests

Manual acceptance checklist:

- install Userscripts on iPhone;
- enable Safari permissions;
- install the project userscript;
- pass the synthetic GitHub Pages test;
- persist a test profile value across domains via GM storage;
- pause/resume;
- unknown-question overlay;
- manual verification pause;
- screenout logging;
- completion logging;
- update/version check.

## 26. CI

GitHub Actions may run:

- lint;
- format check;
- unit tests;
- DOM fixture tests;
- bundle/build;
- metadata validation;
- checks ensuring no known personal-data fixture is committed.

CI must not log into ZBD/PrimeEarn or execute rewarded surveys.

## 27. Observability on device

A local debug mode may record bounded diagnostic events:

- state transitions;
- provider detection;
- matcher confidence;
- adapter fallback;
- storage migration;
- DOM-scan counts.

Debug logs must exclude answer values by default and be clearable by the user.

## 28. Failure handling

Principles:

- fail closed for low-confidence answers;
- fail open to manual user control;
- never loop clicks indefinitely;
- cap automatic navigation attempts;
- detect repeated identical pages;
- back off on rapid DOM changes;
- expose errors in plain language;
- one-tap pause/stop remains available.

## 29. Initial provider scope

V1:

1. PrimeEarn adapter.
2. Generic standards-based survey adapter.
3. Provider discovery telemetry stored locally by hostname so later adapters can be prioritized.

Do not pre-build speculative provider integrations without real pages/evidence.

## 30. Acceptance criteria for V1

V1 is complete when:

- the repository is installable on an iPhone with no PC;
- the GitHub Pages onboarding assets are complete and deployable; if Pages cannot be enabled through the available GitHub connector, the documented raw-GitHub installer fallback works until the user enables Pages in repository settings;
- the stable `.user.js` installs through Userscripts;
- profile data persists locally across supported survey domains;
- PrimeEarn pages are detected;
- common question controls can be discovered and filled from a truthful profile;
- unknown questions reliably pause for user input;
- manual verification pauses work;
- screenout/completion outcomes are stored locally;
- survey ranking uses local historical evidence;
- no personal profile data is present in the public repository;
- CI passes;
- documentation explains limitations honestly.

## 31. Post-V1 extension points

Only after evidence from real use:

- new provider adapters;
- improved multilingual aliases;
- better duration/reward parsing;
- encrypted backup/import;
- richer local analytics dashboard;
- optional Shortcuts integration if it can improve Safari handoff without breaking attribution.

No extension point may weaken the anti-fraud boundaries in this spec.

## 32. Design decisions summary

Chosen:

- iPhone execution.
- Safari + Userscripts.
- GitHub for source/static distribution/testing.
- GM storage for cross-domain local persistence.
- adapter + generic-engine architecture.
- deterministic/local semantic matching.
- explicit state machine.
- human-in-the-loop for unknown/sensitive/verification steps.
- local expected-value ranking based on real outcomes.

Rejected:

- GitHub Actions as the live rewarded-survey browser.
- cloud browser pretending to be the user's iPhone.
- CAPTCHA solving.
- stealth/anti-detection browser modifications.
- fabricated eligibility answers.
- public GitHub profile storage.
