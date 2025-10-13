/**
 * AIA-Engine: Combat Simulation Core
 * Phase 3: The Gladiator - Tick-Based Simulation
 */

import { calculateWeaponDamage } from './formulas.js';
import { fetchUKBDocuments } from '../lib/firebase/firestore';
import { combatChoreography } from './choreography';

const createCombatant = (config) => ({
    id: config.id,
    name: config.name,
    health: config.health,
    maxHealth: config.health,
    weaponType: config.weaponType,
    attack_speed: config.attack_speed,
    attributes: { ...config.attributes },
    perks: config.perks ? [...config.perks] : [],
    next_action_tick: 0,
});

// Simulation loop v2.1: Tick-based, two-actor combat with weapon scaling
export async function runSimulation(combatant, target, choreography) {
  // --- Pre-Flight Briefing ---
  const uniqueAbilityIds = [...new Set((choreography || combatChoreography).map(action => action.action))];
  const ukbDataArray = await fetchUKBDocuments(uniqueAbilityIds);
  const cachedUKBData = ukbDataArray.reduce((acc, doc) => {
    acc[doc.id] = doc;
    return acc;
  }, {});
  console.log("Pre-flight data cache complete:", cachedUKBData);
  // ...existing code for simulation loop...
  // Initialize activeEffects for both combatants
  combatant.activeEffects = [];
  target.activeEffects = [];
  // Apply core principle: target damage reduction
  if (typeof target.damageReduction !== 'number') {
    target.damageReduction = 0.50;
  }

  const log = [];
  let currentTick = 0;
  let actionIndex = 0;
  const tickRate = 0.1; // 100ms precision

  // Continue while target is alive OR combatant has active effects
  while ((target.health > 0 && actionIndex < choreography.length) || combatant.activeEffects.length > 0) {
    let events = [];
    // If next action is due, execute it
    if (actionIndex < choreography.length && choreography[actionIndex].time <= currentTick) {
      const actionObj = choreography[actionIndex];
      events = [actionObj.action];
      // Optionally pass details if needed for processTick
      // e.g., events = [{ type: actionObj.action, ...actionObj.details }];
      actionIndex++;
    }
    // Always process tick for effect resolution
    const tickResults = processTick(combatant, target, tickRate, events);
    // Apply results from the tick
    if (tickResults.damageDealt) {
      target.health -= tickResults.damageDealt;
    }
    if (tickResults.logEntry) {
      log.push({ ...tickResults.logEntry, timestamp: currentTick });
    }
    currentTick += tickRate;
  }
  return log;
}

// UKB Loader (remains the same)
/**
 * Resolves active effects for a character, updating durations and removing expired effects.
 * Returns cumulative bonuses from still-active effects.
 * @param {Object} character - The combatant or target object with activeEffects array
 * @param {number} tickDelta - Time elapsed since last tick
 * @returns {Object} - Cumulative bonuses, e.g., { total_damage_modifier: 15 }
 */
export function resolveActiveEffects(character, tickDelta) {
  if (!character || !Array.isArray(character.activeEffects) || typeof tickDelta !== 'number') return {};
  let total_damage_modifier = 0;
  // Decrement durations and remove expired effects
  character.activeEffects = character.activeEffects.filter(effect => {
    effect.duration -= tickDelta;
    if (effect.duration > 0) {
      if (effect.type === 'damage_modifier' && typeof effect.power === 'number') {
        total_damage_modifier += effect.power;
      }
      return true;
    }
    return false;
  });
  return { total_damage_modifier };
}
// ...existing code...
/**
 * Adds new effects to a character, refreshing duration if effect already exists.
 * @param {Object} character - The combatant or target object with activeEffects array
 * @param {Array<Object>} newEffects - Array of effect objects to apply
 */
export function applyEffects(character, newEffects) {
  if (!character || !Array.isArray(character.activeEffects) || !Array.isArray(newEffects)) return;
  for (const effect of newEffects) {
    if (!effect || !effect.id) continue;
    const existing = character.activeEffects.find(e => e.id === effect.id);
    if (existing) {
      // Refresh duration
      existing.duration = effect.duration;
      existing.power = effect.power;
      // Optionally update other properties
    } else {
      character.activeEffects.push({ ...effect });
    }
  }
}
/**
 * Checks for perk triggers based on events and equipped perks.
 * @param {string[]} events - Array of event names (e.g., ['OnHit', 'OnCrit'])
 * @param {Array<{name: string, trigger: string}>} equippedPerks - List of equipped perks with trigger conditions
 * @returns {string[]} - Array of perk names that triggered
 */
