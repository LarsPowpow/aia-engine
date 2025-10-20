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

## Future ADRs to Consider

When implementing these features, document the decision:

1. **ADR-009: HoT (Heal over Time) Implementation** - When first HoT is added
2. **ADR-010: Multiple DoT Types Coexistence** - When second DoT type is added
3. **ADR-011: Crit Damage Calculation** - If crits use different formula
4. **ADR-012: Ability Cooldown Tracking** - When ability system is added
5. **ADR-013: Resource System (Mana/Stamina)** - If resources are added

---

*Last Updated: 2025-10-20*