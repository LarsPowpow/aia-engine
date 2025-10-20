# Project File Structure Guide

## Purpose
Navigation guide for finding and modifying code. Know where to look when debugging or adding features.

---

## High-Level Organization

```
/workspaces/aia-engine/
├── src/                      # All source code
│   ├── simulation/           # Core combat simulation (THE BRAIN)
│   ├── components/           # React UI components (THE FACE)
│   ├── utils/                # Data files, helpers (THE DATA)
│   └── App.jsx               # Main React app entry point
│
├── Memory Files - First Three Prompts/  # AI continuity docs
│   ├── App Overview/
│   ├── Feature descriptions/
│   └── specific prompts.DEPRECATED/
│
├── public/                   # Static assets (favicon, index.html)
├── node_modules/             # Dependencies (don't edit)
├── package.json              # Project config, dependencies
├── package-lock.json         # Locked dependency versions
└── README.md                 # Project documentation
```

---

## `/src/simulation/` - The Brain 🧠

**Purpose**: Core combat logic, all game rules live here.

```
/src/simulation/
├── engine.js                 # Event processor, two-stroke orchestrator
├── stateManager.js           # Effect application, anti-stacking rules
├── rotationEngine.js         # Generates attack sequences
│
├── bunkers/                  # Perk/ability implementations
│   ├── generated/            # Individual bunker files
│   │   ├── perk_keenly_jagged_ii.js
│   │   ├── perk_healing_defense_ii.js
│   │   ├── perk_counter_attack_empower.js
│   │   └── ... (one file per perk)
│   │
│   ├── bunkerRegistry.js     # Maps perk IDs → handler functions
│   └── baseBunkers.js        # Shared utilities for bunkers
│
└── calculations/
    └── damageCalculator.js   # Weapon damage formulas
```

### Key Files Deep-Dive

#### **engine.js** (Lines: ~750)
The main event loop and orchestrator.

**What it does**:
- Processes combat events in chronological order
- Runs two-stroke system (modifiers → effects)
- Groups and deduplicates effects
- Schedules DoT ticks
- Creates eventAnalysis entries for UI

**Key Functions**:
- `runSimulation()` - Entry point, returns analysisLog
- `twoStrokeProcessEvent()` - Processes single event
- `processDotTicks()` - Handles DoT damage at tick times

**When to edit**:
- Adding new event types (abilities, consumables)
- Changing how effects are grouped
- Modifying DoT tick timing
- Adjusting eventAnalysis structure

**Lines to know**:
- 100-150: DoT tick time generation
- 400-450: Effect grouping logic
- 500-600: DoT tick processing
- 650-700: Event analysis creation

---

#### **stateManager.js** (Lines: ~150)
Mutates combatant state, enforces all stacking/cap rules.

**What it does**:
- Applies individual effects to combatants
- Anti-stacking checks (by ID or sourceId)
- Cap enforcement (50% empower, 70% rend, etc.)
- Duration refresh logic
- Partial application when at cap

**Key Functions**:
- `applyEffect(target, effectData, context)` - Main entry point

**When to edit**:
- Changing stacking rules
- Adding new effect categories
- Modifying cap values
- Adjusting refresh behavior

**Lines to know**:
- 60-76: HEAL category handling
- 78-96: DOT category (anti-stack by ID)
- 98-140: EMPOWER/REND/FORTIFY (anti-stack by source, caps)

---

#### **bunkers/generated/** (Directory)
Individual perk implementations.

**Naming Convention**: `perk_<name>.js` or `ability_<name>.js`

**Structure** (each file):
```javascript
export default {
    id: 'perk_name',  // Must match perks.json
    displayName: 'Perk Name',
    
    handler: function({ stroke, source, target, event, timestamp }) {
        // stroke: 1 (modifiers) or 2 (effects)
        // source: attacking combatant
        // target: defending combatant
        // event: current event object
        // timestamp: current time
        
        if (stroke === 1) {
            // Return damage modifiers
            return { applyModifiers: [...] };
        }
        
        if (stroke === 2) {
            // Return effects to apply
            return { applyEffects: [...] };
        }
    }
};
```

**When to create new file**:
- Adding a new perk
- Copy existing similar perk as template
- Register in bunkerRegistry.js

**Examples**:
- `perk_keenly_jagged_ii.js` - DoT application
- `perk_healing_defense_ii.js` - Self-heal on block
- `perk_counter_attack_empower.js` - Buff application

---

#### **bunkers/bunkerRegistry.js** (Lines: ~50)
Maps perk IDs to bunker handlers.

