# Architecture Decision Records (ADRs)

## Purpose
Document the "why" behind key design choices to preserve institutional knowledge across AI sessions.

---

## ADR-001: Why Two-Stroke Event Processing?

**Date**: 2025-10-16  
**Status**: Implemented

**Context**: Need to separate damage calculation from effect application.

**Decision**: Stroke 1 = modifiers (damage calculation), Stroke 2 = effects (buffs/DoTs).

**Reasoning**:
- Damage needs to be calculated BEFORE effects are applied
- Effects might depend on damage values (e.g., "heal for X% of damage dealt")
- Allows bunkers to inspect damage before deciding what effects to apply
- Separates concerns: damage math vs. state mutation
- Makes debugging easier (stroke 1 logs, then stroke 2 logs)

**Consequences**:
- More complex event processing flow
- But cleaner separation of concerns
- Easier to debug (can inspect modifierRequests before effectRequests)
- Future-proof for complex interactions

**Code Location**: `/src/simulation/engine.js` - twoStrokeProcessEvent()

---

## ADR-002: Why Pre-calculate DoT Ticks?

**Date**: 2025-10-16  
**Status**: Implemented

**Context**: DoTs need to tick at regular intervals (1.0s), but combat events occur at irregular times.

**Decision**: Pre-calculate all tick times at simulation start as a simple array of timestamps.

**Alternatives Considered**:
1. **On-demand tick calculation** - Calculate ticks when processing each event
   - Rejected: Too slow, complex logic to determine "did we miss a tick?"
2. **Event-driven ticks** - Generate tick events dynamically based on active DoTs
   - Rejected: Hard to guarantee precise 1.0s intervals, complicated state tracking

**Reasoning**:
- Performance: O(1) setup cost, O(n) lookup during simulation
- Predictability: Exact tick times guaranteed (0.5s, 1.0s, 1.5s, ...)
- Simplicity: Ticks are just timestamps in an array, easy to debug
- Matches New World's server tick rate behavior

**Consequences**:
- Fixed tick rate (0.5s granularity)
- Memory overhead for tick array (~200 entries for 100s simulation - negligible)
- All DoTs must share same tick schedule (acceptable limitation)

**Code Location**: `/src/simulation/engine.js` - lines 100-150 (tick time generation)

---

## ADR-003: Why Dynamic DoT Damage Calculation?

**Date**: 2025-10-16  
**Status**: Implemented (**Corrected 2025-10-20**)

**Context**: DoT damage could be snapshotted at application or calculated dynamically on each tick.

**Decision**: Calculate DoT damage dynamically on each tick using current combatant stats and modifiers.

**Reasoning**:
- More interesting gameplay: DoTs benefit from buffs applied after them
- Rewards timing: Players can buff themselves after applying DoT for increased damage
- Simpler bunker code: Just store base damage (11% weapon damage), engine handles scaling
- More flexible: DoTs automatically scale with any stat changes (empower, rend, misc damage)

**Implementation**:
- Bunker stores base damage in `effect.value` (e.g., weaponDamage * 0.11)
- Engine reads current damage modifiers (empower, rend, misc damage, etc.) on each tick
- Tick damage = base damage × (1 + current modifiers)

**Consequences**:
- DoTs benefit from buffs applied after them (INTENDED BEHAVIOR - very cool!)
- DoTs benefit from debuffs applied after them (INTENDED BEHAVIOR - very cool!)
- Damage can vary between ticks if buffs expire mid-DoT (dynamic!)
- More interesting optimization for players (when to buff for max DoT damage?)
- Slightly more complex tick processing (need to read current combatant state)

**Example**:
```
Apply Keenly Jagged bleed at 1.5s (base: 100 dmg/tick)
Tick at 2.0s: 100 damage (no buffs)
Gain 20% empower at 7.0s
Tick at 8.0s: 120 damage (100 * 1.20) ← Dynamic scaling!
Empower expires at 9.0s
Tick at 10.0s: 100 damage (back to base)
```

**Code Location**: 
- Bunker: `/src/simulation/bunkers/generated/perk_keenly_jagged_ii.js` (stores base damage)
- Engine: `/src/simulation/engine.js` (DoT tick processing calculates with current modifiers)

---

## ADR-004: Why targetId in Effect Pipeline?

**Date**: 2025-10-18  
**Status**: Implemented (Fixed)

