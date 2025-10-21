/**
 * Auto-generated Effect Bunker for Lifestealing II
 * Heal for 5.5% of the damage you deal (Does not trigger off persistent damage or DoT effects)
 */
import { checkConditions } from '../bunkerUtils.js';

export const METADATA = {
  "id": "perk_lifestealing_ii",
  "type": "PERK",
  "bucket": "fixed_perk",
  "label": "Lifestealing II",
  "name": "Lifestealing II",
  "description": "Heal for 5.5% of the damage you deal (Does not trigger off persistent damage or DoT effects).",
  "event": "ON_DAMAGE_DEALT",
  "effects": [
    {
      "type": "heal",
      "valuePercent": 0.055
    }
  ]
};

/**
 * Handler for Lifestealing II
 * Heals the player for 5.5% of direct damage dealt (not DoTs)
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
    
    // Need finalDamage to calculate lifesteal
    if (!finalDamage || finalDamage <= 0) {
        return null;
    }
    
    const lifestealAmount = Math.round(finalDamage * 0.055);
    
    console.log('[Lifestealing II] ✅ Healing for 5.5% of damage', {
        timestamp: timestamp?.toFixed(2),
        finalDamage,
        lifestealAmount
    });
    
    // Apply instant heal to player
    return {
        applyEffects: [
            {
                id: 'lifestealing_ii_heal',
                category: 'HEAL',
                sourceId: source.id,
                targetId: source.id,  // Heal self
                value: lifestealAmount,
                duration: 0,  // Instant
                appliedAt: timestamp,
                expiresAt: timestamp,
                metadata: {
                    sourceName: 'Lifestealing II',
                    healType: 'lifesteal',
                    triggerDamage: finalDamage
                }
            }
        ]
    };
};

export default { METADATA, handler };