**Structure**:
```javascript
import perkKenlyJaggedII from './generated/perk_keenly_jagged_ii.js';
import perkHealingDefenseII from './generated/perk_healing_defense_ii.js';
// ... more imports

const registry = {
    'keenly_jagged_ii': perkKenlyJaggedII,
    'healing_defense_ii': perkHealingDefenseII,
    // ... more registrations
};

export default registry;
```

**When to edit**:
- After creating new bunker file
- Add import + registration entry

---

## `/src/components/` - The Face 👤

**Purpose**: React UI components, user interaction.

```
/src/components/
├── CombatSimulatorPage.jsx   # Main page: controls, combat log, tabs
├── InspectorPanel.jsx         # Modal: event details, snapshots
├── EquipmentPanel.jsx         # Perk/mastery selection UI
├── RotationViewer.jsx         # Attack sequence visualization
└── ... (other UI components)
```

### Key Files Deep-Dive

#### **CombatSimulatorPage.jsx** (Lines: ~800)
The main simulation page.

**What it does**:
- Renders simulation controls (run, reset)
- Displays Combat Analysis table
- Handles tab switching (Combat Analysis, Live Log, etc.)
- Opens Inspector modal

**Key Sections**:
- `runSimulation()` - Calls engine, stores results
- Combat Analysis table - Displays analysisLog
- Column rendering - Damage, healing, action name

**When to edit**:
- Adding new columns to Combat Analysis
- Changing table display format
- Adding new tabs
- Modifying summary statistics

**Lines to know**:
- 48-80: Table column headers + rendering
- 150-200: Combat Analysis table body
- 300-350: Summary statistics

---

#### **InspectorPanel.jsx** (Lines: ~500)
Detailed event inspection modal.

**What it does**:
- Shows selected event details
- Three tabs: Summary, Raw State, Debug
- Summary: Damage/healing breakdown
- Raw State: Combatant states (health, activeEffects)
- Debug: Raw event object

**Key Sections**:
- Summary tab - Friendly display of effects
- Raw State tab - activeEffects display (filters instant)
- Debug tab - JSON dump

**When to edit**:
- Changing effect display format
- Adding new summary sections
- Filtering activeEffects display

**Lines to know**:
- 95-145: Summary tab rendering
- 168-172: Raw State filtering (removes duration===0)
- 250-300: Effect breakdown logic

---

## `/src/utils/` - The Data 📊

**Purpose**: Configuration data, helper functions.

```
/src/utils/
├── perks.json                # Perk definitions
├── masteries.json            # Mastery definitions
├── weapons.json              # Weapon stats
└── ... (other data files)
```

### Key Files Deep-Dive

#### **perks.json** (Lines: ~500)
Source of truth for perk metadata.

**Structure**:
```json
{
  "perks": [
    {
      "name": "Keenly Jagged II",
      "id": "keenly_jagged_ii",  // ← Must match bunker ID!
      "bucket": "weapon",
      "tier": 2,
      "description": "Crits apply bleed..."
    },
    // ... more perks
  ]
}
```

**When to edit**:
- Adding new perk (after creating bunker)
- Updating perk descriptions
- Changing perk metadata

**Important**: `id` field must match bunker registry key!

---

## `/Memory Files - First Three Prompts/` - AI Continuity 🤖

**Purpose**: Documentation for AI instances to maintain context.

```
Memory Files - First Three Prompts/
├── App Overview/
│   └── 0. APP OVERVIEW.txt           # High-level system overview
│
├── Feature descriptions/
│   ├── Healing Defense 2025.10.16.txt
│   └── Keenly Jagged 2025.10.16.txt
│
└── specific prompts.DEPRECATED/      # Old, ignore
```

**New Files** (created today):
- `ARCHITECTURE_DECISIONS.md` - Why certain choices were made
- `COMMON_PITFALLS.md` - Debugging guide
- `DATA_FLOW_DIAGRAMS.md` - Visual flow guides
- `PROJECT_STRUCTURE.md` - This file!

**When to add**:
- After implementing major features
- When making significant architectural changes
- Document lessons learned

---

## Where to Look: Common Tasks 🔍

### Adding a New Perk

**Step-by-step**:

1. **Create bunker file**:
```bash
# Copy existing perk as template
cp src/simulation/bunkers/generated/perk_keenly_jagged_ii.js \
   src/simulation/bunkers/generated/perk_new_name.js
```

