/**
 * Mastery: Vital Embrace (Flail)
 * DoTs deal +7% damage (stacks with itself)
 */

const METADATA = {
  id: 'mastery_flail_vital_embrace',
  name: 'Vital Embrace',
  type: 'MASTERY',
  weapon: 'Flail',
  stroke: 1  // Damage modifier
};

function handler({ event, source, target, timestamp }) {
  // Only active when wielding Flail
  if (source.weaponType !== 'Flail') return null;
  
  // Only apply to DoT tick events
  if (event.action !== 'DOT_TICK') return null;
  
  // Return damage modifier (stacks with itself - each instance adds 7%)
  return {
    modifyDamage: [{
      id: 'mastery_flail_vital_embrace_dot_boost',
      category: 'MISC_DAMAGE',
      value: 0.07,  // +7% DoT damage
      source: 'Vital Embrace'
    }]
  };
}

export default { METADATA, handler };
