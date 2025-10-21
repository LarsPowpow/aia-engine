# Common Pitfalls & Debugging Guide

## Purpose
Quick reference for common issues and their solutions. Read this before debugging strange behavior!

---

## Variable Naming Confusion 🚨

**Problem**: `source`, `target`, `combatant` mean different things in different contexts.

**Context Guide**:

```javascript
// === IN BUNKERS ===
function handler({ source, target, event, timestamp }) {
    // source = actor triggering the bunker (usually Player)
    // target = recipient of the action (usually Target Dummy)
    // These are READ-ONLY snapshots, don't mutate them!
}

// === IN ENGINE ===
twoStrokeProcessEvent(event, source, target, timestamp) {
    // source = Player (the attacker)
    // target = Target Dummy (the defender)
}

// === IN STATE MANAGER ===
applyEffect(target, effectData, context) {
    // target = the combatant receiving the effect
    //          (could be Player OR Target Dummy!)
    // context.source = the original source combatant
    // This is where we MUTATE state!
}

// === IN EFFECT GROUPING ===
const targetCombatant = applyToSource ? source : target;
stateManager.applyEffect(targetCombatant, eff, context);
// targetCombatant = the resolved combatant to apply effect to
```

**Solution**: Always check:
1. Function signature (what are the parameter names?)
2. Current file (bunker vs. engine vs. stateManager?)
3. Documentation comments (what does this variable represent?)

