/**
 * @file engine.js
 * @description The core "Three Stage" simulation engine.
 * @version 4.0.0 - "Data for the Project Lead" Update
 */

import { statBunkers, modifierBunkers, effectBunkers } from './bunkers/bunkerManifest';
import { stateManager } from './stateManager';
import { calculateWeaponDamage } from './formulas';

/**
 * The main exportable function that the UI calls.
 */
export const runSimulation = (playerPayload, targetPayload, choreography, allSources) => {
    // --- DIAGNOSTIC PROBE 1 ---
    console.log('%c[ENGINE RECEIVED PAYLOAD]', 'color: #7cfc00; font-weight: bold;', {
        player: playerPayload,
        target: targetPayload,
        choreographyLength: choreography.length,
        sourceCount: allSources.length,
    });

    const rawLog = [];
    const analysisLog = [];

    let combatants = {
        [playerPayload.id]: { ...playerPayload, activeEffects: [] },
        [targetPayload.id]: { ...targetPayload, activeEffects: [] },
    };

    const addRawLog = (entry) => {
        const timestamp = performance.now() / 1000;
        rawLog.push({ ...entry, timestamp });
    };

    addRawLog({ level: 'info', message: 'Simulation starting.' });
    
    // --- STAGE 1: STAT CALCULATION ---
    addRawLog({ level: 'info', message: 'Entering Stage 1: Stat Calculation.' });
    combatants = calculateBaseStats(combatants, allSources, addRawLog);

    // --- STAGE 2: "TWO STROKE" EVENT PROCESSING ---
    addRawLog({ level: 'info', message: 'Entering Stage 2: Event Processing.' });
    for (const event of choreography) {
        const { updatedCombatants, eventAnalysis } = twoStrokeProcessEvent(event, combatants, allSources, addRawLog, analysisLog);
        combatants = updatedCombatants;
        if (eventAnalysis) {
            analysisLog.push(eventAnalysis);
        }
    }

    addRawLog({ level: 'info', message: 'Simulation complete.' });
    return { rawLog, analysisLog };
};

/**
 * STAGE 1: Calculates all passive, "Always On" bonuses.
 */
const calculateBaseStats = (currentCombatants, allSources, addRawLog) => {
    let updatedCombatants = JSON.parse(JSON.stringify(currentCombatants));

    for (const combatantId in updatedCombatants) {
        const combatant = updatedCombatants[combatantId];
        addRawLog({ level: 'info', message: `Calculating base stats for ${combatant.name}...`, combatantId });

        for (const bunker of statBunkers) {
            const context = { source: combatant, allSources };
            const result = bunker.handler(context);
            if (result && result.addPassiveModifier) {
                 addRawLog({
                    level: 'debug',
                    message: `Stat Bunker "${bunker.METADATA.id}" returned passive modifiers for ${combatant.name}.`,
                    result,
                });
            }
        }
    }
    return updatedCombatants;
};

/**
 * The full implementation of the Grand Damage Formula from The Book of Law.
 */
const calculateFinalDamage = (context, modifierRequests) => {
    const { source, target, event } = context;

    const weaponDamage = calculateWeaponDamage(source.weaponType, source.attributes);
    const abilityBaseDamageMultiplier = event.baseDamageMultiplier || 1.0;
    const baseDamage = weaponDamage * abilityBaseDamageMultiplier;

    let damageTerms = {
        empowerPercent: 0,
        rendPercent: 0,
        baseCritDmgPercent: 0,
        positionalDmgPercent: 0,
        miscDmgPercent: 0,
    };
    
    damageTerms = stateManager.applyDamageModifiers(damageTerms, modifierRequests);

    const finalDamage = baseDamage *
        (1 + damageTerms.empowerPercent - damageTerms.rendPercent) *
        (1 + damageTerms.baseCritDmgPercent) *
        (1 + damageTerms.positionalDmgPercent) *
        (1 + damageTerms.miscDmgPercent);

    return Math.round(finalDamage);
};


/**
 * STAGE 2: Processes a single event through the "Two Stroke" model.
 */
const twoStrokeProcessEvent = (event, currentCombatants, allSources, addRawLog, analysisLog) => {
    // --- DIAGNOSTIC PROBE 2 ---
    console.log('%c[INSPECTING EVENT]', 'color: #ffa500; font-weight: bold;', event);

    if (!event || !event.sourceId || !event.targetId) {
        addRawLog({ level: 'warn', message: 'Skipping malformed event: Missing sourceId or targetId.', event });
        return { updatedCombatants: currentCombatants, eventAnalysis: null };
    }

    let updatedCombatants = JSON.parse(JSON.stringify(currentCombatants));
    const source = updatedCombatants[event.sourceId];
    const target = updatedCombatants[event.targetId];
    const timestamp = performance.now() / 1000;

    const context = { ...event, source, target, allSources, timestamp, event };
    addRawLog({ level: 'info', message: `Processing event: ${event.type}`, event });

    // --- STROKE 1: DAMAGE MODIFIERS ---
    const modifierRequests = [];
    for (const bunker of modifierBunkers) {
        const result = bunker.handler(context);
        if (result && result.modifyDamage) {
            modifierRequests.push(...result.modifyDamage);
        }
    }
    addRawLog({ level: 'debug', message: `Stroke 1 (Damage) complete. Requests: ${modifierRequests.length}`, modifierRequests });
    
    // --- DAMAGE CALCULATION ---
    const finalDamage = calculateFinalDamage(context, modifierRequests);
    
    // --- STROKE 2: EFFECT APPLICATIONS ---
    const effectRequests = [];
    for (const bunker of effectBunkers) {
        const result = bunker.handler(context);
        if (result && result.applyEffects) {
            effectRequests.push(...result.applyEffects);
        }
    }

    for (const effectRequest of effectRequests) {
        stateManager.applyEffect(target, effectRequest, context);
    }
    addRawLog({ level: 'debug', message: `Stroke 2 (Effects) complete. Requests: ${effectRequests.length}`, effectRequests });
    
    // --- ANALYSIS LOGGING (THE FIX) ---
    const eventAnalysis = {
        timestamp: timestamp,
        source: source.name,
        action: event.abilityId || event.type,
        target: target.name,
        isCrit: false,
        damage: finalDamage,
        // --- DATA FOR THE PROJECT LEAD ---
        snapshot: {
            combatant: JSON.parse(JSON.stringify(source)),
            target: JSON.parse(JSON.stringify(target)),
            // Embed the data you need to see
            stroke1_modifiers: modifierRequests, 
            stroke2_effects: effectRequests,
        }
    };

    return { updatedCombatants, eventAnalysis };
};

