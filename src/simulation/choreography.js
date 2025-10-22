// This file contains the definitive combat choreography for simulations.
// Based on: The "Mid-Combo Block" PvP Combat Choreography (v4.1 - Corrected Event Schema)

export const midComboBlockChoreography = [
  // The first event is skipped by the engine's guard clause, which is correct.
  { timestamp: 0.0, action: 'CONSUMABLE', itemId: 'potion_infused_health', notes: 'Drink Potion' },
  
  // All subsequent events MUST have a sourceId and targetId
  { timestamp: 0.0, action: 'BLOCK_START', weapon: 'Flail', sourceId: 'Player', targetId: 'Target Dummy', notes: 'Block (Start)' },
  { timestamp: 0.5, action: 'BLOCK_HIT', weapon: 'Flail', sourceId: 'Player', targetId: 'Target Dummy', notes: 'Block Hit 1' },
  { timestamp: 1.0, action: 'BLOCK_HIT', weapon: 'Flail', sourceId: 'Player', targetId: 'Target Dummy', notes: 'Block Hit 2' },
  { timestamp: 1.5, action: 'BLOCK_HIT', weapon: 'Flail', sourceId: 'Player', targetId: 'Target Dummy', notes: 'Block Hit 3' },
  { timestamp: 1.5, action: 'BLOCK_END', weapon: 'Flail', sourceId: 'Player', targetId: 'Target Dummy', notes: 'Block (End)' },
  { timestamp: 1.5, action: 'ABILITY_HIT', abilityId: 'ability_flail_trip', weapon: 'Flail', baseDamageMultiplier: 0.50, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Trip' },
  { timestamp: 2.8, action: 'LIGHT_ATTACK', weapon: 'Flail', sourceId: 'Player', targetId: 'Target Dummy', notes: 'Light Attack', forceCrit: true },
  { timestamp: 4.25, action: 'ABILITY_HIT', abilityId: 'ability_flail_arcane_eruption', weapon: 'Flail', damageType: 'ARCANE', baseDamageMultiplier: 1.30, hitCount: 1, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Arcane Eruption Hit 1 (130% Arcane + Slow)' },
  { timestamp: 5.75, action: 'ABILITY_HIT', abilityId: 'ability_flail_arcane_eruption', weapon: 'Flail', baseDamageMultiplier: 1.50, hitCount: 2, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Arcane Eruption Hit 2 (150% Physical + Extend + Heal)' },
  { timestamp: 4.92, action: 'ABILITY_HIT', abilityId: 'ability_flail_blast', weapon: 'Flail', damageType: 'ARCANE', baseDamageMultiplier: 0.75, hitCount: 1, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Arcane Vortex Hit 1' },
  { timestamp: 5.92, action: 'ABILITY_HIT', abilityId: 'ability_flail_blast', weapon: 'Flail', damageType: 'ARCANE', baseDamageMultiplier: 0.75, hitCount: 2, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Arcane Vortex Hit 2' },
  { timestamp: 6.92, action: 'ABILITY_HIT', abilityId: 'ability_flail_blast', weapon: 'Flail', damageType: 'ARCANE', baseDamageMultiplier: 0.75, hitCount: 3, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Arcane Vortex Hit 3' },
  { timestamp: 7.92, action: 'ABILITY_HIT', abilityId: 'ability_flail_blast', weapon: 'Flail', damageType: 'ARCANE', baseDamageMultiplier: 0.75, hitCount: 4, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Arcane Vortex Hit 4' },
  { timestamp: 7.92, action: 'WEAPON_SWAP', targetWeapon: 'Sword', sourceId: 'Player', targetId: 'Target Dummy', notes: 'Weapon Swap to Sword' },
  { timestamp: 7.99, action: 'BLOCK_START', weapon: 'Sword', sourceId: 'Player', targetId: 'Target Dummy', notes: 'Block (Start)' },
  { timestamp: 8.02, action: 'BLOCK_HIT', weapon: 'Sword', sourceId: 'Player', targetId: 'Target Dummy', notes: 'Block Hit 1' },
  { timestamp: 8.02, action: 'BLOCK_END', weapon: 'Sword', sourceId: 'Player', targetId: 'Target Dummy', notes: 'Block (End)' },
  { timestamp: 8.02, action: 'ABILITY_HIT', abilityId: 'ability_sword_leaping_strike', weapon: 'Sword', conditions: ['ATTACK_IS_BACKSTAB'], sourceId: 'Player', targetId: 'Target Dummy', notes: 'Leaping Strike (Backstab)' },
  { timestamp: 8.92, action: 'ABILITY_HIT', abilityId: 'ability_sword_shield_rush', weapon: 'Sword and Shield', baseDamageMultiplier: 1.0, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Shield Rush' },
  { timestamp: 8.4, action: 'HEAVY_ATTACK', weapon: 'Sword', sourceId: 'Player', targetId: 'Target Dummy', notes: 'Heavy Attack' },
  { timestamp: 9.55, action: 'ABILITY_HIT', abilityId: 'ability_sword_whirling_blade', weapon: 'Sword', baseDamageMultiplier: 0.80, hitCount: 1, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Whirling Blade Hit 1' },
  { timestamp: 10.05, action: 'ABILITY_HIT', abilityId: 'ability_sword_whirling_blade', weapon: 'Sword', baseDamageMultiplier: 0.80, hitCount: 2, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Whirling Blade Hit 2' },
  { timestamp: 10.5, action: 'LIGHT_ATTACK', weapon: 'Sword', chainCount: 1, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Light Attack 1' },
  { timestamp: 11.45, action: 'LIGHT_ATTACK', weapon: 'Sword', chainCount: 2, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Light Attack 2' },
  { timestamp: 12.4, action: 'LIGHT_ATTACK', weapon: 'Sword', chainCount: 3, sourceId: 'Player', targetId: 'Target Dummy', notes: 'Light Attack 3 (Final)' },
];

export const simulationParameters = {
  target: {
    baseDamageReduction: 0.5, 
  },
  doctrines: {
    fullCredit: true, 
  }
};
