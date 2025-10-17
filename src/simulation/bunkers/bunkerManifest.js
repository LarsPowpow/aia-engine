/**
 * @file bunkerManifest.js
 * @description The definitive, code-aware manifest of all functional Bunkers in the simulation.
 * @version 3.0.0 - Final Integrity Lock
 */

// --- IMPORT BUNKER HANDLERS AND METADATA ---

// ABILITIES
// NOTE: Leaping Strike ability Bunker is not yet implemented or required for current tests.
// import leapingStrikeHandler, { METADATA as leapingStrikeMeta } from './abilities/sword/leapingStrike.js';

// MASTERIES
import cowardlyPunishmentHandler, { METADATA as cowardlyPunishmentMeta } from './masteries/sword/cowardlyPunishment.js';

// PERKS
import empoweringLeapingStrikeHandler, { METADATA as empoweringLeapingStrikeMeta } from './perks/empoweringLeapingStrike.js';

// RUNEGLASS
import runeglassMalachiteHandler, { METADATA as runeglassMalachiteMeta } from './runeglass/runeglass_malachite_punishing_weapon.js';


// --- THE BUNKER MANIFEST ---
// This array is the single source of truth for all implemented Bunkers.
export const BUNKER_MANIFEST = [
  // MASTERIES
  { metadata: cowardlyPunishmentMeta, handler: cowardlyPunishmentHandler },

  // PERKS
  { metadata: empoweringLeapingStrikeMeta, handler: empoweringLeapingStrikeHandler },

  // RUNEGLASS
  { metadata: runeglassMalachiteMeta, handler: runeglassMalachiteHandler },
];

// --- CONVENIENCE EXPORTS ---
export const bunkerHandlers = BUNKER_MANIFEST.map(bunker => bunker.handler);
export const implementedBunkerIds = BUNKER_MANIFEST.map(bunker => bunker.metadata.id);