**Context**: Engine needs to know which combatant to apply effects to. Initially, engine guessed based on effect category, causing self-heals to apply to opponent.

**Problem**: Healing Defense heal was applying to Target Dummy instead of Player.

**Decision**: Bunkers must set `targetId` explicitly, and engine must preserve it through grouping.

**Reasoning**:
- Bunkers have full context about who should receive the effect
- Engine shouldn't guess based on effect category (too error-prone)
- Explicit is better than implicit (Zen of Python applies to game logic too)
- Self-targeting effects (heals, self-buffs) are common and need first-class support

**Implementation Details**:
```javascript
// Engine grouping logic must check targetId FIRST
const applyToSource = eff.targetId 
    ? (eff.targetId === source.id)  // Use bunker's explicit target
    : (['MISC_DAMAGE', 'EMPOWER'].includes(eff.category) && source.id === 'Player');  // Fallback

// Preserve original targetId when grouping
grouped[key] = { ...eff, targetId: eff.targetId || targetKey };
```

**Consequences**:
- All bunkers must set `targetId` (enforced by convention)
- Engine grouping logic more complex (but more correct)
- Self-targeting effects work correctly

**Code Location**: `/src/simulation/engine.js` (lines 404-412)

---

## ADR-005: Why No activeEffects for Instant Heals?

**Date**: 2025-10-18  
**Status**: Implemented

**Context**: Instant heals (duration: 0) were being added to `activeEffects[]`, cluttering the UI's Raw State tab with irrelevant data.

**Decision**: Don't add instant effects (duration === 0) to `activeEffects` array.

**Reasoning**:
- Instant effects are "done" immediately - no ongoing state to track
- `activeEffects` is meant for persistent effects (DoTs, buffs, debuffs)
- Clutters UI with data that's not "active" in any meaningful sense
- Users expect Raw State to show only ongoing effects

**Consequences**:
- Instant effects (heals, instant damage) only appear in `eventAnalysis`
- HoTs (duration > 0) still added to `activeEffects` (correct behavior)
- UI must filter `duration !== 0` to avoid showing expired instant effects
- State manager needs conditional logic: `if (duration > 0) { activeEffects.push(...) }`

**Code Location**: 
- State Manager: `/src/simulation/stateManager.js` (lines 68-75)
- UI Filter: `/src/components/InspectorPanel.jsx` (lines 168-172)

---

## ADR-006: Why Per-Source Anti-Stacking for Buffs?

**Date**: 2025-10-20  
**Status**: Implemented (Corrected)

**Context**: Multiple empower buffs from same source vs. different sources. Need clear stacking rules.

**Decision**: Same source refreshes duration, different sources stack up to category cap.

**Reasoning**:
- Matches New World behavior (verified by player)
- Prevents single source from stacking infinitely (e.g., spamming Counter Attack)
- Encourages perk diversity: multiple sources stack, so variety is rewarded
- Caps prevent runaway stacking: 50% Empower, 70% Rend, 50% Fortify
- MISC_DAMAGE uncapped to allow multiplicative scaling

**Stacking Rules Table**:

| Category | Anti-Stack Check | Cap | Behavior |
|----------|-----------------|-----|----------|
| DOT | by `id` | None | No stack, no refresh |
| EMPOWER | by `sourceId` | 50% | Same source refreshes, different stack |
| REND | by `sourceId` | 70% | Same source refreshes, different stack |
| FORTIFY | by `sourceId` | 50% | Same source refreshes, different stack |
| MISC_DAMAGE | by `sourceId` | ∞ | Same source refreshes, different stack |

**Cap Enforcement**: When new effect would exceed cap, apply partial amount to reach exactly cap%.

**Consequences**:
- Need to track `sourceId` for all effects (already done)
- State manager logic more complex (checks by sourceId, calculates totals, enforces caps)
- Players incentivized to use multiple different buff sources
- Clear, predictable stacking behavior

**Code Location**: `/src/simulation/stateManager.js` (lines 97-140)

---

## ADR-007: Why valueType Pattern for Percentage Effects?

**Date**: 2025-10-18  
**Status**: Implemented

**Context**: Healing effects specified as percentages (2.5%) need to be converted to actual HP for display and application.

**Decision**: Use `valueType: 'baseHealth'` pattern where bunker stores percentage, engine/UI converts to HP.

