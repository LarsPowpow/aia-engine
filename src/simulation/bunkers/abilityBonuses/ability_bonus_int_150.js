/**
 * INT 150 Ability Bonus
 * Elemental damage +3% (Arcane)
 */

const METADATA = {
  id: 'ability_bonus_int_150',
  name: 'INT 150 - Arcane Damage',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'int',
  threshold: 150,
  stroke: 1
};

function handler({ event, source, target, context, timestamp, damageType }) {
  // Check attribute threshold
  if ((source.attributes?.INT || 0) < 150) return null;
  
  // Only apply to arcane damage
  if (damageType !== 'ARCANE') return null;
  
  // Check it's a damage action
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
