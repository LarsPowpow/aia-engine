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

*Last Updated: 2025-10-20*