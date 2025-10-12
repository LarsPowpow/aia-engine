// Phase 1: The Proving Ground - Core Combat Engine

// Core data structures
const Combatant = {
  id: 'player',
  health: 1000,
  base_damage: 50,
};

const Target = {
  id: 'dummy',
  health: 5000,
};

// Simulation loop
function runSimulation(combatant, target) {
  const log = [];
  let round = 1;
  let targetHealth = target.health;
  while (targetHealth > 0) {
    targetHealth -= combatant.base_damage;
    if (targetHealth < 0) targetHealth = 0;
    log.push(
      `${combatant.id} attacks ${target.id} for ${combatant.base_damage} damage. (${targetHealth}/${target.health} HP remaining)`
    );
    round++;
  }
  return log;
}

// Export for use in App.jsx
// UKB Loader: Fetch a specific document from a Firestore collection
// Usage: await loadUKBDocument(firestore, 'effects', 'effect_id')
async function loadUKBDocument(firestore, collectionName, docId) {
  if (!firestore) throw new Error('Firestore instance required');
  const { getDoc, doc } = await import('firebase/firestore');
  const ref = doc(firestore, collectionName, docId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error(`Document ${docId} not found in ${collectionName}`);
  return { id: snapshot.id, ...snapshot.data() };
}

export { Combatant, Target, runSimulation, loadUKBDocument };
