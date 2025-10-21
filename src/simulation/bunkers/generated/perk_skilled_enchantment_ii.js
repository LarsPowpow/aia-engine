/**
 * Skilled Enchantment II
 * Abilities deal +1.5% damage.
 */

const METADATA = {
  id: 'perk_skilled_enchantment_ii',
  name: 'Skilled Enchantment II',
  description: 'Abilities deal +1.5% damage.',
  type: 'MODIFIER_BUNKER',
  stroke: 1,
  sourceType: 'perk',
  bucket: 'weapon'
};

/**
 * Skilled Enchantment II provides a damage boost to abilities only
 * (excludes LIGHT_ATTACK and HEAVY_ATTACK)
 */
function handler({ event }) {
  // Only boost abilities, not basic attacks
  if (event.action === 'LIGHT_ATTACK' || event.action === 'HEAVY_ATTACK') {
    return {};
  }

  return {
    modifyDamage: [
      {
        id: 'skilled_enchantment_ii_boost',
        category: 'MISC_DAMAGE',
        value: 0.015,  // +1.5% damage
        source: 'Skilled Enchantment II'
      }
    ]
  };
}

export default { METADATA, handler };
