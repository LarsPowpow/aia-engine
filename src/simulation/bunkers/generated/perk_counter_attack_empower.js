/**
 * Counter Attack (Empower)
 * On Block: Gain a 20% Empower for 4s
 */

const METADATA = {
    id: 'perk_counter_attack_empower',
    name: 'Counter Attack',
    type: 'effect',
    sourceType: 'perk',
    bucket: 'SkillCharm',
};

const handler = (context) => {
    const { event, source, timestamp } = context;

    console.log('[Counter Attack] Handler called:', {
        action: event?.action,
        notes: event?.notes,
        timestamp: timestamp?.toFixed(2)
    });

    // Only trigger on block start
    if (event?.action !== 'BLOCK_START') {
        return null;
    }

    console.log('[Counter Attack] ✅ Applying 20% Empower for 4s on block', {
        timestamp: timestamp?.toFixed(2),
        sourceId: source.id
    });

    // Apply empower buff to player (source)
    return {
        applyEffects: [
            {
                id: 'counter_attack_empower_buff',
                category: 'EMPOWER',
                sourceId: source.id,
                targetId: source.id,
                value: 0.20,  // 20% empower
                duration: 4,
                appliedAt: timestamp,
                expiresAt: timestamp + 4,
                metadata: {
                    sourceName: 'Counter Attack',
                }
            }
        ]
    };
};

export default { METADATA, handler };
