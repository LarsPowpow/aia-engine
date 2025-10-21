/**
 * Runeglass of Punishing Sapphire (Weapon) - Punishing Empowered
 * Your melee attacks deal +2% damage
 */

const METADATA = {
  id: 'runeglass_punishing_sapphire_weapon_empowered',
  name: 'Runeglass of Punishing Sapphire (Weapon) - Punishing Empowered',
  description: 'Your melee attacks deal +2% damage',
  type: 'MODIFIER_BUNKER',
  stroke: 1 // Stroke 1: Modify damage calculation
};

function handler({ eventType, actionType, event }) {
  // Only apply to damage-dealing events
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) {
    return {};
  }

  return {
    modifyDamage: [
      {
        id: 'runeglass_punishing_empowered',
        category: 'MISC_DAMAGE',
        value: 0.02, // +2% damage
        source: 'Punishing Empowered'
      }
    ]
  };
}

export default { METADATA, handler };
