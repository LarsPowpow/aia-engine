/**
 * @file bunkerUtils.js
 * @description A collection of simple, stateless utility functions for "Dumb Brick" bunkers.
 */

/**
 * Performs a basic sanity check on the event context.
 */
export const checkContext = (context) => {
    return context && context.source && context.target;
};

/**
 * Checks if a source object has the required property (e.g., 'perks', 'masteries').
 */
export const checkSource = (source, requiredProperty) => {
    return source && Array.isArray(source[requiredProperty]);
};

/**
 * A generic condition checker that processes an array of condition strings.
 * @param {string[]} conditions - An array of condition strings from the effect data.
 * @param {object} context - The full CombatEventContext.
 * @returns {boolean} - True if all conditions are met, false otherwise.
 */
export const checkConditions = (conditions, context) => {
    if (!conditions || !Array.isArray(conditions)) {
        return true; // No conditions means it's always valid.
    }

    for (const condition of conditions) {
        const [type, value] = condition.split(':');
        const abilityId = context.abilityId ?? context.ability?.id ?? context.event?.abilityId ?? null;

        switch (type) {
            case 'ON_ABILITY_HIT':
                if (context.eventType !== 'ABILITY_HIT' || abilityId !== value) {
                    return false;
                }
                break;
            case 'SOURCE_PERK_LOCATION':
                // This is a placeholder for future logic. For now, it requires the context to have this info.
                if (context.sourcePerkLocation !== value) {
                    return false;
                }
                break;
            // Add other condition types here (e.g., TARGET_HAS_CC)
            default:
                // If we don't recognize the condition type, assume it fails.
                return false;
        }
    }
    return true; // All conditions passed.
};
