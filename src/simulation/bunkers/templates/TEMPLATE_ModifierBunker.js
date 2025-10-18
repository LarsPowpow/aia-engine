/**
 * @file TEMPLATE_ModifierBunker.js
 * @description Blueprint for a "Modifier Bunker". This Bunker runs on Stroke 1
 * of the Two Stroke engine to modify the damage of the current event.
 */

export const METADATA = {
    id: 'TEMPLATE_MODIFIER_ID',
    type: 'PERK', // Or MASTERY, RUNEGLASS, etc.
};


/**
 * Generic modifier bunker handler for mass-producible damage buffs.
 * @param {object} context - Simulation event context.
 * @param {object} config - Modifier config (id, amount, eventType, abilityId, damageType, etc).
 * @returns {object|null} Modifier result for engine, or null if not applicable.
 */
const templateModifierBunker = (context, config = {}) => {
    if (!context || !context.source) return null;

    // Check event type and abilityId if specified in config
    if (config.eventType && context.eventType !== config.eventType) return null;
    if (config.abilityId && context.abilityId !== config.abilityId) return null;

    // Default to MISC_DAMAGE if not specified
    const damageType = config.damageType || 'MISC_DAMAGE';
    const amount = typeof config.amount === 'number' ? config.amount : 0;
    if (amount === 0) return null;

    // Return modifier result for engine
    return {
        type: 'MODIFIER',
        id: config.id || METADATA.id,
        source: context.source,
        target: context.target,
        damageType,
        amount,
        metadata: { ...METADATA, ...config }
    };
};

export default templateModifierBunker;

// --- Named factory for existing imports ---
export function createModifierBunker(config = {}) {
    return {
        id: config.id || METADATA.id,
        type: 'MODIFIER',
        metadata: { ...METADATA, ...config },
        handler: (context) => templateModifierBunker(context, config)
    };
}
