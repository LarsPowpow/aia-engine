/**
 * Trip (Flail Ability)
 * 
 * Description:
 * - Single hit dealing 50% weapon damage
 * - Applies 15% Rend to target for 5 seconds
 * - Applies 15% Fortify to self for 5 seconds
 * - Applies Knocked Down (CC) to target for 2 seconds
 * 
 * Implementation:
 * - Choreography contains 1 ABILITY_HIT event
 * - This bunker applies effects to both target and source
 * - State manager handles effect stacking/duration
 */

const METADATA = {
  id: 'ability_flail_trip',
  name: 'Trip',
  type: 'ABILITY_BUNKER',
  weapon: 'Flail',
  stroke: 2  // Effects bunker
};

function handler({ event, source, target, timestamp }) {
  // Only trigger on Trip hits
  if (event.abilityId !== 'ability_flail_trip') return null;
  if (event.action !== 'ABILITY_HIT') return null;
  
  console.log('[Trip] 💥 Hit detected, applying 15% Rend + Knocked Down to target, 15% Fortify to self', {
    timestamp
  });
  
  // Apply effects to both target and source
  return {
    applyEffects: [
      // Target effects: Rend + Knocked Down
      {
        id: 'ability_flail_trip_rend',
        category: 'REND',
        value: 0.15,  // 15% rend
        duration: 5,
        sourceId: source.id,
        targetId: target.id,
        stackable: true,
        maxStacks: 10,
        metadata: {
          sourceName: 'Trip'
        }
      },
      {
        id: 'ability_flail_trip_knocked_down',
        category: 'KNOCKED_DOWN',
        value: 1,  // Binary CC effect
        duration: 2,
        sourceId: source.id,
        targetId: target.id,
        stackable: false,
        metadata: {
          sourceName: 'Trip'
        }
      },
      // Source effect: Fortify on self
      {
        id: 'ability_flail_trip_fortify',
        category: 'FORTIFY',
        value: 0.15,  // 15% fortify
        duration: 5,
        sourceId: source.id,
        targetId: source.id,  // Apply to self!
        stackable: true,
        maxStacks: 10,
        metadata: {
          sourceName: 'Trip'
        }
      }
    ]
  };
}

export default { METADATA, handler };
