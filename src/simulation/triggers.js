/**
 * @file triggers.js
 * @description Processes all in-game events and dispatches to the appropriate mechanic handlers.
 */
import { applyHeal } from './mechanics/heal.js';
import { calculateEffectValue } from './scaling.js';

const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

const checkConditions = (conditions, context) => {
    if (!conditions || conditions.length === 0) return true;
    for (const condition of conditions) {
        let conditionMet = false;
        switch (condition) {
            case 'ATTACK_IS_HEAVY':
                conditionMet = context.eventType === 'HEAVY_ATTACK';
                break;
            case 'ATTACK_IS_MELEE':
                conditionMet = context.attack?.isMelee === true;
                break;
            default:
                conditionMet = false;
                break;
        }
        if (!conditionMet) return false;
    }
    return true;
};

const processTriggers = (context, sourceCombatant, targetCombatant, allEffects, logAndCapture) => {
    // --- DIAGNOSTIC START ---
    console.log(`[DIAGNOSTIC | triggers.js] >>> Processing event: ${context.eventType} at ${context.timestamp}s`);
    // --- DIAGNOSTIC END ---
    
    let statsChanged = false;
    const triggersToProcess = [];
    let totalHealingThisEvent = 0;

    if (context.eventType === 'LIGHT_ATTACK') triggersToProcess.push('ON_LIGHT_ATTACK_HIT');
    else if (context.eventType === 'HEAVY_ATTACK') triggersToProcess.push('ON_HEAVY_ATTACK_HIT');

    if (context.damage?.isCrit) triggersToProcess.push('ON_CRITICAL_HIT');
    if (context.damage?.baseAmount > 0) triggersToProcess.push('ON_DEALDAMAGE');
    if (context.eventType === 'BLOCK_HIT') triggersToProcess.push('ON_BLOCK_HIT');

    // --- DIAGNOSTIC START ---
    if (triggersToProcess.length > 0) {
        console.log(`[DIAGNOSTIC | triggers.js]   -> Generated Triggers:`, triggersToProcess);
    }
    // --- DIAGNOSTIC END ---

    if (triggersToProcess.length === 0) return { statsChanged: false, healingDone: 0 };

    for (const source of sourceCombatant.baseSources) {
        // --- DIAGNOSTIC START ---
        console.log(`[DIAGNOSTIC | triggers.js]   -> Checking Source: '${source.name}'`);
        // --- DIAGNOSTIC END ---
        if (!source.triggerGroups) continue;

        for (const trigger of triggersToProcess) {
            const triggerGroups = source.triggerGroups.filter(tg => tg.trigger === trigger);

            for (const group of triggerGroups) {
                // --- DIAGNOSTIC START ---
                console.log(`[DIAGNOSTIC | triggers.js]   --> Found matching TriggerGroup for '${trigger}' in Source '${source.name}'`);
                // --- DIAGNOSTIC END ---
                if (!sourceCombatant.state.cooldowns[source.id] || context.timestamp >= sourceCombatant.state.cooldowns[source.id]) {
                    if (group.cooldown) sourceCombatant.state.cooldowns[source.id] = context.timestamp + group.cooldown;

                    for (const effectId of group.effects) {
                        // --- DIAGNOSTIC START ---
                        console.log(`[DIAGNOSTIC | triggers.js]   ---> Processing effectId: '${effectId}'`);
                        // --- DIAGNOSTIC END ---
                        const effect = allEffects.find(e => e.id === effectId);
                        if (effect) {
                            // --- DIAGNOSTIC START ---
                            console.log(`[DIAGNOSTIC | triggers.js]   ----> Found effect data for '${effect.name}'. Checking conditions...`);
                            // --- DIAGNOSTIC END ---
                            if (checkConditions(effect.conditions, context)) {
                                // --- DIAGNOSTIC START ---
                                console.log(`[DIAGNOSTIC | triggers.js]   -----> Conditions MET. Executing effect category: '${effect.category}'`);
                                // --- DIAGNOSTIC END ---
                                switch (effect.category) {
                                    case 'STATUS_EFFECT':
                                        statsChanged = true;
                                        const recipient = effect.target === 'SELF' ? sourceCombatant : targetCombatant;
                                        const newEffectInstance = deepCopy(effect);
                                        newEffectInstance.sourceName = source.name;
                                        newEffectInstance.calculatedValue = calculateEffectValue(effect.valueFormula, effect.scalingPerGearScore, sourceCombatant.gearScore);
                                        if (newEffectInstance.duration) newEffectInstance.expiresAt = context.timestamp + newEffectInstance.duration;
                                        
                                        const existingEffect = recipient.activeEffects.find(e => e.id === effect.id);
                                        if (existingEffect) {
                                            existingEffect.expiresAt = newEffectInstance.expiresAt;
                                            existingEffect.calculatedValue = newEffectInstance.calculatedValue;
                                        } else {
                                            recipient.activeEffects.push(newEffectInstance);
                                        }
                                        // --- DIAGNOSTIC START ---
                                        console.log(`[DIAGNOSTIC | triggers.js]   ------> APPLIED effect '${newEffectInstance.name}' to '${recipient.id}'. Recipient active effects now:`, recipient.activeEffects.map(e => e.name));
                                        // --- DIAGNOSTIC END ---
                                        break;
                                    case 'HEAL':
                                        totalHealingThisEvent += applyHeal(effect, context, sourceCombatant, logAndCapture);
                                        break;
                                    default: break;
                                }
                            } else {
                                // --- DIAGNOSTIC START ---
                                console.log(`[DIAGNOSTIC | triggers.js]   -----> Conditions FAILED.`);
                                // --- DIAGNOSTIC END ---
                            }
                        }
                    }
                }
            }
        }
    }
    
    return { statsChanged, healingDone: totalHealingThisEvent }; 
};

export { processTriggers };

