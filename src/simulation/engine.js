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
    // Sort choreography by timestamp to ensure correct order
    const sortedChoreography = [...choreography].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    for (const event of sortedChoreography) {
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
const calculateFinalDamage = (context, modifierRequests, damageTerms) => {
    const { source, target, event } = context;

    const weaponDamage = calculateWeaponDamage(source.weaponType, source.attributes);
    // Auto-lookup baseDamageMultiplier if not provided
    let abilityBaseDamageMultiplier = event.baseDamageMultiplier;
    if (abilityBaseDamageMultiplier == null) {
        // Try to get from BASE_ABILITY_MODIFIERS
        try {
            const { BASE_ABILITY_MODIFIERS } = require('./formulas');
            const weaponMods = BASE_ABILITY_MODIFIERS[source.weaponType] || {};
            abilityBaseDamageMultiplier = weaponMods[event.action] || 1.0;
        } catch (e) {
            abilityBaseDamageMultiplier = 1.0;
        }
    }
    const baseDamage = weaponDamage * abilityBaseDamageMultiplier;

    // Use provided damageTerms (from activeEffects at start of step)
        // Apply uncapped damage percent after empower/rend, per schema
        const finalDamage = baseDamage *
            (1 + (damageTerms.empowerPercent || 0) - (damageTerms.rendPercent || 0)) *
            (1 + (damageTerms.uncappedDamagePercent || 0)) *
            (1 + (damageTerms.baseCritDmgPercent || 0)) *
            (1 + (damageTerms.positionalDmgPercent || 0)) *
            (1 + (damageTerms.miscDmgPercent || 0));

    return Math.round(finalDamage);
};


/**
 * STAGE 2: Processes a single event through the "Two Stroke" model.
 */
const twoStrokeProcessEvent = (event, currentCombatants, allSources, addRawLog, analysisLog) => {
    // Always define modifierRequests before any usage
    let modifierRequests = [];
    // List of non-damaging actions (declare only once at the top)
    const NON_DAMAGE_ACTIONS = [
        'BLOCK_START', 'BLOCK_HIT', 'BLOCK_END', 'CONSUMABLE', 'WEAPON_SWAP'
    ];
    // Always define damageTerms with defaults
    // ...existing code...
    // ...existing code...
    // Always define damageTerms with defaults
    let damageTerms = {
        empowerPercent: 0,
        rendPercent: 0,
        baseCritDmgPercent: 0,
        positionalDmgPercent: 0,
        miscDmgPercent: 0,
        uncappedDamagePercent: 0,
    };
    // F12 console logging for debugging
    if (!NON_DAMAGE_ACTIONS.includes(event.action)) {
        console.log('[ENGINE DEBUG] Damage Event:', {
            event,
            damageTerms,
            modifierRequests,
        });
        addRawLog({ level: 'debug', message: `Uncapped Damage Percent: ${damageTerms.uncappedDamagePercent}`, event });
    }
    // --- DIAGNOSTIC PROBE 2 ---
    console.log('%c[INSPECTING EVENT]', 'color: #ffa500; font-weight: bold;', event);

    if (!event || !event.sourceId || !event.targetId) {
        addRawLog({ level: 'warn', message: 'Skipping malformed event: Missing sourceId or targetId.', event });
        return { updatedCombatants: currentCombatants, eventAnalysis: null };
    }

    let updatedCombatants = JSON.parse(JSON.stringify(currentCombatants));
    const source = updatedCombatants[event.sourceId];
    const target = updatedCombatants[event.targetId];
    // Purge expired effects for both combatants
    const now = (typeof event.timestamp === 'number') ? event.timestamp : (performance.now() / 1000);
    if (source.activeEffects) {
        source.activeEffects = source.activeEffects.filter(e => !e.expiresAt || e.expiresAt > now);
    }
    if (target.activeEffects) {
        target.activeEffects = target.activeEffects.filter(e => !e.expiresAt || e.expiresAt > now);
    }
    // Use event.timestamp if present, else fallback to performance.now
    const timestamp = (typeof event.timestamp === 'number') ? event.timestamp : (performance.now() / 1000);

    // Handle weapon swap event: update weaponType and skip damage
    if (event.action === 'WEAPON_SWAP' && event.targetWeapon) {
        source.weaponType = event.targetWeapon;
        addRawLog({ level: 'info', message: `Weapon swapped to ${event.targetWeapon} for ${source.name}.`, event });
        // Log the swap event but with no damage
        const eventAnalysis = {
            timestamp: timestamp,
            source: source.name,
            action: event.notes || event.abilityId || event.type,
            target: target.name,
            isCrit: false,
            damage: 0,
            snapshot: {
                combatant: JSON.parse(JSON.stringify(source)),
                target: JSON.parse(JSON.stringify(target)),
                stroke1_modifiers: [],
                stroke2_effects: [],
            }
        };
        return { updatedCombatants, eventAnalysis };
    }

    // Set eventType for condition matching (e.g., ON_ABILITY_HIT)
    let eventType = event.action;
    if (event.action === 'ABILITY_HIT') eventType = 'ABILITY_HIT';
    const context = { ...event, source, target, allSources, timestamp, event, eventType };
    addRawLog({ level: 'info', message: `Processing event: ${event.type}`, event });

    // ...existing code...
    let finalDamage = 0;
    let effectRequests = [];

    // Always define damageTerms with defaults
    // ...existing code...
    if (source.activeEffects) {
        for (const effect of source.activeEffects) {
            if (effect && effect.category) {
                if (effect.category === 'EMPOWER') damageTerms.empowerPercent += effect.value || 0;
                if (effect.category === 'REND') damageTerms.rendPercent += effect.value || 0;
                if (effect.category === 'UNCAPPED_DAMAGE') damageTerms.uncappedDamagePercent += effect.value || 0;
                // Add more as needed
            }
        }
    }

    // Collect modifier requests from bunkers
    modifierRequests = [];
    for (const bunker of modifierBunkers) {
        const result = bunker.handler({ ...context, timestamp });
        if (result && result.modifyDamage) {
            modifierRequests.push(...result.modifyDamage);
        }
    }

    // Apply modifierRequests to damageTerms before damage calculation
    if (modifierRequests.length > 0) {
        for (const mod of modifierRequests) {
            if (mod.category === 'EMPOWER') damageTerms.empowerPercent += mod.value || 0;
            if (mod.category === 'REND') damageTerms.rendPercent += mod.value || 0;
            if (mod.category === 'UNCAPPED_DAMAGE') damageTerms.uncappedDamagePercent += mod.value || 0;
            // Add more as needed
        }
    }

    // Treat uncappedDamagePercent as miscDmgPercent for final calculation
    if (damageTerms.uncappedDamagePercent) {
        damageTerms.miscDmgPercent += damageTerms.uncappedDamagePercent;
    }

    if (!NON_DAMAGE_ACTIONS.includes(event.action)) {
        // --- DAMAGE CALCULATION ---
        finalDamage = calculateFinalDamage(context, [], damageTerms);
        console.log('[ENGINE DEBUG] Final Damage:', finalDamage);
    }
    effectRequests = [];
    for (const bunker of effectBunkers) {
        const result = bunker.handler({ ...context, timestamp });
        if (result && result.applyEffects) {
            effectRequests.push(...result.applyEffects);
        }
    }
    for (const effectRequest of effectRequests) {
        // Apply effects to correct combatant and pass correct source context
        if (effectRequest.category === 'UNCAPPED_DAMAGE' && source.id === 'Player') {
            stateManager.applyEffect(source, effectRequest, { ...context, source });
        } else {
            stateManager.applyEffect(target, effectRequest, { ...context, source });
        }
    }
    addRawLog({ level: 'debug', message: `Stroke 2 (Effects) complete. Requests: ${effectRequests.length}`, effectRequests });

    // --- ANALYSIS LOGGING (THE FIX) ---
    // Add miscDmgPercent to combatant and target snapshot for InspectorPanel
    const combatantSnapshot = { ...JSON.parse(JSON.stringify(source)), miscDmgPercent: damageTerms.miscDmgPercent };
    const targetSnapshot = { ...JSON.parse(JSON.stringify(target)), miscDmgPercent: damageTerms.miscDmgPercent };
    const eventAnalysis = {
        timestamp: timestamp,
        source: source.name,
        action: event.notes || event.abilityId || event.type,
        target: target.name,
        isCrit: false,
        damage: finalDamage,
        snapshot: {
            combatant: combatantSnapshot,
            target: targetSnapshot,
            stroke1_modifiers: modifierRequests, 
            stroke2_effects: effectRequests,
        }
    };

    return { updatedCombatants, eventAnalysis };
};

