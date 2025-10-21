/**
 * End II
 * +6% ability base damage and +12% base damage increase to the final attack in a melee light attack chain.
 */

const METADATA = {
  id: 'perk_end_ii',
  name: 'End II',
  description: '+6% ability base damage and +12% base damage increase to the final attack in a melee light attack chain.',
  type: 'MODIFIER_BUNKER',
  stroke: 1,
  sourceType: 'perk',
  bucket: 'weapon'
};

/**
 * End II provides conditional damage boosts:
 * - +6% to all abilities
 * - +12% to chain-finishing light attacks
 */
function handler({ event }) {
  // Check if this is an ability (not LA/HA)
  const isAbility = event.action !== 'LIGHT_ATTACK' && event.action !== 'HEAVY_ATTACK';
  
  // Determine damage boost
  let damageBoost = 0;
  
  if (isAbility) {
    // +6% to all abilities
    damageBoost = 0.06;
  } else if (event.action === 'LIGHT_ATTACK' && event.isChainFinisher) {
    // +12% to chain-finishing light attacks
    damageBoost = 0.12;
  }
  
  // Only return modifier if applicable
  if (damageBoost === 0) {
    return {};
  }
  
  return {
    modifyDamage: [
      {
        id: 'end_ii_damage_boost',
        category: 'MISC_DAMAGE',
        value: damageBoost,
        source: 'End II'
      }
    ]
  };
}

export default { METADATA, handler };
