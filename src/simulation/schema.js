// Central schema definition for simulation events and bunker configs

/**
 * Canonical schema for simulation events.
 * All fields are required unless marked optional (with ? suffix).
 * Use this for strict validation and context assembly.
 */
export const EVENT_SCHEMA = {
  timestamp: 'number', // Unix timestamp (seconds, float)
  eventType: 'string', // e.g. 'ABILITY_HIT', 'BLOCK_START', 'WEAPON_SWAP'
  action: 'string',    // e.g. 'LIGHT_ATTACK', 'ABILITY', 'BLOCK_HIT'
  abilityId: 'string?', // e.g. 'ability_sword_leaping_strike' (optional)
  weapon: 'string?',    // e.g. 'Sword', 'Flail' (optional)
  sourceId: 'string',   // Combatant ID (required)
  targetId: 'string',   // Combatant ID (required)
  conditions: 'array?', // Array of condition strings (optional)
  notes: 'string?',     // Freeform notes (optional)
  itemId: 'string?',    // For consumable events (optional)
  hitCount: 'number?',  // For multi-hit events (optional)
  chainCount: 'number?',// For attack chains (optional)
  forceCrit: 'boolean?',// For forced crit events (optional)
};

/**
 * Canonical schema for bunker METADATA objects.
 * All fields are required unless marked optional (with ? suffix).
 * Use this for strict validation of effect/modifier/stat bunkers.
 */
export const BUNKER_METADATA_SCHEMA = {
  id: 'string',         // Unique bunker ID
  type: 'string',       // 'PERK', 'MASTERY', 'RUNEGLASS', etc.
  label: 'string',      // Display name
  description: 'string',// Description for UI
  amount: 'number?',    // Numeric value (optional)
  eventType: 'string?', // e.g. 'ABILITY_HIT' (optional)
  abilityId: 'string?', // e.g. 'ability_sword_leaping_strike' (optional)
  damageType: 'string?',// e.g. 'MISC_DAMAGE', 'SLOW' (optional)
  category: 'string?',  // e.g. 'MISC_DAMAGE', 'SLOW', 'EMPOWER' (optional)
  conditions: 'array?', // Array of condition strings (optional)
};

/**
 * Validates an object against a schema definition.
 * Supports optional fields (with ? suffix) and strict type checking.
 * Throws on missing required fields or type mismatch.
 * @param {object} obj - Object to validate
 * @param {object} schema - Schema definition
 * @returns {true} if valid, throws Error otherwise
 */
export function validateSchema(obj, schema) {
  for (const key in schema) {
    const isOptional = schema[key].endsWith('?');
    const type = isOptional ? schema[key].slice(0, -1) : schema[key];
    if (!(key in obj)) {
      if (!isOptional) {
        throw new Error(`Missing required field: ${key}`);
      } else {
        continue; // Optional and missing is fine
      }
    }
    if (type === 'array' && !Array.isArray(obj[key])) {
      throw new Error(`Field ${key} must be an array.`);
    }
    if (type === 'boolean' && typeof obj[key] !== 'boolean') {
      throw new Error(`Field ${key} must be a boolean.`);
    }
    if (type === 'number' && typeof obj[key] !== 'number') {
      throw new Error(`Field ${key} must be a number.`);
    }
    if (type === 'string' && typeof obj[key] !== 'string') {
      throw new Error(`Field ${key} must be a string.`);
    }
  }
  return true;
}
