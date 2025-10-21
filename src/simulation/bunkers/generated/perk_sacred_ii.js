/**
 * Sacred II
 * +6.5% outgoing healing efficiency.
 */

const METADATA = {
  id: 'perk_sacred_ii',
  name: 'Sacred II',
  description: '+6.5% outgoing healing efficiency.',
  type: 'MODIFIER_BUNKER',
  stroke: 1,
  sourceType: 'perk',
  bucket: 'weapon'
};

/**
 * Sacred II provides a passive healing efficiency modifier
 * Engine will apply this to all outgoing healing effects
 */
function handler({ event }) {
  // Passive modifier - always active
  return {
    modifyDamage: [
      {
        id: 'sacred_ii_healing_boost',
        category: 'HEALING_EFFICIENCY',
        value: 0.065,  // +6.5% healing
        source: 'Sacred II'
      }
    ]
  };
}

export default { METADATA, handler };
