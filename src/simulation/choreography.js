// FILE: src/simulation/choreography.js
/**
 * AIA-Engine: Combat Choreography Source of Truth
 * This file contains the definitive sequence of events for combat simulations.
 * It is a direct translation of the "Mid-Combo Block" PvP Combat Choreography v3.0.
 */

export const combatChoreography = [
  // Flail Sequence
  { time: 1.5,  action: 'trip',           weapon: 'Flail' },
  { time: 2.8,  action: 'light_attack',   weapon: 'Flail' },
  { time: 4.25, action: 'arcane_eruption',weapon: 'Flail' },
  { time: 4.5,  action: 'arcane_vortex',  weapon: 'Flail' }, // Vortex Hit 1
  { time: 5.0,  action: 'arcane_vortex',  weapon: 'Flail' }, // Vortex Hit 2
  { time: 5.5,  action: 'arcane_vortex',  weapon: 'Flail' }, // Vortex Hit 3
  
  // Weapon Swap & Sword Sequence
  { time: 6.25, action: 'weapon_swap',    weapon: 'System' },
  { time: 6.30, action: 'leaping_strike', weapon: 'Sword' },
  { time: 7.0,  action: 'shield_rush',    weapon: 'Sword' },
  { time: 7.8,  action: 'heavy_attack',   weapon: 'Sword' },
  { time: 8.9,  action: 'whirling_blade', weapon: 'Sword' },
  { time: 9.8,  action: 'light_attack',   weapon: 'Sword' }, // Light Attack Chain 1
  { time: 10.4, action: 'light_attack',   weapon: 'Sword' }, // Light Attack Chain 2
  { time: 11.0, action: 'light_attack',   weapon: 'Sword' }, // Light Attack Chain 3
];

// Note: 'Block' and 'Drink Potion' are currently not implemented as engine actions.
// They are noted in the SoT but will be integrated in a future engine upgrade.
// Ability IDs (e.g., 'trip', 'leaping_strike') must match the 'id' field in your Firestore 'abilities' collection.