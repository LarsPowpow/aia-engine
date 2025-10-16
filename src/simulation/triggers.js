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
 * @returns {object} - An object containing { statsChanged: boolean, healingDone: number }
 */
const processTriggers = (triggerEvent, combatant, timeline, allEffects, logAndCapture) => {
    const { type, isCrit, damageDealt } = triggerEvent;
    let statsChanged = false;
    const triggersToProcess = [];
    
    let totalHealingThisEvent = 0;

    // Map high-level events to specific trigger strings from The Rosetta Stone
    if (type === 'LIGHT_ATTACK' || type === 'HEAVY_ATTACK') triggersToProcess.push('ON_HIT');
    if (isCrit) triggersToProcess.push('ON_CRITICAL_HIT');
    if (damageDealt > 0) triggersToProcess.push('ON_DEALDAMAGE');
    if (type === 'BLOCK_HIT') triggersToProcess.push('ON_BLOCK_HIT');

    if (triggersToProcess.length === 0) {
        return { statsChanged: false, healingDone: 0 };
    }

    for (const source of combatant.baseSources) {
        for (const trigger of triggersToProcess) {
            const triggerGroups = source.triggerGroups?.filter(tg => tg.trigger === trigger) || [];

            for (const group of triggerGroups) {
                if (!combatant.state.cooldowns[source.id] || timeline >= combatant.state.cooldowns[source.id]) {
                    
                    if (group.cooldown) {
                       combatant.state.cooldowns[source.id] = timeline + group.cooldown;
                    }

                    for (const effectId of group.effects) {
                        const effect = allEffects.find(e => e.id === effectId);
                        if(effect) {
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
                                    const healAmount = applyHeal(effect, { damageDealt, timeline }, combatant, logAndCapture);
                                    // --- DIAGNOSTIC START ---
                                    console.log(`[DIAGNOSTIC | triggers.js] Received healAmount: ${healAmount} from applyHeal.`);
                                    // --- DIAGNOSTIC END ---
                                    totalHealingThisEvent += healAmount;
                                    break;
                                }
                                default:
                                    break;
                            }
                        }
                    }
                }
            }
        }
    }
    
    // --- DIAGNOSTIC START ---
    console.log(`[DIAGNOSTIC | triggers.js] Returning totalHealingThisEvent: ${totalHealingThisEvent}`);
    // --- DIAGNOSTIC END ---
    return { statsChanged, healingDone: totalHealingThisEvent }; 
};

export { processTriggers };

