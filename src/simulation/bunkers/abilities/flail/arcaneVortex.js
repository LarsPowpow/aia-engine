/**
 * Arcane Vortex (Flail Ability)
 * 
 * Description:
 * - 4-hit combo over 3 seconds
 * - Each hit deals 75% Arcane damage
 * - Applies 10% Empower to self for 5 seconds
 * 
 * Implementation:
 * - Choreography contains 4 ABILITY_HIT events with damageType: 'ARCANE'
 * - This bunker applies Empower on the first hit only
 * - Arcane damage is handled by engine's ARCANE_DAMAGE processing
 */

const METADATA = {
  id: 'ability_flail_arcane_vortex',
  name: 'Arcane Vortex',
  type: 'ABILITY_BUNKER',
  weapon: 'Flail',
  stroke: 2  // Effects bunker
};

function handler({ event, source, target, timestamp }) {
  // Only trigger on Arcane Vortex hits
  if (event.abilityId !== 'ability_flail_blast') return null;
  if (event.action !== 'ABILITY_HIT') return null;
  
  // Only apply Empower on the first hit
  if (event.hitCount !== 1) return null;
  
  console.log('[Arcane Vortex] 🌀 First hit detected, applying 10% Empower to self', {
    timestamp,
    hitCount: event.hitCount
  });
  
  // Apply Empower self-buff on first hit only
  return {
    applyEffects: [
      {
        id: 'ability_flail_arcane_vortex_empower',
        category: 'EMPOWER',
        value: 0.10,  // 10% empower
        duration: 5,
        sourceId: source.id,
        targetId: source.id,  // Apply to self!
        stackable: true,
        maxStacks: 10,
        metadata: {
          sourceName: 'Arcane Vortex'
        }
      }
    ]
  };
}

export default { METADATA, handler };
