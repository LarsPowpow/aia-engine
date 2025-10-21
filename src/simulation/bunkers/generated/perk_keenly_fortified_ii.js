/**
 * Keenly Fortified II
 * Applies Fortify effect on critical hit
 */

const METADATA = {
    id: 'perk_keenly_fortified_ii',
    name: 'Keenly Fortified II',
    type: 'effect',
    sourceType: 'perk',
    bucket: 'weapon',
    tags: ['defense', 'fortify', 'crit-dependent'],
    description: 'Gain 19% Fortify for 5s on critical hit (7s cooldown).',
};

/**
 * Handler for Keenly Fortified II
 * Applies fortify buff when player crits
 */
const handler = (context) => {
    const { event, source, target, timestamp } = context;
    
    console.log('[Keenly Fortified II] Handler called:', {
        action: event.action,
        isCrit: event.isCrit,
        timestamp: timestamp?.toFixed(2)
    });
    
    // Only trigger on crit hits
    if (!event.isCrit) {
        console.log('[Keenly Fortified II] Not a crit, skipping');
        return null;
    }
    
    console.log('[Keenly Fortified II] ✓ Crit detected! Checking cooldown...');
    
    // Check cooldown (stored in source.cooldowns)
    const cooldownKey = 'perk_keenly_fortified_ii';
    if (!source.cooldowns) source.cooldowns = {};
    const lastProc = source.cooldowns[cooldownKey] || -999;
    const timeSinceLastProc = timestamp - lastProc;
    
    console.log('[Keenly Fortified II] Cooldown check:', {
        lastProc: lastProc.toFixed(2),
        timeSince: timeSinceLastProc.toFixed(2),
        cooldownDuration: 7,
        ready: timeSinceLastProc >= 7
    });
    
    if (timeSinceLastProc < 7) {
        console.log(`[Keenly Fortified II] ❌ On cooldown (${(7 - timeSinceLastProc).toFixed(2)}s remaining)`);
        return null;
    }
    
    // Update cooldown
    source.cooldowns[cooldownKey] = timestamp;
    
    console.log('[Keenly Fortified II] ✅ Applying fortify!', {
        targetId: source.id,
        fortifyPercent: 0.19,
        duration: 5
    });
    
    // Apply fortify effect to self (source)
    return {
        applyEffects: [
            {
                id: 'keenly_fortified_ii_buff',
                category: 'FORTIFY',
                sourceId: source.id,
                targetId: source.id,
                value: 0.19,
                duration: 5,
                appliedAt: timestamp,
                expiresAt: timestamp + 5,
                metadata: {
                    sourceName: 'Keenly Fortified II',
                }
            }
        ]
    };
};

export default { METADATA, handler };
