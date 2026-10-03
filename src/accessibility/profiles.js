export const ACCESSIBILITY_PROFILES=Object.freeze({
  justplay:{id:'justplay',preferred:['named-element','voice-numbers','switch-item-scan','voice-grid'],allowPreemption:true,scanSpeed:'fast',purpose:'rewarded-ad-return'},
  zbdSurvey:{id:'zbd-survey',preferred:['named-element','voice-numbers','switch-item-scan'],allowPreemption:false,scanSpeed:'normal',purpose:'form-completion'},
  zbdGame:{id:'zbd-game',preferred:['named-element','switch-item-scan','voice-grid'],allowPreemption:true,scanSpeed:'fast',purpose:'interruptible-game'},
  generic:{id:'generic',preferred:['named-element','voice-numbers','switch-item-scan','voice-grid'],allowPreemption:false,scanSpeed:'normal',purpose:'safe-fallback'}
});
export function selectAccessibilityProfile(context={}){if(context.app==='justplay')return ACCESSIBILITY_PROFILES.justplay;if(context.app==='zbd'&&context.activity==='survey')return ACCESSIBILITY_PROFILES.zbdSurvey;if(context.app==='zbd'&&context.activity==='game')return ACCESSIBILITY_PROFILES.zbdGame;return ACCESSIBILITY_PROFILES.generic;}
