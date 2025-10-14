/**
 * AIA-Engine: Effect Handler Library
 * This file contains the "Effect Handlers," a set of pure functions that form the core
 * logic of the Glass Engine. Each handler is responsible for processing a specific
 * effect category as defined in our Universal Knowledge Base schema.
 */

/**
 * Handles effects of the 'DAMAGE_MODIFIER' category.
 *
 * @param {object} effect - The Effect object from the UKB.
 * @param {number} currentDamage - The current damage value before this modifier is applied.
 * @param {object} combatant - The state of the character dealing the damage.
 * @param {object} target - The state of the character receiving the damage.
 * @returns {number} The new, modified damage value.
 */
export const handleDamageModifier = (effect, currentDamage, combatant, target) => {
  // For now, we assume valueFormula is a simple numeric value for the percentage.
  // Example: 0.15 for a 15% damage increase.
  const modifierValue = parseFloat(effect.valueFormula);

  if (isNaN(modifierValue)) {
    console.error(`[Effect Handler] Invalid valueFormula in DAMAGE_MODIFIER effect: ${effect.id}`);
    return currentDamage;
  }

  // The core logic: apply the multiplicative bonus.
  const newDamage = currentDamage * (1 + modifierValue);

  return newDamage;
};

// Future handlers for other categories (handleStatusEffect, handleProcDamage, etc.) will be added here.