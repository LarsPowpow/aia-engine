/**
 * INT 200 Ability Bonus
 * DoT damage +5%
 */

const METADATA = {
  id: 'ability_bonus_int_200',
  name: 'INT 200 - DoT Damage',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'int',
  threshold: 200,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.INT || 0) < 200) return null;
  
  // Only apply to DoT ticks
  if (event?.action !== 'DOT_TICK') return null;
  
  return {
    modifyDamage: [{
      category: 'MISC_DAMAGE',
      value: 0.05
    }]
  };
}

export default { METADATA, handler };
