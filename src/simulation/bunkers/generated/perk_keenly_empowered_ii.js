/**
 * Auto-generated Effect Bunker for Keenly Empowered II
 * Applies Empower effect on critical hit
 */

const METADATA = {
    id: 'perk_keenly_empowered_ii',
    name: 'Keenly Empowered II',
    type: 'effect',
    sourceType: 'perk',
    bucket: 'SkillCharm',
    tags: ['offense', 'empower', 'crit-dependent'],
    description: 'Gain 13% Empower for 5s on critical hit (7s cooldown).',
};

/**
 * Handler for Keenly Empowered II
 * Applies empower buff when player crits
 */
const handler = (context) => {
    const { event, source, target, timestamp } = context;
    
    console.log('[Keenly Empowered II] Handler called:', {
        action: event.action,
        isCrit: event.isCrit,
        timestamp: timestamp?.toFixed(2)
    });
    
    // Only trigger on crit hits
    if (!event.isCrit) {
        console.log('[Keenly Empowered II] Not a crit, skipping');
        return null;
    }
    
    console.log('[Keenly Empowered II] ✓ Crit detected! Checking cooldown...');
    
    // Check cooldown (stored in source.cooldowns)
    const cooldownKey = 'perk_keenly_empowered_ii';
    if (!source.cooldowns) source.cooldowns = {};
    const lastProc = source.cooldowns[cooldownKey] || -999;
    const timeSinceLastProc = timestamp - lastProc;
    
    console.log('[Keenly Empowered II] Cooldown check:', {
        lastProc: lastProc.toFixed(2),
        timeSince: timeSinceLastProc.toFixed(2),
        cooldownDuration: 7,
        ready: timeSinceLastProc >= 7
    });
    
    if (timeSinceLastProc < 7) {
        console.log(`[Keenly Empowered II] ❌ On cooldown (${(7 - timeSinceLastProc).toFixed(2)}s remaining)`);
        return null;
    }
    
    // Update cooldown
    source.cooldowns[cooldownKey] = timestamp;
    
    console.log('[Keenly Empowered II] ✅ Applying empower!', {
        targetId: source.id,
        empowerPercent: 0.13,
        duration: 5
    });
    
    // Apply empower effect to self (source)
    return {
        applyEffects: [
            {
                id: 'keenly_empowered_ii_buff',
                category: 'EMPOWER',
                sourceId: source.id,
                targetId: source.id,
                value: 0.13,
                duration: 5,
                appliedAt: timestamp,
                expiresAt: timestamp + 5,
                metadata: {
                    sourceName: 'Keenly Empowered II',
                }
            }
        ]
    };
};

export default { METADATA, handler };