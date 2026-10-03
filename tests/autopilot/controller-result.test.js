import test from 'node:test';
import assert from 'node:assert/strict';
import { createAutopilotController } from '../../src/autopilot/controller.js';
import { createCancelableScheduler } from '../../src/autopilot/scheduler.js';

test('start returns runtime result for visible UI feedback',async()=>{
  const runtime={canStart:async()=>true,start:async()=>({kind:'waiting-for-questionnaire'}),pause(){},stop(){}};
  const c=createAutopilotController({runtime,scheduler:createCancelableScheduler(),store:{set:async()=>{}}});
  const result=await c.start();
  assert.equal(result.ok,true);
  assert.equal(result.result.kind,'waiting-for-questionnaire');
});
