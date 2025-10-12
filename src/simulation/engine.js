
/**
 * AIA-Engine: Combat Simulation Core
 * Phase 3: The Gladiator - Tick-Based Simulation
 */

// v3.0: Evolved data structures for dynamic combat
const createCombatant = (id, name, health, base_damage, attack_speed) => ({
    id,
    name,
    health,
    maxHealth: health,
    base_damage,
    attack_speed, // in seconds
    next_action_tick: 0, // The tick on which this combatant can next act
});

// Simulation loop v2.0: Tick-based, two-actor combat
function runSimulation(combatant1_config, combatant2_config) {
    const log = [];
    let combatant1 = createCombatant(combatant1_config.id, combatant1_config.name, combatant1_config.health, combatant1_config.base_damage, combatant1_config.attack_speed);
    let combatant2 = createCombatant(combatant2_config.id, combatant2_config.name, combatant2_config.health, combatant2_config.base_damage, combatant2_config.attack_speed);
    
    let current_tick = 0;
    const TICK_INCREMENT = 0.1; // Represents 100ms
    const MAX_TICKS = 600; // 60 second timeout to prevent infinite loops

    log.push(`SIMULATION START: ${combatant1.name} vs ${combatant2.name}`);

    while (combatant1.health > 0 && combatant2.health > 0 && current_tick < MAX_TICKS) {
        
        // Combatant 1's turn
        if (current_tick >= combatant1.next_action_tick) {
            combatant2.health -= combatant1.base_damage;
            if (combatant2.health < 0) combatant2.health = 0;
            
            log.push(
                `[Tick ${current_tick.toFixed(1)}s] ${combatant1.name} attacks ${combatant2.name} for ${combatant1.base_damage} damage. (${combatant2.health}/${combatant2.maxHealth} HP)`
            );
            
            combatant1.next_action_tick = current_tick + combatant1.attack_speed;

            if (combatant2.health <= 0) {
                log.push(`${combatant2.name} has been defeated!`);
                break;
            }
        }

        // Combatant 2's turn
        if (current_tick >= combatant2.next_action_tick) {
            combatant1.health -= combatant2.base_damage;
            if (combatant1.health < 0) combatant1.health = 0;

            log.push(
                `[Tick ${current_tick.toFixed(1)}s] ${combatant2.name} attacks ${combatant1.name} for ${combatant2.base_damage} damage. (${combatant1.health}/${combatant1.maxHealth} HP)`
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
