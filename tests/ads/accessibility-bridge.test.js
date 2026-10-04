import test from'node:test';import assert from'node:assert/strict';import{buildAccessibilityHint,isCommercialCTA}from'../../src/ads/accessibility-bridge.js';
test('hint exposes position and confidence without performing a tap',()=>{const h=buildAccessibilityHint({text:'Close',score:.96,rect:{left:10,top:20,width:30,height:30}});assert.equal(h.confidence,.96);assert.deepEqual(h.position,{x:25,y:35});assert.equal('tap' in h,false);});
test('CTA blacklist catches store actions',()=>{assert.equal(isCommercialCTA('Open in App Store'),true);});

test('JustPlay commercial play-now CTA remains blocked',()=>{assert.equal(isCommercialCTA('Play now'),true)});
