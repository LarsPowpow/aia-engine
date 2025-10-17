/**
 * @file simulation/bunkers/index.js
 * @description
 * This is the central manifest for all Bunker components. It imports every
 * self-contained handler and exports them as a single array. The engine
 * only needs to import this one file to gain access to the entire
 * library of game mechanics.
 */

// --- ABILITIES ---
import { handleLeapingStrikeAbility } from './abilities/sword/leapingStrike.js';

// --- MASTERIES ---
import { handleCowardlyPunishment } from './masteries/sword/cowardlyPunishment.js';

// --- PERKS ---
import { handleEmpoweringLeapingStrike } from './perks/empoweringLeapingStrike.js';

// --- RUNEGLASS ---
import { handleRuneglassMalachitePunishingWeapon } from './runeglass/runeglass_malachite_punishing_weapon.js';


// The main "conveyor belt" of all game logic handlers.
export const bunkerHandlers = [
    handleLeapingStrikeAbility,
    handleCowardlyPunishment,
    handleEmpoweringLeapingStrike,
    handleRuneglassMalachitePunishingWeapon,
];
