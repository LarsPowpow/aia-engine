/**
 * Auto-generated Effect Bunker for Keenly Jagged II
 * Applies Bleed DOT on critical hit
 */
import { checkConditions } from '../bunkerUtils.js';

export const METADATA = {
  "id": "perk_keenly_jagged_ii",
  "type": "PERK",
  "bucket": "SkillCharm",
  "label": "Keenly Jagged II",
  "name": "Keenly Jagged II",
  "description": "Inflicts Bleed on critical hit, dealing 9% weapon damage per second for 6s (7s cooldown).",
  "event": "ON_CRIT",
  "cooldown": 7,
  "effects": [
    {
      "type": "bleed",
      "damagePercent": 0.09,
      "duration": 6,
      "tickInterval": 1
    }
  ]
};

/**
 * Handler for Keenly Jagged II
 * Applies bleed DOT effect when player crits
 */
const handler = (context) => {
    const { event, source, target, timestamp } = context;
    
    console.log('[Keenly Jagged II] Handler called:', {
        action: event.action,
        isCrit: event.isCrit,
        timestamp: timestamp?.toFixed(2)
    });
    
    // Only trigger on crit hits
    if (!event.isCrit) {
        console.log('[Keenly Jagged II] Not a crit, skipping');
        return null;
    }
    
    console.log('[Keenly Jagged II] ✓ Crit detected! Checking cooldown...');
    
    // Check cooldown (stored in source.cooldowns)
    const cooldownKey = 'perk_keenly_jagged_ii';
    if (!source.cooldowns) source.cooldowns = {};
    const lastProc = source.cooldowns[cooldownKey] || -999; // ✅ Changed from 0 to -999
    const timeSinceLastProc = timestamp - lastProc;
    
    console.log('[Keenly Jagged II] Cooldown check:', {
        lastProc: lastProc.toFixed(2),
        timeSince: timeSinceLastProc.toFixed(2),
        cooldownDuration: 7,
        ready: timeSinceLastProc >= 7
    });
    
    if (timeSinceLastProc < 7) {
        console.log(`[Keenly Jagged II] ❌ On cooldown (${(7 - timeSinceLastProc).toFixed(2)}s remaining)`);
        return null;
    }
    
    // Update cooldown
    source.cooldowns[cooldownKey] = timestamp;
    
    console.log('[Keenly Jagged II] ✅ Applying bleed!', {
        targetId: target.id,
        damagePercent: 0.09,
        duration: 6,
        weaponType: source.weaponType,
        attributes: source.attributes
    });
    
    // Apply bleed effect that will generate tick events
    return {
        applyEffects: [
            {
                id: 'keenly_jagged_ii_bleed',
                category: 'BLEED',
                sourceId: source.id,
                targetId: target.id,
                damagePercent: 0.09,
                duration: 6,
                tickInterval: 1,
                appliedAt: timestamp,
                nextTickAt: timestamp + 1,
                expiresAt: timestamp + 6,
                metadata: {
                    sourceName: 'Keenly Jagged II',
                    weaponType: source.weaponType,
                    attributes: { ...source.attributes }
                }
            }
        ]
    };
};

export default { METADATA, handler };