import test from 'node:test';
import assert from 'node:assert/strict';
import { createEarnOrchestrator } from '../../src/optimizer/automation-orchestrator.js';

test('orchestrator opens chosen ZBD activity then switches to JustPlay when ready', async () => {
  const opened = [];
  let now = 60000;
  const orchestrator = createEarnOrchestrator({
    clock: () => now,
    openTarget: async (target, meta) => opened.push({ target, meta }),
  });

  await orchestrator.tick({
    justPlay: { lastViewedAt: 0, cooldownMs: 300000 },
    opportunities: [{ id: 'game', source: 'game', satsPerMinute: 50, estimatedMinutes: 10, launchTarget: 'zbd://game' }],
  });
  assert.equal(opened[0].target, 'zbd://game');

  now = 300000;
  const result = await orchestrator.tick({
    justPlay: { lastViewedAt: 0, cooldownMs: 300000, launchTarget: 'justplay://' },
    opportunities: [],
  });
  assert.equal(result.kind, 'JUSTPLAY_READY');
  assert.equal(opened.at(-1).target, 'justplay://');
});


test('orchestrator launches a DOM-only survey without href',async()=>{const calls=[];const o=createEarnOrchestrator({openTarget:async(target,meta)=>{calls.push({target,meta});return true}});const element={click(){}};const result=await o.tick({justPlay:{schemaVersion:1},opportunities:[{id:'dom-survey',source:'survey',element}]});assert.equal(calls.length,1);assert.equal(calls[0].target,null);assert.equal(calls[0].meta.opportunity.element,element);assert.equal(result.opened,true)});
