/**
 * Anointed Lifesteal II
 * 5.5% increased healing from lifesteals.
 */

const METADATA = {
  id: 'perk_anointed_lifesteal_ii',
  name: 'Anointed Lifesteal II',
  description: '5.5% increased healing from lifesteals.',
  type: 'MODIFIER_BUNKER',
  stroke: 1,
  sourceType: 'perk',
  bucket: 'weapon'
};

/**
 * Anointed Lifesteal II boosts healing from lifesteal effects
 * Engine will apply this multiplier to lifesteal heals
 */
function handler({ event }) {
  // Passive modifier - always active
  return {
    modifyDamage: [
      {
        id: 'anointed_lifesteal_ii_boost',
        category: 'LIFESTEAL_EFFICIENCY',
        value: 0.055,  // +5.5% lifesteal healing
        source: 'Anointed Lifesteal II'
      }
    ]
  };
}

export default { METADATA, handler };
