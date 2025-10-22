/**
 * Mastery: Opportunist (Sword)
 * Abilities do +10% damage to enemies affected by Slow
 */

const METADATA = {
  id: 'mastery_sword_opportunist',
  name: 'Opportunist',
  type: 'MASTERY',
  weapon: 'Sword',
  stroke: 1  // Damage modifier
};

function handler({ event, source, target, timestamp }) {
  // Only active when wielding Sword
  if (source.weaponType !== 'Sword') return null;
  
  // Only apply to ability damage
  const isAbility = event?.action === 'ABILITY_HIT' || event?.abilityId;
  if (!isAbility) return null;
  
  // Check if target has SLOW effect
  const targetEffects = target?.activeEffects || [];
  const hasSlow = targetEffects.some(eff => eff.category === 'SLOW');
  
  if (!hasSlow) return null;
  
  // Apply 10% damage bonus
  return {
    modifyDamage: [{
      id: 'mastery_sword_opportunist_bonus',
      category: 'MISC_DAMAGE',
      value: 0.10,  // +10% damage
      source: 'Opportunist'
    }]
  };
}

export default { METADATA, handler };
