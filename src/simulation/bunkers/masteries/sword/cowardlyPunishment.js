/**
 * @file cowardlyPunishment.js
 * @description Bunker for the Cowardly Punishment mastery.
 * @version 1.1.0 - Aligned with Bunker Manifest architecture
 */

// --- METADATA ---
export const METADATA = {
    id: 'upgrade_sword_leapingstrike_slow',
    type: 'MASTERY',
};

// --- BUNKER HANDLER ---
const cowardlyPunishment = (context) => {
    console.debug('[BUNKER DEBUG] cowardlyPunishment called', {
        eventType: context?.eventType,
        abilityId: context?.abilityId ?? context?.event?.abilityId,
        masteries: context?.source?.masteries ?? context?.combatant?.masteries
    });
    // Strict sanity checks
    if (!context || !context.source) return;

    // Derive a canonical abilityId from the minimalist context (support legacy shapes)
    const abilityId = context.abilityId ?? context.ability?.id ?? context.event?.abilityId ?? null;

    // NEW: Trigger only on an ABILITY_HIT for Leaping Strike (accept common legacy id variants)
    if (!(context.eventType === 'ABILITY_HIT' &&
          (abilityId === 'leapingStrike' ||
           abilityId === 'ability_sword_leapingstrike' ||
           abilityId === 'ability_sword_leaping_strike'))) {
        return;
    }

    // Self-check: Is this mastery equipped? Support either alias (source or combatant)
    const masteries = context.source?.masteries ?? context.combatant?.masteries ?? [];
    const isEquipped = Array.isArray(masteries) && masteries.some(m => m?.id === METADATA.id);
    if (!isEquipped) {
        return;
    }

    // Trigger: Only on Leaping Strike ability hit
    const slowEffect = {
        id: 'effect_cowardly_punishment_slow',
        name: 'Cowardly Punishment - Slow',
        category: 'DEBUFF',
        statusId: 'SLOW',
        value: 30, // 30% slow
        duration: 3,
        expiresAt: context.timestamp + 3,
        sourceName: 'Cowardly Punishment',
    };
    context.target.activeEffects.push(slowEffect);
};

export default cowardlyPunishment;
