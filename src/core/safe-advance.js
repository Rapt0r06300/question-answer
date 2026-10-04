const NEXT=/^(next|continue|continue survey|next question|suivant|continuer|continuer le sondage|question suivante|poursuivre)$/i;
const BLOCK=/(submit|finish|complete|terminer|envoyer|valider le sondage|claim|reward|install|download|acheter|buy)/i;
function label(el){return String(el?.getAttribute?.('aria-label')||el?.textContent||el?.value||'').replace(/\s+/g,' ').trim()}
export function findSafeAdvance(root){if(!root?.querySelectorAll)return null;const candidates=[...root.querySelectorAll('button,input[type="button"],a[role="button"],[role="button"]')].filter(el=>{const s=label(el);return NEXT.test(s)&&!BLOCK.test(s)&&!el.disabled&&el.getAttribute?.('aria-disabled')!=='true'});return candidates.length===1?candidates[0]:null}
export function safeAdvance(root){const control=findSafeAdvance(root);if(!control)return{advanced:false};control.click?.();return{advanced:true,label:label(control)}}
