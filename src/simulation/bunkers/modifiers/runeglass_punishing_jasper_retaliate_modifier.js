/**
 * Runeglass of Punishing Jasper - Retaliate Damage Modifier
 * Reads active retaliate stacks on source and applies 8% per stack
 */

const METADATA = {
  id: 'runeglass_punishing_jasper_retaliate_modifier',
  name: 'Punishing Jasper - Retaliate Modifier',
  description: 'Apply damage bonus based on retaliate stacks (8% per stack).',
  type: 'MODIFIER_BUNKER',
  stroke: 1
};

function handler({ source, event }) {
  // Only modify on damage-dealing events
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return {};

  const stacks = (source.activeEffects || []).filter(e => e.id === 'empowered_jasper_retaliate_stack').length;
  if (!stacks) return {};

  return {
    modifyDamage: [
      {
        id: 'punishing_jasper_retaliate_bonus',
        category: 'MISC_DAMAGE',
        value: 0.08 * stacks,
        source: 'Punishing Jasper Retaliate'
      }
    ]
  };
}

export default { METADATA, handler };
