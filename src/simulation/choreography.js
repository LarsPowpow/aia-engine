// This file contains the definitive combat choreography for simulations.
// Based on: The "Mid-Combo Block" PvP Combat Choreography (v3.0) 

export const midComboBlockChoreography = [
  { timestamp: 0.0, action: 'CONSUMABLE', itemId: 'potion_infused_health', notes: 'Drink Potion' },
  { timestamp: 0.0, action: 'BLOCK_START', weapon: 'Flail', notes: 'Block (Start)' },
  { timestamp: 0.5, action: 'BLOCK_HIT', weapon: 'Flail', notes: 'Block Hit 1' },
  { timestamp: 1.0, action: 'BLOCK_HIT', weapon: 'Flail', notes: 'Block Hit 2' },
  { timestamp: 1.5, action: 'BLOCK_HIT', weapon: 'Flail', notes: 'Block Hit 3' },
  { timestamp: 1.5, action: 'BLOCK_END', weapon: 'Flail', notes: 'Block (End)' },
  { timestamp: 1.5, action: 'ABILITY', abilityId: 'ability_flail_trip', weapon: 'Flail', notes: 'Trip' },
  // THE UPGRADE: The first attack is now a guaranteed critical hit.
  { timestamp: 2.8, action: 'LIGHT_ATTACK', weapon: 'Flail', notes: 'Light Attack', forceCrit: true },
  { timestamp: 4.25, action: 'ABILITY', abilityId: 'ability_flail_burst', weapon: 'Flail', notes: 'Arcane Eruption' },
  { timestamp: 4.25, action: 'BLOCK_START', weapon: 'Flail', notes: 'Block (Start)' },
  { timestamp: 4.92, action: 'ABILITY_HIT', abilityId: 'ability_flail_blast', weapon: 'Flail', hitCount: 1, notes: 'Arcane Vortex Hit 1' },
  { timestamp: 5.58, action: 'ABILITY_HIT', abilityId: 'ability_flail_blast', weapon: 'Flail', hitCount: 2, notes: 'Arcane Vortex Hit 2' },
  { timestamp: 6.25, action: 'ABILITY_HIT', abilityId: 'ability_flail_blast', weapon: 'Flail', hitCount: 3, notes: 'Arcane Vortex Hit 3' },
  { timestamp: 6.25, action: 'BLOCK_END', weapon: 'Flail', notes: 'Block (End)' },
  { timestamp: 6.25, action: 'WEAPON_SWAP', notes: 'Weapon Swap to Sword' },
  // [MOD] Changed action to ABILITY_HIT and standardized the abilityId.
  { timestamp: 6.35, action: 'ABILITY_HIT', abilityId: 'ability_sword_leaping_strike', weapon: 'Sword', conditions: ['ATTACK_IS_BACKSTAB'], notes: 'Leaping Strike (Backstab)' },
  { timestamp: 7.25, action: 'ABILITY', abilityId: 'ability_sword_rush', weapon: 'Sword', notes: 'Shield Rush' },
  { timestamp: 8.4, action: 'HEAVY_ATTACK', weapon: 'Sword', notes: 'Heavy Attack' },
  { timestamp: 9.55, action: 'ABILITY', abilityId: 'ability_sword_whirlingblade', weapon: 'Sword', notes: 'Whirling Blade' },
  { timestamp: 10.5, action: 'LIGHT_ATTACK', weapon: 'Sword', chainCount: 1, notes: 'Light Attack 1' },
  { timestamp: 11.45, action: 'LIGHT_ATTACK', weapon: 'Sword', chainCount: 2, notes: 'Light Attack 2' },
  { timestamp: 12.4, action: 'LIGHT_ATTACK', weapon: 'Sword', chainCount: 3, notes: 'Light Attack 3 (Final)' },
];

export const simulationParameters = {
  target: {
    baseDamageReduction: 0.5, 
  },
  doctrines: {
    fullCredit: true, 
  }
};
