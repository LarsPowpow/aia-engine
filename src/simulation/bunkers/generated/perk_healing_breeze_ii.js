/**
 * Healing Breeze II
 * When applying a healing effect to yourself, Heal yourself for 5.25% weapon damage for 6s.
 * (10s cooldown per target)
 */

const METADATA = {
  id: 'perk_healing_breeze_ii',
  name: 'Healing Breeze II',
  type: 'effect',
  sourceType: 'perk',
  bucket: 'weapon',
  tags: ['healing', 'hot', 'healing_trigger'],
  description: 'When applying a healing effect to yourself, Heal yourself for 5.25% weapon damage for 6s. (10s cooldown per target)',
};

/**
 * Handler for Healing Breeze II
 * Triggers when any non-lifesteal heal is applied to self
 */
const handler = (context) => {
  const { event, source, target, timestamp, effectRequests } = context;
  
  console.log('[Healing Breeze II] Handler called:', {
    action: event.action,
    timestamp: timestamp?.toFixed(2),
    effectRequestsCount: effectRequests?.length || 0
  });
  
  // Don't trigger on HOT_TICK (would create infinite loop)
  if (event.action === 'HOT_TICK') {
    return null;
  }
  
  // Check if any HEAL effects were created (excluding lifesteals and self-healing breeze)
  const hasHealEffect = effectRequests?.some(eff => 
    eff.category === 'HEAL' && 
    eff.metadata?.healType !== 'lifesteal' &&
    eff.id !== 'healing_breeze_ii_hot'  // Don't trigger on itself
  );
  
  if (!hasHealEffect) {
    return null;
  }
  
  console.log('[Healing Breeze II] ✓ Heal effect detected! Checking cooldown...');
  
  // Check per-target cooldown
  const cooldownKey = `perk_healing_breeze_ii_${target.id}`;
  if (!source.cooldowns) source.cooldowns = {};
  const lastProc = source.cooldowns[cooldownKey] || -999;
  const timeSinceLastProc = timestamp - lastProc;
  
  console.log('[Healing Breeze II] Cooldown check:', {
    targetId: target.id,
    lastProc: lastProc.toFixed(2),
    timeSince: timeSinceLastProc.toFixed(2),
    cooldownDuration: 10,
    ready: timeSinceLastProc >= 10
  });
  
  if (timeSinceLastProc < 10) {
    console.log(`[Healing Breeze II] ❌ On cooldown for ${target.name} (${(10 - timeSinceLastProc).toFixed(2)}s remaining)`);
    return null;
  }
  
  // Update cooldown
  source.cooldowns[cooldownKey] = timestamp;
  
  // HoT always heals self at 5.25% weapon damage per tick
  const potency = 0.0525;  // 5.25% per tick
  
  console.log('[Healing Breeze II] ✅ Applying HoT to SELF!', {
    healTarget: target.name,
    finalPotency: (potency * 100).toFixed(2) + '%',
    duration: 6
  });
  
  // Apply HoT effect that always heals SELF (the healer)
  return {
    applyEffects: [
      {
        id: 'healing_breeze_ii_hot',
        category: 'HOT',
        sourceId: source.id,
        targetId: source.id,  // ALWAYS heal self
        value: potency,  // Store as percentage for UI display (5.25%)
        healPercent: potency,  // % of weapon damage per tick
        duration: 6,
        tickInterval: 1,  // Tick every second
        appliedAt: timestamp,
        nextTickAt: timestamp + 1,  // First tick at +1s
        expiresAt: timestamp + 6,
        metadata: {
          sourceName: 'Healing Breeze II',
          healType: 'hot',  // Mark as HoT to avoid triggering Sacred/Divine
          weaponType: source.weaponType,
          attributes: { ...source.attributes }
        }
      }
    ]
  };
};

export default { METADATA, handler };
