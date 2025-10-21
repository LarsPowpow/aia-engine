/**
 * Shield Rush (Sword & Shield Ability)
 * 
 * Description:
 * - Single hit dealing 100% weapon damage
 * - Applies 20% Weaken for 10 seconds
 * - Applies Slow for 4 seconds
 * 
 * Implementation:
 * - Choreography contains 1 ABILITY_HIT event
 * - This bunker applies both Weaken and Slow effects
 * - State manager handles effect stacking/duration
 */

const METADATA = {
  id: 'ability_sword_shield_rush',
  name: 'Shield Rush',
  type: 'ABILITY_BUNKER',
  weapon: 'Sword and Shield',
  stroke: 2  // Effects bunker
};

function handler({ event, source, target, timestamp }) {
  // Only trigger on Shield Rush hits
  if (event.abilityId !== 'ability_sword_shield_rush') return null;
  if (event.action !== 'ABILITY_HIT') return null;
  
  console.log('[Shield Rush] 🛡️ Hit detected, applying 20% Weaken (10s) + Slow (4s)', {
    timestamp
  });
  
  // Apply both Weaken and Slow effects
  return {
    applyEffects: [
      {
        id: 'ability_sword_shield_rush_weaken',
        category: 'WEAKEN',
        value: 0.20,  // 20% weaken
        duration: 10,
        sourceId: source.id,
        targetId: target.id,
        stackable: true,
        maxStacks: 10,
        metadata: {
          sourceName: 'Shield Rush'
        }
      },
      {
        id: 'ability_sword_shield_rush_slow',
        category: 'SLOW',
        value: 1,  // Slow is typically binary (on/off)
        duration: 4,
        sourceId: source.id,
        targetId: target.id,
        stackable: false,  // Slow typically doesn't stack
        metadata: {
          sourceName: 'Shield Rush'
        }
      }
    ]
  };
}

export default { METADATA, handler };
