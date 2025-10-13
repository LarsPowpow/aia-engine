// FILE: src/simulation/engine.js
/**
 * AIA-Engine: Combat Simulation Core (v4.0 - High-Fidelity)
 * This file contains the primary simulation loop and the tick-based event processor.
 * This version implements full choreography, weapon swapping, and a perk/effect system.
 */

import { calculateWeaponDamage } from './formulas.js';
import { getDocs, collection, query, where } from 'firebase/firestore';

// --- UKB DATA LOADER ---
async function fetchUKBData(docIds, db, collectionName) {
    if (!docIds || docIds.length === 0) return {};
    const uniqueIds = [...new Set(docIds)];
    const ukbData = {};
    const dataRef = collection(db, collectionName);
    const batches = [];
    for (let i = 0; i < uniqueIds.length; i += 30) {
        batches.push(uniqueIds.slice(i, i + 30));
    }
    try {
        for (const batch of batches) {
            const q = query(dataRef, where('perk_id', 'in', batch));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                const data = doc.data();
                ukbData[data.perk_id] = data; // Use perk_id for perks
            });
        }
        // Also query abilities collection
        const abilitiesRef = collection(db, 'abilities');
         for (const batch of batches) {
            const q = query(abilitiesRef, where('id', 'in', batch));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                const data = doc.data();
                ukbData[data.id] = data; // Use id for abilities
            });
        }
    } catch (error) {
        console.error(`Error fetching UKB data from ${collectionName}:`, error);
    }
    return ukbData;
};

// --- SIMULATION CORE ---

export async function runSimulation(combatant, target, choreography, firestore) {
    // --- Pre-Flight: Load all necessary data from the UKB ---
    const requiredAbilityIds = [...new Set(choreography.map(action => action.action).filter(id => id !== 'weapon_swap'))];
    const linkedEffectIds = combatant.perks.flatMap(p => p.linked_effects?.map(e => e.id) || []);
    
    const allRequiredIds = [...requiredAbilityIds, ...linkedEffectIds];
    const ukbCache = await fetchUKBData(allRequiredIds, firestore, 'abilities'); // Fetch from both

    // Add a default 'Light Attack' if not found in DB
    if (!ukbCache['light_attack']) {
        ukbCache['light_attack'] = { id: 'light_attack', name: 'Light Attack', base_damage_percent: 100, type: 'Attack' };
    }
    console.log("AIA Engine: UKB data cache complete.", ukbCache);

    // --- Initialization ---
    let log = [];
    let currentTick = 0;
    let actionIndex = 0;
    const tickRate = 0.1;

    // Set initial active weapon from the first action in the choreography
    combatant.activeWeapon = choreography[0].weapon;

    combatant.activeEffects = [];
    target.activeEffects = [];
    target.health = 50000;
    target.damageReduction = 0;

    // --- Main Simulation Loop ---
    while (target.health > 0 && actionIndex < choreography.length) {
        const action = choreography[actionIndex];

        // Process events scheduled for the current tick
        if (currentTick >= action.time) {
            if (action.action === 'weapon_swap') {
                // Find the next action to determine which weapon to swap to
                const nextAction = choreography.find((a, i) => i > actionIndex && a.weapon !== 'System');
                if (nextAction) {
                    combatant.activeWeapon = nextAction.weapon;
                    log.push({
                        timestamp: currentTick,
                        source: 'System',
                        action: `Weapon Swap to ${combatant.activeWeapon}`,
                        target: '-',
                        damage: 0,
                        isCrit: false,
                        activeBuffs: combatant.activeEffects.map(e => e.name).join(', ') || '-',
                    });
                }
            } else {
                const tickResults = processTick(combatant, target, ['OnHit'], action, ukbCache);
                if (tickResults.damageDealt > 0) {
                    target.health -= tickResults.damageDealt;
                }
                if (tickResults.logEntry) {
                    log.push({ ...tickResults.logEntry, timestamp: currentTick });
                }
            }
            actionIndex++;
        }

        // Resolve ongoing effects every tick
        resolveActiveEffects(combatant, tickRate);
        resolveActiveEffects(target, tickRate);
        
        currentTick = parseFloat((currentTick + tickRate).toFixed(2));
        if (currentTick > 20) break; // Safety break
    }

    console.log("AIA Engine: Simulation complete.");
    return log;
}


// --- CORE LOGIC FUNCTIONS ---

function applyEffects(character, effectsToApply, ukbCache) {
    if (!effectsToApply || effectsToApply.length === 0) return;
    for (const effectRef of effectsToApply) {
        const effectData = ukbCache[effectRef.id];
        if (!effectData) continue;
        const existingEffect = character.activeEffects.find(e => e.id === effectData.id);
        if (existingEffect) {
            existingEffect.duration = effectData.duration_seconds;
        } else {
            character.activeEffects.push({ ...effectData, duration: effectData.duration_seconds });
        }
    }
}

function resolveActiveEffects(character, tickDelta) {
    if (!character.activeEffects) return;
    character.activeEffects = character.activeEffects.filter(effect => {
        effect.duration -= tickDelta;
        return effect.duration > 0;
    });
}

function processPerkTriggers(events, equippedPerks) {
    const triggeredEffects = [];
    for (const perk of equippedPerks) {
        if (events.includes(perk.trigger) && perk.linked_effects) {
            triggeredEffects.push(...perk.linked_effects);
        }
    }
    return triggeredEffects;
}

export function processTick(combatant, target, events, currentAction, ukbCache) {
    const combatantEmpower = combatant.activeEffects.filter(e => e.type === 'EMPOWER').reduce((sum, e) => sum + e.value, 0);
    const cappedEmpower = Math.min(combatantEmpower, 50);

    let baseCritChance = 0.05;
    if (combatant.perks.some(p => p.perk_id === 'perk_keen')) baseCritChance += 0.11;
    
    let isCrit = Math.random() < baseCritChance;
    if (isCrit) events.push('OnCrit');

    const triggeredEffects = processPerkTriggers(events, combatant.perks);
    applyEffects(combatant, triggeredEffects, ukbCache);

    const weaponDamage = calculateWeaponDamage(combatant.activeWeapon, combatant.attributes);
    const actionData = ukbCache[currentAction.action] || ukbCache['light_attack'];
    const abilityDamageMultiplier = (actionData.base_damage_percent || 100) / 100;
    const baseDamage = weaponDamage * abilityDamageMultiplier;

    const empowerRendMultiplier = 1 + (cappedEmpower / 100);

    let critMultiplier = 1.0;
    if (isCrit) critMultiplier = combatant.activeWeapon === 'Sword' ? 1.3 : 1.2;

    const finalDamage = Math.round(baseDamage * empowerRendMultiplier * critMultiplier);
    
    const logEntry = {
        source: combatant.id,
        action: actionData.name,
        target: target.id,
        damage: finalDamage,
        isCrit: isCrit,
        activeBuffs: combatant.activeEffects.map(e => e.name).join(', ') || '-',
    };

    return { damageDealt: finalDamage, logEntry };
}