// Minimal modifier bunker: applies a 20% empower to the source on first Light Attack
export default {
  id: 'modifier_uncapped_damage_20',
  handler: ({ event, source, timestamp }) => {
    // Remove expired effects (handled by engine, so this is redundant but safe)
    if (source.activeEffects) {
      source.activeEffects = source.activeEffects.filter(e => !e.expiresAt || e.expiresAt > timestamp);
    }
      // Apply uncapped damage for Sword Leaping Strike (ABILITY_HIT) and persist for 3 seconds
    const isLeapingStrikeHit = event.action === 'ABILITY_HIT' && event.abilityId === 'ability_sword_leaping_strike' && source.weaponType === 'Sword';
    if (isLeapingStrikeHit && !source.activeEffects.some(e => e.id === 'modifier_uncapped_damage_20')) {
        const duration = 3;
        const expiresAt = timestamp + duration;
        source.activeEffects.push({ id: 'modifier_uncapped_damage_20', name: 'Uncapped Damage', category: 'UNCAPPED_DAMAGE', value: 0.2, duration, expiresAt });
    }
      // Only apply miscDmgPercent while effect is active
      const isActive = source.activeEffects && source.activeEffects.some(e => e.id === 'modifier_uncapped_damage_20');
      if (isActive) {
      return { modifyDamage: [{ category: 'UNCAPPED_DAMAGE', value: 0.2 }] };
    }
    return null;
  }
};