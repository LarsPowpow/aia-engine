/**
 * Mastery: Achilles Heel (Sword)
 * Light Attack Finisher (3rd consecutive light attack) adds 15% Rend for 2s
 */

const METADATA = {
  id: 'mastery_sword_achilles_heel',
  name: 'Achilles Heel',
  type: 'MASTERY',
  weapon: 'Sword',
  stroke: 2
};

function handler({ event, source, target, timestamp }) {
  // Only trigger on Light Attacks
  if (event?.action !== 'LIGHT_ATTACK') return null;
  
  // Only active when wielding Sword
  if (source.weaponType !== 'Sword') return null;
  
  // Only trigger on chain finisher (uses existing engine tracking)
  if (!event?.isChainFinisher) return null;
  
  return {
    applyEffects: [{
      id: 'mastery_sword_achilles_heel_rend',
      category: 'REND',
      value: 0.15,  // 15% Rend
      duration: 2,
      sourceId: 'mastery_sword_achilles_heel',
      targetId: target.id,
      metadata: {
        sourceName: 'Achilles Heel'
      }
    }]
  };
}

export default { METADATA, handler };
