/**
 * INT 350 Ability Bonus
 * Ability damage +3%
 */

const METADATA = {
  id: 'ability_bonus_int_350',
  name: 'INT 350 - Ability Damage',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'int',
  threshold: 350,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.INT || 0) < 350) return null;
  
  // Check if it's an ability
  const isAbility = ['ABILITY', 'ABILITY_HIT'].includes(event?.action);
  
  if (!isAbility) return null;
  
  return {
    modifyDamage: [{
      category: 'MISC_DAMAGE',
      value: 0.03
    }]
  };
}

export default { METADATA, handler };
