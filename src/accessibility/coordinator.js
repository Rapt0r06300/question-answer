import{selectAccessibilityProfile}from'./profiles.js';import{buildAccessibilityHint,isCommercialCTA}from'../ads/accessibility-bridge.js';
const METHODS=Object.freeze({
'named-element':{requires:['accessibleCandidate'],instruction:'Sélectionner le contrôle accessible identifié'},
'voice-numbers':{requires:['voiceControl'],instruction:'Voice Control: afficher les numéros et sélectionner le contrôle identifié'},
'switch-item-scan':{requires:['switchControl'],instruction:'Switch Control: scanner les éléments accessibles'},
'voice-grid':{requires:['voiceControl'],instruction:'Voice Control: afficher la grille et viser la position indiquée'}
});
function supported(method,capabilities,candidate){return METHODS[method].requires.every(r=>r==='accessibleCandidate'?Boolean(candidate):Boolean(capabilities?.[r]));}
export function chooseAccessibilityMethod({context={},capabilities={},candidate=null}={}){const profile=selectAccessibilityProfile(context);if(candidate&&isCommercialCTA(candidate.text))return{kind:'blocked',reason:'commercial-cta',profile};if(!candidate)return{kind:'wait',reason:'no-reliable-candidate',profile};for(const method of profile.preferred){if(supported(method,capabilities,candidate)){return{kind:'assist',method,profile,hint:buildAccessibilityHint(candidate),instruction:METHODS[method].instruction};}}return{kind:'manual-fallback',reason:'no-supported-accessibility-method',profile,hint:buildAccessibilityHint(candidate)};}
export function createAccessibilityCoordinator({capabilities={},onInstruction,onPause}={}){let paused=false,last=null;return{evaluate(input={}){if(paused)return{kind:'paused'};last=chooseAccessibilityMethod({...input,capabilities:{...capabilities,...input.capabilities}});if(last.kind==='assist')onInstruction?.(last);return last;},panic(reason='user-kill-switch'){paused=true;onPause?.(reason);return{kind:'paused',reason};},resume(){paused=false;return{kind:'resumed'};},getState(){return{paused,last};}};}