export function processPerkTriggers(events, equippedPerks) {
  if (!Array.isArray(events) || !Array.isArray(equippedPerks)) return [];
  const triggeredEffects = [];
  // Test case: If a critical hit occurs, return Empower buff object
  if (events.includes('OnCrit')) {
    triggeredEffects.push({
      id: 'keenly_empowered_buff',
      name: 'Empower',
      duration: 5,
      power: 15,
      type: 'damage_modifier',
    });
  }
  // Future: Add logic for equippedPerks
  return triggeredEffects;
}
/**
 * Master effect processor for each simulation tick.
 * Handles event detection, perk triggering, effect application, and effect resolution.
 * @param {Object} combatant - The combatant object
 * @param {Array<string>} events - Array of event names for this tick
 * @param {number} tickDelta - Time elapsed since last tick
 * @returns {Object} - Active bonuses from resolved effects
 */
/**
 * Master processor for a simulation tick.
 * This function now calculates final damage according to the Grand Damage Formula.
 */
// Accept cachedUKBData and currentAction as optional args
export function processTick(combatant, target, tickDelta, events = [], cachedUKBData = {}, currentAction = null) {
  // --- 1. EFFECT RESOLUTION ---
  // At the start of the tick, resolve buffs/debuffs for BOTH combatant and target
  const combatantBonuses = resolveActiveEffects(combatant, tickDelta);
  const targetBonuses = resolveActiveEffects(target, tickDelta); // For Rend, etc.

  // --- 2. EVENT DETECTION ---
  const isCrit = Math.random() < 0.2; // Placeholder crit chance
  const isBackstabOrHeadshot = false; // Placeholder for positional check
  // events is now passed as an argument
    
  // --- 3. PERK TRIGGERING & EFFECT APPLICATION ---
  const triggeredEffects = processPerkTriggers(events, combatant.perks || []);
  applyEffects(combatant, triggeredEffects);

  // --- 4. GRAND DAMAGE FORMULA CALCULATION ---
  // Stage 1 & 2: Calculate Ability's Base Damage
  const weaponDamage = calculateWeaponDamage(combatant.weaponType, combatant.attributes);
  let abilityDamageMultiplier = 1.0;
  // If an action is provided, look up its real base_damage_percent
  if (currentAction && cachedUKBData) {
    const actionData = cachedUKBData[currentAction.action];
    if (actionData && actionData.base_damage_percent) {
      abilityDamageMultiplier = actionData.base_damage_percent / 100;
    }
  }
  const baseDamage = weaponDamage * abilityDamageMultiplier;

  // Term 2: Empower & Rend (with caps)
  const totalEmpower = Math.min(combatantBonuses.total_damage_modifier || 0, 50); // Cap Empower at 50%
  const totalRend = Math.min(targetBonuses.total_rend_modifier || 0, 70); // Cap Rend at 70%
  const empowerRendMultiplier = 1 + (totalEmpower / 100) - (totalRend / 100);

  // Term 3: Critical Damage
  let critMultiplier = 1.0;
  if (isCrit || isBackstabOrHeadshot) {
    const baseCritMultiplier = combatant.weaponType === 'Sword' ? 1.3 : 1.2; // Weapon-specific
    critMultiplier = baseCritMultiplier; // Add perk effects here later
  }

  // Term 4 & 5: Positional and Misc (placeholders for now)
  const positionalMultiplier = 1.0;
  const miscMultiplier = 1.0;

  // Final Calculation (before reduction)
  const finalDamage =
    baseDamage *
    empowerRendMultiplier *
    critMultiplier *
    positionalMultiplier *
    miscMultiplier;

  // Apply target's damage reduction
  const damageAfterReduction = finalDamage * (1 - (target.damageReduction || 0));
  const finalDamageRounded = Math.round(damageAfterReduction);

  // --- 5. GENERATE LOG ENTRY ---
  const logEntry = {
    source: combatant.id,
    action: currentAction ? currentAction.action : 'Light Attack',
    target: target.id,
    damage: finalDamageRounded,
    isCrit: isCrit || isBackstabOrHeadshot,
    effectsApplied: triggeredEffects.length > 0 ? triggeredEffects.map(e => e.name).join(', ') : '-',
    activeBuffs: combatant.activeEffects.map(e => `${e.name} (${e.duration.toFixed(1)}s)`).join(', ') || '-',
  };

  return {
    damageDealt: finalDamageRounded,
    logEntry: logEntry
  };
}
async function loadUKBDocument(firestore, collectionName, docId) {
    if (!firestore) throw new Error('Firestore instance required');
    const { getDoc, doc } = await import('firebase/firestore');
    const ref = doc(firestore, collectionName, docId);
    const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error(`Document ${docId} not found in ${collectionName}`);
  return { id: snapshot.id, ...snapshot.data() };
}
export { loadUKBDocument };
