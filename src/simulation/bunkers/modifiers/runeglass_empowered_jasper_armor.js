/**
 * Runeglass of Empowered Jasper - Strike Ward (Armor)
 * +2% Arcane Damage
 */

const METADATA = {
  id: 'runeglass_empowered_jasper_armor',
  name: 'Empowered Jasper - Strike Ward (Armor)',
  description: 'Your Arcane attacks deal +2% damage.',
  type: 'MODIFIER_BUNKER',
  stroke: 1
};

function handler({ event }) {
  const damageType = event?.damageType;
  if (damageType === 'ARCANE') {
    return {
      modifyDamage: [
        {
          id: 'empowered_jasper_armor_arcane_boost',
          category: 'MISC_DAMAGE',
          value: 0.02,
          source: 'Empowered Jasper (Armor)'
        }
      ]
    };
  }
  return {};
}

export default { METADATA, handler };