/**
 * Auto-generated Effect Bunker for Arcane Attunement II
 * Successful hits deal +14% weapon damage as Arcane (1.5s cooldown)
 */
import { checkConditions } from '../bunkerUtils.js';

export const METADATA = {
  "id": "perk_arcane_attunement_ii",
  "type": "PERK",
  "bucket": "fixed_perk",
  "label": "Arcane Attunement II",
  "name": "Arcane Attunement II",
  "description": "Successful hits deal +14% weapon damage as Arcane (1.5s cooldown).",
  "event": "ON_HIT",
  "cooldown": 1.5,
  "effects": [
    {
      "type": "arcane_damage",
      "damagePercent": 0.14
    }
  ]
};

/**
 * Handler for Arcane Attunement II
 * Deals additional arcane damage on successful hits
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
    
    // Need finalDamage to occur (means we hit)
    if (!finalDamage || finalDamage <= 0) {
        return null;
    }
    
    console.log('[Arcane Attunement II] Handler called:', {
        action: event.action,
        timestamp: timestamp?.toFixed(2)
    });
    
    // Check cooldown (1.5s)
    const cooldownKey = 'perk_arcane_attunement_ii';
    if (!source.cooldowns) source.cooldowns = {};
    const lastProc = source.cooldowns[cooldownKey] || -999;
    const timeSinceLastProc = timestamp - lastProc;
    
    console.log('[Arcane Attunement II] Cooldown check:', {
        lastProc: lastProc.toFixed(2),
        timeSince: timeSinceLastProc.toFixed(2),
        cooldownDuration: 1.5,
        ready: timeSinceLastProc >= 1.5
    });
    
    if (timeSinceLastProc < 1.5) {
        console.log(`[Arcane Attunement II] ❌ On cooldown (${(1.5 - timeSinceLastProc).toFixed(2)}s remaining)`);
        return null;
    }
    
    // Update cooldown
    source.cooldowns[cooldownKey] = timestamp;
    
    // Calculate arcane damage (14% of weapon damage, NOT final damage)
    // We need base weapon damage before modifiers
    const weaponDamage = source.weaponDamage || 1000; // Fallback
    const arcaneDamage = weaponDamage * 0.14;
    
    console.log('[Arcane Attunement II] ✅ Dealing arcane damage!', {
        weaponDamage,
        arcaneDamage: Math.round(arcaneDamage),
        targetId: target.id
    });
    
    // Return arcane damage effect
    return {
        applyEffects: [
            {
                id: 'arcane_attunement_ii_damage',
                category: 'ARCANE_DAMAGE',
                damageType: 'ARCANE',
                sourceId: source.id,
                targetId: target.id,
                baseDamage: arcaneDamage,
                appliedAt: timestamp,
                metadata: {
                    sourceName: 'Arcane Attunement II',
                    weaponDamage,
                    damagePercent: 0.14
                }
            }
        ]
    };
};

export default { METADATA, handler };
