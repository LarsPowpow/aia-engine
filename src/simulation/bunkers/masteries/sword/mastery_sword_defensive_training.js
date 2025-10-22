/**
 * Mastery: Defensive Training (Sword)
 * On Block: 20% Fortify for 5s
 */

const METADATA = {
  id: 'mastery_sword_defensive_training',
  name: 'Defensive Training',
  type: 'MASTERY',
  weapon: 'Sword',
  stroke: 2
};

function handler({ event, source, target, timestamp }) {
  // Only trigger on BLOCK_START
  if (event?.action !== 'BLOCK_START') return null;
  
  // Only active when wielding Sword
  if (source.weaponType !== 'Sword') return null;
  
  // Apply Fortify buff
  return {
    applyEffects: [{
      id: 'mastery_sword_defensive_training_fortify',
      category: 'FORTIFY',
      sourceId: 'mastery_sword_defensive_training', // Changed from source.id to mastery ID
      targetId: source.id,  // Self-buff
      value: 0.20,  // 20% Fortify
      duration: 5,
      appliedAt: timestamp,
      expiresAt: timestamp + 5,
      metadata: {
        sourceName: 'Defensive Training'
      }
    }]
  };
}

export default { METADATA, handler };
