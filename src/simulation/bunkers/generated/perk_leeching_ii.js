/**
 * Auto-generated Effect Bunker for Leeching II
 * Heal for 4% of the damage you deal (Does not trigger off persistent damage or DoT effects)
 */
import { checkConditions } from '../bunkerUtils.js';

export const METADATA = {
  "id": "perk_leeching_ii",
  "type": "PERK",
  "bucket": "fixed_perk",
  "label": "Leeching II",
  "name": "Leeching II",
  "description": "Heal for 4% of the damage you deal (Does not trigger off persistent damage or DoT effects).",
  "event": "ON_DAMAGE_DEALT",
  "effects": [
    {
      "type": "heal",
      "valuePercent": 0.04
    }
  ]
};

/**
 * Handler for Leeching II
 * Heals the player for 4% of direct damage dealt (not DoTs)
 */
const handler = (context) => {
    const { event, source, target, timestamp, finalDamage } = context;
    
    // Don't trigger on DoT ticks
    if (event.action === 'DOT_TICK') {
        return null;
    }
    
    // Don't trigger on non-damage actions
    const NON_DAMAGE_ACTIONS = ['BLOCK_START', 'BLOCK_HIT', 'BLOCK_END', 'CONSUMABLE', 'WEAPON_SWAP'];
    if (NON_DAMAGE_ACTIONS.includes(event.action)) {
        return null;
    }
    
    // Need finalDamage to calculate leech
    if (!finalDamage || finalDamage <= 0) {
        return null;
    }
    
    const leechAmount = Math.round(finalDamage * 0.04);
    
    console.log('[Leeching II] ✅ Healing for 4% of damage', {
        timestamp: timestamp?.toFixed(2),
        finalDamage,
        leechAmount
    });
    
    // Apply instant heal to player
    return {
        applyEffects: [
            {
                id: 'leeching_ii_heal',
                category: 'HEAL',
                sourceId: source.id,
                targetId: source.id,  // Heal self
                value: leechAmount,
                duration: 0,  // Instant
                appliedAt: timestamp,
                expiresAt: timestamp,
                metadata: {
                    sourceName: 'Leeching II',
                    healType: 'leech',
                    triggerDamage: finalDamage
                }
            }
        ]
    };
};

export default { METADATA, handler };
