/**
 * FOC 50 Ability Bonus
 * Incoming healing +5%
 */

const METADATA = {
  id: 'ability_bonus_foc_50',
  name: 'FOC 50 - Incoming Healing',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'foc',
  threshold: 50,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.FOC || 0) < 50) return null;
  
  // Apply to healing events (regular heals and HoT ticks)
  const healingEvents = ['BLOCK', 'ABILITY', 'ABILITY_HIT', 'HOT_TICK'];
  if (!healingEvents.includes(event?.action)) return null;
  
  return {
    modifyDamage: [{
      category: 'HEALING_EFFICIENCY',
      value: 0.05
    }]
  };
}

export default { METADATA, handler };
