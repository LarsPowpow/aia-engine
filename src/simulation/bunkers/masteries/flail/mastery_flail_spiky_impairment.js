/**
 * Mastery: Spiky Impairment (Flail)
 * For each blocked hit, add 1 stack of Impairment (5s cooldown, max 3 stacks)
 * Impairment: 10% Weaken + 10% weapon damage/sec DoT, both for 6s
 */

const METADATA = {
  id: 'mastery_flail_spiky_impairment',
  name: 'Spiky Impairment',
  type: 'MASTERY',
  weapon: 'Flail',
  stroke: 2
};

function handler({ event, source, target, timestamp }) {
  // Only trigger on BLOCK_HIT
  if (event?.action !== 'BLOCK_HIT') return null;
  
  // Only active when wielding Flail
  if (source.weaponType !== 'Flail') return null;
  
  // Check cooldown (5s internal cooldown)
  const cooldownKey = 'mastery_flail_spiky_impairment';
  if (!source.cooldowns) source.cooldowns = {};
  const lastProc = source.cooldowns[cooldownKey] || -999;
  const timeSinceLastProc = timestamp - lastProc;
  
  if (timeSinceLastProc < 5) {
    return null;  // On cooldown
  }
  
  // Update cooldown
  source.cooldowns[cooldownKey] = timestamp;
  
  // Apply both WEAKEN and DOT as separate stackable effects
  // This allows each to scale independently with their respective modifiers
  return {
    applyEffects: [
      {
        id: 'spiky_impairment_weaken',
        category: 'WEAKEN',
        sourceId: source.id,
        targetId: target.id,
        value: 0.10,  // 10% Weaken per stack
        duration: 6,
        stackable: true,
        maxStacks: 3,
        appliedAt: timestamp,
        expiresAt: timestamp + 6,
        metadata: {
          sourceName: 'Spiky Impairment (Weaken)'
        }
      },
      {
        id: 'spiky_impairment_dot',
        category: 'DOT',
        subtype: 'BLEED',
        sourceId: source.id,
        targetId: target.id,
        damagePercent: 0.10,  // 10% weapon damage per tick per stack
        duration: 6,
        tickInterval: 1,  // Ticks every 1 second
        damageType: 'ARCANE',  // Arcane damage type (purple)
        stackable: true,
        maxStacks: 3,
        appliedAt: timestamp,
        nextTickAt: timestamp + 1,
        expiresAt: timestamp + 6,
        metadata: {
          sourceName: 'Spiky Impairment (DoT)',
          weaponType: source.weaponType,
          attributes: { ...source.attributes },
          damageType: 'ARCANE'
        }
      }
    ]
  };
}

export default { METADATA, handler };
