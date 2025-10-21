/**
 * Runeglass of Empowered Sapphire (Weapon) - Damage Conversion
 * Converts 50% of physical damage to arcane
 */

const METADATA = {
  id: 'runeglass_empowered_sapphire_weapon',
  name: 'Runeglass of Empowered Sapphire (Weapon)',
  description: '50% of damage dealt is converted to Arcane.',
  type: 'MODIFIER_BUNKER',
  stroke: 1 // Stroke 1: Damage conversion
};

function handler({ eventType, actionType, event }) {
  // Only apply to damage-dealing events (not DOT_TICK, BLOCK, etc.)
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) {
    return {};
  }

  console.log('[Runeglass Empowered Sapphire] 💎 Converting 50% damage to arcane');

  // Return conversion instruction for engine
  return {
    convertDamage: {
      from: 'physical',
      to: 'arcane',
      percent: 0.50 // 50% conversion
    }
  };
}

export default { METADATA, handler };
