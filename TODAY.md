# Roadmap — Today (October 23, 2025)

## ✅ TODAY: Two New Flail Perks + Critical Bug Fixes

### What We Built
Implemented **2 new weapon perks** with critical double-application bug fixes that will prevent future issues.

**Perks Implemented:**
1. **Mending Vortex II** - Arcane Vortex hits 2 & 4 heal self for 23% of damage dealt
2. **Powerful Eruption II** - Arcane Eruption hits deal +10% damage per Impairment stack on target

### Critical Bugs Fixed & Patterns Documented

#### 1. **Effect Bunker Double-Application Bug** (Mending Vortex II)
**Problem:** Effect bunkers run TWICE per event:
- **First pass** (line 687-692): `effectRequests` is empty, bunkers create initial effects
- **Second pass** (line 697-702): `effectRequests` contains first-pass effects, allows reactive bunkers (Healing Breeze) to respond

**Impact:** Mending Vortex II was healing 46% instead of 23% (exactly double)

**Solution:** Add guard to only trigger on first pass:
```javascript
function handler({ event, source, finalDamage, effectRequests }) {
  // Only trigger on FIRST PASS (when effectRequests is undefined or empty)
  // This prevents double-application since effect bunkers run twice
  if (effectRequests && effectRequests.length > 0) return null;
  
  // Rest of handler logic...
}
```

**When to use this pattern:**
- ✅ Use for **primary effect creators** (damage heals, direct buffs/debuffs)
- ❌ Skip for **reactive effects** that need to respond to other effects (Healing Breeze amplifying heals)

---

#### 2. **Modifier Bunker Double-Application Bug** (Powerful Eruption II)
**Problem:** Modifier bunkers run TWICE for abilities with damage type splits:
- **First pass** (line 509): No damageType set, general modifiers applied
- **Second pass** (line 640): `damageType` explicitly set for split damage calculation (e.g., 130% Arcane on Eruption Hit 1)

**Impact:** Powerful Eruption II was applying +40% damage instead of +20% (exactly double)

**Solution:** Add guard to only trigger on damage type pass:
```javascript
function handler({ event, target, damageType }) {
  // Only trigger on damage type pass (when damageType is explicitly set)
  // This prevents double-application since modifier bunkers run twice for split damage
  if (!damageType) return null;
  
  // Rest of handler logic...
}
```

**When to use this pattern:**
- ✅ Use for **ability-specific damage modifiers** that should apply once per hit
- ❌ Skip for **passive always-on modifiers** (Leader of the Pack, Leadership) that don't care about damage splits

---

#### 3. **Impairment Stack Counting Bug** (Powerful Eruption II)
**Problem:** Each Impairment "stack" creates 2 effects with unique IDs:
- `arcane_eruption_impairment_weaken_1` (WEAKEN)
- `arcane_eruption_impairment_dot_1` (DOT)

Filter `effect.id.includes('impairment')` was counting 4 effects instead of 2 stacks.

**Solution:** Count unique stack numbers by extracting from IDs:
```javascript
const impairmentStackNumbers = new Set();

for (const effect of target.activeEffects) {
  if (effect.id && effect.id.includes('impairment')) {
    // Extract stack number from IDs like "arcane_eruption_impairment_weaken_1"
    const match = effect.id.match(/_(\d+)$/);
    if (match) {
      impairmentStackNumbers.add(match[1]);  // Add the stack number
    } else {
      // For effects without numbers (like spiky_impairment), use the effect ID itself
      impairmentStackNumbers.add(effect.id);
    }
  }
}

const impairmentStacks = impairmentStackNumbers.size;
```

---

#### 4. **Base Damage vs Final Damage** (Arcane Eruption Heal)
**Problem:** Arcane Eruption Hit 2 heal was using base weapon damage (35% × `calculateWeaponDamage()`), so it didn't scale with Powerful Eruption's damage increase.

