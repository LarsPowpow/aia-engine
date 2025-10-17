/**
 * @file engine.js
 * @description The primary simulation engine.
 * @version 9.0 - Pre-Event State & Final Fixes
 */

// --- INTERNAL MODULES ---
import { calculateWeaponDamage } from './formulas.js';
import { initializeCombatant } from './combatant.js';
import { assembleContext } from './contextAssembler.js';
import { bunkerHandlers } from './bunkers/bunkerManifest.js';

const WEAPON_STATS = {
    Sword: { baseCritDamagePercent: 0.3 },
    Flail: { baseCritDamagePercent: 0.2 },
    Default: { baseCritDamagePercent: 0.2 },
};
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

// --- ENGINE-SIDE STAT AGGREGATOR ---
const aggregateStats = (combatant) => {
    if (!combatant || !Array.isArray(combatant.activeEffects)) {
        throw new Error('[aggregateStats] Invalid combatant or activeEffects');
    }
    const newStats = {
        empower: 0, rend: 0, fortify: 0, weaken: 0, miscDmg: 0,
        critChance: 0.05, critDamage: 0,
    };

    for (const effect of combatant.activeEffects) {
        if (effect.category === 'EMPOWER') newStats.empower += effect.value;
        // --- FINAL FIX: Corrected category name ---
        if (effect.category === 'Uncapped_Damage_%') newStats.miscDmg += effect.value;
        if (effect.category === 'CRIT_DAMAGE') newStats.critDamage += effect.value;
    }
    newStats.empower = Math.min(newStats.empower, 0.50);
    newStats.rend = Math.min(newStats.rend, 0.70);
    combatant.stats = newStats;
};

const applyOnEquipEffects = (combatant, allSourcesMap) => {
    const allEquippedSources = [...(combatant.perks || []), ...(combatant.masteries || [])];
    for (const source of allEquippedSources) {
        // Hydrate the source object to ensure it has the effects array
        const fullSource = allSourcesMap.get(source.id);
        if (!fullSource || !fullSource.effects) continue;

        for (const effectDef of fullSource.effects) {
            if (effectDef.conditions?.includes('ON_EQUIP')) {
                const isAlreadyActive = combatant.activeEffects.some(e => e.id === effectDef.id);
                if (!isAlreadyActive) {
                    const newEffect = {
                        id: effectDef.id,
                        name: effectDef.name,
                        category: effectDef.category,
                        value: parseFloat(effectDef.valueFormula) || 0,
                        duration: Infinity,
                        sourceName: fullSource.name,
                        sourceId: fullSource.id,
                    };
                    combatant.activeEffects.push(newEffect);
                }
            }
        }
    }
};

/**
 * The main simulation runner.
 */
export const runSimulation = async (combatantConfig, targetConfig, choreography, allSources) => {
    const rawLog = [];
    const analysisLog = [];
    let timeline = 0.0;

    const allSourcesMap = new Map(allSources.map(s => [s.id, s]));
    const sourceNameMap = new Map(allSources.map(s => [s.id, s.name]));
    const humanize = (s) => (s || '').split('_').map(t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()).join(' ');

    try {
        const combatant = initializeCombatant(combatantConfig, allSourcesMap);
        const target = initializeCombatant(targetConfig, allSourcesMap);

        if (!combatant || !target) throw new Error('[runSimulation] initializeCombatant returned invalid value');

        applyOnEquipEffects(combatant, allSourcesMap);
        applyOnEquipEffects(target, allSourcesMap);

        for (const event of choreography) {
            timeline = event.timestamp;

            if (event.action === 'WEAPON_SWAP' && event.targetWeapon) {
                combatant.weaponType = event.targetWeapon;
            }

            combatant.activeEffects = combatant.activeEffects.filter(e => e.duration === Infinity || (e.expiresAt && e.expiresAt > timeline));
            target.activeEffects = target.activeEffects.filter(e => e.duration === Infinity || (e.expiresAt && e.expiresAt > timeline));

            // --- ARCHITECTURAL UPGRADE: Create Pre-Event State ---
            const combatantPreEvent = deepCopy(combatant);
            const targetPreEvent = deepCopy(target);

            const context = assembleContext(event, combatant, target);
            context.sourcePreEvent = combatantPreEvent;
            context.targetPreEvent = targetPreEvent;
            
            aggregateStats(combatant); 
            
            const bunkerModifications = {};
            for (const handler of bunkerHandlers) {
                try {
                    const result = handler(context);
                    if (result && typeof result === 'object') {
                        Object.assign(bunkerModifications, result);
                    }
                } catch (err) {
                    console.error('[ENGINE] bunker handler failed:', handler?.name || '<anonymous>', err);
                }
            }
            
            aggregateStats(combatant); 
            aggregateStats(target);
            
            let damage = 0;
            let isCrit = false;
            
            const abilityId = event.abilityId || event.ability?.id;
            const actionName = sourceNameMap.get(abilityId) || humanize(event.action);

            if ((context.eventType || '').includes('ATTACK') || (context.eventType || '').includes('ABILITY_HIT')) {
                isCrit = !!event.forceCrit || (Math.random() <= (combatant.stats.critChance || 0.05));
                const weaponDamage = calculateWeaponDamage(combatant.weaponType, combatant.attributes);
                const resolvedBaseMultiplier = Number(bunkerModifications.baseDamageMultiplier ?? event.ability?.baseDamageMultiplier ?? 1.0);
                const baseDamage = Math.round(weaponDamage * resolvedBaseMultiplier);
                
                let finalDamage = baseDamage;
                
                const empowerRendMultiplier = 1 + (combatant.stats.empower || 0) - (target.stats.fortify || 0);
                const rendMultiplier = 1 + (target.stats.rend || 0);
                const weaponBaseCritDamage = WEAPON_STATS[combatant.weaponType]?.baseCritDamagePercent || WEAPON_STATS.Default.baseCritDamagePercent;
                const perkCritDamageBonus = combatant.stats.critDamage || 0;
                const critMultiplier = isCrit ? (1 + weaponBaseCritDamage + perkCritDamageBonus) : 1;
                const miscDamageMultiplier = 1 + (combatant.stats.miscDmg || 0);

                finalDamage *= empowerRendMultiplier;
                finalDamage *= rendMultiplier;
                finalDamage *= critMultiplier;
                finalDamage *= miscDamageMultiplier;

                damage = Math.round(finalDamage);
                target.state.health -= damage;
            }
            
            analysisLog.push({ 
                timestamp: event.timestamp, 
                source: combatant.name, 
                action: actionName,
                target: target.name, 
                isCrit,
                damage, 
                snapshot: { combatant: deepCopy(combatant), target: deepCopy(target) } 
            });
        }
        return { rawLog, analysisLog };
    } catch (error) {
        console.error("[ENGINE] Simulation failed catastrophically:", error);
        throw error;
    }
};

