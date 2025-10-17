/**
 * @file leapingStrike.js
 * @description The Ability Bunker for the base Leaping Strike ability.
 * @version 1.2.0 - Corrected context variable from .combatant to .source
 */

// --- METADATA ---
export const METADATA = {
  id: 'ability_sword_leapingstrike',
  type: 'ABILITY',
};

// --- BUNKER ---
const leapingStrike = (context) => {
  // --- DEFINITIVE FIX ---
  // The context provides `source` and `target`, not `combatant`.
  const isEquipped = context.source?.masteries?.some(m => m.id === METADATA.id);
  if (!isEquipped) {
    return;
  }

  const abilityId = context.ability?.id ?? context.event?.abilityId ?? null;
  if (context.eventType !== 'ABILITY_HIT' || abilityId !== 'leapingStrike') {
    return;
  }

  // Return modifications instead of mutating shared context
  return { baseDamageMultiplier: 1.0 };
};

export default leapingStrike;

