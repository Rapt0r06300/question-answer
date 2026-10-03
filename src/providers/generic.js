import { createAdapter, makeCapabilities } from './adapter.js';

export const genericAdapter = createAdapter({
  name: 'generic',
  detect() {
    return true;
  },
  capabilities() {
    return makeCapabilities({ canScan: true, canFill: true, canAdvance: false });
  },
  scan() {
    return { questions: [] };
  },
  readOpportunity() {
    return null;
  },
  detectOutcome() {
    return null;
  },
});
