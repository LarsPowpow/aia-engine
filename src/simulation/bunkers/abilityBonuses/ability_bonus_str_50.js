/**
 * STR 50 Ability Bonus
 * Heavy Attack damage +5%
 */

const METADATA = {
  id: 'ability_bonus_str_50',
  name: 'STR 50 - Heavy Attack Damage',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'str',
  threshold: 50,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.STR || 0) < 50) return null;
  
  // Check action type
  if (event?.action !== 'HEAVY_ATTACK') return null;
  
  return {
    modifyDamage: [{
      category: 'MISC_DAMAGE',
      value: 0.05
    }]
  };
}

export default { METADATA, handler };
