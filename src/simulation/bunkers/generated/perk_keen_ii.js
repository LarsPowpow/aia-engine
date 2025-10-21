/**
 * Keen II
 * +4% critical chance.
 */

const METADATA = {
  id: 'perk_keen_ii',
  name: 'Keen II',
  description: '+4% critical chance.',
  type: 'MODIFIER_BUNKER',
  stroke: 1,
  sourceType: 'perk',
  bucket: 'weapon'
};

/**
 * Keen II provides a passive crit chance modifier
 * Engine will include this when rolling for crits
 */
function handler({ event }) {
  // Passive modifier - always active
  return {
    modifyDamage: [
      {
        id: 'keen_ii_crit_boost',
        category: 'CRIT_CHANCE',
        value: 0.04,  // +4% crit chance
        source: 'Keen II'
      }
    ]
  };
}

export default { METADATA, handler };
