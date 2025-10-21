/**
 * Runeglass of Empowered Jasper - Retaliate Stack Applier
 * Apply stackable +8% damage buff for 5s on BLOCK_START, BLOCK_HIT, BLOCK_END
 */

const METADATA = {
  id: 'runeglass_empowered_jasper_retaliate_stack',
  name: 'Empowered Jasper - Retaliate Stack',
  description: 'Gain a stack of +8% damage for 5s after blocking. Max 3 stacks.',
  type: 'EFFECT_BUNKER',
  stroke: 2
};

function handler({ event, source, target, timestamp }) {
  console.log('[JASPER RETALIATE] Handler called with:', {
    action: event?.action,
    sourceId: source?.id,
    targetId: target?.id,
    timestamp
  });

  const triggers = ['BLOCK_START', 'BLOCK_HIT', 'BLOCK_END'];
  if (!triggers.includes(event?.action)) {
    console.log('[JASPER RETALIATE] Action not in triggers list, returning null');
    return null;
  }

  console.log('[JASPER RETALIATE] ✅ TRIGGERING! Applying EMPOWER stack');

  // Apply stackable damage buff to source
  return {
    applyEffects: [
      {
        id: 'empowered_jasper_retaliate_stack',
        category: 'EMPOWER',
        sourceId: source?.id,
        targetId: source?.id,
        value: 0.08, // 8% per stack
        duration: 5,
        stackable: true,
        maxStacks: 3,
        appliedAt: timestamp,
        expiresAt: timestamp + 5,
        metadata: { sourceName: 'Empowered Jasper Retaliate' }
      }
    ]
  };
}

export default { METADATA, handler };