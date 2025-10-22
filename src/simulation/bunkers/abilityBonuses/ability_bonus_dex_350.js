/**
 * DEX 350 Ability Bonus
 * Crit chance +10% while empowered
 */

const METADATA = {
  id: 'ability_bonus_dex_350',
  name: 'DEX 350 - Crit Chance While Empowered',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'dex',
  threshold: 350,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.DEX || 0) < 350) return null;
  
  // Apply to all damage actions
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  // Check if source has EMPOWER buff
  const hasEmpower = source?.activeEffects?.some(e => e.category === 'EMPOWER');
  
  if (!hasEmpower) return null;
  
  return {
    modifyDamage: [{
      category: 'CRIT_CHANCE',
      value: 0.10
    }]
  };
}

export default { METADATA, handler };
