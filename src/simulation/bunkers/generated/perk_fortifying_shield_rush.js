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
  if (event?.abilityId !== 'ability_sword_shield_rush') {
    if (event?.action === 'ABILITY_HIT') {
      console.log(`[FORTIFYING SHIELD RUSH] Wrong ability - action: ${event?.action}, abilityId: ${event?.abilityId}, timestamp: ${timestamp?.toFixed(2)}`);
    }
    return null;
  }
  if (event?.action !== 'ABILITY_HIT') return null;

  console.log(`[FORTIFYING SHIELD RUSH] ✅ Applying 31% Fortify for 6s to ${source.id} at ${timestamp?.toFixed(2)}s`);

  return {
    applyEffects: [
      {
        id: 'perk_fortifying_shield_rush_fortify',
        category: 'FORTIFY',
        value: 0.31,
        duration: 6,
        sourceId: 'perk_fortifying_shield_rush', // Changed from source.id to perk ID
        targetId: source.id, // Apply to self
        appliedAt: timestamp,
        expiresAt: timestamp + 6,
        metadata: {
          sourceName: 'Fortifying Shield Rush'
        }
      }
    ]
  };
}

export default { METADATA, handler };
