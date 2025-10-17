// --- METADATA ---
export const METADATA = {
  id: 'upgrade_sword_leapingstrike_empower',
  type: 'MASTERY',
};

const empoweringLeapingStrike = (context) => {
  try {
    // Basic guards: require context and an actor/source alias
    if (!context) return;
    const src = context.source ?? context.combatant;
    if (!src) return;

    // Quick debug to show what masteries array looks like (remove after verifying)
    // eslint-disable-next-line no-console
    console.debug('[BUNKER DEBUG] empoweringLeapingStrike context:', {
      eventType: context?.eventType,
      abilityId: context?.abilityId ?? context?.event?.abilityId,
      sourceMasteries: src?.masteries
    });

    // Only consider ability hits for Leaping Strike
    const abilityId = context.abilityId ?? context.ability?.id ?? context.event?.abilityId ?? null;
    if (context.eventType !== 'ABILITY_HIT' || !abilityId) return;

    // Normalize common legacy IDs to a canonical form
    const canon = (abilityId === 'ability_sword_leaping_strike' || abilityId === 'ability_sword_leapingstrike')
      ? 'leapingStrike'
      : abilityId;

    if (canon !== 'leapingStrike') return;

    // Ensure masteries is a real array before iterating
    const masteries = Array.isArray(src.masteries) ? src.masteries : [];
    if (masteries.length === 0) return;

    // Iterate defensively — never access m.id unless m is an object
    for (let i = 0; i < masteries.length; i += 1) {
      const m = masteries[i];
      if (!m || typeof m !== 'object') continue;
      if (typeof m.id === 'undefined' || m.id === null) continue;
      const mid = String(m.id);
      if (mid === METADATA.id) {
        // Return modification instead of mutating shared context
        return { baseDamageMultiplier: 1.2 };
      }
    }

    return;
  } catch (err) {
    // Defensive: log and swallow — bunker must not crash engine
    // eslint-disable-next-line no-console
    console.error('[BUNKER] empoweringLeapingStrike encountered error (handled):', err, {
      eventType: context?.eventType,
      abilityId: context?.abilityId ?? context?.event?.abilityId,
      sourceMasteries: context?.source?.masteries
    });
    return;
  }
};

export default empoweringLeapingStrike;