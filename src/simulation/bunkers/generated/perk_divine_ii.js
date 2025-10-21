/**
 * Divine II
 * +5.5% Health from non-consumable or lifesteal healing sources.
 */

const METADATA = {
  id: 'perk_divine_ii',
  name: 'Divine II',
  description: '+5.5% Health from non-consumable or lifesteal healing sources.',
  type: 'MODIFIER_BUNKER',
  stroke: 1,
  sourceType: 'perk',
  bucket: 'weapon'
};

/**
 * Divine II boosts healing from non-lifesteal, non-consumable sources
 * Engine will apply this multiplier to eligible heals
 */
function handler({ event }) {
  // Passive modifier - always active
  return {
    modifyDamage: [
      {
        id: 'divine_ii_healing_boost',
        category: 'DIVINE_HEALING',
        value: 0.055,  // +5.5% healing
        source: 'Divine II'
      }
    ]
  };
}

export default { METADATA, handler };
