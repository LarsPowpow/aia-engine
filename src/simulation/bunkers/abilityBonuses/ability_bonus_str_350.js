/**
 * STR 350 Ability Bonus
 * Ability damage +5%
 * Finisher Light Attack +5%
 */

const METADATA = {
  id: 'ability_bonus_str_350',
  name: 'STR 350 - Ability & Finisher Damage',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'str',
  threshold: 350,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.STR || 0) < 350) return null;
  
  // Check if it's an ability
  const isAbility = ['ABILITY', 'ABILITY_HIT'].includes(event?.action);
  
  // Check if it's a finisher light attack
  const isFinisher = event?.action === 'LIGHT_ATTACK' && event?.isChainFinisher === true;
  
  if (!isAbility && !isFinisher) return null;
  
  return {
    modifyDamage: [{
      category: 'MISC_DAMAGE',
      value: 0.05
    }]
  };
}

export default { METADATA, handler };
