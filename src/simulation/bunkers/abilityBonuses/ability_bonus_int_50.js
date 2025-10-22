/**
 * INT 50 Ability Bonus
 * Base damage +3% to targets affected by DoT
 */

const METADATA = {
  id: 'ability_bonus_int_50',
  name: 'INT 50 - Damage to DoT Targets',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'int',
  threshold: 50,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.INT || 0) < 50) return null;
  
  // Check it's a damage action
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  // Check if target has DoT effect
  const hasDoT = target?.activeEffects?.some(e => e.category === 'DOT');
  
  if (!hasDoT) return null;
  
  return {
    modifyDamage: [{
      category: 'MISC_DAMAGE',
      value: 0.03
    }]
  };
}

export default { METADATA, handler };
