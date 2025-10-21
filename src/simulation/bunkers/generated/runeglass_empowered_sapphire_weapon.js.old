/**
 * Runeglass of Empowered Sapphire (Weapon)
 * 50% of damage dealt is converted to Arcane. Arcane hits inflict Hex, dealing 20 Arcane damage over 10 seconds.
 */

const METADATA = {
  id: 'runeglass_empowered_sapphire_weapon',
  name: 'Runeglass of Empowered Sapphire (Weapon)',
  description: '50% of damage dealt is converted to Arcane. Arcane hits inflict Hex, dealing 20 Arcane damage over 10 seconds.',
  type: 'EFFECT_BUNKER',
  stroke: 2 // Stroke 2: Apply arcane damage as subrow + Hex DoT
};

function handler({ eventType, actionType, event, finalDamage, source, target, timestamp, allSources, action }) {
  // Only trigger on damage-dealing actions (not blocks, weapon swaps, etc.)
  const NON_DAMAGE_ACTIONS = ['WEAPON_SWAP', 'BLOCK_START', 'BLOCK_END'];
  const isBlockAction = action?.includes('Block') || action?.includes('BLOCK');
  
  if (NON_DAMAGE_ACTIONS.includes(action) || isBlockAction) {
    return;
  }

  if (finalDamage <= 0) {
    return;
  }

  console.log('[SAPPHIRE] Creating subrow - finalDamage:', finalDamage);

  // Calculate 50% of the ORIGINAL damage (before the -50% modifier) as arcane
  // The modifier reduced physical by 50%, so we need to get back to the original amount
  // finalDamage is the reduced physical (50%), so originalDamage = finalDamage / 0.5
  const originalDamage = finalDamage / 0.5;
  const arcaneDamage = Math.round(originalDamage * 0.5);

  const effects = [];

  // Add arcane damage as a subrow
  effects.push({
    id: 'runeglass_sapphire_arcane',
    category: 'ARCANE_DAMAGE',
    baseDamage: arcaneDamage,
    damageType: 'ARCANE',
    sourceId: source.id,
    targetId: target.id,
    metadata: {
      sourceName: 'Runeglass of Empowered Sapphire'
    }
  });

  // Apply Hex DoT: 20 arcane damage over 10 seconds (non-stackable)
  effects.push({
    id: 'hex_dot',
    category: 'DOT',
    subtype: 'HEX',
    tickDamage: 2, // 20 damage / 10 seconds = 2 per tick
    tickInterval: 1,
    duration: 10,
    damageType: 'ARCANE',
    sourceId: source.id,
    targetId: target.id,
    stackable: false, // Only 1 Hex at a time
    timestamp
  });

  return { applyEffects: effects };
}

export default { METADATA, handler };
