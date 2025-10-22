/**
 * STR 300 Ability Bonus
 * Base damage +3%
 */

const METADATA = {
  id: 'ability_bonus_str_300',
  name: 'STR 300 - Base Damage',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'str',
  threshold: 300,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.STR || 0) < 300) return null;
  
  // Apply to all damage actions
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  return {
    modifyDamage: [{
      category: 'MISC_DAMAGE',
      value: 0.03
    }]
  };
}

export default { METADATA, handler };
