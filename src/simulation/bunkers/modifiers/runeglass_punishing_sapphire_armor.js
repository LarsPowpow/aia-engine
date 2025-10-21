/**
 * Runeglass of Punishing Sapphire (Armor) - Punishing Arcane Ward
 * Your melee attacks deal +1% damage
 */

const METADATA = {
  id: 'runeglass_punishing_sapphire_armor',
  name: 'Runeglass of Punishing Sapphire (Armor) - Punishing Arcane Ward',
  description: 'Your melee attacks deal +1% damage',
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
        id: 'runeglass_punishing_arcane_ward',
        category: 'MISC_DAMAGE',
        value: 0.01, // +1% damage
        source: 'Punishing Arcane Ward'
      }
    ]
  };
}

export default { METADATA, handler };
