/**
 * Runeglass of Empowered Malachite (Armor) - Empowered Spectral Ward
 * +2% Arcane Damage
 */

const METADATA = {
  id: 'runeglass_empowered_malachite_armor',
  name: 'Runeglass of Empowered Malachite (Armor - Spectral Ward)',
  description: 'Your Arcane attacks deal +2% damage.',
  type: 'MODIFIER_BUNKER',
  stroke: 1
};

function handler({ event }) {
  // Check if this is arcane damage
  const damageType = event?.damageType;
  
  // Only boost arcane damage
  if (damageType === 'ARCANE') {
    return {
      modifyDamage: [
        {
          id: 'empowered_spectral_arcane_boost_armor',
          category: 'MISC_DAMAGE',
          value: 0.02,
          source: 'Empowered Spectral Ward (Armor)'
        }
      ]
    };
  }

  return {};
}

export default { METADATA, handler };
