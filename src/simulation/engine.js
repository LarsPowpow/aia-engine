
/**
 * AIA-Engine: Combat Simulation Core
 * Phase 3: The Gladiator - Tick-Based Simulation
 */

import { calculateWeaponDamage } from './formulas.js';

const createCombatant = (config) => ({
    id: config.id,
    name: config.name,
    health: config.health,
    maxHealth: config.health,
    weaponType: config.weaponType,
    attack_speed: config.attack_speed,
    attributes: { ...config.attributes },
    perks: config.perks ? [...config.perks] : [],
    next_action_tick: 0,
});

// Simulation loop v2.1: Tick-based, two-actor combat with weapon scaling
function runSimulation(combatant1_config, combatant2_config) {
    const log = [];
    let combatant1 = createCombatant(combatant1_config);
    let combatant2 = createCombatant(combatant2_config);
    let current_tick = 0;
    const TICK_INCREMENT = 0.1;
    const MAX_TICKS = 600;

    // Calculate scaled damage for each combatant
    const scaledDamage1 = calculateWeaponDamage(combatant1.weaponType, combatant1.attributes);
    const scaledDamage2 = calculateWeaponDamage(combatant2.weaponType, combatant2.attributes);

    log.push(`SIMULATION START: ${combatant1.name} vs ${combatant2.name}`);

    while (combatant1.health > 0 && combatant2.health > 0 && current_tick < MAX_TICKS) {
        if (current_tick >= combatant1.next_action_tick) {
            const damageDealt = scaledDamage1;
            combatant2.health -= damageDealt;
            if (combatant2.health < 0) combatant2.health = 0;
            log.push(
                `[Tick ${current_tick.toFixed(1)}s] ${combatant1.name} attacks ${combatant2.name} for ${damageDealt.toFixed(2)} damage. (${combatant2.health.toFixed(2)}/${combatant2.maxHealth} HP)`
            );
            combatant1.next_action_tick = current_tick + combatant1.attack_speed;
            if (combatant2.health <= 0) {
                log.push(`${combatant2.name} has been defeated!`);
                break;
            }
        }
        if (current_tick >= combatant2.next_action_tick) {
            const damageDealt = scaledDamage2;
            combatant1.health -= damageDealt;
            if (combatant1.health < 0) combatant1.health = 0;
            log.push(
                `[Tick ${current_tick.toFixed(1)}s] ${combatant2.name} attacks ${combatant1.name} for ${damageDealt.toFixed(2)} damage. (${combatant1.health.toFixed(2)}/${combatant1.maxHealth} HP)`
            );
            combatant2.next_action_tick = current_tick + combatant2.attack_speed;
            if (combatant1.health <= 0) {
                log.push(`${combatant1.name} has been defeated!`);
                break;
            }
        }
        current_tick += TICK_INCREMENT;
    }
    if (current_tick >= MAX_TICKS) {
        log.push('SIMULATION TIMEOUT: Battle exceeded 60 seconds.');
    }
    log.push('SIMULATION END.');
    return log;
}

// UKB Loader (remains the same)
async function loadUKBDocument(firestore, collectionName, docId) {
    if (!firestore) throw new Error('Firestore instance required');
    const { getDoc, doc } = await import('firebase/firestore');
    const ref = doc(firestore, collectionName, docId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error(`Document ${docId} not found in ${collectionName}`);
    return { id: snapshot.id, ...snapshot.data() };
}

export { runSimulation, loadUKBDocument };
