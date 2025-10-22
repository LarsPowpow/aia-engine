/**
 * Mastery: Leadership (Sword)
 * Always-on 10% Empower (only when Sword is active weapon)
 */

const METADATA = {
  id: 'mastery_sword_leadership',
  name: 'Leadership',
  type: 'MASTERY',
  weapon: 'Sword',
  stroke: 1  // Damage modifier
};

function handler({ event, source, target, timestamp }) {
  // Only active when wielding Sword
  if (source.weaponType !== 'Sword') return null;
  
  // Passive modifier - always active
  return {
    modifyDamage: [{
      id: 'mastery_sword_leadership_empower',
      category: 'EMPOWER',
      value: 0.10,  // +10% damage
      source: 'Leadership'
    }]
  };
}

export default { METADATA, handler };
