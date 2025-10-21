/**
 * Runeglass of Punishing Jasper (Weapon) - Punishing Retaliate Misc
 * +2% flat damage
 */

const METADATA = {
  id: 'runeglass_punishing_jasper_weapon_misc',
  name: 'Punishing Jasper (Weapon - Retaliate Misc)',
  description: 'Your melee attacks deal +2% damage.',
  type: 'MODIFIER_BUNKER',
  stroke: 1
};

function handler({ event }) {
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return {};

  return {
    modifyDamage: [
      {
        id: 'punishing_jasper_weapon_misc_boost',
        category: 'MISC_DAMAGE',
        value: 0.02,
        source: 'Punishing Jasper (Weapon)'
      }
    ]
  };
}

export default { METADATA, handler };