**Reasoning**:
- Separation of concerns: Bunker defines game rules (2.5%), engine/UI handles rendering (263 HP)
- Allows same effect to work with different combatants (scales with their baseHealth)
- Makes bunker code simpler: just return 0.025, not calculate HP
- Future-proof: Can add other valueTypes (maxHealth, weaponDamage, etc.)

**Pattern**:
```javascript
// Bunker returns:
{
    value: 0.025,  // 2.5%
    valueType: 'baseHealth',  // How to interpret value
}

// Engine/UI converts:
const baseHealth = target?.baseHealth || target?.maxHealth || 0;
const actualHP = value * baseHealth;  // 0.025 * 10500 = 262.5
```

**Consequences**:
- All code handling effects must check `valueType` and convert appropriately
- UI calculations must match engine calculations (easy to get out of sync)
- But effect definitions stay clean and game-logic focused

**Code Location**: 
- Bunker: `/src/simulation/bunkers/generated/perk_healing_defense_ii.js`
- Engine: `/src/simulation/engine.js` (lines 165-171)
- UI: `/src/components/CombatSimulatorPage.jsx` (healing calculation)

---

## ADR-008: Why Separate Bunker Files per Perk?

**Date**: 2025-10-16 (Original architecture)  
**Status**: Implemented

**Context**: Need to organize perk logic. Could use single file with switch statement, or individual files.

**Decision**: Each perk gets its own file in `/src/simulation/bunkers/generated/`.

**Reasoning**:
- Easier to navigate: Find perk by filename, not by searching large file
- Cleaner git history: Changes to one perk don't touch others
- Easier to test: Can test perks in isolation
- Scales better: Can have 100+ perks without monolithic file
- Clear ownership: One file = one perk = one responsibility

**Naming Convention**: `perk_<name>.js` or `ability_<name>.js`

**Registration**: All bunkers registered in `/src/simulation/bunkers/bunkerRegistry.js`

**Consequences**:
- More files to manage (acceptable with good naming)
- Registry file needs to be updated when adding perks (simple pattern)
- Easier for AI to modify specific perk without touching others

**Code Location**: `/src/simulation/bunkers/generated/` (directory structure)

---

---

## ADR-009: Why 3-Bunker vs 4-Bunker Runeglass Pattern?

**Date**: 2025-10-21  
**Status**: Implemented

**Context**: Runeglass perks can be simple (damage conversion) or complex (conditional damage with multiple effects).

**Decision**: 
- **3 bunkers**: Damage conversion runeglasses (handled in-engine)
- **4+ bunkers**: Conditional mechanics (declarative approach)

**Reasoning**:
- **Damage conversion is a modifier concept**, not a condition
  - Engine already has `convertDamage` system in modifyDamage()
  - Example: 50% physical → arcane (Empowered Sapphire)
  - Requires only: weapon modifier, hex effect, armor modifier
  
- **Conditional mechanics need multiple pieces**:
  - Condition checker (e.g., CC detection, block counter)
  - Effect applier (stacks, DoTs)
  - Damage modifier (reads condition state)
  - Additional bonuses (armor, weapon)
  - Example: Empowered Jasper = stack effect + hex + retaliate modifier + armor

**Implementation Pattern**:

```javascript
// 3-BUNKER: Damage Conversion (Empowered Sapphire)
// 1. Weapon Modifier - Conversion
{
  modifyDamage: {
    convertDamage: { from: 'physical', to: 'arcane', percent: 0.50 }
  }
}

// 2. Weapon Effect - Hex DoT
{
  applyEffects: [{
    category: 'DOT',
    damageType: 'ARCANE',
    // ... metadata with weaponType and attributes
  }]
}

// 3. Armor Modifier - Arcane boost
{
  modifyDamage: { multiplier: 1.02 }  // if damageType === 'ARCANE'
}

// 4-BUNKER: Conditional Mechanics (Empowered Jasper)
// 1. Effect Bunker - Stack Applier
{
  applyEffects: [{
    id: 'empowered_jasper_retaliate_stack',
    category: 'EMPOWER',
    stackable: true,
    maxStacks: 3
  }]
}

// 2. Effect Bunker - Hex DoT
{
  applyEffects: [{ category: 'DOT', ... }]
}

// 3. Modifier Bunker - Retaliate Reader
{
  modifyDamage: {
    multiplier: 1 + (stacks * 0.08)  // Reads activeEffects
  }
}

// 4. Modifier Bunker - Armor boost
{
  modifyDamage: { multiplier: 1.02 }
}
```

