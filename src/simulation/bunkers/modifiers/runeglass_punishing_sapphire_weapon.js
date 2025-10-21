/**
 * Runeglass of Punishing Sapphire (Weapon)
 * Convert 50% of damage dealt to Arcane
 */

const METADATA = {
  id: 'runeglass_punishing_sapphire_weapon',
  name: 'Runeglass of Punishing Sapphire (Weapon)',
  description: 'Convert 50% of damage dealt to Arcane',
  type: 'MODIFIER_BUNKER',
  stroke: 1 // Stroke 1: Modify damage calculation
};

function handler({ eventType, actionType, event }) {
  // Only apply to damage-dealing events
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) {
    return {};
  }

  console.log('[Runeglass Punishing Sapphire] 💎 Converting 50% damage to arcane');

  // Request damage conversion: 50% physical → arcane
  return {
    convertDamage: {
      from: 'PHYSICAL',
      to: 'ARCANE',
      percent: 0.50
    }
  };
}

export default { METADATA, handler };
