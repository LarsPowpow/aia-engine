import { collection, getDocs, query, where } from 'firebase/firestore';

// --- UTILITY FUNCTIONS ---
const log = (message, data = null) => { console.log(message, data); };
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
    
    const recalculateStats = () => {
        combatant.stats = {
            empower: 0,
            fortify: 0,
            rend: 0,
            weaken: 0,
            healingDone: combatant.stats?.healingDone || 0,
            critChance: 0,
            critDamageModifier: 1.0,
        };

        switch (combatant.weaponType) {
            case 'Sword':
                combatant.stats.critChance = 0.07;
                combatant.stats.critDamageModifier = 1.3;
                break;
            case 'Flail':
                combatant.stats.critChance = 0.06;
                combatant.stats.critDamageModifier = 1.2;
                break;
            default:
                combatant.stats.critChance = 0.05;
                combatant.stats.critDamageModifier = 1.2;
                break;
        }

        for (const effect of combatant.activeEffects) {
             if (effect.category === 'STATUS_EFFECT' && effect.statusId === 'EMPOWER') {
                const value = parseFloat(effect.modifications[0].valueFormula.replace('perkMultiplier', '1'));
                if (!isNaN(value)) {
                    combatant.stats.empower += value;
                }
            }
        }
         log(`[STATS] Recalculated stats for ${combatant.id}`, combatant.stats);
    };

    combatant.recalculateStats = recalculateStats;
    combatant.recalculateStats();

    const allSources = [...(baseCombatant.perks || []), ...(baseCombatant.masteries || [])];
    for (const source of allSources) {
        if (source.effects && source.effects.length > 0) {
            for (const effectId of source.effects) {
                const effect = allEffects.find(e => e.id === effectId);
                if (effect && effect.trigger === 'ON_EQUIP') {
                    log(`[ENGINE] Applying passive effect: ${effect.name} from source: ${source.name}`);
                    combatant.activeEffects.push(effect);
                }
            }
        }
    }
    
    combatant.recalculateStats();

    log(`[ENGINE] Combatant ${combatant.id} initialized.`, combatant);
    return combatant;
};

// --- MAIN SIMULATION RUNNER ---
export const runSimulationV2 = async (playerConfig, targetConfig, choreography, firestore) => {
    const rawLog = [];
    const analysisLog = [];
    let timeline = 0.0;

    const logAndCapture = (timestamp, message, data = {}) => {
        const time = parseFloat(timestamp.toFixed(2));
        rawLog.push({ timestamp: time, message, data });
        console.log(`[${time}s] ${message}`, data);
    };

    try {
        logAndCapture(0, "--- Simulation Start ---");
        const allEffects = await fetchAllEffects(firestore);
        let player = initializeCombatant(playerConfig, allEffects);
        let target = initializeCombatant(targetConfig, allEffects);

        logAndCapture(0, "Starting choreography execution...");
        for (const event of choreography) {
            const eventTimestamp = event.timestamp;
            
            while (timeline < eventTimestamp) {
                timeline = parseFloat((timeline + 0.1).toFixed(2));
                
                const expiredEffects = player.activeEffects.filter(e => e.expiresAt && timeline >= e.expiresAt);
                if (expiredEffects.length > 0) {
                    logAndCapture(timeline, `[EXPIRE] Effects expired for ${player.id}`, expiredEffects.map(e => e.name));
                    player.activeEffects = player.activeEffects.filter(e => !e.expiresAt || timeline < e.expiresAt);
                    player.recalculateStats();
                }
            }
            timeline = eventTimestamp;

            logAndCapture(eventTimestamp, `Executing event: ${event.action}`, { event });

            let damage = 0;
            let isCrit = false;

            if (event.action.includes('ATTACK')) {
                damage = 895;
                
                // THE UPGRADE: Check for the forceCrit flag first.
                if (event.forceCrit) {
                    isCrit = true;
                    logAndCapture(eventTimestamp, `[FORCED CRITICAL HIT!]`);
                } else {
                    const critRoll = Math.random();
                    if (critRoll <= player.stats.critChance) {
                        isCrit = true;
                        logAndCapture(eventTimestamp, `[CRITICAL HIT!] Rolled ${critRoll.toFixed(2)} vs. chance ${player.stats.critChance}.`);
                    }
                }

                if(isCrit) {
                    damage *= player.stats.critDamageModifier;
                }

                const empowerMultiplier = 1 + (player.stats.empower / 100);
                damage *= empowerMultiplier;
                damage = Math.round(damage);

                const allPlayerSources = [...(player.perks || []), ...(player.masteries || [])];
                
                if (isCrit) {
                    for (const source of allPlayerSources) {
                        const triggerGroups = source.triggerGroups?.filter(tg => tg.trigger === 'ON_CRITICAL_HIT') || [];
                        for (const group of triggerGroups) {
                            if (!player.state.cooldowns[source.id] || timeline >= player.state.cooldowns[source.id]) {
                                logAndCapture(eventTimestamp, `[TRIGGER] ${source.name} activated by ON_CRITICAL_HIT.`);
                                player.state.cooldowns[source.id] = timeline + group.cooldown;
                                for (const effectId of group.effects) {
                                    const effect = allEffects.find(e => e.id === effectId);
                                    if(effect) {
                                        const newEffectInstance = deepCopy(effect);
                                        newEffectInstance.expiresAt = timeline + newEffectInstance.duration;
                                        player.activeEffects.push(newEffectInstance);
                                        logAndCapture(eventTimestamp, `[EFFECT] Applied ${effect.name} to ${player.id}. Expires at ${newEffectInstance.expiresAt.toFixed(2)}s.`);
                                    }
                                }
                                player.recalculateStats();
                            } else {
                                logAndCapture(eventTimestamp, `[COOLDOWN] ${source.name} is on cooldown. Available at ${player.state.cooldowns[source.id].toFixed(2)}s.`);
                            }
                        }
                    }
                }
            }

            const snapshot = { combatant: deepCopy(player), target: deepCopy(target) };
            analysisLog.push({ timestamp: eventTimestamp, source: 'Player', action: event.action, target: 'Target Dummy', isCrit, damage, snapshot });
        }

        logAndCapture(choreography[choreography.length - 1].timestamp, "--- Simulation End ---");
        return { rawLog, analysisLog };
    } catch (error) {
        console.error("[ENGINE] Simulation failed catastrophically:", error);
        logAndCapture(0, "FATAL ERROR", { error: error.message });
        return { rawLog, analysisLog };
    }
};