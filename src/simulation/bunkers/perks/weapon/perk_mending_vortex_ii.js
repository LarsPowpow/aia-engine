/**
 * Perk: Mending Vortex II
 * 
 * Effect: Every 2nd hit with Arcane Vortex (ability_flail_blast) heals you for 23% of the base weapon damage dealt by that hit.
 * 
 * Triggers on: Arcane Vortex hits 2 and 4 (even-numbered hits)
 */

const METADATA = {
  id: 'perk_mending_vortex_ii',
  name: 'Mending Vortex II',
  type: 'PERK',
  weapon: 'Flail',
  stroke: 2  // Effect bunker (applies healing after damage)
};

function handler({ event, source, finalDamage, effectRequests }) {
  // Only trigger on FIRST PASS (when effectRequests is undefined or empty)
  // This prevents double-application since effect bunkers run twice
  if (effectRequests && effectRequests.length > 0) return null;
  
  // Only trigger on Arcane Vortex ability hits
  if (event.abilityId !== 'ability_flail_blast') return null;
  if (event.action !== 'ABILITY_HIT') return null;
  
  // Only trigger on even-numbered hits (2, 4)
  const hitCount = event.hitCount || 0;
  if (hitCount === 0 || hitCount % 2 !== 0) return null;
  
  // Calculate heal: 23% of the weapon damage dealt by this hit
  const healAmount = Math.round(finalDamage * 0.23);
  
  console.log('[Mending Vortex II] 💚 Hit', hitCount, 'detected, healing self for 23% of', finalDamage, '=', healAmount);
  
  return {
    applyEffects: [{
      id: `mending_vortex_heal_hit${hitCount}`,
      category: 'HEAL',
      value: healAmount,
      duration: 0,  // Instant heal
      sourceId: source.id,
      targetId: source.id,  // Heal self
      metadata: {
        sourceName: 'Mending Vortex II',
        healType: 'ability'
      }
    }]
  };
}

export default { METADATA, handler };
