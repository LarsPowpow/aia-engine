/**
 * STR 25 Ability Bonus
 * Light Attack damage +3%
 */

const METADATA = {
  id: 'ability_bonus_str_25',
  name: 'STR 25 - Light Attack Damage',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'str',
  threshold: 25,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.STR || 0) < 25) return null;
  
  // Check action type
  if (event?.action !== 'LIGHT_ATTACK') return null;
  
  return {
    modifyDamage: [{
      category: 'MISC_DAMAGE',
      value: 0.03
    }]
  };
}

export default { METADATA, handler };
