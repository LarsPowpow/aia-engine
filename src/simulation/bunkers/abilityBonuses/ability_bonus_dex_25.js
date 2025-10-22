/**
 * DEX 25 Ability Bonus
 * Crit chance +5%
 */

const METADATA = {
  id: 'ability_bonus_dex_25',
  name: 'DEX 25 - Crit Chance',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'dex',
  threshold: 25,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.DEX || 0) < 25) return null;
  
  // Apply to all damage actions
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  return {
    modifyDamage: [{
      category: 'CRIT_CHANCE',
      value: 0.05
    }]
  };
}

export default { METADATA, handler };
