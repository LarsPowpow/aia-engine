/**
 * Arcane Eruption (Flail Ability)
 * 
 * Description:
 * - 2 hits over 1.5 seconds
 * - Hit 1: 130% Arcane damage + Slow (3s)
 * - Hit 2: 150% Physical damage + Extend all status durations by 30% + Heal self 35% of weapon damage
 * 
 * Implementation:
 * - MODIFIER_BUNKER (Stroke 1): Applies duration extension modifiers on hit 2
 * - EFFECT_BUNKER (Stroke 2): Applies Slow on hit 1, Heal on hit 2
 */

// Import formula for weapon damage calculation
import { calculateWeaponDamage } from '../../../formulas.js';

const MODIFIER_METADATA = {
  id: 'ability_flail_arcane_eruption_modifier',
  name: 'Arcane Eruption - Duration Extension',
  type: 'MODIFIER_BUNKER',
  weapon: 'Flail',
  stroke: 1
};

function modifierHandler({ event }) {
  // Only trigger on Arcane Eruption hits
  if (event.abilityId !== 'ability_flail_arcane_eruption') return null;
  if (event.action !== 'ABILITY_HIT') return null;
  
  // Only apply duration extension on the second hit
  if (event.hitCount !== 2) return null;
  
  console.log('[Arcane Eruption] ⏱️ Hit 2 detected, extending all status durations by 30%', {
    timestamp: event.timestamp,
    hitCount: event.hitCount
  });
  
  // Apply 30% duration extension to Rend, Weaken, and Slow
  return {
    modifyDamage: [
      {
        id: 'arcane_eruption_rend_duration',
        category: 'REND_DURATION',
        value: 0.30,
        source: 'Arcane Eruption'
      },
      {
        id: 'arcane_eruption_weaken_duration',
        category: 'WEAKEN_DURATION',
        value: 0.30,
        source: 'Arcane Eruption'
      },
      {
        id: 'arcane_eruption_slow_duration',
        category: 'SLOW_DURATION',
        value: 0.30,
        source: 'Arcane Eruption'
      }
    ]
  };
}

const EFFECT_METADATA = {
  id: 'ability_flail_arcane_eruption_effects',
  name: 'Arcane Eruption - Effects',
  type: 'ABILITY_BUNKER',
  weapon: 'Flail',
  stroke: 2
};

function effectHandler({ event, source, target, timestamp }) {
  // Only trigger on Arcane Eruption hits
  if (event.abilityId !== 'ability_flail_arcane_eruption') return null;
  if (event.action !== 'ABILITY_HIT') return null;
  
  const effects = [];
  
  // Hit 1: Apply Slow (3s)
  if (event.hitCount === 1) {
    console.log('[Arcane Eruption] ❄️ Hit 1 detected, applying Slow (3s)');
    
    effects.push({
      id: 'ability_flail_arcane_eruption_slow',
      category: 'SLOW',
      value: 1,  // Binary CC effect
      duration: 3,
      sourceId: source.id,
      targetId: target.id,
      metadata: {
        sourceName: 'Arcane Eruption'
      }
    });
  }
  
  // Hit 2: Heal self for 35% of weapon damage
  if (event.hitCount === 2) {
    // Calculate weapon damage for the heal
    const weaponDamage = calculateWeaponDamage(source.weaponType, source.attributes);
    const healAmount = Math.round(weaponDamage * 0.35);
    
    console.log('[Arcane Eruption] 💚 Hit 2 detected, healing self for 35% of weapon damage', {
      weaponDamage,
      healAmount
    });
    
    effects.push({
      id: 'ability_flail_arcane_eruption_heal',
      category: 'HEAL',
      value: healAmount,  // 35% of weapon damage (calculated)
      sourceId: source.id,
      targetId: source.id,  // Apply to self
      metadata: {
        sourceName: 'Arcane Eruption',
        healType: 'ability'
      }
    });
  }
  
  return effects.length > 0 ? { applyEffects: effects } : null;
}

// Export both as a combined bunker
export default {
  MODIFIER: { METADATA: MODIFIER_METADATA, handler: modifierHandler },
  EFFECT: { METADATA: EFFECT_METADATA, handler: effectHandler }
};
