// Minimal modifier bunker: applies a 20% empower to the source on first Light Attack
// Remove test misc damage effect
export default {
  id: 'modifier_misc_damage_20',
  handler: ({ event, source, timestamp }) => {
    // Remove expired effects (handled by engine, so this is redundant but safe)
    if (source.activeEffects) {
      source.activeEffects = source.activeEffects.filter(e => !e.expiresAt || e.expiresAt > timestamp);
    }
    // Only apply real effect logic here (if needed)
    return null;
  }
};