2. **Edit bunker**:
```javascript
// src/simulation/bunkers/generated/perk_new_name.js
export default {
    id: 'new_perk_name',  // Change this
    displayName: 'New Perk Name',  // Change this
    handler: function({ stroke, source, target, event, timestamp }) {
        // Implement logic here
    }
};
```

3. **Register bunker**:
```javascript
// src/simulation/bunkers/bunkerRegistry.js
import perkNewName from './generated/perk_new_name.js';  // Add import

const registry = {
    // ... existing
    'new_perk_name': perkNewName,  // Add registration
};
```

4. **Add to perks.json** (if needed):
```json
{
  "name": "New Perk Name",
  "id": "new_perk_name",
  "bucket": "weapon",
  "tier": 2
}
```

5. **Test**: Run simulation, check console logs, inspect results

---

### Changing Stacking Rules

**File**: `/src/simulation/stateManager.js`

**Section**: Lines 78-140 (applyEffect function)

**What to change**:
```javascript
// For new category:
if (effectData.category === 'NEW_CATEGORY') {
    // Anti-stack logic here
    const existing = target.activeEffects.find(e => 
        e.category === 'NEW_CATEGORY' && 
        e.sourceId === effectData.sourceId  // or e.id for DoT-like
    );
    
    if (existing) {
        // Refresh or block?
    }
    
    // Cap logic here (if applicable)
    const total = target.activeEffects
        .filter(e => e.category === 'NEW_CATEGORY')
        .reduce((sum, e) => sum + e.value, 0);
    
    if (total + effectData.value > CAP) {
        // Handle cap
    }
}
```

**Test**: Run simulation with multiple procs, check activeEffects in Inspector

---

### Fixing DoT Behavior

**Files to check**:

1. **Bunker** (`/src/simulation/bunkers/generated/perk_*.js`):
   - Is `value` correct (damage amount)?
   - Is `duration` correct?
   - Is `category: 'DOT'` set?

2. **State Manager** (`/src/simulation/stateManager.js`):
   - Lines 78-96: Anti-stacking working?
   - Is DoT being added to activeEffects?

3. **Engine** (`/src/simulation/engine.js`):
   - Lines 100-150: Tick times generated?
   - Lines 535-580: Ticks being processed?
   - Is damage calculation correct?

**Debug logs to add**:
```javascript
// In stateManager:
console.log('[STATE MANAGER] Applying DoT:', effectData.id, 'to', target.id);

// In engine tick processing:
console.log('[DOT] Tick at', timestamp, 'active DoTs:', activeDots.length);
console.log('[DOT] Applying', dotDamage, 'damage from', dot.id);
```

---

### Fixing UI Display Issues

**Files to check**:

1. **Engine eventAnalysis** (`/src/simulation/engine.js`):
```javascript
// Lines 650-700: Is data being added to eventAnalysis?
const eventAnalysis = {
    timestamp,
    action,
    damage,
    totalHealing,  // ← Is this calculated?
    healing: [...], // ← Is this populated?
    // ...
};
```

2. **Component rendering** (`/src/components/CombatSimulatorPage.jsx`):
```javascript
// Lines 48-80: Is column reading correct property?
<td>{entry.totalHealing || 0}</td>  // Correct property name?
```

3. **Calculation mismatch**:
```javascript
// UI calculation must match engine calculation!
// Engine:
const totalHealing = healing.reduce((sum, h) => sum + calculate(h), 0);

// UI:
const healingValue = entry.totalHealing ?? (
    entry.healing?.reduce((sum, h) => sum + calculate(h), 0)
);
// Same calculation!
```

---

### Debugging Target Resolution

**Files to check in order**:

1. **Bunker output** (`/src/simulation/bunkers/generated/perk_*.js`):
```javascript
console.log('[BUNKER] Returning effect:', {
    targetId: 'Player',  // ← Set correctly?
    category: 'HEAL'
});
```

2. **Engine grouping** (`/src/simulation/engine.js`, lines ~410):
```javascript
console.log('[ENGINE] Grouped effect:', {
    targetId: grouped[key].targetId,  // ← Preserved?
    originalTargetId: eff.targetId
});
```

3. **State manager** (`/src/simulation/stateManager.js`, line ~60):
```javascript
console.log('[STATE MANAGER] Applying to:', target.id);
// Should be 'Player' for self-heal!
```

---

## File Naming Conventions

| File Type | Convention | Example |
|-----------|-----------|----------|
| Bunkers | `perk_<name>.js` or `ability_<name>.js` | `perk_keenly_jagged_ii.js` |
| Components | `<Name>Page.jsx` or `<Name>Panel.jsx` | `CombatSimulatorPage.jsx` |
| Utilities | `<name>Utils.js` or `<name>Calculator.js` | `damageCalculator.js` |
| Data files | `<name>.json` | `perks.json` |
| Memory docs | `<NAME>.md` | `ARCHITECTURE_DECISIONS.md` |

