/**
 * @file engine.js
 * @description The primary simulation engine. This file orchestrates the various single-responsibility
 * modules to run a full combat simulation. This is the definitive, decoupled engine.
 */

// --- INTERNAL MODULES ---
import { calculateWeaponDamage } from './formulas.js';
import { initializeCombatant } from './combatant.js';
import { assembleContext } from './contextAssembler.js';
import { bunkerHandlers } from './bunkers/index.js';

// --- DATABASE COLLECTIONS (Firestore) ---
import { collection, getDocs } from 'firebase/firestore';
import { db } from '/src/services/firebase'; 

// --- UTILITY FUNCTIONS ---
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

// --- CORE DATA FETCHING ---
const fetchAllFromUKB = async (collectionName) => {
    try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error(`[ENGINE] Error fetching from ${collectionName}:`, error);
        throw new Error(`Failed to fetch data from ${collectionName}.`);
    }
};

/**
 * The main simulation runner. It processes a choreography of events and calculates the outcome.
 * @param {object} playerConfig - The player's character definition.
 * @param {object} targetConfig - The target's character definition.
 * @param {Array<object>} choreography - A timeline of actions to be simulated.
 * @returns {object} An object containing the raw simulation log and an analysis log.
 */
export const runSimulation = async (playerConfig, targetConfig, choreography) => {
    const rawLog = [];
    const analysisLog = [];
    let timeline = 0.0;
    const logAndCapture = (timestamp, message, data = {}) => {
        const time = parseFloat(timestamp.toFixed(2));
        rawLog.push({ timestamp: time, message, data });
    };

    try {
        const allSources = await fetchAllFromUKB('ukb_sources_v2');

        let player = initializeCombatant(playerConfig, allSources);
        let target = initializeCombatant(targetConfig, allSources);

        for (const event of choreography) {
            timeline = event.timestamp;

            player.activeEffects = player.activeEffects.filter(e => !e.expiresAt || e.expiresAt > timeline);
            target.activeEffects = target.activeEffects.filter(e => !e.expiresAt || e.expiresAt > timeline);
            
            player.recalculateStats();
            target.recalculateStats();
            
            const context = assembleContext(event, player, target);

            // --- BUNKER DISPATCHER ---
            for (const handler of bunkerHandlers) {
                handler(context);
            }

            // --- RECALCULATE STATS POST-BUNKER ---
            player.recalculateStats();
            target.recalculateStats();
            
            let damage = 0;
            
            if (context.eventType.includes('ATTACK') || context.eventType.includes('ABILITY_HIT')) {
                const isCrit = event.forceCrit || (Math.random() <= player.stats.critChance);

                const weaponDamage = calculateWeaponDamage(player.weaponType, player.attributes);
                const baseDamage = Math.round(weaponDamage * context.ability.baseDamageMultiplier);
                
                if (!context.damage) {
                    context.damage = {};
                }
                context.damage.baseAmount = baseDamage;
                context.damage.isCrit = isCrit;

                let finalDamage = baseDamage;
                
                const empowerRendMultiplier = 1 + (player.stats.empower.total / 100) + (target.stats.rend.total / 100);
                const critMultiplier = context.damage.isCrit ? (1 + player.stats.critDamage / 100) : 1;
                const uncappedDamageMultiplier = 1 + (player.stats.uncappedDamage.total / 100);

                finalDamage *= empowerRendMultiplier;
                finalDamage *= critMultiplier;
                finalDamage *= uncappedDamageMultiplier;


                damage = Math.round(finalDamage);
            }
            
            analysisLog.push({ 
                timestamp: event.timestamp, 
                source: 'Player', 
                action: event.action, 
                target: 'Target Dummy', 
                isCrit: context.damage?.isCrit || false, 
                damage, 
                healingDone: 0,
                snapshot: { combatant: deepCopy(player), target: deepCopy(target) } 
            });
        }
        return { rawLog, analysisLog };
    } catch (error) {
        console.error("[ENGINE] Simulation failed catastrophically:", error);
        logAndCapture(0, "FATAL ERROR", { error: error.message });
        return { rawLog, analysisLog };
    }
};

