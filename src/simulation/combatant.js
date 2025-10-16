/**
 * @file combatant.js
 * @description Manages the creation and state calculation of combatants.
 */
import { calculateEffectValue } from './scaling.js';

const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Initializes a combatant object from a character definition.
 * @param {object} baseCombatant - The base character definition.
 * @param {Array<object>} allSources - A complete list of all sources in the game.
 * @param {Array<object>} allEffects - A complete list of all effects in the game.
 * @returns {object} The fully initialized combatant object.
 */
const initializeCombatant = (baseCombatant, allSources, allEffects) => {
    const combatant = deepCopy(baseCombatant);
    
    const maxHealth = baseCombatant.health || 10000;
    combatant.maxHealth = maxHealth;
    combatant.state = {
        health: maxHealth,
        stamina: 100, mana: 100, cooldowns: {},
    };

    const perkIds = (baseCombatant.perks || []).map(p => p.id);
    combatant.baseSources = allSources.filter(s => perkIds.includes(s.id));
    
    combatant.activeEffects = [];
    
    // --- SIMPLIFIED INITIALIZATION ---
    // We no longer pre-calculate anything. We just load the raw ON_EQUIP effects.
    // The recalculateStats function is now the single source of truth for all calculations.
    for (const source of combatant.baseSources) {
        if (source.effects) {
            for (const effectId of source.effects) {
                const effect = allEffects.find(e => e.id === effectId);
                if (effect && effect.trigger === 'ON_EQUIP') {
                    const effectInstance = deepCopy(effect);
                    effectInstance.duration = Infinity;
                    effectInstance.sourceName = source.name; // Carry the source name for the UI
                    combatant.activeEffects.push(effectInstance);
                }
            }
        }
    }

    const recalculateStats = () => {
        const newStats = {
            empower: { total: 0, sources: [] },
            fortify: { total: 0, sources: [] },
            rend: { total: 0, sources: [] },
            weaken: { total: 0, sources: [] },
            critChance: 0,
            critDamage: 0,
        };

        const critChanceBuckets = { BASE: 0, PERKS: 0 };
        const critDamageBuckets = { BASE: 0, PERKS: 0 };

        if (combatant.weaponType) {
            switch (combatant.weaponType) {
                case 'Sword': 
                    critChanceBuckets.BASE = 0.07; 
                    critDamageBuckets.BASE = 30;
                    break;
                case 'Flail': 
                    critChanceBuckets.BASE = 0.06; 
                    critDamageBuckets.BASE = 20;
                    break;
                default: 
                    critChanceBuckets.BASE = 0.05; 
                    critDamageBuckets.BASE = 20;
                    break;
            }
        }
        
        for (const effect of combatant.activeEffects) {
            const sourceName = effect.sourceName || effect.name;

            const processValue = (value, statusId) => {
                switch (statusId) {
                    case 'EMPOWER':
                        newStats.empower.total += value;
                        newStats.empower.sources.push({ name: sourceName, value });
                        break;
                    case 'FORTIFY':
                        newStats.fortify.total += value;
                        newStats.fortify.sources.push({ name: sourceName, value });
                        break;
                    case 'REND':
                        newStats.rend.total += value;
                        newStats.rend.sources.push({ name: sourceName, value });
                        break;
                    case 'WEAKEN':
                        newStats.weaken.total += value;
                        newStats.weaken.sources.push({ name: sourceName, value });
                        break;
                    case 'CRITICAL_CHANCE':
                        critChanceBuckets.PERKS += (value / 100);
                        break;
                    default:
                        break;
                }
            };

            // --- "JUST-IN-TIME" CALCULATION ---
            // This is now the single source of truth for ALL effect calculations.
            if (effect.modifications) {
                for (const mod of effect.modifications) {
                    const value = calculateEffectValue(mod.valueFormula, effect.scalingPerGearScore, combatant.gearScore);
                    const statusId = mod.statusId || effect.statusId;
                    processValue(value, statusId);
                }
            } else {
                const value = calculateEffectValue(effect.valueFormula, effect.scalingPerGearScore, combatant.gearScore);
                processValue(value, effect.statusId);
            }
        }
        
        // Apply caps
        newStats.empower.total = Math.min(newStats.empower.total, 50);
        newStats.fortify.total = Math.min(newStats.fortify.total, 50);
        newStats.rend.total = Math.min(newStats.rend.total, 70);

        newStats.critChance = critChanceBuckets.BASE + critChanceBuckets.PERKS;
        newStats.critDamage = critDamageBuckets.BASE + critDamageBuckets.PERKS;

        combatant.stats = newStats;
    };

    combatant.recalculateStats = recalculateStats;
    combatant.recalculateStats();
    
    return combatant;
};

export { initializeCombatant };

