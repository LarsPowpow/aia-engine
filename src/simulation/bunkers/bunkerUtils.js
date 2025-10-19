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
 * Uses canonical schema from schema.js. Extensible for future condition types.
 *
 * Supported condition types:
 * - ON_ABILITY_HIT:abilityId
 * - SOURCE_PERK_LOCATION:slot
 * - (future) TARGET_HAS_CC, ATTACK_IS_BACKSTAB, etc.
 *
 * @param {string[]} conditions - An array of condition strings from the effect data.
 * @param {object} context - The full CombatEventContext.
 * @returns {boolean} - True if all conditions are met, false otherwise.
 */
import { EVENT_SCHEMA } from '../schema.js';
export const checkConditions = (conditions, context) => {
    if (!conditions || !Array.isArray(conditions)) {
        return true; // No conditions means it's always valid.
    }

    for (const condition of conditions) {
        const [type, value] = condition.split(':');
        const abilityId = context.abilityId;

        switch (type) {
            case 'ON_ABILITY_HIT':
                if (context.eventType !== 'ABILITY_HIT' || abilityId !== value) {
                    return false;
                }
                break;
            case 'SOURCE_PERK_LOCATION':
                if (context.sourcePerkLocation !== value) {
                    return false;
                }
                break;
            // Example: check for backstab
            case 'ATTACK_IS_BACKSTAB':
                if (!context.conditions || !context.conditions.includes('ATTACK_IS_BACKSTAB')) {
                    return false;
                }
                break;
            case 'TARGET_HAS_CC': {
                // Check if target has any active CC effect: SLOW, STUN, ROOT
                const ccCategories = ['SLOW', 'STUN', 'ROOT'];
                const targetEffects = (context.target?.activeEffects || []);
                console.log('[CHECKCONDITIONS DEBUG] TARGET_HAS_CC: targetEffects=', JSON.parse(JSON.stringify(targetEffects)));
                const hasCC = targetEffects.some(eff => ccCategories.includes(eff.category));
                console.log('[CHECKCONDITIONS DEBUG] TARGET_HAS_CC: hasCC=', hasCC);
                if (!hasCC) return false;
                break;
            }
            default:
                // If we don't recognize the condition type, assume it fails.
                return false;
        }
    }
    return true; // All conditions passed.
};

