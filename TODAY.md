00# Roadmap — Today (October 22, 2025)

## ✅ Completed: 9 Weapon Masteries Implementation

### Masteries Implemented (9 total)

**Sword Masteries (6):**
1. ✅ **Empowered Stab** - Heavy Attack grants 30% Empower for 5s
2. ✅ **Achilles Heel** - Light Attack finisher (3rd LA) adds 15% Rend for 2s
3. ✅ **Counter Attack** - On Block: Gain 3% Empower for 5s (stacks 5x)
4. ✅ **Opportunist** - Abilities do +10% damage to enemies affected by Slow
5. ✅ **Leadership** - Always-on 10% Empower (passive)
6. ✅ **Defensive Training** - On Block: 20% Fortify for 5s

**Flail Masteries (3):**
7. ✅ **Vital Embrace** - DoTs deal +7% damage (stacks with itself)
8. ✅ **Leader of the Pack** - Base damage +15% (passive)
9. ✅ **Spiky Impairment** - BLOCK_HIT applies hybrid debuff (5s cooldown, max 3 stacks):
   - 10% Weaken for 6s
   - 10% weapon damage/sec Arcane DoT for 6s

### Technical Achievements
- ✅ **Mastery System**: Weapon-specific bunkers (only active when weapon equipped)
- ✅ **Auto-Select UX**: Masteries auto-selected by default in loadout panel
- ✅ **Light Attack Chain Integration**: Used existing `event.isChainFinisher` for Achilles Heel
- ✅ **Block Event Triggers**: BLOCK_START and BLOCK_HIT support for defensive masteries
- ✅ **Conditional Damage Modifiers**: Target effect checking (Opportunist checks for SLOW)
- ✅ **Stackable Effects**: Counter Attack uses stackable Empower (max 5 stacks)
- ✅ **Cooldown System**: 5s internal cooldown for Spiky Impairment
- ✅ **Hybrid DoT**: Spiky Impairment applies both WEAKEN + Arcane DOT
- ✅ **DoT Damage Typing**: Added `damageType` support to DOT_TICK events (purple arcane DoTs!)

### Files Created

**Sword Mastery Bunkers:**
- `/src/simulation/bunkers/masteries/sword/mastery_sword_empowered_stab.js`
- `/src/simulation/bunkers/masteries/sword/mastery_sword_achilles_heel.js`
- `/src/simulation/bunkers/masteries/sword/mastery_sword_counter_attack.js`
- `/src/simulation/bunkers/masteries/sword/mastery_sword_opportunist.js`
- `/src/simulation/bunkers/masteries/sword/mastery_sword_leadership.js`
- `/src/simulation/bunkers/masteries/sword/mastery_sword_defensive_training.js`

**Flail Mastery Bunkers:**
- `/src/simulation/bunkers/masteries/flail/mastery_flail_vital_embrace.js`
- `/src/simulation/bunkers/masteries/flail/mastery_flail_leader_of_the_pack.js`
- `/src/simulation/bunkers/masteries/flail/mastery_flail_spiky_impairment.js`

**JSON Prefabs (ready for Firestore):**
- `mastery_sword_empowered_stab.json`
- `mastery_sword_achilles_heel.json`
- `mastery_sword_counter_attack.json`
- `mastery_sword_opportunist.json`
- `mastery_sword_leadership.json`
- `mastery_sword_defensive_training.json`
- `mastery_flail_vital_embrace.json`
- `mastery_flail_leader_of_the_pack.json`
- `mastery_flail_spiky_impairment.json`

### Files Modified
- `bunkerManifest.js`: Registered all 9 masteries (6 in effectBunkers, 3 in modifierBunkers)
- `CombatSimulatorPage.jsx`: Added auto-select for masteries, fixed damageType color check
- `choreography.js`: Fixed event ordering (Arcane Eruption consecutive, Block timing)
- `engine.js`: Added damageType to DOT_TICK eventAnalysis

### Key Patterns Established

```javascript
// Weapon-specific check (all masteries)
if (source.weaponType !== 'Sword') return null;

// Chain finisher detection (Achilles Heel)
if (!event?.isChainFinisher) return null;

// Block triggers
if (event?.action !== 'BLOCK_START') return null;  // Counter Attack, Defensive Training
if (event?.action !== 'BLOCK_HIT') return null;    // Spiky Impairment

// Target effect checking (Opportunist)
const hasSlow = target.activeEffects?.some(eff => eff.category === 'SLOW');

// Stackable effects (Counter Attack)
{
  stackable: true,
  maxStacks: 5,
  value: 0.03  // 3% per stack
}

// Cooldown tracking (Spiky Impairment)
const cooldownKey = 'mastery_flail_spiky_impairment';
if (!source.cooldowns) source.cooldowns = {};
const lastProc = source.cooldowns[cooldownKey] || -999;
if (timestamp - lastProc < 5) return null;
source.cooldowns[cooldownKey] = timestamp;

// Arcane DoT with full metadata (Spiky Impairment)
{
  id: 'spiky_impairment_dot',
  category: 'DOT',
  damageType: 'ARCANE',
  damagePercent: 0.10,
  metadata: {
    weaponType: source.weaponType,
    attributes: { ...source.attributes },
    damageType: 'ARCANE'  // Also in metadata for tick events
  }
}
```

### UX Improvements
- ✅ Masteries auto-selected by default (useEffect in CombatSimulatorPage)
- ✅ Search bar already functional in MasteryLoadoutPanel
- ✅ Arcane damage displays in purple (`text-purple-400`) for both direct hits and DoT ticks

### Next Steps
- [ ] Upload mastery JSON prefabs to Firestore
- [ ] Test all 9 masteries in combat sequences
- [ ] Verify stacking behavior (Counter Attack, Vital Embrace)
- [ ] Verify weapon-specific activation (switch between Sword and Flail)

---

**Philosophy Maintained:** "Smart Engine, Dumb Bunkers" - Masteries leverage existing engine systems (light attack chains, block events, effect stacking, cooldowns).

