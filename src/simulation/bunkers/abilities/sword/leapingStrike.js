/**
 * @file leapingStrike.js
 * @description The Ability Bunker for the base Leaping Strike ability.
 * Its sole responsibility is to declare the ability's base weapon damage modifier.
 */

// The unique ID for this ability in the mastery tree.
const ABILITY_ID = 'ability_sword_leapingstrike';

/**
 * Handles the base effect of the Leaping Strike ability.
 * @param {object} context The universal CombatEventContext.
 */
export const handleLeapingStrikeAbility = (context) => {
    // --- BUNKER SELF-CHECK ---
    // Is this ability selected in the source's mastery tree?
    const isEquipped = context.source.masteries?.some(m => m.id === ABILITY_ID);
    if (!isEquipped) {
        return; // If not equipped, do nothing.
    }

    // This Bunker only cares about the Leaping Strike ability hit.
    if (context.attack?.abilityId !== 'ability_sword_leaping_strike') {
        return;
    }

    // --- State Mutation ---
    // Overwrite the default base damage multiplier with this ability's specific value.
    // 1.0 represents the 100% weapon damage from the source data.
    context.ability.baseDamageMultiplier = 1.0;
};

