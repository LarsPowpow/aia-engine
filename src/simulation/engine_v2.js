/**
 * AIA-Engine: The "Glass Engine" (v2.7 - Consequence-Aware)
 * This version reads the active buffs/debuffs on both combatant and target
 * to calculate a final damage multiplier.
 */
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { handleDamageModifier, handleStatusEffect } from './effectHandlers.js';
import { calculateWeaponDamage } from './formulas.js';

// --- UKB DATA LOADER (No Changes) ---
const fetchUKBData = async (ids, collectionName, db) => {
    const cache = {};
    if (!ids || ids.length === 0) return cache;
    const uniqueIds = [...new Set(ids)];
    const ref = collection(db, collectionName);
    const batches = [];
    for (let i = 0; i < uniqueIds.length; i += 30) {
        batches.push(uniqueIds.slice(i, i + 30));
    }
    try {
        for (const batch of batches) {
            const q = query(ref, where(documentId(), 'in', batch));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                cache[doc.id] = { id: doc.id, ...doc.data() };
            });
        }
    } catch (error) {
        console.error(`AIA ENGINE: Error fetching from ${collectionName}:`, error);
    }
    return cache;
};

// --- SIMULATION CORE ---
export const runSimulationV2 = async (combatant, target, choreography, db) => {
    const log = [];
    log.push(`[0.0s] SIMULATION START: ${combatant.id} vs. ${target.id}`);
    
    // === PRE-FLIGHT DATA HARVEST (No Changes) ===
    const requiredAbilityIds = [...new Set(choreography.filter(e => e.abilityId).map(e => e.abilityId))];
    const equippedPerkIds = combatant.perks.map(p => p.id);
    const requiredSourceIds = [...new Set([...requiredAbilityIds, ...equippedPerkIds])];
    
    log.push(`[0.0s] ENGINE: Identified ${requiredSourceIds.length} unique sources. Querying UKB...`);
    const sourceCache = await fetchUKBData(requiredSourceIds, 'ukb_sources_v2', db);
    log.push(`[0.0s] ENGINE: Found ${Object.keys(sourceCache).length} matching Source documents.`);

    let requiredEffectIds = [];
    for (const sourceId in sourceCache) {
        const source = sourceCache[sourceId];
        if (source.effects) requiredEffectIds.push(...source.effects);
        if (source.triggerGroups) {
            for (const group of source.triggerGroups) {
                if (group.effects) requiredEffectIds.push(...group.effects);
            }
        }
    }
    const uniqueEffectIds = [...new Set(requiredEffectIds)];
    log.push(`[0.unkn] ENGINE: Identified ${uniqueEffectIds.length} linked effects. Querying UKB...`);
    
    const effectCache = await fetchUKBData(uniqueEffectIds, 'ukb_effects_v2', db);
    log.push(`[0.0s] ENGINE: Found ${Object.keys(effectCache).length} matching Effect documents.`);
    
    // === INITIAL STATE SETUP (No Changes) ===
    const simulationState = {
        combatant: { ...combatant, activeEffects: [], passiveEffects: [] },
        target: { ...target, activeEffects: [], passiveEffects: [] },
        log,
        sourceCache,
        effectCache,
    };

    const passiveEffects = [];
    for (const perkId of equippedPerkIds) {
        const source = sourceCache[perkId];
        if (source && source.effects) {
            for (const effectId of source.effects) {
                const effect = effectCache[effectId];
                if (effect && effect.trigger === 'ON_EQUIP') {
                    passiveEffects.push(effect);
                    log.push(`[0.0s] STATE: Added passive effect '${effect.name}' from source '${source.name}'.`);
                }
            }
        }
    }
    simulationState.combatant.passiveEffects = passiveEffects;
    log.push(`[0.0s] ENGINE: Pre-flight and state setup complete. Starting simulation loop.`);

    // === CORE SIMULATION LOOP (No Changes) ===
    for (const event of choreography) {
        log.push(`[${event.timestamp.toFixed(2)}s] EVENT: ${event.action} - ${event.notes}`);
        processEvent(event, simulationState);
    }

    const lastEventTime = choreography.length > 0 ? choreography[choreography.length - 1].timestamp : 0.0;
    log.push(`[${lastEventTime.toFixed(2)}s] SIMULATION END: Choreography complete.`);

    return { rawLog: log, analysisLog: [] };
};


