/**
 * @file triggers.js
 * @description Processes all in-game events and dispatches to the appropriate mechanic handlers.
 */
import { applyHeal } from './mechanics/heal.js';

// This is a temporary utility function. It will be moved to a shared utils file later.
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * The universal trigger processor. It checks a combatant's sources against a trigger event.
 * @param {object} triggerEvent - The event that occurred (e.g., { type: 'ON_CRITICAL_HIT', ... }).
 * @param {object} combatant - The combatant who is the source of the potential trigger.
 * @param {number} timeline - The current timestamp in the simulation.
 * @param {Array<object>} allEffects - A complete list of all effects in the game.
 * @param {function} logAndCapture - The simulation's logging function.
 * @returns {boolean} - True if any effect was applied that could change the combatant's stats.
 */
const processTriggers = (triggerEvent, combatant, timeline, allEffects, logAndCapture) => {
    const { type, isCrit, damageDealt } = triggerEvent;
    let statsChanged = false;
    const triggersToProcess = [];
    
    console.log(`[DIAGNOSTIC] processTriggers called with event type: "${type}"`);

    // Map high-level events to specific trigger strings from The Rosetta Stone
    if (type === 'LIGHT_ATTACK' || type === 'HEAVY_ATTACK') triggersToProcess.push('ON_HIT');
    if (isCrit) triggersToProcess.push('ON_CRITICAL_HIT');
    if (damageDealt > 0) triggersToProcess.push('ON_DEALDAMAGE');
    if (type === 'BLOCK_HIT') triggersToProcess.push('ON_BLOCK_HIT');

    console.log('[DIAGNOSTIC] Triggers to process for this event:', triggersToProcess);
    if (triggersToProcess.length === 0) return false;

    // Iterate through all of the combatant's perks and masteries
    for (const source of combatant.baseSources) {
        for (const trigger of triggersToProcess) {
            console.log(`[DIAGNOSTIC] Checking source "${source.name}" for trigger "${trigger}"`);
            const triggerGroups = source.triggerGroups?.filter(tg => tg.trigger === trigger) || [];

            if (triggerGroups.length > 0) {
                console.log(`[DIAGNOSTIC] Found ${triggerGroups.length} matching trigger group(s) in "${source.name}"`);
            }

            for (const group of triggerGroups) {
                // Check if the source is on cooldown
                if (!combatant.state.cooldowns[source.id] || timeline >= combatant.state.cooldowns[source.id]) {
                    
                    if (group.cooldown) {
                       combatant.state.cooldowns[source.id] = timeline + group.cooldown;
                       console.log(`[DIAGNOSTIC] Cooldown for "${source.name}" set until timeline ${timeline + group.cooldown}`);
                    }

                    for (const effectId of group.effects) {
                        console.log(`[DIAGNOSTIC] Attempting to find and dispatch effect with ID: "${effectId}"`);
                        const effect = allEffects.find(e => e.id === effectId);
                        if(effect) {
                            console.log(`[DIAGNOSTIC] Found effect "${effect.name}". Dispatching to category: "${effect.category}"`);
                            // --- MECHANIC DISPATCHER (PHASE 3) ---
                            switch (effect.category) {
                                case 'STATUS_EFFECT': {
                                    statsChanged = true;
                                    const existingEffect = combatant.activeEffects.find(e => e.id === effect.id);
                                    if (existingEffect) {
                                        if (existingEffect.duration) {
                                            existingEffect.expiresAt = timeline + existingEffect.duration;
                                        }
                                    } else {
                                        const newEffectInstance = deepCopy(effect);
                                        if (newEffectInstance.duration) {
                                            newEffectInstance.expiresAt = timeline + newEffectInstance.duration;
                                        }
                                        combatant.activeEffects.push(newEffectInstance);
                                    }
                                    break;
                                }
                                case 'HEAL': {
                                    applyHeal(effect, { damageDealt, timeline }, combatant, logAndCapture);
                                    break;
                                }
                                default:
                                    console.warn(`[DIAGNOSTIC] Unhandled effect category: "${effect.category}"`);
                            }
                        } else {
                            console.error(`[DIAGNOSTIC] CRITICAL FAILURE: Could not find effect with ID "${effectId}" in allEffects list.`);
                        }
                    }
                } else {
                    console.log(`[DIAGNOSTIC] Source "${source.name}" is on cooldown. Skipping.`);
                }
            }
        }
    }
    return statsChanged; 
};

export { processTriggers };