**Consequences**:
- Clear separation: simple vs. complex mechanics
- Damage conversion leverages existing engine capability
- Conditional mechanics fully declarative (bunkers handle all logic)
- Easy to understand which pattern applies to new runeglass

**Code Location**: 
- 3-bunker: `/src/simulation/bunkers/modifiers/runeglass_empowered_sapphire_*.js`
- 4-bunker: `/src/simulation/bunkers/effectBunkers/runeglass_empowered_jasper_*.js`

---

## ADR-010: Why Shared Stack Effects Between Runeglass Variants?

**Date**: 2025-10-21  
**Status**: Implemented

**Context**: Empowered Jasper and Punishing Jasper both use retaliate stacking, but apply different bonuses.

**Decision**: Share the same stack effect ID (`empowered_jasper_retaliate_stack`) between variants, but have separate modifier bunkers.

**Reasoning**:
- **Stack effect is identical**: Both apply +8% EMPOWER per stack, max 3, 5s duration
- **Triggers are the same**: BLOCK_START, BLOCK_HIT, BLOCK_END
- **Only consumption differs**: 
  - Empowered Jasper: retaliate modifier + Hex + arcane armor
  - Punishing Jasper: retaliate modifier + flat damage bonuses
- **Prevents duplicate stacks**: Can't run both runeglasses and get 6 stacks
- **DRY principle**: Don't repeat identical effect logic

**Implementation**:
```javascript
// Shared effect (ONE bunker, TWO JSON prefabs for UI selection)
// Code: runeglass_empowered_jasper_retaliate_stack.js
const METADATA = {
  id: 'runeglass_empowered_jasper_retaliate_stack',  // ← Same ID
  // ...
};

// JSON 1: runeglass_empowered_jasper_retaliate_stack.json
{ "id": "runeglass_empowered_jasper_retaliate_stack", ... }

// JSON 2: runeglass_punishing_jasper_retaliate_stack.json
{ "id": "runeglass_punishing_jasper_retaliate_stack", ... }
// Note: Different JSON IDs for UI, but code uses same bunker!

// Separate modifiers (read the shared stack)
// Empowered reads stack → applies to arcane damage
// Punishing reads stack → applies to all damage
```

**Consequences**:
- One effect bunker, multiple JSON prefabs (UI selection flexibility)
- Can't stack Empowered + Punishing (uses same effect ID)
- Modifiers can read stack regardless of which JSON was selected
- Clean separation: stack application vs. stack consumption

**Code Location**: 
- Shared effect: `/src/simulation/bunkers/effectBunkers/runeglass_empowered_jasper_retaliate_stack.js`
- Empowered modifier: `/src/simulation/bunkers/modifiers/runeglass_empowered_jasper_retaliate_modifier.js`
- Punishing modifier: `/src/simulation/bunkers/modifiers/runeglass_punishing_jasper_retaliate_modifier.js`

---

## ADR-011: Why Hex DoT Needs weaponType and attributes in Metadata?

**Date**: 2025-10-21  
**Status**: Implemented (Fixed)

**Context**: Empowered Jasper Hex was showing 0 damage and wrong label in UI.

**Problem**: Hex DoT applied without `weaponType` and `attributes` in metadata, causing:
1. Damage calculation to fail (no weapon damage base)
2. UI display showing wrong source name
3. DoT ticks dealing 0 damage

**Decision**: ALL Hex DoT effects MUST include full metadata:
```javascript
{
  category: 'DOT',
  damageType: 'ARCANE',
  value: weaponDamage * 0.08,  // Requires weaponDamage!
  metadata: {
    sourceName: 'Empowered Jasper Hex',  // UI display
    weaponType: event.weapon,             // REQUIRED for damage calc
    attributes: source.attributes         // REQUIRED for scaling
  }
}
```

**Reasoning**:
- **weaponType**: Engine needs this to recalculate weapon damage on each tick
- **attributes**: Damage scales with INT/FOC/STR based on weapon
- **Dynamic damage**: DoTs calculate damage per tick using current stats
- **Without these**: DoT base damage = 0, no scaling possible

