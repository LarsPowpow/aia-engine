/**
 * Arcane Damage II
 * +8.0% Arcane Damage
 */

const METADATA = {
  id: 'perk_arcane_damage_ii',
  name: 'Arcane Damage II',
  description: '+8.0% Arcane Damage',
  type: 'MODIFIER_BUNKER',
  stroke: 1,
  sourceType: 'perk',
  bucket: 'weapon'
};

/**
 * Arcane Damage II boosts only arcane damage
 * Engine will call this for each damage type separately
 */
function handler({ event, context, damageType }) {
  // Only apply to arcane damage type
  // Check both context.damageType and damageType parameter
  const currentDamageType = damageType || context?.damageType || event?.damageType;
  
  if (currentDamageType !== 'ARCANE') {
    // Not arcane damage - skip
    return {};
  }
  
  console.log('[Arcane Damage II] ✨ Boosting arcane damage by 8%');
  
  return {
    modifyDamage: [
      {
        id: 'arcane_damage_ii_boost',
        category: 'MISC_DAMAGE',
        value: 0.08,  // +8% arcane damage
        source: 'Arcane Damage II'
      }
    ]
  };
}

export default { METADATA, handler };
