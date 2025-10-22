/**
 * Fortifying Shield Rush
 * When hitting a target with Shield Rush, player gains 31% Fortify for 6s
 */

const METADATA = {
  id: 'perk_fortifying_shield_rush',
  name: 'Fortifying Shield Rush',
  type: 'PERK',
  stroke: 2,
  description: 'When hitting a target with Shield Rush, player gains 31% Fortify for 6s'
};

function handler({ event, source, target, context, timestamp }) {
  // Only trigger on Shield Rush hits
  if (event?.abilityId !== 'ability_sword_shield_rush') return null;
  if (event?.action !== 'ABILITY_HIT') return null;

  return {
    applyEffect: [
      {
        category: 'FORTIFY',
        value: 0.31,
        duration: 6,
        sourceId: source.id,
        targetId: source.id, // Apply to self
        metadata: {
          appliedBy: 'perk_fortifying_shield_rush',
          timestamp: timestamp
        }
      }
    ]
  };
}

export default { METADATA, handler };
