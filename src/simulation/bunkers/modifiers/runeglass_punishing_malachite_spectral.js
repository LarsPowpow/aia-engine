/**
 * Runeglass of Punishing Malachite - Punishing Spectral Ward (Weapon)
 * +2% damage on all attacks
 */

const METADATA = {
  id: 'runeglass_punishing_malachite_weapon_misc',
  name: 'Punishing Spectral Ward (Malachite Weapon)',
  description: 'Your melee attacks deal +2% damage.',
  type: 'MODIFIER_BUNKER',
  stroke: 1
};

function handler({ event, action }) {
  // Skip non-damage actions
  const NON_DAMAGE_ACTIONS = ['WEAPON_SWAP', 'BLOCK_START', 'BLOCK_END'];
  const isBlockAction = action?.includes('Block') || action?.includes('BLOCK');
  
  if (NON_DAMAGE_ACTIONS.includes(action) || isBlockAction) {
    return {};
  }

  // Apply +2% damage to all attacks
  return {
    modifyDamage: [
      {
        id: 'punishing_spectral_weapon_damage',
        category: 'MISC_DAMAGE',
        value: 0.02,
        source: 'Punishing Spectral Ward (Weapon)'
      }
    ]
  };
}

export default { METADATA, handler };
