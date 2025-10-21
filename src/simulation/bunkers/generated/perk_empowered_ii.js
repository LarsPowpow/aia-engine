/**
 * Empowered II
 * Empower you apply lasts 12% longer.
 */

const METADATA = {
  id: 'perk_empowered_ii',
  name: 'Empowered II',
  description: 'Empower you apply lasts 12% longer.',
  type: 'MODIFIER_BUNKER',
  stroke: 1,
  sourceType: 'perk',
  bucket: 'weapon'
};

/**
 * Empowered II extends the duration of empower effects
 * Engine will apply this multiplier to all outgoing empowers
 */
function handler({ event }) {
  // Passive modifier - always active
  return {
    modifyDamage: [
      {
        id: 'empowered_ii_duration_boost',
        category: 'EMPOWER_DURATION',
        value: 0.12,  // +12% duration
        source: 'Empowered II'
      }
    ]
  };
}

export default { METADATA, handler };