---

## Import Patterns

```javascript
// === Simulation imports ===
import bunkerRegistry from '/src/simulation/bunkers/bunkerRegistry.js';
import { twoStrokeProcessEvent } from '/src/simulation/engine.js';
import * as stateManager from '/src/simulation/stateManager.js';

// === Component imports ===
import InspectorPanel from '/src/components/InspectorPanel.jsx';
import EquipmentPanel from '/src/components/EquipmentPanel.jsx';

// === Data imports ===
import perksData from '/src/utils/perks.json';
import masteriesData from '/src/utils/masteries.json';

// === Bunker imports (in registry) ===
import perkKenlyJaggedII from './generated/perk_keenly_jagged_ii.js';
```

**Path rules**:
- Absolute paths from `/src/` (preferred for clarity)
- Relative paths ok within same directory (`./`)
- JSON imports automatically parsed

---

## Git Workflow (If Relevant)

**Branch strategy**:
- `main` or `master` - Production code
- `roadmap/today-YYYYMMDD-HHMM` - Daily feature branches
- `feature/<name>` - Larger features

**Commit messages**:
```bash
# Good:
git commit -m "Fix heal target resolution in engine grouping"
git commit -m "Add Keenly Jagged II perk with DoT system"
git commit -m "Update stacking rules for EMPOWER category"

# Bad:
git commit -m "fix bug"
git commit -m "update code"
git commit -m "changes"
```

---

## Testing Strategy

### Manual Testing (Primary)

1. **Run simulation** via UI "Run Simulation" button
2. **Check console logs** for expected behavior
3. **Inspect results** in Combat Analysis table
4. **Open Inspector** for detailed event examination
5. **Verify calculations** match expected values

### Regression Testing

After changes, re-test known scenarios:

| Scenario | Expected Result |
|----------|----------------|
| Keenly Jagged crit | Bleed applied, ticks for 10s |
| Keenly Jagged double crit | Second blocked (no stacking) |
| Healing Defense block | Player heals 263 HP |
| Counter Attack x2 | Second refreshes duration |
| CA + HD empower | Both stack (40% total) |

### Unit Tests (If They Exist)

```bash
npm test
# or
npm run test:watch
```

Look for tests in:
- `/src/simulation/__tests__/`
- `/src/components/__tests__/`

---

## Quick Reference: Line Number Ranges

| File | Section | Lines | Purpose |
|------|---------|-------|---------|
| engine.js | DoT tick generation | 100-150 | Pre-calculate tick times |
| engine.js | Effect grouping | 400-450 | Group/dedupe effects |
| engine.js | DoT tick processing | 535-580 | Apply DoT damage |
| engine.js | Event analysis | 650-700 | Create UI data |
| stateManager.js | HEAL handling | 60-76 | Apply heals |
| stateManager.js | DOT handling | 78-96 | Anti-stack DoTs |
| stateManager.js | BUFF handling | 98-140 | Anti-stack + caps |
| CombatSimulatorPage.jsx | Table headers | 48-80 | Column definitions |
| CombatSimulatorPage.jsx | Table body | 150-200 | Row rendering |
| InspectorPanel.jsx | Summary tab | 95-145 | Effect breakdown |
| InspectorPanel.jsx | Raw State filter | 168-172 | Filter instant effects |

**Note**: Line numbers approximate, may shift with changes.

---

## Emergency Debugging Commands

```bash
# Find where something is defined:
grep -r "functionName" /workspaces/aia-engine/src/

# Find where something is used:
grep -r "variableName" /workspaces/aia-engine/src/

# Find console logs:
grep -r "console.log" /workspaces/aia-engine/src/simulation/

# Find TODOs:
grep -r "TODO\|FIXME\|XXX" /workspaces/aia-engine/src/

# List all bunkers:
ls -1 /workspaces/aia-engine/src/simulation/bunkers/generated/

# Check file size (find bloated files):
du -h /workspaces/aia-engine/src/**/*.js | sort -h

# Count lines of code:
find /workspaces/aia-engine/src -name "*.js" -o -name "*.jsx" | xargs wc -l
```

---

## External Resources

- **React Docs**: https://react.dev/
- **JavaScript MDN**: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- **Git Docs**: https://git-scm.com/doc

---

*Last Updated: 2025-10-20*