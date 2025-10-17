/**
 * @file engine.js
 * @description The primary simulation engine.
 * @version 3.7 - High-Precision Diagnostics Installed
 */

// --- INTERNAL MODULES ---
import { calculateWeaponDamage } from './formulas.js';
import { initializeCombatant } from './combatant.js';
import { assembleContext } from './contextAssembler.js';
import { bunkerHandlers } from './bunkers/bunkerManifest.js';

// --- UTILITY FUNCTIONS ---
const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

// --- ENGINE-SIDE STAT AGGREGATOR ---
const aggregateStats = (combatant) => {
    // Strict: require a valid combatant and an activeEffects array.
    if (!combatant) {
        throw new Error('[aggregateStats] combatant is required');
    }
    if (!Array.isArray(combatant.activeEffects)) {
        throw new Error('[aggregateStats] combatant.activeEffects must be an array');
    }

    const newStats = {
        empower: 0, rend: 0, fortify: 0, weaken: 0, miscDmg: 0,
        critChance: 0.05, critDamage: 20,
    };

    for (const effect of combatant.activeEffects) {
        if (!effect.modifications || effect.modifications.length === 0) continue;
        for (const mod of effect.modifications) {
            const value = parseFloat(mod.valueFormula) || 0;
            switch (mod.damageBucket) {
                case 'Empower': newStats.empower += value; break;
                case 'Rend': newStats.rend += value; break;
                case 'miscDmg': newStats.miscDmg += value; break;
            }
        }
    }
    newStats.empower = Math.min(newStats.empower, 50);
    newStats.rend = Math.min(newStats.rend, 70);
    combatant.stats = newStats;
};

/**
 * The main simulation runner.
 */
export const runSimulation = async (combatantConfig, targetConfig, choreography, allSources) => {
    const rawLog = [];
    const analysisLog = [];
    let timeline = 0.0;
    
    try {
        // --- HIGH-PRECISION DIAGNOSTIC ---
        console.log('--- ENGINE PROBE: State of combatantConfig PRE-INITIALIZATION ---');
        console.log(JSON.stringify(combatantConfig, null, 2));

        // initializeCombatant is strict and will throw on bad input
        const combatant = initializeCombatant(combatantConfig);
        const target = initializeCombatant(targetConfig);

        // Sanity checks (fail fast; no silent defaults).
        if (!combatant || !target) {
            throw new Error('[runSimulation] initializeCombatant returned invalid value for combatant or target');
        }
        if (!Array.isArray(combatant.activeEffects) || !Array.isArray(target.activeEffects)) {
            throw new Error('[runSimulation] activeEffects must be arrays for both combatant and target');
        }

        for (const event of choreography) {
            timeline = event.timestamp;

            // activeEffects are guaranteed arrays due to earlier validation
            combatant.activeEffects = combatant.activeEffects.filter(e => !e.expiresAt || e.expiresAt > timeline);
            target.activeEffects = target.activeEffects.filter(e => !e.expiresAt || e.expiresAt > timeline);
            
            const context = assembleContext(event, combatant, target);

            // add quick diagnostics
            console.log('[ENGINE DEBUG]', {
              ts: event.timestamp, eventType: context.eventType, abilityId: context.abilityId ?? context.event?.abilityId,
              weaponType: context.source?.weaponType, masteries: context.source?.masteries
            });

            // --- NEW: Engine derives attack details locally from the minimalist context ---
            const attackDetails = (() => {
                // weapon classification
                const weapon = (context.source?.weaponType || context.combatant?.weaponType || '').toString();
                const meleeWeapons = ['Sword', 'Flail', 'Mace', 'Dagger', 'Axe'];
                const rangedWeapons = ['Bow', 'Crossbow', 'Gun'];

                const isMelee = meleeWeapons.includes(weapon);
                const isRanged = rangedWeapons.includes(weapon) || (!isMelee && !!weapon);

                // canonical ability id lookup (support legacy shapes)
                const abilityId = context.abilityId ?? context.ability?.id ?? context.event?.abilityId ?? null;

                // an initial baseDamageMultiplier coming from event/ability if present;
                // bunkers may override via return channel (merged later)
                const baseDamageMultiplier = Number(context.ability?.baseDamageMultiplier ?? context.event?.baseDamageMultiplier ?? 1.0);

                return { isMelee, isRanged, abilityId, baseDamageMultiplier };
            })();

            // --- NEW: Dispatch bunkers and collect an explicit return channel ---
            const bunkerModifications = {};
            for (const handler of bunkerHandlers) {
                try {
                    const result = handler(context);
                    if (result && typeof result === 'object') {
                        Object.assign(bunkerModifications, result);
                    }
                } catch (err) {
                    // Log but do NOT rethrow — a single buggy bunker should not abort the whole simulation
                    console.error('[ENGINE] bunker handler failed:', handler?.name || '<anonymous>', err);
                    // continue to next handler without throwing
                }
            }

            aggregateStats(combatant);
            aggregateStats(target);
            
            let damage = 0;
            let isCrit = false;
            
            if ((context.eventType || '').includes('ATTACK') || (context.eventType || '').includes('ABILITY_HIT')) {
                // crit uses combatant.stats (aggregateStats guaranteed it exists) — attackDetails may be used later for special crit rules
                isCrit = !!event.forceCrit || (Math.random() <= (combatant.stats.critChance || 0.05));

                const weaponDamage = calculateWeaponDamage(combatant.weaponType, combatant.attributes);

                // Resolve baseDamageMultiplier: bunker modifications take precedence, then attackDetails, then 1.0
                const resolvedBaseMultiplier = Number(
                    bunkerModifications.baseDamageMultiplier ??
                    attackDetails.baseDamageMultiplier ??
                    1.0
                );
                const baseDamage = Math.round(weaponDamage * (resolvedBaseMultiplier || 1.0));
                
                let finalDamage = baseDamage;
                
                const empowerRendMultiplier = 1 + (combatant.stats.empower / 100) - (target.stats.fortify / 100);
                const rendMultiplier = 1 + (target.stats.rend / 100);
                const critMultiplier = isCrit ? (1 + combatant.stats.critDamage / 100) : 1;
                const miscDamageMultiplier = 1 + (combatant.stats.miscDmg / 100);

                finalDamage *= empowerRendMultiplier;
                finalDamage *= rendMultiplier;
                finalDamage *= critMultiplier;
                finalDamage *= miscDamageMultiplier;

                damage = Math.round(finalDamage);
            }
            
            analysisLog.push({ 
                timestamp: event.timestamp, 
                source: 'Player', 
                action: event.action, 
                target: 'Target Dummy', 
                isCrit,
                damage, 
                healingDone: 0,
                snapshot: { combatant: deepCopy(combatant), target: deepCopy(target) } 
            });
        }
        return { rawLog, analysisLog };
    } catch (error) {
        // Fail loudly so callers/ UI see the real error (per strict/fail-fast constraint).
        console.error("[ENGINE] Simulation failed catastrophically:", error);
        throw error;
    }
};

