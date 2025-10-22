/**
 * Mastery: Counter Attack (Sword)
 * On Block: Gain 3% Empower for 5s. Stacks 5 times.
 */

const METADATA = {
  id: 'mastery_sword_counter_attack',
  name: 'Counter Attack',
  type: 'MASTERY',
  weapon: 'Sword',
  stroke: 2
};

function handler({ event, source, target, timestamp }) {
  // Only trigger on BLOCK_START
  if (event?.action !== 'BLOCK_START') return null;
  
  // Only active when wielding Sword
  if (source.weaponType !== 'Sword') return null;
  
  // Apply stackable Empower buff
  return {
    applyEffects: [{
      id: 'mastery_sword_counter_attack_empower',
      category: 'EMPOWER',
      sourceId: source.id,
      targetId: source.id,
      value: 0.03,  // 3% per stack
      duration: 5,
      stackable: true,
      maxStacks: 5,
      appliedAt: timestamp,
      expiresAt: timestamp + 5,
      metadata: {
        sourceName: 'Counter Attack'
      }
    }]
  };
}

export default { METADATA, handler };