**Root Cause**: Copy-paste from Empowered Malachite Hex, which had metadata, to Empowered Jasper Hex, which was missing it.

**Consequences**:
- All new Hex DoT bunkers MUST copy full metadata pattern
- Easy to miss during implementation (not caught by type system)
- Debugging requires checking DoT tick logs for damage = 0

**Code Pattern (Template)**:
```javascript
// ✅ CORRECT: Full metadata
const weaponDamage = calculateWeaponDamage(
  event.weapon,
  source.attributes,
  source
);

return {
  applyEffects: [{
    id: 'hex_dot_id',
    category: 'DOT',
    damageType: 'ARCANE',
    value: weaponDamage * 0.08,
    duration: 2,
    sourceId: source.id,
    targetId: target.id,
    metadata: {
      sourceName: 'Hex Effect Name',
      weaponType: event.weapon,      // ← REQUIRED
      attributes: source.attributes  // ← REQUIRED
    }
  }]
};

// ❌ WRONG: Missing metadata
return {
  applyEffects: [{
    id: 'hex_dot_id',
    category: 'DOT',
    value: weaponDamage * 0.08,
    // Missing metadata! Will deal 0 damage!
  }]
};
```

**Code Location**: 
- Fixed: `/src/simulation/bunkers/effectBunkers/runeglass_empowered_jasper_hex.js`
- Pattern: All `runeglass_*_hex.js` files

---

## ADR-012: Why Firestore Document ID Must Match Bunker METADATA.id?

**Date**: 2025-10-21  
**Status**: Enforced (Critical Rule)

**Context**: Engine filters bunkers based on `allSources` array from UI, matching by ID.

**Rule**: Firestore document ID === bunker `METADATA.id` === JSON prefab `"id"` field

**Why This Matters**:
1. **UI selection**: User selects runeglass in UI by Firestore doc ID
2. **Engine filtering**: Engine receives `allSources` with those IDs
3. **Bunker matching**: Engine filters bunkers where `METADATA.id` matches selected IDs
4. **Mismatch = Invisible bunker**: If IDs don't match, bunker never runs

**Example Failure**:
```javascript
// JSON prefab (Firestore):
{ "id": "runeglass_punishing_jasper_armor" }

// Bunker code:
const METADATA = {
  id: 'runeglass_punishing_jasper_armor_misc'  // ← MISMATCH!
};

// Result: User selects "runeglass_punishing_jasper_armor"
//         Engine looks for bunker with that ID
//         Bunker has different ID
//         Bunker never executes! ❌
```

**Debugging Symptom**:
```
[ENGINE] Effect bunker runeglass_empowered_jasper_retaliate_stack: not matched
```
Even though bunker exists, it's not in `allSources` because user didn't select it (or ID mismatch).

**Solution**: Triple-check IDs match:
```javascript
// 1. JSON prefab
{ "id": "runeglass_empowered_jasper_retaliate_stack" }

// 2. Bunker code
const METADATA = {
  id: 'runeglass_empowered_jasper_retaliate_stack'  // ← EXACT MATCH
};

// 3. Firestore document ID (when uploading)
Document ID: "runeglass_empowered_jasper_retaliate_stack"
```

**Consequences**:
- Must maintain three identical ID strings (JSON, code, Firestore)
- Typos break functionality silently (no error, just no effect)
- User complained: "you have switched 3x now. Pick one!" (IDs kept changing)

