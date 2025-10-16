/**
 * @file engine.js
 * @description The primary simulation engine. This file orchestrates the various single-responsibility
 * modules (combatant, triggers, mechanics) to run a full combat simulation.
 * This is the definitive, non-versioned engine.
 */

// --- EXTERNAL DEPENDENCIES ---
import { collection, getDocs } from 'firebase/firestore';

// --- INTERNAL MODULES ---
import { calculateWeaponDamage, BASE_ABILITY_MODIFIERS } from './formulas.js';
import { initializeCombatant } from './combatant.js';
import { processTriggers } from './triggers.js';

// --- UTILITY FUNCTIONS ---
const log = (message, data = null) => { console.log(message, data); };
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

// --- CORE DATA FETCHING ---
// Fetches the complete set of effect definitions from the Universal Knowledge Base (UKB).
const fetchAllEffects = async (firestore) => {
    try {
        const effectsCol = collection(firestore, 'ukb_effects_v2');
        const effectSnapshot = await getDocs(effectsCol);
        const effectList = effectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return effectList;
    } catch (error) {
        console.error("[ENGINE] Error fetching effects from UKB:", error);
        throw new Error("Failed to fetch Effect data.");
    }
};


/**
 * The main simulation runner. It processes a choreography of events and calculates the outcome.
 * @param {object} playerConfig - The player's character definition.
 * @param {object} targetConfig - The target's character definition.
 * @param {Array<object>} choreography - A timeline of actions to be simulated.
 * @param {object} firestore - The Firestore database instance.
 * @returns {object} An object containing the raw simulation log and an analysis log.
 */
export const runSimulation = async (playerConfig, targetConfig, choreography, firestore) => {
    const rawLog = [];
    const analysisLog = [];
    let timeline = 0.0;
    const logAndCapture = (timestamp, message, data = {}) => {
        const time = parseFloat(timestamp.toFixed(2));
        rawLog.push({ timestamp: time, message, data });
    };

    try {
        // 1. Fetch all game rule definitions
        const allEffects = await fetchAllEffects(firestore);
        
        // 2. Initialize combatants using the dedicated module
        let player = initializeCombatant(playerConfig, allEffects);
        let target = initializeCombatant(targetConfig, allEffects);

        // 3. Process the choreography timeline
        for (const event of choreography) {
            timeline = event.timestamp;
            let damage = 0;
            let isCrit = false;

            // --- UNIVERSAL PRE-ACTION PHASE ---
            // Remove expired effects before any action
            player.activeEffects = player.activeEffects.filter(e => !e.expiresAt || e.expiresAt > timeline);
            target.activeEffects = target.activeEffects.filter(e => !e.expiresAt || e.expiresAt > timeline);
            
            // Recalculate stats based on current active effects
            player.recalculateStats();
            target.recalculateStats();

            // --- ACTION-SPECIFIC LOGIC ---
            if (event.action.includes('ATTACK')) {
                isCrit = event.forceCrit || Math.random() <= player.stats.critChance;

                // Process pre-damage triggers that might change stats for THIS hit
                const preDamageStatsChanged = processTriggers({ type: event.action, isCrit, damageDealt: 0 }, player, timeline, allEffects, logAndCapture);
                if (preDamageStatsChanged) {
                    player.recalculateStats();
                }
                
                // --- DAMAGE CALCULATION PHASE (The Grand Damage Formula) ---
                const weaponDamage = calculateWeaponDamage(player.weaponType, player.attributes);
                let abilityModifier = 1.0;
                if (event.action === 'LIGHT_ATTACK' || event.action === 'HEAVY_ATTACK') {
                    abilityModifier = BASE_ABILITY_MODIFIERS[player.weaponType]?.[event.action] || 1.0;
                } 
                const baseDamage = Math.round(weaponDamage * abilityModifier);
                
                let finalDamage = baseDamage;
                
                const empowerRendMultiplier = 1 + (player.stats.empower / 100) - (target.stats.rend / 100);
                const miscDmgMultiplier = 1 + (player.stats.miscDmg / 100);
                const critMultiplier = isCrit ? (1 + player.stats.critDamage / 100) : 1;

                finalDamage *= empowerRendMultiplier;
                finalDamage *= miscDmgMultiplier;
                finalDamage *= critMultiplier;

                damage = Math.round(finalDamage);

                // --- POST-DAMAGE PHASE ---
                // Process post-damage triggers (like healing) using the trigger module
                processTriggers({ type: event.action, isCrit, damageDealt: damage }, player, timeline, allEffects, logAndCapture);
            
            } else if (event.action === 'BLOCK_HIT') {
                // --- FIX START ---
                // This new block ensures that defensive events are also processed by the trigger system.
                processTriggers({ type: event.action, isCrit: false, damageDealt: 0 }, player, timeline, allEffects, logAndCapture);
                // --- FIX END ---
            }

            analysisLog.push({ timestamp: event.timestamp, source: 'Player', action: event.action, target: 'Target Dummy', isCrit, damage, snapshot: { combatant: deepCopy(player), target: deepCopy(target) } });
        }
        return { rawLog, analysisLog };
    } catch (error) {
        console.error("[ENGINE] Simulation failed catastrophically:", error);
        logAndCapture(0, "FATAL ERROR", { error: error.message });
        return { rawLog, analysisLog };
    }
};