**Design Decision:** Heals should scale with **actual damage dealt** (`finalDamage`) for intuitive gameplay feel.

**Solution:** Changed heal calculation:
```javascript
// BEFORE (didn't scale with modifiers)
const weaponDamage = calculateWeaponDamage(source.weaponType, source.attributes);
const healAmount = Math.round(weaponDamage * 0.35);

// AFTER (scales with actual damage dealt)
const healAmount = Math.round(finalDamage * 0.35);
```

**Standard Pattern Established:**
- ✅ **Percentage-based heals/effects**: Use `finalDamage` (actual damage dealt)
- ✅ **Damage-triggered effects**: Use `finalDamage` for reactive calculations
- ❌ **Fixed-value heals**: Use `calculateWeaponDamage()` only when heal shouldn't scale

---

### Files Created

**Perk Bunkers:**
- `/src/simulation/bunkers/perks/weapon/perk_mending_vortex_ii.js`
- `/src/simulation/bunkers/perks/weapon/perk_powerful_eruption_ii.js`

**JSON Prefabs:**
- `/src/simulation/bunkers/prefabs/perk_mending_vortex_ii.json`
- `/src/simulation/bunkers/prefabs/perk_powerful_eruption_ii.json`

### Files Modified
- **bunkerManifest.js**: Registered both perks (Mending Vortex in effectBunkers, Powerful Eruption in modifierBunkers)
- **arcaneEruption.js**: 
  - Added first-pass guard to prevent double-application
  - Changed heal from base weapon damage to `finalDamage * 0.35`

### Validation Results

**Mending Vortex II (23% of damage dealt):**
- Vortex Hit 2: 531 damage → 122 heal (23.0%) ✅
- Vortex Hit 4: 467 damage → 107 heal (22.9%) ✅

**Powerful Eruption II (+10% per stack):**
- Scenario 1 (raw): Hit 1 = 846, Hit 2 = 976 (baseline) ✅
- Scenario 2 (2 stacks): Hit 1 = 846 (no stacks yet), Hit 2 = 1172 (+20%) ✅
- Scenario 3 (with Spiky): Hit 1 = 1015 (+20%), Hit 2 = 1367 (+40%) ✅

**Arcane Eruption Heal Scaling (35% of damage dealt):**
- Scenario 1 (raw): 976 damage → 342 heal (35.0%) ✅
- Scenario 2 (Powerful): 1172 damage → 410 heal (35.0%) ✅
- Scenario 3 (Powerful + Spiky): 1367 damage → 478 heal (35.0%) ✅

---

### Key Patterns for Future Reference

```javascript
// EFFECT BUNKER - First pass guard (prevents double-application)
function handler({ event, source, finalDamage, effectRequests }) {
  if (effectRequests && effectRequests.length > 0) return null;  // Only first pass
  // ... create effects
}

// MODIFIER BUNKER - Damage type pass guard (prevents double-application)
function handler({ event, target, damageType }) {
  if (!damageType) return null;  // Only on damage type split pass
  // ... modify damage
}

// COUNTING MULTI-EFFECT STACKS - Extract unique identifiers
const uniqueStacks = new Set();
for (const effect of target.activeEffects) {
  const match = effect.id.match(/_(\d+)$/);  // Extract stack number
  if (match) uniqueStacks.add(match[1]);
}
const stackCount = uniqueStacks.size;

// PERCENTAGE-BASED HEALS - Use finalDamage for scaling
const healAmount = Math.round(finalDamage * 0.35);  // Scales with modifiers
```

---

## ✅ YESTERDAY: Complete Attribute Bonus System (17 Bunkers)

# Roadmap — Yesterday (October 22, 2025)

## ✅ TONIGHT: Complete Attribute Bonus System (17 Bunkers)

### What We Built
Implemented **all 17 attribute bonus bunkers** from start to finish - JSON prefabs, bug fixes, testing, and UI enhancements.

