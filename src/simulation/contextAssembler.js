/**
 * @file contextAssembler.js
 * @description A dedicated module for assembling the universal CombatEventContext object.
 * This module ensures a consistent and rich data payload for every in-game event.
 */

/**
 * Assembles the comprehensive CombatEventContext object.
 * This object serves as the single source of truth for all downstream systems
 * like triggers and condition checkers.
 *
 * @param {object} event - The raw choreography event (e.g., { timestamp, action, ... }).
 * @param {object} sourceCombatant - The full combatant object initiating the event.
 * @param {object} targetCombatant - The full combatant object receiving the event.
 * @returns {object} The fully assembled CombatEventContext object.
 */
export const assembleContext = (event, sourceCombatant, targetCombatant) => {
    const context = {
        timestamp: event.timestamp,
        eventType: event.action,
        // --- DEFINITIVE FIX ---
        // We are no longer making a deep copy. The context now holds a direct
        // reference to the live combatant objects. Any change made by the trigger
        // system will now be instantly reflected everywhere.
        source: sourceCombatant,
        target: targetCombatant,
        attack: null, // Initialize as null, populate if it's an attack event
        damage: null, // This property will be populated by the engine *after* damage calculation
        healing: null // This property will be populated by the engine *after* healing is calculated
    };

    // --- Populate Attack-Specific Details ---
    if (event.action.includes('ATTACK')) {
        context.attack = {
            isMelee: ['Sword', 'Flail'].includes(sourceCombatant.weaponType),
            isRanged: !['Sword', 'Flail'].includes(sourceCombatant.weaponType),
            isPositional: null, 
            isFinalInLightChain: false,
            abilityId: `player_${event.action.toLowerCase()}_${sourceCombatant.weaponType.toLowerCase()}`
        };
    }

    return context;
};

