/**
 * Runeglass of Punishing Malachite - Punishing Cruel
 * +14% damage against targets affected by Crowd Control effects
 */

const METADATA = {
  id: 'runeglass_punishing_malachite_cruel',
  name: 'Punishing Cruel (Malachite)',
  description: '+14% damage against targets affected by Crowd Control effects.',
  type: 'MODIFIER_BUNKER',
  stroke: 1
};

function handler({ target, event, action }) {
  // Skip non-damage actions
  const NON_DAMAGE_ACTIONS = ['WEAPON_SWAP', 'BLOCK_START', 'BLOCK_END'];
  const isBlockAction = action?.includes('Block') || action?.includes('BLOCK');
  
  if (NON_DAMAGE_ACTIONS.includes(action) || isBlockAction) {
    return {};
  }

  // Check if target has any CC effects (SLOW, STUN, ROOT)
  const ccCategories = ['SLOW', 'STUN', 'ROOT'];
  const hasCC = target?.activeEffects?.some(effect => 
    ccCategories.includes(effect.category)
  );

  if (!hasCC) {
    return {};
  }

  // Apply +14% damage
  return {
    modifyDamage: [
      {
        id: 'punishing_cruel_cc_bonus',
        category: 'MISC_DAMAGE',
        value: 0.14,
        source: 'Punishing Cruel'
      }
    ]
  };
}

export default { METADATA, handler };
