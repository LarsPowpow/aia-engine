/**
 * @file stateUtils.js
 * @description A collection of pure utility functions for querying combatant state.
 * These are intended to be used by the decoupled "Bunker" components.
 */

/**
 * Checks if a combatant has an active effect belonging to a specific category.
 * @param {object} combatant - The combatant object to check.
 * @param {string} category - The category string to look for (e.g., "CC", "SLOW").
 * @returns {boolean} - True if an effect with the specified category is found, false otherwise.
 */
export const hasEffectByCategory = (combatant, category) => {
    if (!combatant || !combatant.activeEffects || !Array.isArray(combatant.activeEffects)) {
        return false;
    }

    for (const effect of combatant.activeEffects) {
        if (effect.categories && Array.isArray(effect.categories) && effect.categories.includes(category)) {
            return true;
        }
    }

    return false;
};

/**
 * Checks if a combatant has an active effect with a specific ID.
 * @param {object} combatant - The combatant object to check.
 * @param {string} effectId - The unique ID of the effect to look for.
 * @returns {boolean} - True if an effect with the specified ID is found, false otherwise.
 */
export const hasEffectById = (combatant, effectId) => {
    if (!combatant || !combatant.activeEffects || !Array.isArray(combatant.activeEffects)) {
        return false;
    }

    for (const effect of combatant.activeEffects) {
        if (effect.id === effectId) {
            return true;
        }
    }

    return false;
};

