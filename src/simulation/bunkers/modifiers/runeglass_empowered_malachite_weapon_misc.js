/**
 * Runeglass of Empowered Malachite (Weapon) - Empowered Spectral Ward
 * +2% Arcane Damage
 */

const METADATA = {
  id: 'runeglass_empowered_malachite_weapon_misc',
  name: 'Runeglass of Empowered Malachite (Weapon - Spectral Ward)',
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
          id: 'empowered_spectral_arcane_boost_weapon',
          category: 'MISC_DAMAGE',
          value: 0.02,
          source: 'Empowered Spectral Ward (Weapon)'
        }
      ]
    };
  }

  return {};
}

export default { METADATA, handler };
