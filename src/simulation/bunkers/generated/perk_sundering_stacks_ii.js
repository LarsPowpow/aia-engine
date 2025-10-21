/**
 * Auto-generated Effect Bunker for Sundering Stacks II
 * Once every 0.5s, attack inflicts a stack of 4% Rend, each stack lasting 6s. (Max 5 stacks)
 */
import { checkConditions } from '../bunkerUtils.js';

export const METADATA = {
  "id": "perk_sundering_stacks_ii",
  "type": "PERK",
  "bucket": "fixed_perk",
  "label": "Sundering Stacks II",
  "name": "Sundering Stacks II",
  "description": "Once every 0.5s, attack inflicts a stack of 4% Rend, each stack lasting 6s. (Max 5 stacks)",
  "event": "ON_ATTACK",
  "cooldown": 0.5,
  "effects": [
    {
      "type": "rend",
      "value": 0.04,
      "duration": 6,
      "stackable": true,
      "maxStacks": 5
    }
  ]
};

/**
 * Handler for Sundering Stacks II
 * Applies stackable Rend debuff on any attack (0.5s internal cooldown)
 */
const handler = (context) => {
    const { event, source, target, timestamp } = context;
    
    console.log('[Sundering Stacks II] Handler called:', {
        action: event.action,
        timestamp: timestamp?.toFixed(2)
    });
    
    // Trigger on any attack action (not block, consumable, etc.)
    const attackActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
    if (!attackActions.includes(event.action)) {
        console.log('[Sundering Stacks II] Not an attack action, skipping');
        return null;
    }
    
    console.log('[Sundering Stacks II] ✓ Attack detected! Checking cooldown...');
    
    // Check cooldown (0.5s internal cooldown)
    const cooldownKey = 'perk_sundering_stacks_ii';
    if (!source.cooldowns) source.cooldowns = {};
    const lastProc = source.cooldowns[cooldownKey] || -999;
    const timeSinceLastProc = timestamp - lastProc;
    
    console.log('[Sundering Stacks II] Cooldown check:', {
        lastProc: lastProc.toFixed(2),
        timeSince: timeSinceLastProc.toFixed(2),
        cooldownDuration: 0.5,
        ready: timeSinceLastProc >= 0.5
    });
    
    if (timeSinceLastProc < 0.5) {
        console.log(`[Sundering Stacks II] ❌ On cooldown (${(0.5 - timeSinceLastProc).toFixed(2)}s remaining)`);
        return null;
    }
    
    // Update cooldown
    source.cooldowns[cooldownKey] = timestamp;
    
    console.log('[Sundering Stacks II] ✅ Applying Rend stack (4%)!', {
        targetId: target.id,
        value: 0.04,
        duration: 6,
        stackable: true,
        maxStacks: 5
    });
    
    // Apply stackable Rend effect
    return {
        applyEffects: [
            {
                id: 'sundering_stacks_ii_rend',
                category: 'REND',
                sourceId: source.id,
                targetId: target.id,
                value: 0.04,  // 4% Rend per stack
                duration: 6,
                stackable: true,  // ← Key property!
                maxStacks: 5,     // ← Max 5 stacks
                appliedAt: timestamp,
                expiresAt: timestamp + 6,
                metadata: {
                    sourceName: 'Sundering Stacks II',
                    rendType: 'stacking_armor_reduction'
                }
            }
        ]
    };
};

export default { METADATA, handler };
