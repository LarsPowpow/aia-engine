/**
 * AIA-Engine: The "Glass Engine" (v2.12 - Build-Aware)
 * This version integrates equipped Masteries into the pre-flight data harvest,
 * allowing for full build simulations.
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
    const analysisLog = [];
    rawLog.push(`[0.0s] SIMULATION START: ${combatant.id} vs. ${target.id}`);
    
    // === UPDATED: PRE-FLIGHT DATA HARVEST ===
    const requiredAbilityIds = [...new Set(choreography.filter(e => e.abilityId).map(e => e.abilityId))];
    const equippedPerkIds = combatant.perks.map(p => p.id);
    const equippedMasteryIds = combatant.masteries.map(m => m.id); // <-- Get Mastery IDs
    
    // Combine all sources into one list for a single fetch operation
    const requiredSourceIds = [...new Set([...requiredAbilityIds, ...equippedPerkIds, ...equippedMasteryIds])];
    
    rawLog.push(`[0.0s] ENGINE: Identified ${requiredSourceIds.length} unique sources (abilities, perks, masteries). Querying UKB...`);
    const sourceCache = await fetchUKBData(requiredSourceIds, 'ukb_sources_v2', db);
    rawLog.push(`[0.0s] ENGINE: Found ${Object.keys(sourceCache).length} matching Source documents.`);

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
    rawLog.push(`[0.0s] ENGINE: Identified ${uniqueEffectIds.length} linked effects. Querying UKB...`);
    
    const effectCache = await fetchUKBData(uniqueEffectIds, 'ukb_effects_v2', db);
    rawLog.push(`[0.0s] ENGINE: Found ${Object.keys(effectCache).length} matching Effect documents.`);
    
    // === INITIAL STATE SETUP ===
    const simulationState = {
        combatant: { ...combatant, activeEffects: [], passiveEffects: [] },
        target: { ...target, activeEffects: [], passiveEffects: [] },
        rawLog,
        analysisLog,
        sourceCache,
        effectCache,
    };
    const passiveEffects = [];
    // Process both perks and masteries for passive effects
    const allEquippedIds = [...equippedPerkIds, ...equippedMasteryIds];
    for (const sourceId of allEquippedIds) {
        const source = sourceCache[sourceId];
        if (source && source.effects) {
            for (const effectId of source.effects) {
                const effect = effectCache[effectId];
                if (effect && effect.trigger === 'ON_EQUIP') {
                    passiveEffects.push(effect);
                    rawLog.push(`[0.0s] STATE: Added passive effect '${effect.name}' from source '${source.name}'.`);
                }
            }
        }
    }
    simulationState.combatant.passiveEffects = passiveEffects;
    rawLog.push(`[0.0s] ENGINE: Pre-flight and state setup complete. Starting simulation loop.`);

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
    return { rawLog, analysisLog };
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

// --- EVENT PROCESSORS (No Changes) ---
const processEvent = (event, state, currentTick) => {
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
        
        let empowerTotal = 0;
        let weakenTotal = 0;
        state.combatant.activeEffects.forEach(effect => {
            const effectData = state.effectCache[effect.id];
            effectData?.modifications?.forEach(mod => {
                if (mod.statToModify === 'OUTGOING_DAMAGE_MODIFIER') {
                    const value = parseFloat(mod.valueFormula);
                    if (value > 0) empowerTotal += value;
                    else weakenTotal += value;
                }
            });
        });
        const cappedEmpower = Math.min(empowerTotal, 0.50);
        const cappedWeaken = Math.max(weakenTotal, -0.50);
        const attackerMultiplier = 1 + cappedEmpower + cappedWeaken;
        state.rawLog.push(`[${currentTick.toFixed(2)}s] STATE: Combatant has ${Math.round(cappedEmpower*100)}% Empower, ${Math.round(Math.abs(cappedWeaken)*100)}% Weaken.`);

        let rendTotal = 0;
        let fortifyTotal = 0;
        state.target.activeEffects.forEach(effect => {
            const effectData = state.effectCache[effect.id];
            effectData?.modifications?.forEach(mod => {
                if (mod.statToModify === 'INCOMING_DAMAGE_MODIFIER') {
                    const value = parseFloat(mod.valueFormula);
                    if (value > 0) rendTotal += value;
                    else fortifyTotal += value;
                }
            });
        });
        const cappedRend = Math.min(rendTotal, 0.70);
        const cappedFortify = Math.max(fortifyTotal, -0.50);
        const defenderMultiplier = 1 + cappedRend + cappedFortify;
        state.rawLog.push(`[${currentTick.toFixed(2)}s] STATE: Target has ${Math.round(cappedRend*100)}% Rend, ${Math.round(Math.abs(cappedFortify)*100)}% Fortify.`);

        damage *= attackerMultiplier * defenderMultiplier;
        state.rawLog.push(`[${currentTick.toFixed(2)}s] ENGINE: Damage after buffs/debuffs: ${Math.round(damage)}.`);
        
        for (const effect of state.combatant.passiveEffects) {
            if (effect.category === 'DAMAGE_MODIFIER') {
                const originalDamage = damage;
                damage = handleDamageModifier(effect, originalDamage, state.combatant, state.target);
                state.rawLog.push(`[${currentTick.toFixed(2)}s] ENGINE: Applying passive '${effect.name}'. Damage: ${Math.round(originalDamage)} -> ${Math.round(damage)}.`);
            }
        }
        
        const finalDamage = Math.round(damage);
        state.rawLog.push(`[${currentTick.toFixed(2)}s] ENGINE: Final damage for this event: ${finalDamage}.`);

        const stateSnapshot = {
            combatant: { activeEffects: state.combatant.activeEffects.map(ae => ({ ...state.effectCache[ae.id], duration: ae.duration })) },
            target: { activeEffects: state.target.activeEffects.map(ae => ({ ...state.effectCache[ae.id], duration: ae.duration })) },
        };

        state.analysisLog.push({
            timestamp: currentTick,
            source: state.combatant.id,
            action: actionName,
            target: state.target.id,
            isCrit: false,
            damage: finalDamage,
            snapshot: stateSnapshot
        });
    }

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