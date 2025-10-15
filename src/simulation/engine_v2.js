import { collection, getDocs, query, where } from 'firebase/firestore';
import { calculateWeaponDamage, BASE_ABILITY_MODIFIERS } from './formulas.js';

// --- UTILITY & FORMULA FUNCTIONS ---
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

// --- PLACEHOLDER FUNCTIONS ---
const calculatePerkMultiplier = (scalingPerGearScore) => {
    if (!scalingPerGearScore || typeof scalingPerGearScore !== 'string') return 1;
    const parts = scalingPerGearScore.replace(',', '.').split(':');
    if (parts.length === 2) {
        const base = parseFloat(parts[0]);
        const factor = parseFloat(parts[1]);
        if (!isNaN(base) && !isNaN(factor)) return base + (factor * 700);
    }
    return 1;
};
const evaluateFormula = (formula, context) => {
    try {
        let processedFormula = String(formula);
        for (const key in context) {
            processedFormula = processedFormula.replace(new RegExp(key, 'g'), context[key]);
        }
        const result = new Function(`return ${processedFormula}`)();
        if (typeof result !== 'number' || !isFinite(result)) {
            log(`[ENGINE] Warning: Formula "${formula}" evaluated to a non-numeric value:`, result);
            return 0;
        }
        return result;
    } catch (error) {
        console.error(`[ENGINE] Error evaluating formula "${formula}" with context ${JSON.stringify(context)}:`, error);
        return 0;
    }
};

// --- MECHANIC PROCESSORS ---
const applyHeal = (effect, context, combatant, logAndCapture) => {
    const { damageDealt, timeline } = context;
    const perkMultiplier = calculatePerkMultiplier(effect.scalingPerGearScore);
    let healAmount = 0;
    if (effect.unit === 'PERCENT_OF_DAMAGE') {
        const percentage = evaluateFormula(effect.valueFormula, { perkMultiplier });
        healAmount = Math.round(damageDealt * (percentage / 100));
    }
    if (healAmount > 0) {
        combatant.state.health = Math.min(combatant.health, combatant.state.health + healAmount);
        logAndCapture(timeline, `[HEAL] ${combatant.id} healed for ${healAmount}.`, { newHealth: combatant.state.health });
    }
};

// --- COMBATANT INITIALIZATION & STATS ---
const initializeCombatant = (baseCombatant, allEffects) => {
    const combatant = deepCopy(baseCombatant);
    combatant.baseSources = [...(baseCombatant.perks || []), ...(baseCombatant.masteries || [])];
    combatant.activeEffects = [];
    combatant.state = {
        health: combatant.health || 10000,
        stamina: 100, mana: 100, cooldowns: {},
    };
    const recalculateStats = () => {
        const newStats = {
            empower: 0, fortify: 0, rend: 0, weaken: 0,
            healingDone: combatant.stats?.healingDone || 0,
            critChance: 0, critDamageModifier: 1.0,
        };
        const statBuckets = { EMPOWER: { sum: 0, cap: 50 }, FORTIFY: { sum: 0, cap: 50 } };
        switch (combatant.weaponType) {
            case 'Sword': newStats.critChance = 0.07; newStats.critDamageModifier = 1.3; break;
            case 'Flail': newStats.critChance = 0.06; newStats.critDamageModifier = 1.2; break;
            default: newStats.critChance = 0.05; newStats.critDamageModifier = 1.2; break;
        }
        const allCurrentEffects = [...combatant.activeEffects];
        for (const source of combatant.baseSources) {
            if (source.effects) {
                for (const effectId of source.effects) {
                    const effect = allEffects.find(e => e.id === effectId);
                    if (effect && effect.trigger === 'ON_EQUIP') {
                        allCurrentEffects.push(effect);
                    }
                }
            }
        }
        for (const effect of allCurrentEffects) {
            if (effect.modifications) {
                for (const mod of effect.modifications) {
                    if (mod.statToModify === 'OUTGOING_DAMAGE_MODIFIER') {
                        const perkMultiplier = calculatePerkMultiplier(effect.scalingPerGearScore);
                        const value = evaluateFormula(mod.valueFormula, { perkMultiplier });
                        if(effect.statusId === 'EMPOWER' && statBuckets.EMPOWER) {
                            statBuckets.EMPOWER.sum += value;
                        } 
                    }
                }
            }
        }
        newStats.empower = Math.min(statBuckets.EMPOWER.sum, statBuckets.EMPOWER.cap);
        combatant.stats = newStats;
    };
    combatant.recalculateStats = recalculateStats;
    combatant.recalculateStats();
    return combatant;
};

