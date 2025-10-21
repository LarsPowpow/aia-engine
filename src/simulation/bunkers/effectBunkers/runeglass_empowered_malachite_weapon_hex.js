/**
 * Runeglass of Empowered Malachite (Weapon) - Hex Effect
 * Hits inflict Hex, dealing 8% Arcane damage per second for 2s
 */

const METADATA = {
  id: 'runeglass_empowered_malachite_weapon_hex',
  name: 'Runeglass of Empowered Malachite (Weapon) - Hex',
  description: 'Hits inflict Hex, dealing 8% Arcane damage per second for 2s.',
  type: 'EFFECT_BUNKER',
  stroke: 2
};

function handler({ event, source, target, timestamp }) {
  // Only trigger on damage-dealing hits
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) {
    return null;
  }

  console.log('[Runeglass Empowered Malachite] 🔮 Applying Hex DoT');

  return {
    applyEffects: [
      {
        id: 'runeglass_malachite_hex',
        category: 'DOT',
        subtype: 'HEX',
        sourceId: source.id,
        targetId: target.id,
        damagePercent: 0.08,
        duration: 2,
        tickInterval: 1,
        damageType: 'ARCANE',
        appliedAt: timestamp,
        nextTickAt: timestamp + 1,
        expiresAt: timestamp + 2,
        metadata: {
          sourceName: 'Hex (Empowered Malachite)',
          weaponType: source.weaponType,
          attributes: { ...source.attributes },
          damageType: 'ARCANE'
        }
      }
    ]
  };
}

export default { METADATA, handler };
