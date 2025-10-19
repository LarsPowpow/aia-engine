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
    if (!conditions || !Array.isArray(conditions)) return true;

    // Helper: normalize keys to the canonical event schema names
    const normalizeKey = (k) => k.replace(/^ON_/, '').toLowerCase();

    for (const condition of conditions) {
        // condition can be 'KEY' or 'KEY:VALUE'
        const [rawKey, rawValue] = condition.split(':');
        const key = rawKey.trim();
        const value = rawValue !== undefined ? rawValue.trim() : undefined;

        // If condition starts with ON_, treat it as a test against eventType or generic presence
        if (key.startsWith('ON_')) {
            const expectedEvent = key.replace('ON_', '').toUpperCase();
            // allow eventType or action to satisfy an ON_ condition
            const actualEvent = (context.eventType || context.action || '').toUpperCase();
            if (actualEvent !== expectedEvent) return false;
            continue;
        }

        // Generic KEY:VALUE matching against the EVENT_SCHEMA fields
        const schemaKey = normalizeKey(key);
        if (schemaKey in EVENT_SCHEMA) {
            // if a value is provided, compare; otherwise just check presence/truthiness
            const ctxVal = context[schemaKey] ?? context[rawKey] ?? context[key];
            if (value !== undefined) {
                // numeric compare when schema expects number
                const expectedType = EVENT_SCHEMA[schemaKey].replace('?', '');
                if (expectedType === 'number') {
                    if (Number(ctxVal) !== Number(value)) return false;
                } else {
                    if (String(ctxVal) !== value) return false;
                }
            } else {
                if (ctxVal === undefined || ctxVal === null) return false;
            }
            continue;
        }

        // Special-cases: known composite checks
        switch (key) {
            case 'TARGET_HAS_CC': {
                const ccCategories = ['SLOW', 'STUN', 'ROOT'];
                const targetEffects = (context.target?.activeEffects || []);
                const hasCC = targetEffects.some(eff => ccCategories.includes(eff.category));
                if (!hasCC) return false;
                break;
            }
            case 'ATTACK_IS_BACKSTAB': {
                if (!context.conditions || !context.conditions.includes('ATTACK_IS_BACKSTAB')) return false;
                break;
            }
            default:
                // Unknown condition type — fail closed to avoid accidental procs
                return false;
        }
    }

    return true;
};

