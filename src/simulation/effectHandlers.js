/**
 * AIA-Engine: Effect Handler Library (v2)
 * This version adds the `handleStatusEffect` function.
 */

/**
 * Handles 'DAMAGE_MODIFIER' effects.
 */
export const handleDamageModifier = (effect, currentDamage, combatant, target) => {
  const modifierValue = parseFloat(effect.valueFormula);
  if (isNaN(modifierValue)) {
    console.error(`[Effect Handler] Invalid valueFormula in DAMAGE_MODIFIER effect: ${effect.id}`);
    return currentDamage;
  }
  return currentDamage * (1 + modifierValue);
};

/**
 * Handles effects of the 'STATUS_EFFECT' category.
 * It applies a new status effect to a character's activeEffects array.
 *
 * @param {object} effect - The Effect object from the UKB.
 * @param {object} character - The state object for the character receiving the effect.
 * @returns {string} A log message describing the action taken.
 */
export const handleStatusEffect = (effect, character) => {
  const duration = parseFloat(effect.duration);
  if (isNaN(duration)) {
    console.error(`[Effect Handler] Invalid duration in STATUS_EFFECT effect: ${effect.id}`);
    return `ENGINE ERROR: Invalid duration for effect '${effect.name}'.`;
  }

  // Check for existing stacks of the same effect
  const existingEffect = character.activeEffects.find(e => e.id === effect.id);

  if (existingEffect) {
    // For now, we only implement the "REFRESH_DURATION" rule.
    existingEffect.duration = duration;
    return `Refreshed '${effect.name}' on ${character.id} for ${duration}s.`;
  } else {
    // Add the new effect to the character's state
    character.activeEffects.push({
      id: effect.id,
      name: effect.name,
      category: effect.category,
      duration: duration,
      // We will add stacking and modification data here in the future
    });
    return `Applied '${effect.name}' to ${character.id} for ${duration}s.`;
  }
};