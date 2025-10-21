/**
 * Fortified II
 * Fortify you apply lasts 10% longer.
 */

const METADATA = {
  id: 'perk_fortified_ii',
  name: 'Fortified II',
  description: 'Fortify you apply lasts 10% longer.',
  type: 'MODIFIER_BUNKER',
  stroke: 1,
  sourceType: 'perk',
  bucket: 'weapon'
};

/**
 * Fortified II extends the duration of fortify effects
 * Engine will apply this multiplier to all outgoing fortifies
 */
function handler({ event }) {
  // Passive modifier - always active
  return {
    modifyDamage: [
      {
        id: 'fortified_ii_duration_boost',
        category: 'FORTIFY_DURATION',
        value: 0.10,  // +10% duration
        source: 'Fortified II'
      }
    ]
  };
}

export default { METADATA, handler };
