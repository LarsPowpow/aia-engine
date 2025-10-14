/**
 * AIA-Engine: The "Glass Engine" (v2.9 - Feature Complete Core)
 * This version generates a structured analysisLog, connecting the engine's
 * calculations to the main Combat Analysis UI panel.
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
    const rawLog = [];
    const analysisLog = []; // <-- The new structured log
    rawLog.push(`[0.0s] SIMULATION START: ${combatant.id} vs. ${target.id}`);
    
    // === PRE-FLIGHT DATA HARVEST (No Changes) ===
    const requiredAbilityIds = [...new Set(choreography.filter(e => e.abilityId).map(e => e.abilityId))];
    const equippedPerkIds = combatant.perks.map(p => p.id);
    const requiredSourceIds = [...new Set([...requiredAbilityIds, ...equippedPerkIds])];
    const sourceCache = await fetchUKBData(requiredSourceIds, 'ukb_sources_v2', db);
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
    const effectCache = await fetchUKBData([...new Set(requiredEffectIds)], 'ukb_effects_v2', db);
    
    // === INITIAL STATE SETUP ===
    const simulationState = {
        combatant: { ...combatant, activeEffects: [], passiveEffects: [] },
        target: { ...target, activeEffects: [], passiveEffects: [] },
        rawLog,
        analysisLog, // Pass the new log to the state
        sourceCache,
        effectCache,
    };
    const passiveEffects = [];
    for (const perkId of equippedPerkIds) {
        const source = sourceCache[perkId];
        if (source && source.effects) {
            for (const effectId of source.effects) {
                const effect = effectCache[effectId];
                if (effect && effect.trigger === 'ON_EQUIP') passiveEffects.push(effect);
            }
        }
    }
    simulationState.combatant.passiveEffects = passiveEffects;
    rawLog.push(`[0.0s] ENGINE: Pre-flight complete. Starting simulation loop.`);

    // === TIME-BASED SIMULATION LOOP (No Changes) ===
    let currentTick = 0.0;
    const tickRate = 0.1;
    let eventIndex = 0;
    const lastEventTime = choreography[choreography.length - 1].timestamp;

    while (currentTick <= lastEventTime + 5.0) {
        while (eventIndex < choreography.length && choreography[eventIndex].timestamp <= currentTick) {
            const event = choreography[eventIndex];
            rawLog.push(`[${currentTick.toFixed(2)}s] EVENT: ${event.action} - ${event.notes}`);
            processEvent(event, simulationState, currentTick);
            eventIndex++;
        }
        resolveActiveEffects(simulationState.combatant, tickRate, currentTick, rawLog);
        resolveActiveEffects(simulationState.target, tickRate, currentTick, rawLog);
        currentTick = parseFloat((currentTick + tickRate).toFixed(2));
        if (currentTick > 30) break;
    }

    rawLog.push(`[${currentTick.toFixed(2)}s] SIMULATION END: Time elapsed.`);
    return { rawLog, analysisLog }; // Return both logs
};

// --- DURATION RESOLVER (No Changes) ---
const resolveActiveEffects = (character, tickRate, currentTick, log) => {
    character.activeEffects = character.activeEffects.filter(effect => {
        effect.duration -= tickRate;
        if (effect.duration <= 0) {
            log.push(`[${currentTick.toFixed(2)}s] STATE: '${effect.name}' expired on ${character.id}.`);
            return false;
        }
        return true;
    });
};

// --- EVENT PROCESSORS ---
const processEvent = (event, state, currentTick) => {
    // Step 1: Handle Damage Calculation
    if (['ABILITY', 'LIGHT_ATTACK', 'HEAVY_ATTACK'].includes(event.action)) {
        let weaponDamage = calculateWeaponDamage(state.combatant.weaponType, state.combatant.attributes);
        state.rawLog.push(`[${currentTick.toFixed(2)}s] ENGINE: Base Weapon Damage: ${weaponDamage}.`);
        
        let abilityDamageMultiplier = 1.0;
        let actionName = event.action;
        const source = state.sourceCache[event.abilityId];
        if (source) {
            actionName = source.name;
            if (source.triggerGroups) {
                 const procDamageEffectId = source.triggerGroups.flatMap(g => g.effects).find(id => state.effectCache[id]?.category === 'PROC_DAMAGE');
                if (procDamageEffectId) {
                    const procEffect = state.effectCache[procDamageEffectId];
                    abilityDamageMultiplier = parseFloat(procEffect.valueFormula);
                    state.rawLog.push(`[${currentTick.toFixed(2)}s] ENGINE: Applying Ability Power from '${procEffect.name}' (${abilityDamageMultiplier * 100}%).`);
                }
            }
        }
        let damage = weaponDamage * abilityDamageMultiplier;
        
        let outgoingModifier = 0;
        state.combatant.activeEffects.forEach(effect => {
            const effectData = state.effectCache[effect.id];
            effectData?.modifications?.forEach(mod => {
                if (mod.statToModify === 'OUTGOING_DAMAGE_MODIFIER') outgoingModifier += parseFloat(mod.valueFormula);
            });
        });
        const cappedEmpower = Math.min(outgoingModifier, 0.5);
        
        let incomingModifier = 0;
        state.target.activeEffects.forEach(effect => {
            const effectData = state.effectCache[effect.id];
            effectData?.modifications?.forEach(mod => {
                if (mod.statToModify === 'INCOMING_DAMAGE_MODIFIER') incomingModifier += parseFloat(mod.valueFormula);
            });
        });
        
        damage *= (1 + cappedEmpower + incomingModifier);
        
        for (const effect of state.combatant.passiveEffects) {
            if (effect.category === 'DAMAGE_MODIFIER') {
                damage = handleDamageModifier(effect, damage, state.combatant, state.target);
            }
        }
        
        const finalDamage = Math.round(damage);
        state.rawLog.push(`[${currentTick.toFixed(2)}s] ENGINE: Final damage for this event: ${finalDamage}.`);

        // --- NEW: Populate the Analysis Log ---
        state.analysisLog.push({
            timestamp: currentTick,
            source: state.combatant.id,
            action: actionName,
            target: state.target.id,
            isCrit: false, // Placeholder
            damage: finalDamage,
            activeBuffs: state.combatant.activeEffects.map(e => e.name).join(', ') || 'None',
            effectsApplied: state.target.activeEffects.map(e => e.name).join(', ') || 'None',
        });
    }

    // Step 2: Handle Triggered Effects (No Changes)
    const source = state.sourceCache[event.abilityId];
    if (source?.triggerGroups) {
        const triggerGroup = source.triggerGroups[0];
        if (triggerGroup?.effects) {
            for (const effectId of triggerGroup.effects) {
                const effect = state.effectCache[effectId];
                if (!effect) continue;
                if (effect.category === 'STATUS_EFFECT') {
                    const targetCharacter = effect.target === 'SELF' ? state.combatant : state.target;
                    const logMessage = handleStatusEffect(effect, targetCharacter);
                    state.rawLog.push(`[${currentTick.toFixed(2)}s] ENGINE: ${logMessage}`);
                }
            }
        }
    }
};