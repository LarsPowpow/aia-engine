/**
 * @file contextAssembler.js
 * @description A dedicated module for assembling the universal CombatEventContext object.
 * This module ensures a consistent and rich data payload for every in-game event.
 */

/**
 * Assembles the comprehensive CombatEventContext object.
 * This object serves as the single source of truth for all downstream systems.
 *
 * @param {object} event - The raw choreography event.
 * @param {object} sourceCombatant - The combatant initiating the event.
 * @param {object} targetCombatant - The combatant receiving the event.
 * @returns {object} The fully assembled CombatEventContext object.
 */
export const assembleContext = (event, sourceCombatant, targetCombatant) => {
    const context = {
        timestamp: event.timestamp,
        eventType: event.action,
        source: sourceCombatant,
        target: targetCombatant,
        attack: null,
        // --- DEFINITIVE FIX V2 ---
        // Initialize the ability property to ensure it always exists,
        // preventing the engine from crashing on non-ability events.
        ability: { baseDamageMultiplier: 1.0 },
        damage: null,
        healing: null
    };

    // Populate Attack-Specific Details
    if (event.action.includes('ATTACK') || event.action.includes('ABILITY_HIT')) {
        context.attack = {
            isMelee: ['Sword', 'Flail'].includes(sourceCombatant.weaponType),
            isRanged: !['Sword', 'Flail'].includes(sourceCombatant.weaponType),
            isPositional: null, 
            isFinalInLightChain: false,
            // Prioritize the specific abilityId from the choreography if it exists.
            abilityId: event.abilityId || `player_${event.action.toLowerCase()}_${sourceCombatant.weaponType.toLowerCase()}`
        };
    }

    return context;
};

