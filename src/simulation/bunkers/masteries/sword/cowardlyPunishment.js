/**
 * @file cowardlyPunishment.js
 * @description Bunker for the Cowardly Punishment mastery.
 * @version 2.0.0 - Data-Driven Refactor
 */

// --- METADATA ---
export const METADATA = {
    id: 'upgrade_sword_leapingstrike_slow',
    type: 'WEAPON_MASTERY',
};

// --- BUNKER HANDLER ---
const cowardlyPunishment = (context) => {
    // Strict sanity checks
    if (!context || !context.source || !context.target || !context.source.masteries) {
        return;
    }

    const { source, target, timestamp } = context;

    // Self-check: Is this mastery equipped and does it have a valid effects array?
    const masterySource = source.masteries.find(m => m.id === METADATA.id);
    if (!masterySource || !Array.isArray(masterySource.effects) || masterySource.effects.length === 0) {
        return;
    }

    const abilityId = context.abilityId ?? context.ability?.id ?? context.event?.abilityId ?? null;

    for (const effectDef of masterySource.effects) {
        // Condition Check: Does the effect's condition match the current event?
        // Example condition: "ON_ABILITY_HIT:ability_sword_leapingstrike"
        const condition = effectDef.conditions?.[0];
        if (!condition) continue;

        const [trigger, requiredId] = condition.split(':');
        const isTriggerMet = (trigger === 'ON_ABILITY_HIT' && context.eventType === 'ABILITY_HIT');
        const isIdMet = (abilityId === requiredId);

        if (isTriggerMet && isIdMet) {
            // Action: Apply the defined effect to the target.
            const newEffect = {
                id: effectDef.id,
                name: effectDef.name,
                category: effectDef.category,
                value: parseFloat(effectDef.valueFormula) || 0,
                duration: effectDef.duration,
                expiresAt: timestamp + effectDef.duration,
                sourceName: masterySource.name,
                sourceId: masterySource.id,
            };
            target.activeEffects.push(newEffect);
        }
    }
};

export default cowardlyPunishment;
