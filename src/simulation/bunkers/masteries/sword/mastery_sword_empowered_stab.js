/**
 * Mastery: Empowered Stab (Sword)
 * Heavy Attack grants 30% Empower for 5s
 */

const METADATA = {
  id: 'mastery_sword_empowered_stab',
  name: 'Empowered Stab',
  type: 'MASTERY',
  weapon: 'Sword',
  stroke: 2
};

function handler({ event, source, target, timestamp }) {
  // Only trigger on Heavy Attacks
  if (event?.action !== 'HEAVY_ATTACK') return null;
  
  // Only active when wielding Sword
  if (source.weaponType !== 'Sword') return null;
  
  return {
    applyEffects: [{
      id: 'mastery_sword_empowered_stab_empower',
      category: 'EMPOWER',
      value: 0.30,  // 30% Empower
      duration: 5,
      sourceId: 'mastery_sword_empowered_stab',
      targetId: source.id,  // Self-buff
      metadata: {
        sourceName: 'Empowered Stab'
      }
    }]
  };
}

export default { METADATA, handler };
