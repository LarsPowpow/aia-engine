// Utility: classify condition types
const isOngoingCondition = (condition) => {
    // Add all ongoing condition types here
    return condition.startsWith('TARGET_HAS_CC');
};

const hasOngoingCondition = (conditions) => {
    if (!Array.isArray(conditions)) return false;
    return conditions.some(isOngoingCondition);
};
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
    // [ENGINE] Payload received (concise log, uncomment for debugging)
    // console.log('[ENGINE] Payload received', { player: playerPayload, target: targetPayload, choreographyLength: choreography.length, sourceCount: allSources.length });

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
            combatants = JSON.parse(JSON.stringify(updatedCombatants));
            if (eventAnalysis) {
                // --- PATCH: Ensure healing is always an array and add totalHealing ---
                if (eventAnalysis.healing && !Array.isArray(eventAnalysis.healing)) {
                    eventAnalysis.healing = [eventAnalysis.healing];
                }
                if (Array.isArray(eventAnalysis.healing)) {
                    eventAnalysis.totalHealing = eventAnalysis.healing.reduce((sum, h) => {
                        if (h.valueType === 'baseHealth') {
                            const target = h.targetId === 'Player' ? eventAnalysis.snapshot?.combatant : h.targetId === 'Target Dummy' ? eventAnalysis.snapshot?.target : null;
                            const baseHealth = target && (target.baseHealth || target.maxHealth || 0);
                            return sum + (typeof h.value === 'number' ? h.value * baseHealth : 0);
                        }
                        return sum + (typeof h.value === 'number' ? h.value : 0);
                    }, 0);
                }
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
        // Apply misc damage percent after empower/rend, per schema
        const finalDamage = baseDamage *
            (1 + (damageTerms.empowerPercent || 0) - (damageTerms.rendPercent || 0)) *
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
    };
    // F12 console logging for debugging
    // [ENGINE] Damage Event (debug, uncomment for troubleshooting)
    // if (!NON_DAMAGE_ACTIONS.includes(event.action)) {
    //     console.log('[ENGINE] Damage Event:', { event, damageTerms, modifierRequests });
    // }
        // ...existing code...

    if (!event || !event.sourceId || !event.targetId) {
        addRawLog({ level: 'warn', message: 'Skipping malformed event: Missing sourceId or targetId.', event });
        return { updatedCombatants: currentCombatants, eventAnalysis: null };
    }

    let updatedCombatants = JSON.parse(JSON.stringify(currentCombatants));
    const source = updatedCombatants[event.sourceId];
    const target = updatedCombatants[event.targetId];
    // --- DIAGNOSTIC PROBE: Healing Defense ---
    if (event.action && event.action.startsWith('BLOCK')) {
        addRawLog({
            level: 'debug',
            message: '[Healing Defense] Block event detected.',
            event,
            sourceActiveEffects: source.activeEffects,
            targetActiveEffects: target.activeEffects
        });
    }
    // Purge expired and invalid conditional effects for both combatants
    const now = (typeof event.timestamp === 'number') ? event.timestamp : (performance.now() / 1000);
    const purgeInvalidEffects = (combatant, context) => {
        if (!combatant.activeEffects) return [];
        return combatant.activeEffects.filter(eff => {
            // Remove if expired
            if (eff.expiresAt && eff.expiresAt <= now) return false;
            // Only auto-purge if effect has ongoing conditions
            if (Array.isArray(eff.conditions) && eff.conditions.length > 0 && hasOngoingCondition(eff.conditions)) {
                try {
                    const { checkConditions } = require('../bunkers/bunkerUtils');
                    const effectContext = { ...context, source: combatant, target: (combatant.id === context.sourceId ? context.target : context.source) };
                    if (!checkConditions(eff.conditions, effectContext)) return false;
                } catch (e) {
                    return false;
                }
            }
            return true;
        });
    };
    source.activeEffects = purgeInvalidEffects(source, event);
    target.activeEffects = purgeInvalidEffects(target, event);
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
            if (effect && effect.category && effect.id !== 'computed_misc_damage') {
                if (effect.category === 'EMPOWER') damageTerms.empowerPercent += effect.value || 0;
                if (effect.category === 'REND') damageTerms.rendPercent += effect.value || 0;
                if (effect.category === 'MISC_DAMAGE') damageTerms.miscDmgPercent += effect.value || 0;
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
            if (mod.category === 'MISC_DAMAGE') damageTerms.miscDmgPercent += mod.value || 0;
            // Add more as needed
        }
    }

    // All handled as miscDmgPercent

    if (!NON_DAMAGE_ACTIONS.includes(event.action)) {
        // --- DAMAGE CALCULATION ---
        finalDamage = calculateFinalDamage(context, [], damageTerms);
        // [ENGINE] Final Damage (debug, uncomment for troubleshooting)
        // console.log('[ENGINE] Final Damage:', finalDamage);
    }
    effectRequests = [];
    for (const bunker of effectBunkers) {
        const result = bunker.handler({ ...context, timestamp });
        if (result && result.applyEffects) {
            effectRequests.push(...result.applyEffects);
        }
    }
    // --- GATEKEEPER: consolidate and apply effects with proper anti-stacking rules ---
    const grouped = {};
    for (const eff of effectRequests) {
        // normalize target: misc/empower to source when applicable
        const applyToSource = (['MISC_DAMAGE', 'EMPOWER'].includes(eff.category) && source.id === 'Player');
        const targetKey = applyToSource ? source.id : target.id;
        const key = `${targetKey}::${eff.id}`;
        if (!grouped[key]) grouped[key] = { ...eff, targetId: targetKey };
        else {
            // If duplicate, prefer the later expiresAt
            const existing = grouped[key];
            if ((eff.expiresAt || 0) > (existing.expiresAt || 0)) {
                grouped[key] = { ...eff, targetId: targetKey };
            }
        }
    }

    // Apply the consolidated effects via stateManager which handles refresh logic
    for (const k of Object.keys(grouped)) {
        const eff = grouped[k];
        const applyToSource = (eff.targetId === source.id);
        const targetCombatant = applyToSource ? source : target;
        // Ensure duration/expiresAt are relative to current timestamp if not already set
        const now = timestamp;
        if (!eff.duration && eff.expiresAt) {
            eff.duration = Math.max(0, eff.expiresAt - now);
        }
        if (!eff.expiresAt && typeof eff.duration === 'number') {
            eff.expiresAt = now + eff.duration;
        }
        stateManager.applyEffect(targetCombatant, eff, { ...context, source, timestamp: now });
    }
    // [ENGINE] Stroke 2 (Effects) complete. Requests: ${effectRequests.length}
    // addRawLog({ level: 'debug', message: `Stroke 2 (Effects) complete. Requests: ${effectRequests.length}`, effectRequests });

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
        healing: effectRequests
            .filter(eff => eff.category === 'HEAL')
            .map(eff => ({ value: eff.value, valueType: eff.valueType, targetId: eff.targetId })),
        snapshot: {
            combatant: combatantSnapshot,
            target: targetSnapshot,
            stroke1_modifiers: modifierRequests, 
            stroke2_effects: effectRequests,
        }
    };

    return { updatedCombatants, eventAnalysis };
};

