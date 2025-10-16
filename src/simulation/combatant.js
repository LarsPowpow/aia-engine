/**
 * @file combatant.js
 * @description Manages the creation and state calculation of combatants.
 */

const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Initializes a combatant object from a character definition.
 * @param {object} baseCombatant - The base character definition.
 * @param {Array<object>} allEffects - A complete list of all effects in the game.
 * @returns {object} The fully initialized combatant object.
 */
const initializeCombatant = (baseCombatant, allEffects) => {
    const combatant = deepCopy(baseCombatant);
    
    // --- FIX START ---
    // We are now explicitly defining maxHealth. The state.health represents the current, fluctuating health.
    // This makes our data model more robust and prevents NaN errors in calculations.
    const maxHealth = baseCombatant.health || 10000;
    combatant.maxHealth = maxHealth;
    combatant.state = {
        health: maxHealth,
        stamina: 100, mana: 100, cooldowns: {},
    };
    // --- FIX END ---

    combatant.baseSources = [...(baseCombatant.perks || []), ...(baseCombatant.masteries || [])];
    combatant.activeEffects = [];
    
    for (const source of combatant.baseSources) {
        if (source.effects) {
            for (const effectId of source.effects) {
                const effect = allEffects.find(e => e.id === effectId);
                if (effect && effect.trigger === 'ON_EQUIP') {
                    const effectInstance = deepCopy(effect);
                    effectInstance.duration = Infinity;
                    combatant.activeEffects.push(effectInstance);
                }
            }
        }
    }

    const recalculateStats = () => {
        const newStats = {
            empower: 0, fortify: 0, rend: 0, weaken: 0, miscDmg: 0,
            healingDone: combatant.stats?.healingDone || 0,
            critChance: 0, critDamage: 0,
        };
        
        const statBuckets = { 
            EMPOWER: { sum: 0, cap: 50 }, 
            FORTIFY: { sum: 0, cap: 50 },
            REND: { sum: 0, cap: 70 },
            MISC_DMG: { sum: 0 },
            CRIT_DMG: { sum: 0 }
        };

        if (combatant.weaponType) {
            switch (combatant.weaponType) {
                case 'Sword': 
                    newStats.critChance = 0.07; 
                    statBuckets.CRIT_DMG.sum += 30;
                    break;
                case 'Flail': 
                    newStats.critChance = 0.06; 
                    statBuckets.CRIT_DMG.sum += 20;
                    break;
                default: 
                    newStats.critChance = 0.05; 
                    statBuckets.CRIT_DMG.sum += 20;
                    break;
            }
        }
        
        for (const effect of combatant.activeEffects) {
            if (effect.modifications) {
                for (const mod of effect.modifications) {
                    const perkMultiplier = 1;
                    const value = parseFloat(mod.valueFormula) || 0;

                    let bucket = effect.damageBucket;
                    if (!bucket && mod.statToModify === 'OUTGOING_DAMAGE_MODIFIER' && effect.statusId === 'EMPOWER') {
                        bucket = 'Empower';
                    }

                    switch (bucket) {
                        case 'Empower': statBuckets.EMPOWER.sum += value; break;
                        case 'Rend': statBuckets.REND.sum += value; break;
                        case 'MiscDmg': statBuckets.MISC_DMG.sum += value; break;
                        case 'CritDamage': statBuckets.CRIT_DMG.sum += value; break;
                        default: break;
                    }
                }
            } else if (effect.category === 'STAT_MODIFIER' && effect.statusId === 'EMPOWER') {
                const value = parseFloat(effect.valueFormula) || 0;
                statBuckets.EMPOWER.sum += value;
            }
        }
        
        newStats.empower = Math.min(statBuckets.EMPOWER.sum, statBuckets.EMPOWER.cap);
        newStats.rend = Math.min(statBuckets.REND.sum, statBuckets.REND.cap);
        newStats.miscDmg = statBuckets.MISC_DMG.sum;
        newStats.critDamage = statBuckets.CRIT_DMG.sum;
        combatant.stats = newStats;
    };

    combatant.recalculateStats = recalculateStats;
    combatant.recalculateStats();
    
    return combatant;
};

export { initializeCombatant };

