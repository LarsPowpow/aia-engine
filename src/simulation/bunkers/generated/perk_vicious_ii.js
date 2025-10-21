/**
 * Vicious II
 * +3% critical damage.
 */

const METADATA = {
  id: 'perk_vicious_ii',
  name: 'Vicious II',
  description: '+3% critical damage.',
  type: 'MODIFIER_BUNKER',
  stroke: 1,
  sourceType: 'perk',
  bucket: 'weapon'
};

/**
 * Vicious II provides a passive crit damage modifier
 * Engine will add this to the weapon's base crit multiplier
 */
function handler({ event }) {
  // Passive modifier - always active
  return {
    modifyDamage: [
      {
        id: 'vicious_ii_crit_damage_boost',
        category: 'CRIT_DAMAGE',
        value: 0.03,  // +3% crit damage (additive to multiplier)
        source: 'Vicious II'
      }
    ]
  };
}

export default { METADATA, handler };
