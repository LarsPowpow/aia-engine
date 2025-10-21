/**
 * Auto-generated Effect Bunker for Trenchant Rend II
 * Heavy melee attacks inflict Rend for 7s, reducing the target's armor by 20% (7s cooldown).
 */
import { checkConditions } from '../bunkerUtils.js';

export const METADATA = {
  "id": "perk_trenchant_rend_ii",
  "type": "PERK",
  "bucket": "SkillCharm",
  "label": "Trenchant Rend II",
  "name": "Trenchant Rend II",
  "description": "Heavy melee attacks inflict Rend for 7s, reducing the target's armor by 20% (7s cooldown).",
  "event": "ON_HEAVY_ATTACK",
  "cooldown": 7,
  "effects": [
    {
      "type": "rend",
      "value": 0.20,
      "duration": 7
    }
  ]
};

/**
 * Handler for Trenchant Rend II
 * Applies Rend debuff when player performs a heavy attack
 */
const handler = (context) => {
    const { event, source, target, timestamp } = context;
    
    console.log('[Trenchant Rend II] Handler called:', {
        action: event.action,
        timestamp: timestamp?.toFixed(2)
    });
    
    // Only trigger on heavy attacks
    if (event.action !== 'HEAVY_ATTACK') {
        console.log('[Trenchant Rend II] Not a heavy attack, skipping');
        return null;
    }
    
    console.log('[Trenchant Rend II] ✓ Heavy attack detected! Checking cooldown...');
    
    // Check cooldown (stored in source.cooldowns)
    const cooldownKey = 'perk_trenchant_rend_ii';
    if (!source.cooldowns) source.cooldowns = {};
    const lastProc = source.cooldowns[cooldownKey] || -999;
    const timeSinceLastProc = timestamp - lastProc;
    
    console.log('[Trenchant Rend II] Cooldown check:', {
        lastProc: lastProc.toFixed(2),
        timeSince: timeSinceLastProc.toFixed(2),
        cooldownDuration: 7,
        ready: timeSinceLastProc >= 7
    });
    
    if (timeSinceLastProc < 7) {
        console.log(`[Trenchant Rend II] ❌ On cooldown (${(7 - timeSinceLastProc).toFixed(2)}s remaining)`);
        return null;
    }
    
    // Update cooldown
    source.cooldowns[cooldownKey] = timestamp;
    
    console.log('[Trenchant Rend II] ✅ Applying 20% Rend!', {
        targetId: target.id,
        value: 0.20,
        duration: 7
    });
    
    // Apply Rend effect
    return {
        applyEffects: [
            {
                id: 'trenchant_rend_ii',
                category: 'REND',
                sourceId: source.id,
                targetId: target.id,
                value: 0.20,  // 20% armor reduction
                duration: 7,
                appliedAt: timestamp,
                expiresAt: timestamp + 7,
                metadata: {
                    sourceName: 'Trenchant Rend II',
                    rendType: 'armor_reduction'
                }
            }
        ]
    };
};

export default { METADATA, handler };
