/**
 * STR 200 Ability Bonus
 * Damage to slow/stun/rooted targets +5%
 */

const METADATA = {
  id: 'ability_bonus_str_200',
  name: 'STR 200 - Damage to CC Targets',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'str',
  threshold: 200,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.STR || 0) < 200) return null;
  
  // Check it's a damage action
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  // Check if target has crowd control effects
  const hasCC = target?.activeEffects?.some(e => 
    ['SLOW', 'STUN', 'ROOT'].includes(e.category)
  );
  
  if (!hasCC) return null;
  
  return {
    modifyDamage: [{
      category: 'MISC_DAMAGE',
      value: 0.05
    }]
  };
}

export default { METADATA, handler };