**Red Flags**:
- Using `combatant` in stateManager when parameter is `target`
- Assuming `target` always means "opponent" (it doesn't in applyEffect!)
- Mutating `source` or `target` in bunkers (they're snapshots, changes won't persist)

---

## Effect Target Resolution 🎯

**Problem**: Heals/buffs applying to wrong combatant (e.g., heal going to opponent).

**Root Cause**: Engine grouping logic not preserving bunker's `targetId`.

**Debugging Steps**:

1. **Check Bunker Output**:
```javascript
// In bunker, log the effect being returned:
console.log('[BUNKER_NAME] Returning effect:', {
    id: eff.id,
    targetId: eff.targetId,  // Should be 'Player' for self-heal
    category: eff.category
});
```

2. **Check Engine Grouping**:
```javascript
// In engine.js, after grouping:
console.log('[ENGINE] Grouped effect:', {
    key,
    targetId: grouped[key].targetId,  // Should still be 'Player'
    originalTargetId: eff.targetId
});
```

3. **Check State Manager**:
```javascript
// In stateManager.js, at start of applyEffect:
console.log('[STATE MANAGER] Applying to:', target.id, 'effect:', effectData.id);
// target.id should be 'Player' for self-heal
```

**Common Fixes**:

```javascript
// ❌ WRONG: Overwrites bunker's targetId
const targetKey = applyToSource ? source.id : target.id;
grouped[key] = { ...eff, targetId: targetKey };

// ✅ RIGHT: Preserves bunker's targetId
const applyToSource = eff.targetId 
    ? (eff.targetId === source.id)
    : (defaultLogicHere);
grouped[key] = { ...eff, targetId: eff.targetId || targetKey };
```

---

## Stacking Logic Confusion 🔄

**Problem**: Not clear when to check by `id` vs. `sourceId`.

**The Rule**:

| Effect Type | Anti-Stack Check | Why? |
|-------------|-----------------|------|
| **DoT** | `e.id === effectData.id` | Only one instance per DoT type |
| **Buffs/Debuffs** | `e.sourceId === effectData.sourceId` | Same source can't stack with itself |

**Examples**:

```javascript
// === DoT Check (by ID) ===
const existingDoT = target.activeEffects.find(e => 
    e.category === 'DOT' && 
    e.id === effectData.id  // ← Check effect ID
);
// Blocks: Second Keenly Jagged bleed while first is active
// Allows: Keenly Jagged + Infected Strike (different IDs)

// === Buff Check (by SOURCE ID) ===
const existingBuff = target.activeEffects.find(e => 
    e.category === effectData.category && 
    e.sourceId === effectData.sourceId  // ← Check source ID
);
// Blocks: Counter Attack → Counter Attack (same source)
// Allows: Counter Attack + Healing Defense (different sources)
```

**Quick Reference**:
- Same DoT TYPE can't stack with itself (check `id`)
- Same buff SOURCE can't stack with itself (check `sourceId`)
- Different sources CAN stack (up to cap)

---

## Value vs. ValueType 💰

**Problem**: Confusion between percentage (0.025) and HP (263).

**Pattern**:

```javascript
// === Bunker Returns ===
{
    value: 0.025,  // 2.5% (the raw number)
    valueType: 'baseHealth',  // "interpret this as % of base health"
}

// === Engine/UI Converts ===
if (h.valueType === 'baseHealth') {
    const baseHealth = target?.baseHealth || target?.maxHealth || 0;
    const actualHP = h.value * baseHealth;  // 0.025 * 10500 = 262.5
} else {
    const actualHP = h.value;  // Raw HP value
}
```

**Common Mistakes**:

```javascript
// ❌ WRONG: Treating percentage as HP
target.health += 0.025;  // Only heals 0.025 HP!

// ❌ WRONG: Not checking valueType
const healAmount = effect.value;  // Could be 0.025 or 263!

// ✅ RIGHT: Always check valueType
const healAmount = effect.valueType === 'baseHealth'
    ? effect.value * target.baseHealth
    : effect.value;
```

**Rule**: Always use `valueType` for percentage-based effects. Never assume `value` is HP!

---

## Duration: 0 vs. Missing ⏱️

**Problem**: When is an effect instant vs. persistent?

**Pattern**:

```javascript
// === Instant Effect (apply immediately, don't store) ===
{
    category: 'HEAL',
    duration: 0,  // ← Zero duration
}

// In stateManager:
if (effectData.duration > 0) {
    target.activeEffects.push(effect);  // Store it
} else {
    // Apply it but DON'T store
}

// === Persistent Effect (store in activeEffects) ===
{
    category: 'DOT',
    duration: 10,  // ← Positive duration
}
// Always stored in activeEffects
```

**Common Mistake**:

```javascript
// ❌ WRONG: Storing instant heals
if (effectData.category === 'HEAL') {
    target.activeEffects.push(effect);  // Don't do this for instant heals!
}

// ✅ RIGHT: Check duration first
if (effectData.category === 'HEAL' && effectData.duration > 0) {
    target.activeEffects.push(effect);  // Only store HoTs
}
```

---

## DoT Tick Timing ⏰

**Problem**: DoTs not ticking at expected times or ticking twice.

**How Ticks Work**:
- Ticks scheduled at 0.5s, 1.0s, 1.5s, 2.0s, ... (every 0.5s)
- DoT applied at 1.3s won't tick until 1.5s (next scheduled tick)
- Engine checks `Math.abs(tickTime - timestamp) < 0.01` to detect tick events

**Debug Checklist**:

```javascript
// 1. Check tick array was generated:
console.log('[DOT] Tick times:', dotTickTimes.slice(0, 10));
// Should show: [0.5, 1.0, 1.5, 2.0, ...]

// 2. Check current time alignment:
const isTickTime = dotTickTimes.some(t => Math.abs(t - timestamp) < 0.01);
console.log('[DOT] Is tick time?', isTickTime, 'at', timestamp);

// 3. Check active DoTs:
const activeDots = target.activeEffects.filter(e => e.category === 'DOT');
console.log('[DOT] Active DoTs on', target.id, ':', activeDots);

// 4. Check DoT is in valid time range:
for (const dot of activeDots) {
    const isActive = dot.appliedAt <= timestamp && dot.expiresAt > timestamp;
    console.log('[DOT]', dot.id, 'active?', isActive, 
        'applied:', dot.appliedAt, 'expires:', dot.expiresAt);
}
```

**Common Issues**:

| Symptom | Cause | Fix |
|---------|-------|-----|
| No ticks at all | DoT not in activeEffects | Check stateManager anti-stacking logic |
| Ticks at wrong time | Tick array not generated | Check engine initialization |
| Double ticking | DoT duplicated in activeEffects | Check anti-stacking is working |
| Ticks after expiration | Expired DoTs not cleaned up | Add expiration filter before processing |

---

## Expired Effect Cleanup 🧹

**Problem**: Expired effects still ticking, showing in UI, or interfering with new applications.

**Solution**: Always filter expired effects BEFORE processing:

```javascript
// ❌ WRONG: Process first, clean up later
for (const effect of combatant.activeEffects) {
    if (effect.expiresAt > now) {
        processEffect(effect);
    }
}
// Expired effects still in array!

// ✅ RIGHT: Clean up first, then process
combatant.activeEffects = combatant.activeEffects.filter(e => 
    !e.expiresAt || e.expiresAt > now
);

for (const effect of combatant.activeEffects) {
    processEffect(effect);  // All effects guaranteed valid
}
```

**Where to Clean Up**:
1. **Before DoT ticks**: Engine DoT processing (lines ~545)
2. **Before UI display**: Inspector panel filters
3. **Periodically**: Engine main loop

**Symptoms of Missing Cleanup**:
- DoTs ticking after they should have expired
- Anti-stacking failing (finds "active" effect that's actually expired)
- UI showing expired effects in Raw State

---

## Console Log Overload 📊

**Problem**: Too many logs, can't find relevant information.

**Best Practices**:

```javascript
// Use consistent prefixes:
console.log('[BUNKER_NAME] Message');  // e.g., [Keenly Jagged II]
console.log('[ENGINE] Message');
console.log('[STATE MANAGER] Message');
console.log('[DOT] Message');
console.log('[UI] Message');

// Add emojis for quick visual scanning:
console.log('[BUNKER] ✅ Crit detected!');
console.log('[BUNKER] ❌ Not a crit, skipping');
console.log('[ENGINE] 🔄 Processing tick at', timestamp);
console.log('[STATE MANAGER] 🚫 Blocked by anti-stack');
```

**Filtering in Browser Console**:

```
Filter by:                  Shows:
[Keenly Jagged II]         Only Keenly Jagged logs
[STATE MANAGER] Applied    Only successful applications
✅                         Only success messages
❌                         Only blocked/failed operations
```

**Log Levels**:
- `console.log()` - Normal operation
- `console.warn()` - Unexpected but handled (e.g., cap hit)
- `console.error()` - Actually broken (e.g., missing data)

---

## UI Not Updating 🖥️

**Problem**: Changed backend code but UI shows old data or no data.

**Debugging Checklist**:

1. **Hard Refresh Browser**: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

2. **Check React Dev Server Reloaded**:
```bash
# Look for this in terminal:
webpack compiled successfully
# Or:
Compiled with warnings  # Check warnings!
```

3. **Verify Console Logs Show New Behavior**:
```javascript
// Add a unique log in your changed code:
console.log('[DEBUG] New code running at', Date.now());
// If you don't see this, code didn't reload
```

4. **Check Data Flow to UI**:
```javascript
// In component render:
console.log('[UI] Rendering with data:', entry);
// Verify structure matches what engine produces
```

5. **Common Causes**:

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Column empty | UI calculation different from engine | Match calculation to engine |
| Stale data | React state not updating | Check useState/useEffect |
| No data at all | eventAnalysis not including field | Check engine.js eventAnalysis creation |
| Wrong data | UI reading wrong property | Check property names match |

**Example: Healing Column Empty**

```javascript
// ❌ Engine creates:
eventAnalysis.totalHealing = 263;

// ❌ UI reads:
const healing = entry.healing;  // undefined! Should be totalHealing

// ✅ Fix:
const healing = entry.totalHealing;
```

---

## Metadata vs. Top-Level Properties 📦

**Problem**: When should data go in `metadata` vs. top-level effect properties?

**Rule**:

| Use Top-Level For | Use Metadata For |
|-------------------|------------------|
| System-critical values | Display information |
| Used in stacking logic | Optional details |
| Used in calculations | Debugging info |
| Required by engine | Nice-to-have |

**Examples**:

```javascript
{
    // === TOP-LEVEL (required by system) ===
    id: 'keenly_jagged_ii_bleed',  // Used for anti-stacking
    category: 'DOT',                // Used for filtering
    value: 100,                     // Used for damage calculation
    duration: 10,                   // Used for expiration
    sourceId: 'Player',             // Used for source check
    targetId: 'Target Dummy',       // Used for target resolution
    
    // === METADATA (informational only) ===
    metadata: {
        sourceName: 'Keenly Jagged II',  // Display in UI
        tickInterval: 1.0,               // Informational (engine uses fixed 1.0s)
        damagePerTick: 100,              // Redundant with value (but helpful for UI)
        description: 'Bleed effect'      // For tooltips
    }
}
```

**Wrong**:

```javascript
// ❌ Don't put critical data in metadata:
{
    id: 'some_effect',
    metadata: {
        targetId: 'Player'  // Engine won't see this!
    }
}

// ❌ Don't clutter top-level with display-only data:
{
    id: 'some_effect',
    displayName: 'Cool Effect',  // Use metadata.sourceName
    description: 'Does cool stuff',  // Use metadata.description
    iconUrl: '/icons/cool.png'  // Use metadata.iconUrl
}
```

---

## Async/Promise Issues ⚡

**Problem**: UI showing stale data or simulations not completing.

**Current Architecture**: Everything is synchronous! No promises, no async/await.

**If You See This**:

```javascript
// ❌ DON'T DO THIS:
const result = await runSimulation();  // Nothing is async!

// ✅ DO THIS:
const result = runSimulation();  // Synchronous call
```

**Why No Async?**:
- Simulations run in-memory, no I/O
- No network calls
- No database queries
- Simpler debugging (no race conditions)

**Future**: If we add features that need async (save to cloud, load external data), document that decision in ADR!

---

## Damage Type Modifiers Not Applying 🎨

**Problem**: Arcane damage bonus not boosting converted damage.

**Root Cause**: Modifier not checking `context.damageType` correctly.

**How Damage Types Work**:

When damage is split by type (e.g., 50% physical, 50% arcane), engine processes EACH type separately with type-specific context:

```javascript
// Engine splits damage:
damageByType = { physical: 0.50, arcane: 0.50 };

// For each type, creates context:
for (const [damageType, percent] of Object.entries(damageByType)) {
    const modContext = { 
        ...context, 
        damageType: damageType.toUpperCase()  // 'PHYSICAL' or 'ARCANE'
    };
    
    // Bunker can check this:
    if (modContext.damageType === 'ARCANE') {
        // Apply arcane-specific bonus
    }
}
```

**Correct Pattern for Type-Specific Modifiers**:

```javascript
// ✅ CORRECT: Check context.damageType
function handler({ event, source, target, context }) {
    const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
    if (!damageActions.includes(event?.action)) return null;
    
    // Only boost ARCANE damage
    if (context?.damageType !== 'ARCANE') return null;
    
    return {
        modifyDamage: {
            multiplier: 1.02  // +2% to arcane only
        }
    };
}

// ❌ WRONG: No damageType check (applies to ALL types)
function handler({ event, source, target, context }) {
    const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
    if (!damageActions.includes(event?.action)) return null;
    
    return {
        modifyDamage: {
            multiplier: 1.02  // Applies to physical AND arcane! Wrong!
        }
    };
}
```

**Debugging**:

```javascript
// Add to modifier bunker:
console.log('[ARCANE MODIFIER]', {
    action: event?.action,
    damageType: context?.damageType,
    willApply: context?.damageType === 'ARCANE'
});

// Should show:
// Physical calculation: damageType: 'PHYSICAL', willApply: false
// Arcane calculation:   damageType: 'ARCANE',   willApply: true
```

**Common Issue**: Modifier applies to all damage types instead of just one:

```javascript
// User expects: +2% arcane only
// Reality: +2% physical AND arcane (no type check!)

// Fix: Add type check
if (context?.damageType !== 'ARCANE') return null;
```

---

## Damage Conversion Not Splitting Correctly ⚖️

**Problem**: 50% conversion shows as 100% arcane instead of 50/50 split.

**Check List**:

1. **Is conversion returning correct structure?**
```javascript
return {
    modifyDamage: {
        convertDamage: {
            from: 'physical',      // ✓
            to: 'arcane',          // ✓
            percent: 0.50          // ✓ (not 50 or '50%')
        }
    }
};
```

2. **Is conversion being collected?**
```javascript
// Engine should show:
console.log('[ENGINE] 💎 Damage conversion:', {
    conversions: [{ from: 'physical', to: 'arcane', percent: 0.50 }],
    split: { physical: 0.50, arcane: 0.50 },
    baseDamage: 440
});
```

3. **Are both damage types being calculated?**
```javascript
// Should see TWO damage calculations:
[ENGINE] Calculating PHYSICAL damage: 220 (440 * 0.50)
[ENGINE] Calculating ARCANE damage: 220 (440 * 0.50)
```

**Common Mistakes**:

```javascript
// ❌ WRONG: percent as integer
convertDamage: { from: 'physical', to: 'arcane', percent: 50 }
// Result: 5000% conversion! (50 × base damage)

// ❌ WRONG: percent as string
convertDamage: { from: 'physical', to: 'arcane', percent: '0.50' }
// Result: NaN or 0 conversion

// ✅ RIGHT: percent as decimal
convertDamage: { from: 'physical', to: 'arcane', percent: 0.50 }
```

---

## TypeScript Gotchas (If Applicable)

**Current Status**: Project is plain JavaScript, not TypeScript.

**If TypeScript is Added**:
- Document type definitions for Effect, Combatant, EventAnalysis
- Add to this guide: common type errors and solutions

---

## Summary: Debug Workflow

When something's broken:

1. **Reproduce in UI** → Open browser console
2. **Check logs** → Look for error messages or missing expected logs
3. **Trace data flow** → Bunker → Engine → StateManager → UI
4. **Add targeted logs** → `console.log` at each step
5. **Check snapshots** → Inspector panel, expand objects
6. **Verify assumptions** → Is `target` who you think it is?
7. **Compare to working example** → Keenly Jagged or Healing Defense
8. **Small changes** → Test after each change, revert if broken

---

## Runeglass ID Mismatch 🆔

**Problem**: Runeglass selected in UI but not applying in simulation.

**Symptom**:
```
[ENGINE] Effect bunker runeglass_empowered_jasper_retaliate_stack: not matched
```

**Root Cause**: Firestore document ID ≠ bunker METADATA.id ≠ JSON prefab "id"

**The Triple-ID Rule**:

ALL THREE must match EXACTLY:

```javascript
// 1. JSON Prefab (/src/simulation/bunkers/prefabs/*.json)
{
  "id": "runeglass_empowered_jasper_retaliate_stack",  // ← String 1
  // ...
}

// 2. Bunker Code (/src/simulation/bunkers/effectBunkers/*.js)
const METADATA = {
  id: 'runeglass_empowered_jasper_retaliate_stack',  // ← String 2 (MUST MATCH!)
  // ...
};

// 3. Firestore Document ID (when uploading to database)
Document: "runeglass_empowered_jasper_retaliate_stack"  // ← String 3 (MUST MATCH!)
```

**Why This Breaks**:
1. User selects runeglass in UI → Adds Firestore doc ID to `allSources`
2. Engine filters bunkers → Checks `METADATA.id` against `allSources`
3. Mismatch → Bunker filtered out → Never executes

**Debugging Checklist**:

```javascript
// 1. Check engine logs for filtering:
console.log('[ENGINE] Selected source IDs:', Array.from(selectedSourceIds));
// Should show: ["runeglass_empowered_jasper_retaliate_stack", ...]

// 2. Check bunker manifest logs:
console.log('[BUNKER MANIFEST] Effect bunkers loaded:', {
  ids: effectBunkers.map(b => b.METADATA?.id || 'UNKNOWN')
});
// Should show bunker ID in list

// 3. Compare:
// If bunker ID in manifest but not in selected sources → User didn't select it
// If bunker ID in manifest AND selected, but "not matched" → ID mismatch somewhere
```

**Common Mistakes**:

```javascript
// ❌ WRONG: Typo in bunker code
{ "id": "runeglass_empowered_jasper_retaliate_stack" }  // JSON
const METADATA = { id: 'runeglass_empowered_jasper_retailate_stack' };  // Typo!

// ❌ WRONG: Added suffix in bunker code
{ "id": "runeglass_punishing_jasper_armor" }  // JSON
const METADATA = { id: 'runeglass_punishing_jasper_armor_misc' };  // Different!

// ❌ WRONG: Firestore upload with wrong ID
{ "id": "runeglass_empowered_jasper_hex" }  // JSON
// But uploaded to Firestore as: "runeglass_empowered_jasper_weapon_hex"

// ✅ RIGHT: Copy-paste, don't retype
{ "id": "runeglass_empowered_jasper_retaliate_stack" }  // JSON
const METADATA = { id: 'runeglass_empowered_jasper_retaliate_stack' };  // Same!
// Upload with same ID to Firestore
```

**Prevention**:
1. Write ID in JSON first
2. **Copy-paste** into bunker METADATA (DON'T RETYPE!)
3. Verify Firestore doc ID before upload
4. Run simulation, check engine logs

---

## Runeglass Not Selected in UI 🎛️

**Problem**: Runeglass bunker exists and ID matches, but still shows "not matched".

**Root Cause**: User only selected 2 of 3 (or 3 of 4) runeglass pieces.

**Example**: Empowered Jasper has 4 pieces:
1. Retaliate Stack Effect (applies EMPOWER stacks)
2. Hex DoT Effect (applies arcane DoT)
3. Retaliate Modifier (reads stacks, applies damage bonus)
4. Armor Modifier (applies arcane damage bonus)

If user only selects pieces 3 and 4:
- Modifier runs → Looks for stacks → Finds none (stack effect not selected!)
- Result: Retaliate bonus = 0%, no Hex DoT

**Solution**: Select ALL pieces of a runeglass in UI:

```
Combat Simulator → Select Sources:
☑ Empowered Jasper (Weapon - Retaliate Stack)  ← Must select!
☑ Empowered Jasper (Weapon - Hex)              ← Must select!
☑ Empowered Jasper (Weapon - Retaliate Mod)    ← Must select!
☑ Empowered Jasper (Armor)                     ← Must select!
```

**Debugging**:
```javascript
// Check what user selected:
console.log('[ENGINE] Selected source IDs:', Array.from(selectedSourceIds));

// Should see ALL pieces:
[
  "runeglass_empowered_jasper_retaliate_stack",
  "runeglass_empowered_jasper_weapon_hex",
  "runeglass_empowered_jasper_retaliate_modifier",
  "runeglass_empowered_jasper_armor"
]

// If missing pieces → User didn't select them in UI!
```

---

## Hex DoT Dealing 0 Damage 💀

**Problem**: Hex DoT applies, shows in activeEffects, but deals 0 damage per tick.

**Root Cause**: Missing `weaponType` and `attributes` in effect metadata.

**The Pattern** (REQUIRED for all Hex DoTs):

```javascript
// ❌ WRONG: Missing metadata
const weaponDamage = calculateWeaponDamage(event.weapon, source.attributes, source);

return {
  applyEffects: [{
    id: 'hex_dot',
    category: 'DOT',
    damageType: 'ARCANE',
    value: weaponDamage * 0.08,
    duration: 2
    // Missing metadata! → Engine can't recalculate damage on ticks!
  }]
};

// ✅ CORRECT: Full metadata
const weaponDamage = calculateWeaponDamage(event.weapon, source.attributes, source);

return {
  applyEffects: [{
    id: 'hex_dot',
    category: 'DOT',
    damageType: 'ARCANE',
    value: weaponDamage * 0.08,
    duration: 2,
    sourceId: source.id,
    targetId: target.id,
    metadata: {
      sourceName: 'Empowered Jasper Hex',
      weaponType: event.weapon,      // ← REQUIRED for damage calc!
      attributes: source.attributes  // ← REQUIRED for scaling!
    }
  }]
};
```

**Why Metadata Needed**:
- **DoTs calculate damage dynamically** on each tick (see ADR-003)
- Engine calls `calculateWeaponDamage(weaponType, attributes, source)` per tick
- Without `weaponType` → Can't look up weapon damage
- Without `attributes` → Can't scale with INT/FOC/STR
- Result: `weaponDamage = 0` → `value = 0 * 0.08 = 0`

**Symptoms**:
```javascript
// In Combat Log:
Tick at 2.0s: Hex - 0 damage  // ← 0 damage!

// In Inspector → Raw State → Active Effects:
{
  id: 'hex_dot',
  value: 0,  // ← Base value is 0!
  metadata: {}  // ← Empty or missing weaponType/attributes
}
```

**Debugging**:
```javascript
// In bunker, log the effect being created:
console.log('[HEX] Creating DoT:', {
  value: weaponDamage * 0.08,
  weaponDamage,
  metadata: {
    weaponType: event.weapon,
    attributes: source.attributes
  }
});

// Should show:
// value: 35.2 (non-zero!)
// weaponDamage: 440
// metadata: { weaponType: 'Flail', attributes: { int: 350, ... } }
```

**Template to Copy**:
```javascript
// When creating ANY Hex DoT, copy this pattern:
import { calculateWeaponDamage } from '../../formulas.js';

const weaponDamage = calculateWeaponDamage(
  event.weapon,
  source.attributes,
  source
);

return {
  applyEffects: [{
    id: 'unique_hex_id',
    category: 'DOT',
    damageType: 'ARCANE',
    value: weaponDamage * 0.08,  // 8% weapon damage per tick
    duration: 2,
    sourceId: source.id,
    targetId: target.id,
    metadata: {
      sourceName: 'Display Name',
      weaponType: event.weapon,      // ← Copy this line!
      attributes: source.attributes  // ← Copy this line!
    }
  }]
};
```

---

## Damage Conversion Not Working 🔄

**Problem**: Damage still showing as physical instead of arcane.

**Check List**:

1. **Is bunker registered in modifierBunkers?**
```javascript
// In bunkerManifest.js:
export const modifierBunkers = [
    // ...
    runeglass_empowered_sapphire_weapon,  // ← Should be here!
];
```

2. **Is bunker returning convertDamage correctly?**
```javascript
// In bunker stroke 1:
return {
  modifyDamage: {
    convertDamage: {
      from: 'physical',
      to: 'arcane',
      percent: 0.50  // 50% conversion
    }
  }
};
```

3. **Is action a damage action?**
```javascript
// Conversion only applies to damage actions:
const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
if (!damageActions.includes(event?.action)) {
  return null;  // ← No conversion for non-damage events!
}
```

4. **Is damageType check correct?**
```javascript
// Only convert physical damage:
if (context?.damageType !== 'PHYSICAL') {
  return null;  // ← Already arcane, don't convert!
}
```

**Debugging**:
```javascript
// In bunker:
console.log('[SAPPHIRE CONVERSION]', {
  action: event?.action,
  damageType: context?.damageType,
  converting: event?.action in damageActions && context?.damageType === 'PHYSICAL'
});

// Should show:
// action: 'LIGHT_ATTACK'
// damageType: 'PHYSICAL'
// converting: true
```

---

## Stacking Retaliate Buffs Not Working 📚

**Problem**: Blocking multiple times doesn't increase damage.

**Root Cause**: Stack effect not applying or modifier not reading stacks.

**Debug Steps**:

1. **Is stack effect selected in UI?**
```javascript
// Must select the stack effect bunker:
☑ Empowered Jasper (Weapon - Retaliate Stack)  // ← This one!
```

2. **Is stack effect being triggered?**
```javascript
// Add to stack effect bunker:
console.log('[JASPER RETALIATE] Handler called with:', {
  action: event?.action,
  sourceId: source?.id
});

// On BLOCK events, should show:
// action: 'BLOCK_START'
// action: 'BLOCK_HIT'
// action: 'BLOCK_END'
```

3. **Are stacks being applied to activeEffects?**
```javascript
// In Inspector → Raw State → Active Effects:
// Should see:
{
  id: 'empowered_jasper_retaliate_stack',
  category: 'EMPOWER',
  value: 0.08,
  stackCount: 3  // ← Should increase with each block!
}
```

4. **Is modifier reading stacks correctly?**
```javascript
// In retaliate modifier bunker:
const stacks = source.activeEffects.filter(e => 
  e.id === 'empowered_jasper_retaliate_stack'
).length;

console.log('[RETALIATE MOD] Found stacks:', stacks);
// Should show: 1, 2, 3 as blocks happen
```

**Common Issue**: Modifier bunker looking for wrong stack ID:
```javascript
// ❌ WRONG: Typo in stack ID
const stacks = source.activeEffects.filter(e => 
  e.id === 'empowered_jasper_retailate_stack'  // Typo!
).length;

// ✅ CORRECT: Exact match
const stacks = source.activeEffects.filter(e => 
  e.id === 'empowered_jasper_retaliate_stack'  // Matches effect ID!
).length;
```

---

## Summary: Debug Workflow

When something's broken:

1. **Reproduce in UI** → Open browser console
2. **Check logs** → Look for error messages or missing expected logs
3. **Trace data flow** → Bunker → Engine → StateManager → UI
4. **Add targeted logs** → `console.log` at each step
5. **Check snapshots** → Inspector panel, expand objects
6. **Verify assumptions** → Is `target` who you think it is?
7. **Compare to working example** → Keenly Jagged or Healing Defense
8. **Small changes** → Test after each change, revert if broken

**Runeglass-Specific Checklist**:
- [ ] All IDs match (JSON, code, Firestore)
- [ ] All pieces selected in UI (3 for conversion, 4 for conditional)
- [ ] Hex DoTs have full metadata (weaponType, attributes)
- [ ] Stack effects registered in effectBunkers
- [ ] Modifiers registered in modifierBunkers
- [ ] Console logs show bunkers matching in engine
- [ ] Type-specific modifiers check context.damageType

---

## Runeglass Creation Best Practices 🏆

Based on 5 successful runeglass implementations (18 bunkers, 0 bugs after workflow established):

### 1. **File Creation Order** (Prevents Missing Pieces)

```
✅ Correct Sequence:
1. Create ALL code bunkers first (modifiers + effects)
2. Create ALL JSON prefabs second (copy IDs from code)
3. Register in bunkerManifest.js third
4. Test with console logs fourth
5. Upload to Firestore last (only after code works)

❌ Wrong: Create code + JSON + upload for each bunker individually
   - Easy to forget pieces
   - Hard to track what's done
```

### 2. **Use Terminal Commands** (Prevents File Duplication)

```bash
# ✅ DO THIS: Terminal cat command
cat > /path/to/file.js <<'EOF'
const METADATA = { id: 'runeglass_name' };
// ... code ...
export default { METADATA, handler };
EOF

# ❌ DON'T: create_file tool on files that might exist
# Can create duplicates if git state unclear
```

### 3. **ID Consistency Workflow** (Prevents Typos)

```
Step 1: Write ID in JSON first
{
  "id": "runeglass_empowered_jasper_retaliate_stack"
}

Step 2: Select ID → Copy (Cmd/Ctrl + C)

Step 3: Paste into code (Cmd/Ctrl + V)
const METADATA = {
  id: 'runeglass_empowered_jasper_retaliate_stack'  // ← PASTED!
};

Step 4: Paste into import name
import runeglass_empowered_jasper_retaliate_stack from './...';

✅ Result: Zero typos, exact matches
❌ Avoid: Retyping IDs manually (introduces typos)
```

### 4. **Save Hex DoT Template** (Copy This Every Time)

```javascript
// TEMPLATE: Hex DoT Effect Bunker
// Copy this entire block for new Hex DoTs

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
        weaponType: event.weapon,      // ← REQUIRED!
        attributes: source.attributes  // ← REQUIRED!
      }
    }]
  };
}

export default { METADATA, handler };
```

**Why**: Missing metadata = 0 damage bug. Template prevents this!

### 5. **Test Incrementally** (Debug One Bunker at a Time)

```
After EACH bunker file:
1. Save file → Check for syntax errors (red squiggles)
2. Register in manifest
3. Run simulation
4. Check console for "[ENGINE] ... MATCHED"
5. Verify behavior in Inspector

❌ Don't: Create all 4 bunkers → test at end
   - If bug found, could be in any of 4 files
   - Wastes time debugging multiple files

✅ Do: Create 1 bunker → test → next bunker
   - Bug is always in most recent file
   - Fast feedback loop
```

### 6. **Console Log Strategy**

```javascript
// DURING development: Add detailed logs
console.log('[BUNKER_NAME] Handler called:', { 
  action: event?.action,
  sourceId: source?.id 
});
console.log('[BUNKER_NAME] ✅ Triggering!', { value });

// AFTER testing: Comment out or remove
// console.log('[BUNKER_NAME] Handler called:', ...);

// Keep only critical logs for production
```

**Why**: Logs essential for debugging, but clutter console when working.

### 7. **Shared Effect Pattern**

```
When multiple runeglasses use identical effect logic:

✅ Create ONE code bunker
   - Example: runeglass_empowered_jasper_retaliate_stack.js

✅ Create MULTIPLE JSON prefabs (one per variant)
   - runeglass_empowered_jasper_retaliate_stack.json
   - runeglass_punishing_jasper_retaliate_stack.json

✅ Different JSON IDs for UI selection
✅ Same code bunker handles both
✅ Multiple modifiers can read the same effect

❌ Don't: Duplicate code bunker for each variant
   - Violates DRY principle
   - Maintenance nightmare (fix bug in 2 places)
```

### 8. **Checklist Before Moving to Next Runeglass**

```
After completing a runeglass:
- [ ] All code bunkers created
- [ ] All JSON prefabs created  
- [ ] All IDs match exactly
- [ ] Registered in bunkerManifest.js
- [ ] Console shows "MATCHED" for all pieces
- [ ] Damage/effects working in Combat Log
- [ ] Effects showing in Inspector → Raw State
- [ ] No errors in browser console
- [ ] Debugging logs removed/commented

Only then: Start next runeglass!
```

---

*Last Updated: 2025-10-21*