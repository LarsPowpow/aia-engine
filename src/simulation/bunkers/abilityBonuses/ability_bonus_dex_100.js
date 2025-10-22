/**
 * DEX 100 Ability Bonus
 * Base damage +5%
 */

const METADATA = {
  id: 'ability_bonus_dex_100',
  name: 'DEX 100 - Base Damage',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'dex',
  threshold: 100,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.DEX || 0) < 100) return null;
  
  // Apply to all damage actions
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  return {
    modifyDamage: [{
      category: 'MISC_DAMAGE',
      value: 0.05
    }]
  };
}

export default { METADATA, handler };
