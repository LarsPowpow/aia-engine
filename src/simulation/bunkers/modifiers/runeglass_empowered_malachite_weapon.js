/**
 * Runeglass of Empowered Malachite (Weapon) - Empowered Cruel
 * +14% damage against targets affected by Crowd Control effects
 */

const METADATA = {
  id: 'runeglass_empowered_malachite_weapon',
  name: 'Runeglass of Empowered Malachite (Weapon)',
  description: '+14% damage against targets affected by Crowd Control effects.',
  type: 'MODIFIER_BUNKER',
  stroke: 1
};

function handler({ target, event }) {
  // Skip non-damage actions
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) {
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

  console.log('[Runeglass Empowered Malachite] 💎 +14% damage vs CC target');

  return {
    modifyDamage: [
      {
        id: 'empowered_cruel_cc_bonus',
        category: 'MISC_DAMAGE',
        value: 0.14,
        source: 'Empowered Cruel'
      }
    ]
  };
}

export default { METADATA, handler };
