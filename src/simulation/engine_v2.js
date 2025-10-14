import { collection, getDocs, query, where } from 'firebase/firestore';

// --- UTILITY FUNCTIONS ---
const log = (message, data = null) => {
  console.log(message, data);
};
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

// --- CORE DATA FETCHING ---
const fetchAllEffects = async (firestore) => {
    try {
        const effectsCol = collection(firestore, 'ukb_effects_v2');
        const effectSnapshot = await getDocs(effectsCol);
        const effectList = effectSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        log(`[ENGINE] Successfully fetched ${effectList.length} effects from UKB.`);
        return effectList;
    } catch (error) {
        console.error("[ENGINE] Error fetching effects from UKB:", error);
        throw new Error("Failed to fetch Effect data.");
    }
};

// --- COMBATANT INITIALIZATION ---
const initializeCombatant = (baseCombatant, allEffects) => {
    log(`[ENGINE] Initializing combatant: ${baseCombatant.id}`);
    const combatant = deepCopy(baseCombatant);
    combatant.activeEffects = [];
    combatant.state = {
        health: combatant.health || 10000,
        stamina: 100,
        mana: 100,
        cooldowns: {},
    };
    combatant.stats = {
        empower: 0,
        fortify: 0,
        rend: 0,
        weaken: 0,
        healingDone: 0, 
    };
    
    const applyPassiveEffects = (sourceArray, sourceType) => {
        if (!sourceArray || sourceArray.length === 0) return;
        log(`[ENGINE] Applying ON_EQUIP effects from ${sourceType} for ${combatant.id}`);
        for (const source of sourceArray) {
            if (source.effects && source.effects.length > 0) {
                for (const effectId of source.effects) {
                    const effect = allEffects.find(e => e.id === effectId);
                    if (effect && effect.trigger === 'ON_EQUIP') {
                        log(`[ENGINE] Found passive effect: ${effect.name} from source: ${source.name}`);
                        combatant.activeEffects.push(effect);
                        if (effect.statusId === 'EMPOWER' && effect.category === 'STAT_MODIFIER') {
                            const value = parseInt(effect.valueFormula, 10);
                            if (!isNaN(value)) {
                                combatant.stats.empower += value;
                                log(`[ENGINE] ${combatant.id} empowered by ${value}%. New total: ${combatant.stats.empower}%`);
                            }
                        }
                    }
                }
            }
        }
    };
    
    applyPassiveEffects(combatant.perks, 'perks');
    applyPassiveEffects(combatant.masteries, 'masteries');
    log(`[ENGINE] Combatant ${combatant.id} initialized.`, combatant);
    return combatant;
};

// --- MAIN SIMULATION RUNNER ---
export const runSimulationV2 = async (playerConfig, targetConfig, choreography, firestore) => {
    const rawLog = [];
    const analysisLog = [];
    let timeline = 0;

    const logAndCapture = (message, data = {}) => {
        const timestamp = parseFloat(timeline.toFixed(2));
        rawLog.push({ timestamp, message, data });
        console.log(`[${timestamp}s] ${message}`, data);
    };
    
    try {
        logAndCapture("--- Simulation Start ---");
        const allEffects = await fetchAllEffects(firestore);
        let player = initializeCombatant(playerConfig, allEffects);
        let target = initializeCombatant(targetConfig, allEffects);

        logAndCapture("Starting choreography execution...");
        for (const event of choreography) {
            timeline += event.delay;
            logAndCapture(`Executing event: ${event.action}`, { event });

            let damage = 0;
            let isCrit = false;
            
            if (event.action.includes('ATTACK')) {
                damage = 895; // Base damage
                const empowerMultiplier = 1 + (player.stats.empower / 100);
                damage *= empowerMultiplier;
                damage = Math.round(damage);

                const allPlayerSources = [...(player.perks || []), ...(player.masteries || [])];
                for (const source of allPlayerSources) {
                    const triggerGroups = source.triggerGroups?.filter(tg => tg.trigger === 'ON_DEALDAMAGE') || [];
                    for (const group of triggerGroups) {
                        for (const effectId of group.effects) {
                            const effect = allEffects.find(e => e.id === effectId);
                            if (effect?.category === 'HEAL' && effect.unit === 'PERCENT_OF_DAMAGE') {
                                const healPercent = parseFloat(effect.valueFormula.replace('perkMultiplier', '1'));
                                const healAmount = Math.round(damage * (healPercent / 100));
                                
                                // THE FIX: Update the healingDone stat *before* the snapshot.
                                player.stats.healingDone += healAmount;
                                logAndCapture(`[HEAL] ${source.name} triggered, healing ${player.id} for ${healAmount} (${healPercent}% of ${damage} damage).`);
                            }
                        }
                    }
                }
            }

            // THE FIX: The snapshot is now taken *after* all effects for the event are calculated.
            const snapshot = {
                combatant: deepCopy(player),
                target: deepCopy(target)
            };
            
            analysisLog.push({
                timestamp: timeline, // Use the more precise timeline for analysis
                source: 'Player',
                action: event.action,
                target: 'Target Dummy',
                isCrit: isCrit,
                damage: damage,
                snapshot: snapshot,
            });
        }

        logAndCapture("--- Simulation End ---");
        return { rawLog, analysisLog };
    } catch (error) {
        console.error("[ENGINE] Simulation failed catastrophically:", error);
        logAndCapture("FATAL ERROR", { error: error.message });
        return { rawLog, analysisLog };
    }
};