**Attribute Bonuses Implemented:**
- **STR (6):** 25 (LA +3%), 50 (HA +5%), 100 (Phys +5%), 200 (CC +5%), 300 (Base +3%), 350 (Ability +5%)
- **DEX (4):** 25 (Crit +5%), 100 (Base +5%), 150 (DoT +5%), 350 (Crit +10% Empowered)
- **INT (5):** 25 (CritDmg +3%), 50 (DotTarget +3%), 150 (Arcane +3%), 200 (DoT +5%), 350 (Ability +3%)
- **FOC (2):** 50 (InHeal +5%), 200 (Buff +10%, HoT +10%)

### Critical Bugs Fixed
1. **Case Sensitivity Bug**: Attributes stored as uppercase (`STR`, `DEX`, `INT`, `FOC`) but bunkers checking lowercase
   - Fixed all 17 bunkers: `source.attributes?.str` → `source.attributes?.STR`
2. **DamageType Not In Context**: STR 100 and INT 150 couldn't access `damageType`
   - Fixed parameter destructuring: `{ event, source, target, context, timestamp, damageType }`
   - Added engine defaulting: `const damageType = (event.damageType === 'ARCANE') ? 'ARCANE' : 'PHYSICAL';`
3. **SourceId Collision**: Fortify effects using `sourceId: 'Player'` prevented stacking
   - Changed to bunker-specific IDs: `sourceId: 'perk_fortifying_shield_rush'`, `sourceId: 'mastery_sword_defensive_training'`

### New Features
- **Fortifying Shield Rush Perk**: 31% Fortify for 6s on Shield Rush hit
- **Inspector Modal Redesign**: 
  - Removed "Damage Modifiers (from Bunkers)" table
  - Added "Active Attribute Bonuses" section with 4-column table (STR/DEX/INT/FOC)
  - Color-coded columns: STR (red), DEX (green), INT (sky-blue), FOC (yellow)
  - Changed cyan → sky-blue throughout modal for cooler tone

### Files Created (17 JSON Prefabs)
All in `/src/simulation/bunkers/prefabs/`:
- `ability_bonus_str_25.json` through `ability_bonus_str_350.json` (6)
- `ability_bonus_dex_25.json` through `ability_bonus_dex_350.json` (4)
- `ability_bonus_int_25.json` through `ability_bonus_int_350.json` (5)
- `ability_bonus_foc_50.json`, `ability_bonus_foc_200.json` (2)
- `perk_fortifying_shield_rush.json`

### Files Modified
- **All 17 ability bonus .js files**: Fixed uppercase attribute checking
- **engine.js**: Added damageType defaulting, FORTIFY debug logging
- **perk_fortifying_shield_rush.js**: Fixed sourceId, proper applyEffects structure
- **mastery_sword_defensive_training.js**: Fixed sourceId for stacking
- **InspectorPanel.jsx**: Complete UI redesign with attribute bonus table, sky-blue color scheme

### Technical Patterns
```javascript
// Attribute threshold checking (uppercase!)
const strValue = source.attributes?.STR || 0;
if (strValue < 100) return null;

// DamageType parameter access
export default function ability_bonus_str_100({ event, source, target, context, timestamp, damageType }) {
  if (damageType !== 'PHYSICAL') return null;
  
// Effect sourceId for proper stacking
applyEffects: [{
  sourceId: 'perk_fortifying_shield_rush',  // Unique ID, not 'Player'
  id: 'fortifying_shield_rush_fortify'
}]

// Attribute bonus UI calculation
const getEligibleAttributeBonuses = () => {
  const attributes = combatantState?.attributes || {};
  return bonuses.filter(b => attributes[attr] >= b.threshold);
};
```

### Ready for Production
- ✅ All 17 JSON prefabs ready for Firestore upsert
- ✅ All bugs fixed and tested
- ✅ Inspector Modal showing active bonuses beautifully
- ✅ Fortifying Shield Rush perk working with proper stacking

---

## ✅ Earlier: 9 Weapon Masteries Implementation

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

