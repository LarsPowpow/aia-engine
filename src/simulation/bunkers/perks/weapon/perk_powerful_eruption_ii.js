/**
 * Perk: Powerful Eruption II
 * 
 * Effect: Eruption hits deal 10% increased damage per stack of Impairment on the target.
 * 
 * Implementation:
 * - MODIFIER_BUNKER (Stroke 1)
 * - Checks target's activeEffects for Impairment stacks
 * - Returns MISC_DAMAGE modifier: 0.10 × stackCount
 * - Example: 3 Impairment stacks → +30% damage
 */

const METADATA = {
  id: 'perk_powerful_eruption_ii',
  name: 'Powerful Eruption II',
  type: 'PERK',
  weapon: 'Flail',
  stroke: 1  // Modifier bunker (amplifies damage before calculation)
};

function handler({ event, target, damageType }) {
  // Only trigger on damage type pass (when damageType is explicitly set)
  // This prevents double-application since modifier bunkers run twice for split damage
  if (!damageType) return null;
  
  // Only trigger on Arcane Eruption hits
  if (event.abilityId !== 'ability_flail_arcane_eruption') return null;
  if (event.action !== 'ABILITY_HIT') return null;
  
  // Count Impairment stacks on target
  if (!target || !target.activeEffects) return null;
  
  // Count unique Impairment stacks by extracting stack numbers from IDs
  // Each stack has 2 effects: weaken and DoT (e.g., impairment_weaken_1, impairment_dot_1)
  const impairmentStackNumbers = new Set();
  
  for (const effect of target.activeEffects) {
    if (effect.id && effect.id.includes('impairment')) {
      // Extract stack number from IDs like "arcane_eruption_impairment_weaken_1" or "spiky_impairment_dot"
      const match = effect.id.match(/_(\d+)$/);
      if (match) {
        impairmentStackNumbers.add(match[1]);  // Add the stack number
      } else {
        // For effects without numbers (like spiky_impairment), use the effect ID itself
        impairmentStackNumbers.add(effect.id);
      }
    }
  }
  
  const impairmentStacks = impairmentStackNumbers.size;
  
  if (impairmentStacks === 0) return null;
  
  // Calculate damage bonus: 10% per stack
  const damageBonus = impairmentStacks * 0.10;
  
  console.log('[Powerful Eruption II] 💥 Amplifying Eruption hit:', {
    hitCount: event.hitCount,
    impairmentStacks,
    damageBonus: `+${(damageBonus * 100).toFixed(0)}%`
  });
  
  return {
    modifyDamage: [{
      category: 'MISC_DAMAGE',
      value: damageBonus,
      source: 'Powerful Eruption II'
    }]
  };
}

export default { METADATA, handler };
