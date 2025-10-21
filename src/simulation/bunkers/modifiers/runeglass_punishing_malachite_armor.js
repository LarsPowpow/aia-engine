/**
 * Runeglass of Punishing Malachite - Punishing Spectral Ward (Armor)
 * +1% damage on all attacks
 */

const METADATA = {
  id: 'runeglass_punishing_malachite_armor_misc',
  name: 'Punishing Spectral Ward (Malachite Armor)',
  description: 'Your melee attacks deal +1% damage.',
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

  // Apply +1% damage to all attacks
  return {
    modifyDamage: [
      {
        id: 'punishing_spectral_armor_damage',
        category: 'MISC_DAMAGE',
        value: 0.01,
        source: 'Punishing Spectral Ward (Armor)'
      }
    ]
  };
}

export default { METADATA, handler };
