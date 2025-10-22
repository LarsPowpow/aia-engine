/**
 * Mastery: Leader of the Pack (Flail)
 * Base Damage +15%
 */

const METADATA = {
  id: 'mastery_flail_leader_of_the_pack',
  name: 'Leader of the Pack',
  type: 'MASTERY',
  weapon: 'Flail',
  stroke: 1  // Damage modifier
};

function handler({ event, source, target, timestamp }) {
  // Only active when wielding Flail
  if (source.weaponType !== 'Flail') return null;
  
  // Passive modifier - always active
  return {
    modifyDamage: [{
      id: 'mastery_flail_leader_of_the_pack_damage',
      category: 'MISC_DAMAGE',
      value: 0.15,  // +15% base damage
      source: 'Leader of the Pack'
    }]
  };
}

export default { METADATA, handler };