**Best Practice**: 
1. Define ID in JSON first
2. Copy-paste (don't retype!) into bunker code
3. Verify Firestore upload uses same ID

**Code Location**: 
- Engine filtering: `/src/simulation/engine.js` (lines 25-65)
- Bunker METADATA: All bunker files

---

---

## ADR-013: Why Damage Type Splitting Instead of Simple Conversion?

**Date**: 2025-10-21  
**Status**: Implemented

**Context**: Damage conversion runeglasses (Empowered Sapphire) need to convert 50% physical → arcane, but multiple conversions could stack.

**Decision**: Use percentage-based splitting system that calculates `damageByType` object with percentages per type.

**Reasoning**:
- **Handles multiple conversions**: 50% to arcane + 30% to lightning = 50% arcane, 30% lightning, 20% physical
- **Order-independent**: Conversions don't depend on processing order
- **Prevents over-conversion**: Total damage always sums to 100%
- **Type-specific modifiers**: Each damage type can have its own modifier pipeline

**How It Works**:

```javascript
// Start with 100% physical
let remainingPhysical = 1.0;
const damageByType = { physical: 1.0 };

// Apply each conversion
for (const conversion of damageConversions) {
    const convertPercent = conversion.percent;  // e.g., 0.50
    const toType = conversion.to;               // e.g., 'arcane'
    
    // Reduce physical by conversion amount
    remainingPhysical -= convertPercent;
    
    // Add to target type
    damageByType[toType] = (damageByType[toType] || 0) + convertPercent;
}

damageByType.physical = remainingPhysical;

// Result with 50% conversion:
// damageByType = { physical: 0.50, arcane: 0.50 }

// Calculate final damage for each type
for (const [damageType, percent] of Object.entries(damageByType)) {
    if (percent <= 0) continue;
    
    const typeBaseDamage = baseDamage * percent;  // Split base damage
    
    // Apply TYPE-SPECIFIC modifiers
    const modContext = { ...context, damageType: damageType.toUpperCase() };
    // e.g., damageType: 'ARCANE' triggers arcane-specific modifiers
    
    // Run modifier bunkers with this context
    // Bunkers can check: if (context.damageType === 'ARCANE') return bonus;
}
```

**Example: Empowered Sapphire with 440 base damage**:

```
Base: 440 physical damage
Conversion: 50% → arcane

Split calculation:
- Physical: 440 * 0.50 = 220
- Arcane:   440 * 0.50 = 220

Apply modifiers to each type:
Physical 220:
  × (1 + empower + rend)
  × (1 + misc_damage)
  = Final physical damage

Arcane 220:
  × (1 + empower + rend)
  × (1 + misc_damage)
  × (1 + arcane_boost)  ← Type-specific modifier!
  = Final arcane damage

Total = Physical + Arcane
```

**Type-Specific Modifiers**:

```javascript
// Armor runeglass modifier checks damage type
function handler({ event, source, target, context }) {
    // Only boost arcane damage
    if (context?.damageType !== 'ARCANE') return null;
    
    return {
        modifyDamage: {
            multiplier: 1.02  // +2% to arcane only
        }
    };
}
```

**Consequences**:
- Engine more complex (multiple damage calculations per attack)
- But properly handles damage type variety (physical, arcane, lightning, etc.)
- Each damage type can scale independently
- Future-proof for elemental damage mechanics

**Alternatives Considered**:
1. **Simple replacement** - Convert damage, lose physical portion
   - Rejected: Doesn't allow partial conversion
2. **Sequential conversions** - Apply conversions one after another
   - Rejected: Order-dependent, could over-convert

**Code Location**: `/src/simulation/engine.js` (lines 440-500)

---

## ADR-014: Runeglass Creation Best Practices

**Date**: 2025-10-21  
**Status**: Established (5 runeglasses implemented successfully)

**Context**: After implementing 5 runeglass types (18 bunkers), clear patterns emerged for efficient creation.

**Best Practices**:

### 1. File Creation Order (Prevents Missing Pieces)

```
1. Create ALL code bunkers FIRST
   - Modifiers in /modifiers/
   - Effects in /effectBunkers/
   
2. Create ALL JSON prefabs SECOND
   - One JSON per bunker in /prefabs/
   - Copy ID from code METADATA (don't retype!)
   
3. Register in bunkerManifest.js THIRD
   - Import all bunkers
   - Add to appropriate arrays
   
4. Test with console logs FOURTH
   - Verify "MATCHED" in engine logs
   
5. Upload to Firestore LAST
   - Only after code is working
```

**Why This Order**:
- Code changes are fast to iterate
- JSON can be regenerated from code easily
- Firestore upload is slowest/most permanent
- Console logs catch registration issues early

### 2. Use Terminal `cat` Commands (Prevents Duplication)

```bash
# ✅ CORRECT: Terminal cat command
cat > /path/to/file.js <<'EOF'
// ... code here ...
EOF

# ❌ WRONG: create_file tool on "undone" files
# Can create duplicate files if git state is unclear
```

**Why**: Terminal commands respect git state exactly, no duplication bugs.

### 3. ID Consistency Pattern

```
Step 1: Write ID in JSON prefab first
{
  "id": "runeglass_empowered_jasper_retaliate_stack"
}

Step 2: Copy-paste (Cmd/Ctrl+C, Cmd/Ctrl+V) into code
const METADATA = {
  id: 'runeglass_empowered_jasper_retaliate_stack'  // ← PASTED!
};

Step 3: Verify in bunkerManifest import
import runeglass_empowered_jasper_retaliate_stack from './effectBunkers/runeglass_empowered_jasper_retaliate_stack.js';
```

**Why**: Copy-paste eliminates typos, ensures exact match.

### 4. Hex DoT Template (Always Use This)

```javascript
// Save this as a snippet/template
import { calculateWeaponDamage } from '../../formulas.js';

const METADATA = {
  id: 'runeglass_NAME_weapon_hex',
  name: 'NAME - Hex',
  type: 'EFFECT_BUNKER',
  stroke: 2
};

function handler({ event, source, target, timestamp }) {
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  const weaponDamage = calculateWeaponDamage(
    event.weapon,
    source.attributes,
    source
  );
  
  return {
    applyEffects: [{
      id: 'runeglass_NAME_hex',
      category: 'DOT',
      damageType: 'ARCANE',
      value: weaponDamage * 0.08,
      duration: 2,
      sourceId: source.id,
      targetId: target.id,
      metadata: {
        sourceName: 'NAME Hex',
        weaponType: event.weapon,      // REQUIRED
        attributes: source.attributes  // REQUIRED
      }
    }]
  };
}

export default { METADATA, handler };
```

**Why**: Metadata requirement is easy to forget, template prevents 0-damage bugs.

### 5. Debugging Logs Strategy

```javascript
// Add logs DURING development, remove AFTER testing

// Development:
console.log('[BUNKER_NAME] Handler called:', { action: event?.action });
console.log('[BUNKER_NAME] ✅ Triggering!', { value });

// After testing: Remove or comment out
// console.log('[BUNKER_NAME] Handler called:', { action: event?.action });
```

**Why**: Logs are essential for debugging but clutter console in production.

### 6. Test Incrementally

```
After each bunker:
1. Save file
2. Check for syntax errors (red squiggles)
3. Register in manifest
4. Check engine logs for "MATCHED"
5. Run simulation
6. Verify in Inspector

Don't create all 4 bunkers then test - debug 1 at a time!
```

**Why**: Isolates issues to single bunker, easier to debug.

### 7. JSON Prefab Conventions

```json
{
  "id": "exact_match_to_code_METADATA_id",
  "type": "RUNEGLASS",
  "bucket": "runeglass_weapon",  // or runeglass_armor
  "label": "Display Name (Component Type)",  // e.g., "Empowered Jasper (Weapon - Hex)"
  "name": "Runeglass of Full Name",
  "description": "Clear, concise description of what it does",
  "event": "PASSIVE",  // Most runeglasses are passive
  "effects": [/* Declarative effect structure */],
  "labels": ["Runeglass_Slot_Name_Component"],  // Consistent naming
  "slot": "weapon_runeglass"  // or armor_runeglass
}
```

**Why**: Consistency makes JSONs easy to find, understand, and maintain.

### 8. Shared Effects Pattern

```
When multiple runeglasses share identical effect logic:

1. Create ONE code bunker (e.g., retaliate_stack)
2. Create MULTIPLE JSON prefabs (one per runeglass variant)
3. Different JSON IDs for UI selection
4. Same code bunker ID
5. Multiple modifiers can read the same effect

Example:
- Code: runeglass_empowered_jasper_retaliate_stack.js (ONE file)
- JSON: runeglass_empowered_jasper_retaliate_stack.json (for Empowered UI)
- JSON: runeglass_punishing_jasper_retaliate_stack.json (for Punishing UI)
- Both point to same code bunker
```

**Why**: DRY principle, prevents duplicate logic, ensures consistency.

---

## Future ADRs to Consider

When implementing these features, document the decision:

1. **ADR-015: HoT (Heal over Time) Implementation** - When first HoT is added
2. **ADR-016: Multiple DoT Types Coexistence** - When second DoT type is added
3. **ADR-017: Crit Damage Calculation** - If crits use different formula
4. **ADR-018: Ability Cooldown Tracking** - When ability system is added
5. **ADR-019: Resource System (Mana/Stamina)** - If resources are added

---

*Last Updated: 2025-10-21*