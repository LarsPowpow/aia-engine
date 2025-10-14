import React, { useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';

// Master lists of all legacy documents to be purged.
const sourceIdsToDelete = [
  'ability_flail_slam', 'upgrade_flail_slam_upgrade1', 'upgrade_flail_slam_upgrade2', 'upgrade_flail_slam_upgrade3',
  'ability_flail_blast', 'upgrade_flail_blast_upgrade1', 'upgrade_flail_blast_upgrade2', 'upgrade_flail_blast_upgrade3',
  'ability_flail_burst', 'upgrade_flail_burst_upgrade1', 'upgrade_flail_burst_upgrade2', 'upgrade_flail_burst_upgrade3',
  'passive_flail_eldritch_passive1', 'passive_flail_eldritch_passive2', 'passive_flail_eldritch_passive3', 'passive_flail_eldritch_passive4',
  'passive_flail_eldritch_passive5', 'passive_flail_eldritch_passive6', 'ultimate_flail_eldritch', 'ability_flail_charge',
  'upgrade_flail_charge_upgrade1', 'upgrade_flail_charge_upgrade2', 'upgrade_flail_charge_upgrade3', 'upgrade_flail_charge_upgrade4',
  'ability_flail_trip', 'upgrade_flail_trip_upgrade1', 'upgrade_flail_trip_upgrade2', 'upgrade_flail_trip_upgrade3',
  'ability_flail_defensivestrike', 'upgrade_flail_defensivestrike_upgrade1', 'upgrade_flail_defensivestrike_upgrade2',
  'passive_flail_crusader_passive1', 'passive_flail_crusader_passive2', 'passive_flail_crusader_passive3', 'passive_flail_crusader_passive4',
  'passive_flail_crusader_passive5', 'passive_flail_crusader_passive6', 'ultimate_flail_crusader'
];

const effectIdsToDelete = [
  'effect_impairment_dot', 'effect_impairment_weaken', 'effect_arcane_smite_damage', 'effect_arcane_smite_hazard_apply',
  'effect_epic_flail_cooldown', 'effect_ironclad_superiority_round_modifier', 'effect_ironclad_superiority_kite_modifier',
  'effect_ironclad_superiority_tower_fortify', 'effect_deflecting_frailty_aura', 'effect_arcane_vortex_damage',
  'effect_arcane_vortex_empower', 'effect_flailbird_root', 'effect_accelerated_advantage_haste_self', 'effect_accelerated_advantage_haste_allies',
  'effect_flailing_stability_cleanse', 'effect_flailing_stability_immunity', 'effect_flailing_stability_heal',
  'effect_arcane_eruption_initial_damage', 'effect_arcane_eruption_followup_damage', 'effect_crippling_strike_slow',
  'effect_debilitating_extension_modifier', 'effect_supportive_blessing_chain_heal', 'effect_oppressive_advantage_heal_buff',
  'effect_oppressive_advantage_haste', 'effect_weighted_superiority_heavy', 'effect_weighted_superiority_medium',
  'effect_weighted_superiority_light', 'effect_happy_flails_exhaust', 'effect_vital_embrace_lifesteal',
  'effect_vital_embrace_dot_extend', 'effect_leader_of_the_pack_solo_damage', 'effect_leader_of_the_pack_group_empower',
  'effect_better_together_heal_aura', 'effect_barrage_leap_damage', 'effect_barrage_land_damage', 'effect_barrage_stagger',
  'effect_defensive_rush_fortify', 'effect_abiding_superiority_round_modifier', 'effect_abiding_superiority_kite_slow',
  'effect_abiding_superiority_tower_grit', 'effect_bulldoze_modifier', 'effect_flailure_to_launch_damage',
  'effect_flailure_to_launch_fortify', 'effect_trip_damage', 'effect_trip_knockdown', 'effect_flailing_duration_debuff',
  'effect_youve_got_flail_rend', 'effect_youve_got_flail_fortify', 'effect_destabilize_followup_attack',
  'effect_warding_bludgeon_damage', 'effect_warding_bludgeon_fortify', 'effect_stable_impairment_stam_dr',
  'effect_stable_impairment_block_retaliate', 'effect_best_friends_link', 'effect_vital_suppressant_dr',
  'effect_vital_suppressant_stam_dmg_reduction', 'effect_cured_flailment_cleanse', 'effect_reductive_superiority_round',
  'effect_reductive_superiority_kite', 'effect_reductive_superiority_tower', 'effect_flail_mary_stamina',
  'effect_mitigated_protection_buff', 'effect_reinforced_vitality_health', 'effect_human_shield_link'
];


const PurgePanel = ({ db, addLog }) => {
  const [isPurging, setIsPurging] = useState(false);

  const handlePurge = async () => {
    if (!window.confirm('CRITICAL ACTION: This will permanently delete all Flail Mastery documents from the UKB. Are you absolutely sure?')) {
      return;
    }

    setIsPurging(true);
    const totalToDelete = sourceIdsToDelete.length + effectIdsToDelete.length;
    addLog({ message: `Operation: Purge initiated. Targeting ${totalToDelete} documents...`, type: 'info', timestamp: new Date() });

    try {
      const batch = writeBatch(db);

      sourceIdsToDelete.forEach(id => {
        const docRef = doc(db, 'ukb_sources_v2', id);
        batch.delete(docRef);
      });

      effectIdsToDelete.forEach(id => {
        const docRef = doc(db, 'ukb_effects_v2', id);
        batch.delete(docRef);
      });

      await batch.commit();

      addLog({ message: `Purge complete. ${totalToDelete} legacy documents successfully deleted.`, type: 'success', timestamp: new Date() });
    } catch (error) {
      console.error('Purge operation failed:', error);
      addLog({ message: `Purge operation failed: ${error.message}`, type: 'error', timestamp: new Date() });
    }

    setIsPurging(false);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-red-500/50">
      <h3 className="text-lg font-semibold text-red-400 mb-2">
        Operation: Purge
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Perform a surgical bulk deletion of all Flail Mastery documents to prepare for high-fidelity data ingestion. This action is irreversible.
      </p>
      <button
        onClick={handlePurge}
        disabled={isPurging}
        className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed w-full"
      >
        {isPurging ? 'Purging...' : 'Execute Flail Mastery Purge'}
      </button>
    </div>
  );
};

export default PurgePanel;