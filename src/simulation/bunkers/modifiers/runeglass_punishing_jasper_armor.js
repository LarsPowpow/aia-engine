/**
 * Runeglass of Punishing Jasper (Armor) - Punishing Strike Ward
 * +1% flat damage
 */

const METADATA = {
  id: 'runeglass_punishing_jasper_armor',
  name: 'Punishing Jasper (Armor - Strike Ward)',
  description: 'Your melee attacks deal +1% damage.',
  type: 'MODIFIER_BUNKER',
  stroke: 1
};

function handler({ event }) {
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return {};

  return {
    modifyDamage: [
      {
        id: 'punishing_jasper_armor_boost',
        category: 'MISC_DAMAGE',
        value: 0.01,
        source: 'Punishing Jasper (Armor)'
      }
    ]
  };
}

export default { METADATA, handler };