// --- UNIVERSAL TRIGGER PROCESSOR ---
const processTriggers = (triggerEvent, combatant, timeline, allEffects, logAndCapture) => {
    const { type, isCrit, damageDealt } = triggerEvent;
    const triggersToProcess = [];
    if (isCrit) triggersToProcess.push('ON_CRITICAL_HIT');
    if (damageDealt > 0) triggersToProcess.push('ON_DEALDAMAGE');
    if (triggersToProcess.length === 0) return;
    for (const source of combatant.baseSources) {
        for (const trigger of triggersToProcess) {
            const triggerGroups = source.triggerGroups?.filter(tg => tg.trigger === trigger) || [];
            for (const group of triggerGroups) {
                if (!combatant.state.cooldowns[source.id] || timeline >= combatant.state.cooldowns[source.id]) {
                    combatant.state.cooldowns[source.id] = timeline + group.cooldown;
                    for (const effectId of group.effects) {
                        const effect = allEffects.find(e => e.id === effectId);
                        if(effect) {
                            switch (effect.category) {
                                case 'STATUS_EFFECT': {
                                    const newEffectInstance = deepCopy(effect);
                                    if (newEffectInstance.duration) newEffectInstance.expiresAt = timeline + newEffectInstance.duration;
                                    combatant.activeEffects.push(newEffectInstance);
                                    break;
                                }
                                case 'HEAL': {
                                    applyHeal(effect, { damageDealt, timeline }, combatant, logAndCapture);
                                    break;
                                }
                                default:
                            }
                        }
                    }
                }
            }
        }
    }
    return true; 
};

// --- MAIN SIMULATION RUNNER ---
export const runSimulationV2 = async (playerConfig, targetConfig, choreography, firestore) => {
    const rawLog = [];
    const analysisLog = [];
    let timeline = 0.0;
    const logAndCapture = (timestamp, message, data = {}) => {
        const time = parseFloat(timestamp.toFixed(2));
        rawLog.push({ timestamp: time, message, data });
    };

    try {
        const allEffects = await fetchAllEffects(firestore);
        let player = initializeCombatant(playerConfig, allEffects);
        let target = initializeCombatant(targetConfig, allEffects);

        for (const event of choreography) {
            timeline = event.timestamp;
            let damage = 0;
            let isCrit = false;

            if (event.action.includes('ATTACK')) {
                // --- 1. DETERMINE EVENT FACTS ---
                isCrit = event.forceCrit || Math.random() <= player.stats.critChance;

                // --- 2. CALCULATE BASE DAMAGE (TWO-STAGE) ---
                const weaponDamage = calculateWeaponDamage(player.weaponType, player.attributes);
                let abilityModifier = 1.0;
                if (event.action === 'LIGHT_ATTACK' || event.action === 'HEAVY_ATTACK') {
                    abilityModifier = BASE_ABILITY_MODIFIERS[player.weaponType]?.[event.action] || 1.0;
                } 
                // TODO: Add lookup for 'ABILITY' actions
                const baseDamage = Math.round(weaponDamage * abilityModifier);
                
                // --- 3. PRE-DAMAGE TRIGGERS & RECALC ---
                const statsChanged = processTriggers({ type: 'ATTACK', isCrit, damageDealt: baseDamage }, player, timeline, allEffects, logAndCapture);
                if (statsChanged) {
                    player.recalculateStats();
                }

                // --- 4. FINAL DAMAGE CALCULATION ---
                let finalDamage = baseDamage;
                if(isCrit) {
                    finalDamage *= player.stats.critDamageModifier;
                }
                finalDamage *= (1 + (player.stats.empower / 100));
                // TODO: Add Rend and other buckets here
                damage = Math.round(finalDamage);
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