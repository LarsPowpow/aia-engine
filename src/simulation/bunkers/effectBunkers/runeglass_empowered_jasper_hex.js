/**
 * Runeglass of Empowered Jasper (Weapon) - Hex Effect
 * Hits inflict Hex, dealing 8% Arcane damage per second for 2s.
 */

const METADATA = {
  id: 'runeglass_empowered_jasper_weapon_hex',
  name: 'Runeglass of Empowered Jasper (Weapon) - Hex',
  description: 'Hits inflict Hex, dealing 8% Arcane damage per second for 2s.',
  type: 'EFFECT_BUNKER',
  stroke: 2 // Stroke 2: Apply Hex DoT
};

function handler({ event, source, target, timestamp }) {
  // Only trigger on damage-dealing hits
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) {
    return null;
  }

  console.log('[Runeglass Empowered Jasper] 🔮 Applying Hex DoT');

  // Apply Hex: 8% weapon damage per second for 2 seconds
  return {
    applyEffects: [
      {
        id: 'runeglass_jasper_hex',
        category: 'DOT',
        subtype: 'HEX',
        sourceId: source.id,
        targetId: target.id,
        damagePercent: 0.08,  // 8% weapon damage per tick
        duration: 2,
        tickInterval: 1,
        damageType: 'ARCANE',  // Arcane damage type
        appliedAt: timestamp,
        nextTickAt: timestamp + 1,
        expiresAt: timestamp + 2,
        metadata: {
          sourceName: 'Hex (Empowered Jasper)',
          weaponType: source.weaponType,
          attributes: { ...source.attributes },
          damageType: 'ARCANE'
        }
      }
    ]
  };
}

export default { METADATA, handler };