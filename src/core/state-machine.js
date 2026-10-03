export const STATES=Object.freeze(['BOOTING','READY','SCANNING','ANSWERING','WAITING_FOR_USER','WAITING_FOR_VERIFICATION','PAUSED','COMPLETED','SCREENED_OUT','ERROR','STOPPED']);
export function createStateMachine(initial='BOOTING'){let state=initial;return{get state(){return state;},transition(next){if(!STATES.includes(next))return{ok:false,state};state=next;return{ok:true,state};}};}
