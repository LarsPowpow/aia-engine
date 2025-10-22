/**
 * FOC 200 Ability Bonus
 * Buff duration +10% (Empower, Fortify, Misc Damage)
 * HoT healing +10%
 */

const METADATA = {
  id: 'ability_bonus_foc_200',
  name: 'FOC 200 - Buff Duration & HoT Healing',
  type: 'ABILITY_BONUS_BUNKER',
  attribute: 'foc',
  threshold: 200,
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  // Check attribute threshold
  if ((source.attributes?.FOC || 0) < 200) return null;
  
  const modifiers = [];
  
  // For HOT ticks: boost healing by 10%
  if (event?.action === 'HOT_TICK') {
    modifiers.push({
      category: 'HEALING_EFFICIENCY',
      value: 0.10
    });
  }
  
  // For buff-creating events: extend duration
  const buffEvents = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT', 'BLOCK', 'BLOCK_HIT', 'BLOCK_START'];
  if (buffEvents.includes(event?.action)) {
    modifiers.push(
      {
        category: 'EMPOWER_DURATION',
        value: 0.10
      },
      {
        category: 'FORTIFY_DURATION',
        value: 0.10
      },
      {
        category: 'MISC_DAMAGE_DURATION',
        value: 0.10
      }
    );
  }
  
  return modifiers.length > 0 ? { modifyDamage: modifiers } : null;
}

export default { METADATA, handler };
