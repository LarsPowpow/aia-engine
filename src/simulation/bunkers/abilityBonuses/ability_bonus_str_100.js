/**
 * STR 100 Ability Bonus
 * Physical damage +5%
 */

const METADATA = {
  id: 'ability_bonus_str_100',
  name: 'STR 100 - Physical Damage',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'str',
  threshold: 100,
  stroke: 1
};

function handler({ event, source, target, context, timestamp, damageType }) {
  // Check attribute threshold
  if ((source.attributes?.STR || 0) < 100) return null;
  
  console.log(`[STR 100] event.action: ${event?.action}, damageType param: ${damageType}, event.damageType: ${event?.damageType}`);
  
  // Only apply to physical damage (damageType will be either PHYSICAL or ARCANE)
  if (damageType !== 'PHYSICAL') return null;
  
  console.log(`[STR 100] ✅ Applying +5% physical damage`);
  
  // Check it's a damage action
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  return {
    modifyDamage: [{
      category: 'MISC_DAMAGE',
      value: 0.05
    }]
  };
}

export default { METADATA, handler };
