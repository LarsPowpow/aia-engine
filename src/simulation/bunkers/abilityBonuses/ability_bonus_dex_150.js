/**
 * DEX 150 Ability Bonus
 * DoT damage +5%
 */

const METADATA = {
  id: 'ability_bonus_dex_150',
  name: 'DEX 150 - DoT Damage',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'dex',
  threshold: 150,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.DEX || 0) < 150) return null;
  
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
