/**
 * @file empoweringLeapingStrike.js
 * @description Bunker component for the Empowering Leaping Strike perk.
 * @version 1.2.0 - Corrected context variable from .combatant to .source
 */

// --- METADATA ---
export const METADATA = {
  id: 'perk_empoweringLeapingStrike',
  type: 'PERK',
};

const empoweringLeapingStrike = (context) => {
  try {
    if (!context) return;
    const src = context.source ?? context.combatant;
    if (!src) return;

    // Only trigger on ability hits for Leaping Strike (support legacy ids)
    const abilityId = context.abilityId ?? context.ability?.id ?? context.event?.abilityId ?? null;
    if (context.eventType !== 'ABILITY_HIT' || !abilityId) return;

    const canon = (abilityId === 'ability_sword_leaping_strike' || abilityId === 'ability_sword_leapingstrike')
      ? 'leapingStrike'
      : abilityId;
    if (canon !== 'leapingStrike') return;

    // Safely inspect perks array
    const perks = Array.isArray(src.perks) ? src.perks : [];
    if (perks.length === 0) return;

    for (let i = 0; i < perks.length; i += 1) {
      const p = perks[i];
      if (!p || typeof p !== 'object' || typeof p.id === 'undefined' || p.id === null) continue;
      if (String(p.id) === METADATA.id) {
        return { baseDamageMultiplier: 1.2 };
      }
    }
    return;
  } catch (err) {
    console.error('[BUNKER] perks/empoweringLeapingStrike error (handled):', err, {
      eventType: context?.eventType,
      abilityId: context?.abilityId ?? context?.event?.abilityId,
      sourcePerksPreview: Array.isArray(context?.source?.perks) ? context.source.perks.slice(0,3) : context?.source?.perks
    });
    return;
  }
};

export default empoweringLeapingStrike;

