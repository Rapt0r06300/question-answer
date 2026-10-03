import test from'node:test';import assert from'node:assert/strict';import{scoreExitCandidate,chooseExitCandidate}from'../../src/ads/exit-detector.js';
function el(text,rect={left:350,top:10,right:380,bottom:40,width:30,height:30}){return{innerText:text,click(){},getAttribute(){return null;},getBoundingClientRect(){return rect;}};}
test('high confidence close at edge after time gate',()=>{assert.ok(scoreExitCandidate(el('Close'),{elapsedMs:30000}).score>=.92);});
test('commercial CTA is always rejected',()=>{assert.equal(scoreExitCandidate(el('Install'),{elapsedMs:30000}).score,0);});
test('exit shown too early is not accepted',()=>{assert.ok(scoreExitCandidate(el('X'),{elapsedMs:1000,minAdMs:5000}).score<.92);});
test('close candidates too close are ambiguous',()=>{assert.equal(chooseExitCandidate([{score:.98},{score:.95}]).kind,'ambiguous');});
