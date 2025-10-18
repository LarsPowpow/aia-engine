/**
 * @file contextAssembler.js
 * @description A dedicated module for assembling the universal CombatEventContext object.
 * This module ensures a consistent and rich data payload for every in-game event.
 */

/**
 * Assembles the comprehensive CombatEventContext object.
 * This object serves as the single source of truth for all downstream systems.
 *
 * @param {object} event - The raw choreography event.
import { EVENT_SCHEMA, validateSchema } from './schema';
 * @param {object} target - The combatant receiving the event.
 * @returns {object} The fully assembled CombatEventContext object.
 */
export const assembleContext = (event, combatant, target) => {
  // Strict / fail-fast checks — do not fabricate missing inputs
  if (!event || typeof event !== 'object') {
    throw new Error('[assembleContext] event is required and must be an object');
  }
  if (!combatant || typeof combatant !== 'object') {
    throw new Error('[assembleContext] combatant (source) is required and must be an object');
  }
  if (!target || typeof target !== 'object') {
    throw new Error('[assembleContext] target (defender) is required and must be an object');
  }

  // Validate event against canonical schema
  validateSchema(event, EVENT_SCHEMA);

  // Minimal normalized context with aliases expected by bunkers.
  // NOTE: include the choreography "action" as eventType so downstream logic that
  // checks for 'ABILITY_HIT', 'LIGHT_ATTACK', etc. works.
  const ctx = {
    event,
    // Prefer explicit type if present, otherwise fall back to the action field on the raw event
    eventType: event.eventType,
    action: event.action,
    abilityId: event.abilityId,
    timestamp: event.timestamp,
    conditions: event.conditions,
    weapon: event.weapon,
    sourceId: event.sourceId,
    targetId: event.targetId,
    notes: event.notes,

    // Aliases for downstream compatibility
    source: combatant,
    combatant: combatant,
    actor: combatant,
    target: target,
    defender: target,
    recipient: target,
  };

  return ctx;
};