// --- EVENT PROCESSORS ---
const processEvent = (event, state) => {
    // --- Step 1: Handle Damage Calculation ---
    if (['ABILITY', 'LIGHT_ATTACK', 'HEAVY_ATTACK'].includes(event.action)) {
        let weaponDamage = calculateWeaponDamage(state.combatant.weaponType, state.combatant.attributes);
        state.log.push(`[${event.timestamp.toFixed(2)}s] ENGINE: Calculated base weapon damage: ${weaponDamage}.`);
        
        let abilityDamageMultiplier = 1.0; 
        const source = state.sourceCache[event.abilityId];
        if (source && source.triggerGroups) {
            const procDamageEffectId = source.triggerGroups.flatMap(g => g.effects).find(effectId => {
                const effect = state.effectCache[effectId];
                return effect && effect.category === 'PROC_DAMAGE';
            });
            if (procDamageEffectId) {
                const procEffect = state.effectCache[procDamageEffectId];
                abilityDamageMultiplier = parseFloat(procEffect.valueFormula);
                state.log.push(`[${event.timestamp.toFixed(2)}s] ENGINE: Applying Ability Power from '${procEffect.name}' (${abilityDamageMultiplier * 100}%).`);
            }
        }
        
        let damage = weaponDamage * abilityDamageMultiplier;
        state.log.push(`[${event.timestamp.toFixed(2)}s] ENGINE: Damage after Ability Power: ${Math.round(damage)}.`);

        // --- NEW: Calculate multipliers from active buffs/debuffs ---
        let outgoingModifier = 0;
        state.combatant.activeEffects.forEach(effect => {
            const effectData = state.effectCache[effect.id];
            if (effectData.modifications) {
                effectData.modifications.forEach(mod => {
                    if (mod.statToModify === 'OUTGOING_DAMAGE_MODIFIER') {
                        outgoingModifier += parseFloat(mod.valueFormula);
                    }
                });
            }
        });
        const cappedEmpower = Math.min(outgoingModifier, 0.5); // Cap empower at 50%
        state.log.push(`[${event.timestamp.toFixed(2)}s] ENGINE: Combatant has ${Math.round(cappedEmpower * 100)}% Empower.`);

        let incomingModifier = 0;
        state.target.activeEffects.forEach(effect => {
            const effectData = state.effectCache[effect.id];
             if (effectData.modifications) {
                effectData.modifications.forEach(mod => {
                    if (mod.statToModify === 'INCOMING_DAMAGE_MODIFIER') {
                        incomingModifier += parseFloat(mod.valueFormula);
                    }
                });
            }
        });
        state.log.push(`[${event.timestamp.toFixed(2)}s] ENGINE: Target has ${Math.round(incomingModifier * 100)}% Rend/Fortify.`);
        
        const originalDamageAfterAP = damage;
        damage *= (1 + cappedEmpower + incomingModifier);
        state.log.push(`[${event.timestamp.toFixed(2)}s] ENGINE: Applying Buffs/Debuffs. Damage: ${Math.round(originalDamageAfterAP)} -> ${Math.round(damage)}.`);

        // Apply passive damage modifiers
        for (const effect of state.combatant.passiveEffects) {
            if (effect.category === 'DAMAGE_MODIFIER') {
                const originalDamage = damage;
                damage = handleDamageModifier(effect, originalDamage, state.combatant, state.target);
                state.log.push(`[${event.timestamp.toFixed(2)}s] ENGINE: Applying '${effect.name}'. Damage: ${Math.round(originalDamage)} -> ${Math.round(damage)}.`);
            }
        }
        state.log.push(`[${event.timestamp.toFixed(2)}s] ENGINE: Final damage for this event: ${Math.round(damage)}.`);
    }

    // --- Step 2: Handle Triggered Effects (No Changes) ---
    const source = state.sourceCache[event.abilityId];
    if (source && source.triggerGroups) {
        const triggerGroup = source.triggerGroups[0]; 
        if (triggerGroup && triggerGroup.effects) {
            for (const effectId of triggerGroup.effects) {
                const effect = state.effectCache[effectId];
                if (!effect) continue;

                if (effect.category === 'STATUS_EFFECT') {
                    const targetCharacter = effect.target === 'SELF' ? state.combatant : state.target;
                    const logMessage = handleStatusEffect(effect, targetCharacter);
                    state.log.push(`[${event.timestamp.toFixed(2)}s] ENGINE: ${logMessage}`);
                }
            }
        }
    }
};