/**
 * INT 25 Ability Bonus
 * Crit damage +3%
 */

const METADATA = {
  id: 'ability_bonus_int_25',
  name: 'INT 25 - Crit Damage',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'int',
  threshold: 25,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.INT || 0) < 25) return null;
  
  // Apply to all damage actions
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  console.log(`[INT 25] ✅ Applying +3% crit damage`);
  
  return {
    modifyDamage: [{
      category: 'CRIT_DAMAGE',
      value: 0.03
    }]
  };
}

export default { METADATA, handler };
