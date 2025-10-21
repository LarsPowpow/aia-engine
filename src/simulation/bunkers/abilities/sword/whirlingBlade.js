/**
 * Whirling Blade (Sword Ability)
 * 
 * Description:
 * - 2-hit combo, each hit deals 80% weapon damage
 * - Each hit applies 16% Weaken for 5 seconds
 * - Stacks up to 3 times (or more, depending on balance)
 * 
 * Implementation:
 * - Choreography contains 2 ABILITY_HIT events (~0.5s apart)
 * - This bunker applies Weaken on each hit
 * - State manager handles stacking logic
 */

const METADATA = {
  id: 'ability_sword_whirling_blade',
  name: 'Whirling Blade',
  type: 'ABILITY_BUNKER',
  weapon: 'Sword',
  stroke: 2  // Effects bunker
};

function handler({ event, source, target, timestamp }) {
  // Only trigger on Whirling Blade hits
  if (event.abilityId !== 'ability_sword_whirling_blade') return null;
  if (event.action !== 'ABILITY_HIT') return null;
  
  console.log('[Whirling Blade] ⚔️ Hit detected, applying 16% Weaken', {
    hitCount: event.hitCount,
    timestamp
  });
  
  // Apply 16% Weaken per hit
  return {
    applyEffects: [{
      id: 'ability_sword_whirling_blade_weaken',
      category: 'WEAKEN',
      value: 0.16,  // 16% weaken
      duration: 5,
      sourceId: source.id,
      targetId: target.id,
      appliedAt: timestamp,
      expiresAt: timestamp + 5,
      stackable: true,
      maxStacks: 10,  // High cap, can be adjusted
      metadata: {
        sourceName: 'Whirling Blade',
        hitCount: event.hitCount
      }
    }]
  };
}

export default { METADATA, handler };
