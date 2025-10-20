/**
 * Healing Defense II
 * On Block: Heal for 2.5% base health (5s cooldown)
 */

const METADATA = {
    id: 'perk_healing_defense_ii',
    name: 'Healing Defense II',
    type: 'effect',
    sourceType: 'perk',
    bucket: 'SkillCharm',
};

const handler = (context) => {
    const { event, source, timestamp } = context;

    console.log('[Healing Defense II] Handler called:', {
        action: event?.action,
        notes: event?.notes,
        timestamp: timestamp?.toFixed(2)
    });

    // Only trigger on block start
    if (event?.action !== 'BLOCK_START') {
        return null;
    }

    console.log('[Healing Defense II] ✓ Block detected! Checking cooldown...');

    // Check cooldown (5s)
    const cooldownKey = 'perk_healing_defense_ii';
    if (!source.cooldowns) source.cooldowns = {};
    const lastProc = source.cooldowns[cooldownKey] || -999;
    const timeSinceLastProc = timestamp - lastProc;

    console.log('[Healing Defense II] Cooldown check:', {
        lastProc: lastProc.toFixed(2),
        timeSince: timeSinceLastProc.toFixed(2),
        cooldownDuration: 5,
        ready: timeSinceLastProc >= 5
    });

    if (timeSinceLastProc < 5) {
        console.log(`[Healing Defense II] ❌ On cooldown (${(5 - timeSinceLastProc).toFixed(2)}s remaining)`);
        return null;
    }

    // Update cooldown
    source.cooldowns[cooldownKey] = timestamp;

    console.log('[Healing Defense II] ✅ Applying heal (2.5% base health)', {
        timestamp: timestamp?.toFixed(2),
        sourceId: source.id
    });

    // Apply heal effect
    return {
        applyEffects: [
            {
                id: 'healing_defense_ii_heal',
                category: 'HEAL',  // New category: HEAL
                sourceId: source.id,
                targetId: source.id,
                value: 0.025,  // 2.5% of base health
                duration: 0,  // Instant effect
                appliedAt: timestamp,
                expiresAt: timestamp,
                metadata: {
                    sourceName: 'Healing Defense II',
                    healType: 'percent',  // Percentage of base health
                }
            }
        ]
    };
};

export default { METADATA, handler };
