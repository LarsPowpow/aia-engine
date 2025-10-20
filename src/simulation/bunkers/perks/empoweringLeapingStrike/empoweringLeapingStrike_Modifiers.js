/**
 * Empowering Leaping Strike
 * Applies 20% Misc damage buff for 3s when Leaping Strike hits
 */

const METADATA = {
    id: 'perk_empoweringLeapingStrike',
    name: 'Empowering Leaping Strike',
    type: 'effect',
    sourceType: 'perk',
    bucket: 'WeaponAbilityPerk',
};

const handler = (context) => {
    const { event, source, timestamp } = context;

    // Only trigger on Leaping Strike ability hits
    const isLeapingStrike = 
        event?.abilityId === 'ability_sword_leaping_strike' ||
        /leaping\s*strike/i.test(event?.notes || '');

    if (!isLeapingStrike || event?.action !== 'ABILITY_HIT') {
        return null;
    }

    console.log('[Empowering Leaping Strike] ✅ Applying 20% Misc damage buff for 3s', {
        timestamp: timestamp?.toFixed(2),
        sourceId: source.id
    });

    // Apply misc damage buff to player (source)
    return {
        applyEffects: [
            {
                id: 'empowering_leaping_strike_buff',
                category: 'MISC_DAMAGE',  // Use MISC_DAMAGE category
                sourceId: source.id,
                targetId: source.id,
                value: 0.26,  // 26% misc damage
                duration: 3,
                appliedAt: timestamp,
                expiresAt: timestamp + 3,
                metadata: {
                    sourceName: 'Empowering Leaping Strike',
                }
            }
        ]
    };
};

export default { METADATA, handler };
