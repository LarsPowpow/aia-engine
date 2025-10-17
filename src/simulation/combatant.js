/**
 * @file combatant.js
 * @description Manages the creation of combatant state objects.
 * @version 3.1 - Strict / Fail-Fast initializer
 */

const deepCopy = (obj) => JSON.parse(JSON.stringify(obj));

/**
 * Initializes a combatant object from a configuration.
 * Strict mode: validates required fields and throws if the shape is incorrect.
 * This enforces that the caller must provide a fully-formed configuration.
 *
 * Required shape (examples):
 * {
 *   id: 'Player',
 *   weaponType: 'Sword',
 *   attributes: { STR: 10, DEX: 5, INT: 0, FOC: 0, CON: 0 },
 *   perks: [],
 *   masteries: [],
 *   maxHealth: 10000,
 *   state: { health: 10000, stamina: 100, mana: 100, cooldowns: {} },
 *   activeEffects: []
 * }
 *
 * @param {object} combatantConfig
 * @returns {object} deep-copied validated combatant
 * @throws {Error} if validation fails
 */
export const initializeCombatant = (combatantConfig) => {
  if (!combatantConfig || typeof combatantConfig !== 'object') {
    throw new Error('[initializeCombatant] Invalid combatantConfig: expected an object.');
  }

  if (typeof combatantConfig.id !== 'string' || combatantConfig.id.trim() === '') {
    throw new Error('[initializeCombatant] Missing or invalid property: id (non-empty string required).');
  }

  if (typeof combatantConfig.weaponType !== 'string' || combatantConfig.weaponType.trim() === '') {
    throw new Error('[initializeCombatant] Missing or invalid property: weaponType (non-empty string required).');
  }

  if (!combatantConfig.attributes || typeof combatantConfig.attributes !== 'object') {
    throw new Error('[initializeCombatant] Missing or invalid property: attributes (object required).');
  }

  if (!Number.isFinite(combatantConfig.maxHealth) || combatantConfig.maxHealth <= 0) {
    throw new Error('[initializeCombatant] Missing or invalid property: maxHealth (positive number required).');
  }

  if (!combatantConfig.state || typeof combatantConfig.state !== 'object') {
    throw new Error('[initializeCombatant] Missing or invalid property: state (object required).');
  }

  if (!Number.isFinite(combatantConfig.state.health)) {
    throw new Error('[initializeCombatant] Missing or invalid property: state.health (number required).');
  }

  if (!Array.isArray(combatantConfig.activeEffects)) {
    throw new Error('[initializeCombatant] Missing or invalid property: activeEffects (array required).');
  }

  if (!Array.isArray(combatantConfig.perks)) {
    throw new Error('[initializeCombatant] Missing or invalid property: perks (array required).');
  }

  if (!Array.isArray(combatantConfig.masteries)) {
    throw new Error('[initializeCombatant] Missing or invalid property: masteries (array required).');
  }

  // deep-copy to avoid mutations crossing simulation runs
  const copy = deepCopy(combatantConfig);

  // Final sanity checks (post-copy)
  if (copy.state.health > copy.maxHealth) {
    throw new Error('[initializeCombatant] Invalid config: state.health cannot exceed maxHealth.');
  }

  return copy;
};

