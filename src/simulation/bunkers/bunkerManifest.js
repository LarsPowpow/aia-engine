/**
 * @file bunkerManifest.js
 * @description The definitive, code-aware manifest of all functional Bunkers in the simulation.
 * This file is the source of truth for which perks, masteries, etc., have been implemented.
 */

// --- IMPORT BUNKER HANDLERS AND METADATA ---
import leapingStrikeHandler, { METADATA as leapingStrikeMeta } from './abilities/sword/leapingStrike.js';
import cowardlyPunishmentHandler, { METADATA as cowardlyPunishmentMeta } from './masteries/sword/cowardlyPunishment.js';
import empoweringLeapingStrikeHandler, { METADATA as empoweringLeapingStrikeMeta } from './perks/empoweringLeapingStrike.js';
import runeglassMalachiteHandler, { METADATA as runeglassMalachiteMeta } from './runeglass/runeglass_malachite_punishing_weapon.js';

// --- THE BUNKER MANIFEST ---
// This array contains the full definition for every implemented Bunker.
// The UI will use this to determine which options to display.
// The Engine will use this to get the handler functions.
export const BUNKER_MANIFEST = [
  { metadata: leapingStrikeMeta, handler: leapingStrikeHandler },
  { metadata: cowardlyPunishmentMeta, handler: cowardlyPunishmentHandler },
  { metadata: empoweringLeapingStrikeMeta, handler: empoweringLeapingStrikeHandler },
  { metadata: runeglassMalachiteMeta, handler: runeglassMalachiteHandler },
];

// --- CONVENIENCE EXPORTS ---
// These are for convenience, so we don't have to refactor the engine too much.

// An array of just the handler functions for the engine's dispatcher loop.
export const bunkerHandlers = BUNKER_MANIFEST.map(bunker => bunker.handler);

// An array of just the implemented IDs for the UI filter.
export const implementedBunkerIds = BUNKER_MANIFEST.map(bunker => bunker.metadata.id);
