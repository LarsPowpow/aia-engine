/**
 * Runeglass of Empowered Sapphire (Armor)
 * +2% Arcane Damage
 */

const METADATA = {
  id: 'runeglass_empowered_sapphire_armor',
  name: 'Runeglass of Empowered Sapphire (Armor)',
  description: '+2% Arcane Damage',
  type: 'MODIFIER_BUNKER',
  stroke: 1 // Stroke 1: Modify damage calculation
};

function handler({ event, eventType }) {
  // Check if this is arcane damage (from context)
  const damageType = event?.damageType;
  
  // Only boost arcane damage
  if (damageType === 'ARCANE') {
    return {
      modifyDamage: [
        {
          id: 'runeglass_sapphire_armor_boost',
          category: 'MISC_DAMAGE',
          value: 0.02, // +2% damage
          source: 'Runeglass of Empowered Sapphire (Armor)'
        }
      ]
    };
  }

  return {};
}

export default { METADATA, handler };
