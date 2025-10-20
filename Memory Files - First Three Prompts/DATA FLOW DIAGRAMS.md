# Data Flow Diagrams

## Purpose
Visual guides to understand how data moves through the system. Reference these when debugging complex interactions.

---

## 1. Complete Combat Event Processing Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SIMULATION START                              │
│  • Load perks, masteries, weapon, stats from UI                 │
│  • Generate rotation (attack sequence) via rotationEngine       │
│  • Pre-calculate DoT tick times (0.5s, 1.0s, 1.5s, ...)        │
│  • Initialize combatant states (health, activeEffects)          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              EVENT LOOP (for each timestamp)                     │
│  Process: Attack events, DoT ticks, ability casts               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        │   Is this a DOT_TICK event?           │
        └───────────────────┬───────────────────┘
                Yes ←───────┤───────→ No
                ↓                     ↓
    ┌───────────────────┐   ┌───────────────────────────┐
    │  Process DoT Tick │   │  Process Normal Event     │
    │  ───────────────  │   │  (Attack, Block, etc.)    │
    │  1. Filter expired│   └───────────────────────────┘
    │     effects       │                 ↓
    │  2. Find active   │   ┌─────────────────────────────────┐
    │     DoTs on both  │   │  STROKE 1: Modifiers (Damage)   │
    │     combatants    │   │  ──────────────────────────────  │
    │  3. For each DoT: │   │  • Run bunkers with stroke: 1   │
    │     - Apply dmg   │   │  • Collect modifierRequests     │
    │     - Log tick    │   │  • Calculate final damage       │
    │  4. Create        │   │  • Apply to target.health       │
    │     DOT_TICK      │   └─────────────────────────────────┘
    │     analysis      │                 ↓
    └───────────────────┘   ┌─────────────────────────────────┐
                            │  STROKE 2: Effects (Buffs/DoTs) │
                            │  ──────────────────────────────  │
                            │  • Run bunkers with stroke: 2   │
                            │  • Collect effectRequests       │
                            │  • Each bunker returns:         │
                            │    { applyEffects: [...] }      │
                            └─────────────────────────────────┘
                                          ↓
                            ┌─────────────────────────────────┐
                            │  Effect Grouping & Aggregation  │
                            │  ──────────────────────────────  │
                            │  • Group by: targetId + id      │
                            │  • Preserve targetId from       │
                            │    bunker (don't overwrite!)    │
                            │  • Aggregate same effects:      │
                            │    - MISC_DAMAGE: sum values    │
                            │    - EMPOWER: keep separate     │
                            │  • De-duplicate identical       │
                            └─────────────────────────────────┘
                                          ↓
                            ┌─────────────────────────────────┐
                            │  Apply Effects via stateManager │
                            │  ──────────────────────────────  │
                            │  For each grouped effect:       │
                            │  1. Resolve targetCombatant:    │
                            │     - Use eff.targetId          │
                            │     - Fallback to category      │
                            │  2. Call applyEffect(target)    │
                            │     - HEAL: instant apply       │
                            │     - DOT: anti-stack by id     │
                            │     - BUFF: anti-stack by       │
                            │       sourceId, enforce caps    │
                            │  3. Mutate combatant state      │
                            └─────────────────────────────────┘
                                          ↓
                            ┌─────────────────────────────────┐
                            │  Create Event Analysis Entry    │
                            │  ──────────────────────────────  │
                            │  • timestamp, action name       │
                            │  • damage dealt (if any)        │
                            │  • healing done (totalHealing)  │
                            │  • effectRequests (raw)         │
                            │  • Snapshot combatant states:   │
                            │    - health, maxHealth          │
                            │    - activeEffects (cloned)     │
                            │  • Add to analysisLog[]         │
                            └─────────────────────────────────┘
                                          ↓
        ┌───────────────────────────────────────────────────┐
        │  Continue to next event in timeline               │
        └───────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SIMULATION END                                │
│  • Return analysisLog (array of all events)                     │
│  • UI displays in Combat Analysis table                         │
│  • Inspector available for detailed event inspection            │
└─────────────────────────────────────────────────────────────────┘
```

**Key Points**:
- DoT ticks are "special events" processed differently from attacks
- Two-stroke system separates damage (stroke 1) from effects (stroke 2)
- Effect grouping happens BEFORE state mutation
- Every event creates an eventAnalysis entry (even if no damage/healing)

---

## 2. Effect Application Flow (stateManager.applyEffect)

```
┌─────────────────────────────────────────────────────────────────┐
│  applyEffect(target, effectData, context)                        │
│  ───────────────────────────────────────────────────────────────│
│  target = combatant receiving effect (Player or Target Dummy)   │
│  effectData = { id, category, value, duration, sourceId, ... }  │
│  context = { timestamp, source, ... }                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        │   effectData.category?                │
        └───────────────────┬───────────────────┘
                            ↓
    ┌─────────┬─────────┬─────────┬─────────┬─────────┐
    │  HEAL   │   DOT   │ EMPOWER │  REND   │ Unknown │
    │         │         │ FORTIFY │         │         │
    │         │         │ MISC    │         │         │
    └────┬────┴────┬────┴────┬────┴────┬────┴────┬────┘
         ↓         ↓         ↓         ↓         ↓

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  HEAL Path   │ │  DOT Path    │ │  BUFF Path   │ │  Unknown     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
      ↓                ↓                ↓                ↓
┌──────────┐    ┌──────────┐    ┌──────────────┐  ┌──────────┐
│ Calculate│    │ Check by │    │ Check by     │  │ Warn &   │
│ HP from  │    │ effect   │    │ sourceId     │  │ apply    │
│ valueType│    │ ID       │    │              │  │ anyway   │
│          │    │          │    │              │  └──────────┘
│ Convert  │    │ Existing │    │ Same source  │
│ 0.025 to │    │ DOT with │    │ exists?      │
│ 263 HP   │    │ same ID? │    │              │
└────┬─────┘    └────┬─────┘    └──────┬───────┘
     ↓               ↓                  ↓
┌──────────┐    ┌──────────┐    ┌──────────────┐
│ Apply    │    │ YES      │    │ YES          │
│ healing  │    │ → Block  │    │ → Refresh    │
│ instant  │    │   (log)  │    │   duration   │
│          │    │   return │    │   (log)      │
│ Mutate:  │    │          │    │   return     │
│ target.  │    │ NO       │    │              │
│ health   │    │ → Add to │    │ NO           │
│ += HP    │    │   active │    │ → Calculate  │
│          │    │   Effects│    │   current    │
└────┬─────┘    └────┬─────┘    │   total      │
     ↓               ↓           └──────┬───────┘
┌──────────┐    ┌──────────┐          ↓
│ duration │    │ Store:   │    ┌──────────────┐
│ > 0?     │    │ {        │    │ Would exceed │
│          │    │   id,    │    │ cap?         │
│ YES      │    │   value, │    │              │
│ → Add to │    │   applied│    │ YES          │
│   active │    │   At,    │    │ → Apply      │
│   Effects│    │   expires│    │   partial    │
│   (HoT)  │    │   At     │    │   (cap -     │
│          │    │ }        │    │   current)   │
│ NO       │    └──────────┘    │              │
│ → Don't  │                    │ NO           │
│   store  │                    │ → Apply full │
└──────────┘                    └──────┬───────┘
                                       ↓
                                ┌──────────────┐
                                │ Add to       │
                                │ activeEffects│
                                │ {            │
                                │   sourceId,  │
                                │   value,     │
                                │   appliedAt, │
                                │   expiresAt  │
                                │ }            │
                                └──────────────┘
```

**Category-Specific Logic**:

| Category | Check Type | Action if Exists | Cap? | Store? |
|----------|-----------|------------------|------|--------|
| HEAL | N/A | N/A (instant) | No | Only if duration > 0 |
| DOT | By `id` | Block | No | Yes (if not blocked) |
| EMPOWER | By `sourceId` | Refresh duration | 50% | Yes |
| REND | By `sourceId` | Refresh duration | 70% | Yes |
| FORTIFY | By `sourceId` | Refresh duration | 50% | Yes |
| MISC_DAMAGE | By `sourceId` | Refresh duration | ∞ | Yes |

---

## 3. Healing Data Flow (End-to-End)

```
┌─────────────────────────────────────────────────────────────────┐
│  USER ACTION: Player blocks attack                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  BUNKER: perk_healing_defense_ii.js                              │
│  ──────────────────────────────────────────────────────────────  │
│  if (event.action === 'BLOCK' && !onCooldown) {                 │
│    return {                                                      │
│      applyEffects: [{                                            │
│        id: 'healing_defense_ii_heal',                            │
│        category: 'HEAL',                                         │
│        value: 0.025,           // 2.5% of base health            │
│        valueType: 'baseHealth', // How to interpret value        │
│        duration: 0,             // Instant (not HoT)             │
│        sourceId: 'healing_defense_ii',                           │
│        targetId: 'Player',      // ← Self-targeting!             │
│        metadata: { sourceName: 'Healing Defense II' }            │
│      }]                                                          │
│    };                                                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ENGINE: engine.js (Stroke 2 - Effect Collection)               │
│  ──────────────────────────────────────────────────────────────  │
│  const effectRequests = [];                                      │
│  for (const bunker of bunkers) {                                 │
│    const result = bunker.handler({ stroke: 2, ... });           │
│    if (result?.applyEffects) {                                   │
│      effectRequests.push(...result.applyEffects);                │
│    }                                                             │
│  }                                                               │
│  // effectRequests now contains heal effect                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ENGINE: Effect Grouping (Preserve targetId!)                   │
│  ──────────────────────────────────────────────────────────────  │
│  const grouped = {};                                             │
│  for (const eff of effectRequests) {                             │
│    const key = `${eff.targetId || 'default'}_${eff.id}`;        │
│    const applyToSource = eff.targetId === 'Player';  // ✓ TRUE  │
│    grouped[key] = {                                              │
│      ...eff,                                                     │
│      targetId: eff.targetId  // ← Preserved!                    │
│    };                                                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ENGINE: Apply Effects                                           │
│  ──────────────────────────────────────────────────────────────  │
│  for (const eff of Object.values(grouped)) {                     │
│    const targetCombatant = eff.targetId === 'Player'            │
│      ? player    // ← Correctly resolves to Player!             │
│      : targetDummy;                                              │
│    stateManager.applyEffect(targetCombatant, eff, context);      │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  STATE MANAGER: stateManager.js                                  │
│  ──────────────────────────────────────────────────────────────  │
│  applyEffect(target, effectData, context) {                      │
│    // target = player combatant object                           │
│    if (effectData.category === 'HEAL') {                         │
│      const baseHealth = target.baseHealth || target.maxHealth;   │
│      const healAmount = effectData.valueType === 'baseHealth'    │
│        ? effectData.value * baseHealth  // 0.025 * 10500 = 262.5│
│        : effectData.value;                                       │
│                                                                  │
│      // Mutate player health:                                    │
│      target.health = Math.min(                                   │
│        target.maxHealth,                                         │
│        target.health + healAmount  // Player health increases!   │
│      );                                                          │
│                                                                  │
│      // Don't store instant heal (duration === 0)                │
│      if (effectData.duration > 0) {                              │
│        target.activeEffects.push(effect);  // Would store HoT    │
│      }                                                           │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ENGINE: Create Event Analysis                                   │
│  ──────────────────────────────────────────────────────────────  │
│  const eventAnalysis = {                                         │
│    timestamp: 2.5,                                               │
│    action: 'Block',                                              │
│    damage: 0,                                                    │
│    healing: [{                                                   │
│      value: 0.025,                                               │
│      valueType: 'baseHealth',                                    │
│      actualHP: 263  // Pre-calculated for UI                    │
│    }],                                                           │
│    totalHealing: 263,  // ← Engine calculates this              │
│    effectRequests: [...],  // Raw requests                       │
│    snapshot: {                                                   │
│      combatant: { ...player },  // Health now increased          │
│      target: { ...targetDummy }                                  │
│    }                                                             │
│  };                                                              │
│  analysisLog.push(eventAnalysis);                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  UI: CombatSimulatorPage.jsx (Combat Analysis Table)            │
│  ──────────────────────────────────────────────────────────────  │
│  const healingValue = entry.totalHealing ?? (                    │
│    entry.healing?.reduce((sum, h) => {                           │
│      if (h.valueType === 'baseHealth') {                         │
│        const baseHealth = snapshot.target?.baseHealth            │
│          || snapshot.target?.maxHealth || 0;                     │
│        return sum + (h.value * baseHealth);                      │
│      }                                                           │
│      return sum + h.value;                                       │
│    }, 0)                                                         │
│  );                                                              │
│  // healingValue = 263                                           │
│                                                                  │
│  <td>{healingValue > 0 ? healingValue.toFixed(0) : ''}</td>     │
│  // Displays: "263" in Healing column                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  UI: InspectorPanel.jsx (Summary Tab)                           │
│  ──────────────────────────────────────────────────────────────  │
│  {entry.healing && entry.healing.length > 0 && (                 │
│    <div className="inspector-section">                           │
│      <h4>Healing</h4>                                            │
│      {entry.healing.map((h, i) => (                              │
│        <div key={i}>                                             │
│          <strong>{h.metadata?.sourceName || 'Heal'}</strong>     │
│          {h.valueType === 'baseHealth' ? (                       │
│            <span>                                                │
│              {(h.value * 100).toFixed(1)}%                       │
│              ({(h.value * baseHealth).toFixed(0)} HP)            │
│            </span>                                               │
│          ) : (                                                   │
│            <span>{h.value.toFixed(0)} HP</span>                  │
│          )}                                                      │
│        </div>                                                    │
│      ))}                                                         │
│    </div>                                                        │
│  )}                                                              │
│  // Displays: "Healing Defense II: 2.5% (263 HP)"               │
└─────────────────────────────────────────────────────────────────┘
```

**Critical Flow Points**:
1. **Bunker sets `targetId: 'Player'`** ← Self-targeting starts here
2. **Engine preserves `targetId`** ← Don't overwrite!
3. **Engine resolves to player combatant** ← Uses preserved targetId
4. **State manager mutates player.health** ← Correct target
5. **Engine calculates totalHealing** ← Pre-computes for UI
6. **UI reads totalHealing** ← Falls back to calculation if missing

---

## 4. DoT (Damage over Time) Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  USER ACTION: Light attack crits                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  BUNKER: perk_keenly_jagged_ii.js                                │
│  ──────────────────────────────────────────────────────────────  │
│  if (event.action === 'LIGHT_ATTACK' && didCrit) {              │
│    const weaponDamage = source.weaponDamage || 100;              │
│    return {                                                      │
│      applyEffects: [{                                            │
│        id: 'keenly_jagged_ii_bleed',                             │
│        category: 'DOT',                                          │
│        value: weaponDamage * 0.11,  // Snapshot: 110 dmg        │
│        duration: 10,                 // 10 seconds               │
│        sourceId: 'keenly_jagged_ii',                             │
│        targetId: 'Target Dummy',                                 │
│        metadata: {                                               │
│          tickInterval: 1.0,                                      │
│          damagePerTick: weaponDamage * 0.11,                     │
│          sourceName: 'Keenly Jagged II'                          │
│        }                                                         │
│      }]                                                          │
│    };                                                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  STATE MANAGER: Anti-Stacking Check                              │
│  ──────────────────────────────────────────────────────────────  │
│  if (effectData.category === 'DOT') {                            │
│    const existingDoT = target.activeEffects.find(e =>           │
│      e.category === 'DOT' &&                                     │
│      e.id === effectData.id  // Check by effect ID!             │
│    );                                                            │
│                                                                  │
│    if (existingDoT) {                                            │
│      console.log('DoT already active, blocking');                │
│      return;  // ← Block! No stacking, no refresh               │
│    }                                                             │
│                                                                  │
│    // Add new DoT to activeEffects:                              │
│    target.activeEffects.push({                                   │
│      ...effectData,                                              │
│      appliedAt: context.timestamp,  // 1.5s                      │
│      expiresAt: context.timestamp + effectData.duration  // 11.5s│
│    });                                                           │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  [TIME PASSES: 1.5s → 2.0s]                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ENGINE: DoT Tick Processing (at t=2.0s)                        │
│  ──────────────────────────────────────────────────────────────  │
│  // Check if this is a tick time:                                │
│  const isTickTime = dotTickTimes.some(t =>                       │
│    Math.abs(t - timestamp) < 0.01                                │
│  );  // TRUE at 2.0s                                             │
│                                                                  │
│  if (isTickTime) {                                               │
│    // Clean up expired effects:                                  │
│    target.activeEffects = target.activeEffects.filter(e =>      │
│      !e.expiresAt || e.expiresAt > timestamp                     │
│    );                                                            │
│                                                                  │
│    // Find active DoTs:                                          │
│    const activeDots = target.activeEffects.filter(e =>          │
│      e.category === 'DOT' &&                                     │
│      e.appliedAt <= timestamp &&                                 │
│      e.expiresAt > timestamp                                     │
│    );                                                            │
│                                                                  │
│    // Process each DoT:                                          │
│    for (const dot of activeDots) {                               │
│      const dotDamage = dot.value || dot.metadata?.damagePerTick;│
│      target.health -= dotDamage;  // Apply 110 damage           │
│                                                                  │
│      // Create tick event for combat log:                        │
│      analysisLog.push({                                          │
│        timestamp: timestamp,                                     │
│        action: `${dot.metadata?.sourceName} (Tick)`,            │
│        damage: dotDamage,                                        │
│        healing: [],                                              │
│        snapshot: { combatant: {...player}, target: {...target} }│
│      });                                                         │
│    }                                                             │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  [TICKS CONTINUE: 3.0s, 4.0s, ..., 11.0s]                       │
│  Each tick:                                                      │
│  • Checks DoT still active (appliedAt ≤ t < expiresAt)          │
│  • Applies damage (110)                                          │
│  • Logs tick event                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  [TIME: 11.5s - DoT EXPIRES]                                     │
│  • expiresAt (11.5s) ≤ timestamp (11.5s)                         │
│  • DoT removed from activeEffects during cleanup                 │
│  • No more ticks                                                 │
│  • Future crits can now apply new bleed                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  UI: Combat Analysis (Shows all ticks)                           │
│  ──────────────────────────────────────────────────────────────  │
│  Timestamp | Action                    | Damage                  │
│  ─────────────────────────────────────────────────────────────  │
│  1.5s      | Light Attack (Crit)       | 500                     │
│  2.0s      | Keenly Jagged II (Tick)   | 110  ← First tick       │
│  3.0s      | Keenly Jagged II (Tick)   | 110                     │
│  4.0s      | Keenly Jagged II (Tick)   | 110                     │
│  ...       | ...                       | ...                     │
│  11.0s     | Keenly Jagged II (Tick)   | 110  ← Last tick        │
│                                                                  │
│  Each row is clickable → Inspector shows tick details            │
└─────────────────────────────────────────────────────────────────┘
```

**DoT Lifecycle States**:
1. **Applied** → Added to `target.activeEffects[]` with `appliedAt` and `expiresAt`
2. **Active** → `appliedAt ≤ currentTime < expiresAt`
3. **Ticking** → At each tick time, if active, apply damage and log
4. **Expired** → `expiresAt ≤ currentTime`, removed from activeEffects
5. **Reapplicable** → After expiration, anti-stack check passes for new application

---

## 5. Buff Stacking Flow (EMPOWER Example)

```
┌─────────────────────────────────────────────────────────────────┐
│  SCENARIO: Multiple EMPOWER sources                              │
│  • Counter Attack procs at 2.0s (20% empower, 5s duration)      │
│  • Counter Attack procs at 4.0s (attempt refresh)                │
│  • Healing Defense procs at 6.0s (20% empower, 4s duration)     │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
  EVENT 1: Counter Attack procs at t=2.0s
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  BUNKER: perk_counter_attack_empower.js                          │
│  return {                                                        │
│    applyEffects: [{                                              │
│      id: 'counter_attack_empower',                               │
│      category: 'EMPOWER',                                        │
│      value: 0.20,  // 20%                                        │
│      duration: 5,                                                │
│      sourceId: 'counter_attack',  // ← Source ID                │
│      targetId: 'Player'                                          │
│    }]                                                            │
│  };                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  STATE MANAGER: Check for same source                            │
│  const existingFromSameSource = target.activeEffects.find(e =>  │
│    e.category === 'EMPOWER' &&                                   │
│    e.sourceId === 'counter_attack'  // Check source ID          │
│  );                                                              │
│  // → null (first application)                                   │
│                                                                  │
│  // Check cap:                                                   │
│  const currentTotal = target.activeEffects                       │
│    .filter(e => e.category === 'EMPOWER')                        │
│    .reduce((sum, e) => sum + e.value, 0);                        │
│  // → 0 (no empowers yet)                                        │
│                                                                  │
│  // Apply full amount:                                           │
│  target.activeEffects.push({                                     │
│    ...effectData,                                                │
│    appliedAt: 2.0,                                               │
│    expiresAt: 7.0  // 2.0 + 5                                    │
│  });                                                             │
│                                                                  │
│  // Result: Player has 20% empower until 7.0s                    │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
  EVENT 2: Counter Attack procs again at t=4.0s
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  BUNKER: Same effect returned                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  STATE MANAGER: Check for same source                            │
│  const existingFromSameSource = target.activeEffects.find(e =>  │
│    e.category === 'EMPOWER' &&                                   │
│    e.sourceId === 'counter_attack'                               │
│  );                                                              │
│  // → FOUND! (the 20% empower from 2.0s)                         │
│                                                                  │
│  // Refresh duration:                                            │
│  existingFromSameSource.expiresAt = 4.0 + 5;  // New: 9.0s      │
│  existingFromSameSource.appliedAt = 4.0;      // Update applied  │
│  return;  // Don't add new effect                                │
│                                                                  │
│  // Result: Same 20% empower, now expires at 9.0s (refreshed!)  │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
  EVENT 3: Healing Defense procs at t=6.0s
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  BUNKER: perk_healing_defense_ii.js                              │
│  return {                                                        │
│    applyEffects: [{                                              │
│      id: 'healing_defense_empower',                              │
│      category: 'EMPOWER',                                        │
│      value: 0.20,  // 20%                                        │
│      duration: 4,                                                │
│      sourceId: 'healing_defense',  // ← Different source!       │
│      targetId: 'Player'                                          │
│    }]                                                            │
│  };                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  STATE MANAGER: Check for same source                            │
│  const existingFromSameSource = target.activeEffects.find(e =>  │
│    e.category === 'EMPOWER' &&                                   │
│    e.sourceId === 'healing_defense'  // Different from CA!      │
│  );                                                              │
│  // → null (different source, allowed to stack!)                 │
│                                                                  │
│  // Check cap:                                                   │
│  const currentTotal = target.activeEffects                       │
│    .filter(e => e.category === 'EMPOWER')                        │
│    .reduce((sum, e) => sum + e.value, 0);                        │
│  // → 0.20 (20% from Counter Attack)                             │
│                                                                  │
│  // Would adding 0.20 exceed 0.50 cap?                           │
│  if (currentTotal + 0.20 > 0.50) {  // 0.40 > 0.50? NO!         │
│    // Not exceeded, apply full amount                            │
│  }                                                               │
│                                                                  │
│  // Apply full amount:                                           │
│  target.activeEffects.push({                                     │
│    ...effectData,                                                │
│    appliedAt: 6.0,                                               │
│    expiresAt: 10.0  // 6.0 + 4                                   │
│  });                                                             │
│                                                                  │
│  // Result: Player now has TWO empowers:                         │
│  //   1. Counter Attack: 20% (expires 9.0s)                      │
│  //   2. Healing Defense: 20% (expires 10.0s)                    │
│  // Total: 40% empower!                                          │
└─────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════
  STATE AT t=6.0s (After all three events)
═══════════════════════════════════════════════════════════════════

player.activeEffects = [
  {
    id: 'counter_attack_empower',
    category: 'EMPOWER',
    value: 0.20,
    sourceId: 'counter_attack',
    appliedAt: 4.0,
    expiresAt: 9.0
  },
  {
    id: 'healing_defense_empower',
    category: 'EMPOWER',
    value: 0.20,
    sourceId: 'healing_defense',
    appliedAt: 6.0,
    expiresAt: 10.0
  }
]

Total Empower: 40% (0.20 + 0.20)
Damage multiplier: 1.40x
```

**Key Stacking Rules Demonstrated**:
1. **Same source** (Counter Attack x2) → Refresh duration, don't add new
2. **Different sources** (Counter Attack + Healing Defense) → Stack (add both)
3. **Cap enforcement** → Would block/partial at 50% (not reached in this example)

---

## 6. Quick Reference: Where Data Lives

```
┌─────────────────────────────────────────────────────────────────┐
│  DATA LOCATION CHEAT SHEET                                       │
└─────────────────────────────────────────────────────────────────┘

STATIC CONFIGURATION (Loaded at startup):
├─ Perks           → /src/utils/perks.json
├─ Masteries       → /src/utils/masteries.json
├─ Weapons         → /src/utils/weapons.json
└─ Bunker Registry → /src/simulation/bunkers/bunkerRegistry.js

SIMULATION STATE (Mutated during sim):
├─ Player State
│  ├─ health       → player.health (number)
│  ├─ maxHealth    → player.maxHealth (number)
│  ├─ baseHealth   → player.baseHealth (number)
│  └─ activeEffects → player.activeEffects[] (DoTs, buffs, debuffs)
│
└─ Target State
   ├─ health       → target.health (number)
   ├─ maxHealth    → target.maxHealth (number)
   └─ activeEffects → target.activeEffects[] (DoTs, rends)

EVENT ANALYSIS (Output of simulation):
└─ analysisLog[]
   └─ Each entry:
      ├─ timestamp        (number)
      ├─ action           (string)
      ├─ damage           (number)
      ├─ totalHealing     (number, pre-calculated)
      ├─ healing[]        (array of heal effects)
      ├─ effectRequests[] (array of raw effect requests)
      └─ snapshot
         ├─ combatant     (cloned player state)
         └─ target        (cloned target state)

UI STATE (React components):
├─ Combat Analysis → Uses analysisLog[]
└─ Inspector       → Uses selected eventAnalysis entry
```

---

*Last Updated: 2025-10-20*