/**
 * Enchanted II
 * Light and Heavy attacks deal +2.3% damage.
 */

const METADATA = {
  id: 'perk_enchanted_ii',
  name: 'Enchanted II',
  description: 'Light and Heavy attacks deal +2.3% damage.',
  type: 'MODIFIER_BUNKER',
  stroke: 1,
  sourceType: 'perk',
  bucket: 'weapon'
};

function handler({ event }) {
  // Only trigger on light and heavy attacks
  const validActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK'];
  if (!validActions.includes(event?.action)) return {};

  return {
    modifyDamage: [
      {
        id: 'enchanted_ii_damage_boost',
        category: 'MISC_DAMAGE',
        value: 0.023,  // +2.3%
        source: 'Enchanted II'
      }
    ]
  };
}

export default { METADATA, handler };
