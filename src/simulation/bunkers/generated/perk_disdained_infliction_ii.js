/**
 * Auto-generated Modifier Bunker for Disdained Infliction II
 * Potency of outgoing DoTs are increased by 20%
 * (Simplified from: 15% base + ~5% from duration extension mechanic)
 */
import { checkConditions } from '../bunkerUtils.js';

export const METADATA = {
  "id": "perk_disdained_infliction_ii",
  "type": "PERK",
  "bucket": "fixed_perk",
  "label": "Disdained Infliction II",
  "name": "Disdained Infliction II",
  "description": "Potency of outgoing DoTs are increased by 20%.",
  "event": "ON_DOT_TICK",
  "effects": [
    {
      "type": "misc_damage",
      "value": 0.20
    }
  ]
};

/**
 * Handler for Disdained Infliction II
 * Passively boosts DoT damage by 20%
 */
const handler = (context) => {
    const { event, source, target, timestamp } = context;
    
    console.log('[Disdained Infliction II] Handler called for action:', event?.action);
    
    // Only apply to DoT tick events
    if (event.action !== 'DOT_TICK') {
        console.log('[Disdained Infliction II] ❌ Not a DOT_TICK, skipping');
        return null;
    }
    
    console.log('[Disdained Infliction II] ✅ Boosting DoT damage by 20%', {
        timestamp: timestamp?.toFixed(2),
        dotEffect: event.dotEffect?.id
    });
    
    // Return damage modifier (applies in Stroke 1)
    return {
        modifyDamage: [
            {
                category: 'MISC_DAMAGE',
                value: 0.20  // 20% damage boost
            }
        ]
    };
};

export default { METADATA, handler };
