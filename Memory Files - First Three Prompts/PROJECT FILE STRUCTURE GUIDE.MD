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
│   ├── modifiers/            # Damage modifier bunkers (Stroke 1)
│   │   ├── runeglass_empowered_sapphire_weapon.js
│   │   ├── runeglass_empowered_sapphire_armor.js
│   │   ├── runeglass_empowered_jasper_retaliate_modifier.js
│   │   └── ... (runeglass modifiers)
│   │
│   ├── effectBunkers/        # Effect applier bunkers (Stroke 2)
│   │   ├── runeglass_empowered_sapphire_weapon_hex.js
│   │   ├── runeglass_empowered_jasper_retaliate_stack.js
│   │   ├── runeglass_empowered_jasper_hex.js
│   │   └── ... (runeglass effects)
│   │
│   ├── prefabs/              # JSON definitions for Firestore
│   │   ├── runeglass_empowered_sapphire_weapon.json
│   │   ├── runeglass_empowered_jasper_retaliate_stack.json
│   │   └── ... (one JSON per bunker)
│   │
│   ├── bunkerManifest.js     # Registers all bunkers
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

#### **bunkers/modifiers/** (Directory)
Stroke 1 bunkers that modify damage calculations.

**Purpose**: Return `modifyDamage` objects to adjust damage before it's applied.

**Types**:
1. **Damage Conversion**: Physical → Arcane, etc.
2. **Conditional Bonuses**: +14% damage vs CC targets
3. **Flat Bonuses**: +2% damage (unconditional)
4. **Stack Readers**: Read activeEffects, return multiplier based on stacks

**Structure** (each file):
```javascript
const METADATA = {
  id: 'runeglass_empowered_sapphire_weapon',  // Must match JSON!
  name: 'Empowered Sapphire - Weapon',
  type: 'MODIFIER_BUNKER',
  stroke: 1  // Stroke 1 = modifiers
};

function handler({ event, source, target, context, timestamp }) {
  // Check if this event should apply
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  // Return damage modification
  return {
    modifyDamage: {
      // Option 1: Damage conversion
      convertDamage: { from: 'physical', to: 'arcane', percent: 0.50 },
      
      // Option 2: Multiplier
      multiplier: 1.14,  // +14% damage
      
      // Option 3: Additive bonus
      additive: 0.02  // +2% damage
    }
  };
}

export default { METADATA, handler };
```

**Examples**:
- `runeglass_empowered_sapphire_weapon.js` - 50% physical → arcane conversion
- `runeglass_empowered_malachite_weapon.js` - +14% damage vs CC targets
- `runeglass_empowered_jasper_retaliate_modifier.js` - +8% per stack (reads activeEffects)
- `runeglass_punishing_jasper_weapon_misc.js` - +2% flat damage

**Registered In**: `bunkerManifest.js` → `modifierBunkers` array

---

#### **bunkers/effectBunkers/** (Directory)
Stroke 2 bunkers that apply effects (buffs, DoTs, heals).

**Purpose**: Return `applyEffects` arrays to create activeEffects on combatants.

**Types**:
1. **DoT Appliers**: Hex, Bleed, etc.
2. **Buff Appliers**: EMPOWER stacks, Fortify, etc.
3. **Heal Appliers**: Instant heals or HoTs

**Structure** (each file):
```javascript
import { calculateWeaponDamage } from '../../formulas.js';

const METADATA = {
  id: 'runeglass_empowered_jasper_retaliate_stack',  // Must match JSON!
  name: 'Empowered Jasper - Retaliate Stack',
  type: 'EFFECT_BUNKER',
  stroke: 2  // Stroke 2 = effects
};

function handler({ event, source, target, timestamp }) {
  // Check if this event should apply
  const triggers = ['BLOCK_START', 'BLOCK_HIT', 'BLOCK_END'];
  if (!triggers.includes(event?.action)) return null;
  
  // Return effect to apply
  return {
    applyEffects: [{
      id: 'empowered_jasper_retaliate_stack',  // Used for anti-stacking
      category: 'EMPOWER',  // EMPOWER, DOT, HEAL, etc.
      sourceId: source?.id,
      targetId: source?.id,  // Self-buff
      value: 0.08,  // 8% per stack
      duration: 5,
      stackable: true,  // Allows multiple stacks
      maxStacks: 3,  // Cap at 3 stacks
      appliedAt: timestamp,
      expiresAt: timestamp + 5,
      metadata: {
        sourceName: 'Empowered Jasper Retaliate'
      }
    }]
  };
}

export default { METADATA, handler };
```

**Hex DoT Pattern** (IMPORTANT - COPY THIS):
```javascript
function handler({ event, source, target, timestamp }) {
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  // Calculate weapon damage
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
      value: weaponDamage * 0.08,  // 8% weapon damage per tick
      duration: 2,
      sourceId: source.id,
      targetId: target.id,
      metadata: {
        sourceName: 'Hex Effect Name',
        weaponType: event.weapon,      // ← REQUIRED!
        attributes: source.attributes  // ← REQUIRED!
      }
    }]
  };
}
```

**Examples**:
- `runeglass_empowered_sapphire_weapon_hex.js` - Hex DoT (8% arcane for 2s)
- `runeglass_empowered_jasper_retaliate_stack.js` - Stackable EMPOWER buff
- `runeglass_empowered_jasper_hex.js` - Hex DoT (FIXED with metadata!)

**Registered In**: `bunkerManifest.js` → `effectBunkers` array

---

#### **bunkers/prefabs/** (Directory)
JSON definitions uploaded to Firestore for UI selection.

**Purpose**: Describe bunkers for UI display and selection.

**Structure** (each file):
```json
{
  "id": "runeglass_empowered_jasper_retaliate_stack",
  "type": "RUNEGLASS",
  "bucket": "runeglass_weapon",
  "label": "Empowered Jasper (Weapon - Retaliate Stack)",
  "name": "Runeglass of Empowered Jasper",
  "description": "Gain a stack of +8% damage for 5s after blocking. Max 3 stacks.",
  "event": "PASSIVE",
  "condition": {
    "type": "action_in",
    "actions": ["BLOCK_START", "BLOCK_HIT", "BLOCK_END"]
  },
  "effects": [
    {
      "type": "buff",
      "category": "EMPOWER",
      "value": 0.08,
      "duration": 5,
      "stackable": true,
      "maxStacks": 3
    }
  ],
  "labels": ["Runeglass_Weapon_Jasper_Empowered_Retaliate"],
  "slot": "weapon_runeglass"
}
```

**Critical Rule**: `"id"` field MUST match bunker `METADATA.id` exactly!

**Upload Process**:
1. Create JSON file in `/prefabs/`
2. Upload to Firestore collection `runeglass` (or appropriate collection)
3. Document ID in Firestore = JSON `"id"` field
4. User selects in UI by this ID
5. Engine filters bunkers by matching `METADATA.id`

**Examples**: All runeglass JSON files (19 total across 5 runeglass types)

---

#### **bunkerManifest.js** (Lines: ~110)
Registers all bunkers and makes them available to engine.

**Structure**:
```javascript
// Auto-import generated bunkers
const generatedBunkerModules = import.meta.glob('./generated/*.js', { eager: true });
const generatedBunkers = Object.values(generatedBunkerModules)
  .map(mod => mod.default)
  .filter(Boolean);

// Manual imports for modifiers
import runeglass_empowered_sapphire_weapon from './modifiers/runeglass_empowered_sapphire_weapon.js';
import runeglass_empowered_jasper_retaliate_modifier from './modifiers/runeglass_empowered_jasper_retaliate_modifier.js';
// ... more imports

// Manual imports for effects
import runeglass_empowered_sapphire_weapon_hex from './effectBunkers/runeglass_empowered_sapphire_weapon_hex.js';
import runeglass_empowered_jasper_retaliate_stack from './effectBunkers/runeglass_empowered_jasper_retaliate_stack.js';
// ... more imports

export const modifierBunkers = [
    runeglass_empowered_sapphire_weapon,
    runeglass_empowered_jasper_retaliate_modifier,
    // ... all modifier bunkers
];

export const effectBunkers = [
    runeglass_empowered_sapphire_weapon_hex,
    runeglass_empowered_jasper_retaliate_stack,
    ...generatedBunkers  // Auto-imported generated bunkers
];
```

**When to Edit**:
- After creating new modifier bunker → Add import + add to `modifierBunkers`
- After creating new effect bunker → Add import + add to `effectBunkers`
- Generated bunkers auto-import (no manual registration needed)

**Critical**: Engine filters bunkers based on IDs, so registration is essential!

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

### Adding a New Runeglass

**Step-by-step**:

**1. Determine Pattern** (3-bunker vs 4-bunker):
- **3-bunker**: Damage conversion only (e.g., Empowered Sapphire)
  - Weapon modifier (conversion)
  - Weapon effect (Hex DoT)
  - Armor modifier (arcane boost)
  
- **4-bunker**: Conditional mechanics (e.g., Empowered Jasper)
  - Effect bunker (stack applier or Hex)
  - Effect bunker (second effect, usually Hex)
  - Modifier bunker (condition reader, damage boost)
  - Modifier bunker (armor boost)

**2. Create Modifier Bunkers**:
```bash
# For damage conversion:
cat > src/simulation/bunkers/modifiers/runeglass_name_weapon.js <<'EOF'
const METADATA = {
  id: 'runeglass_name_weapon',
  name: 'Runeglass Name - Weapon',
  type: 'MODIFIER_BUNKER',
  stroke: 1
};

function handler({ event, source, target, context, timestamp }) {
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  if (context?.damageType !== 'PHYSICAL') return null;
  
  return {
    modifyDamage: {
      convertDamage: { from: 'physical', to: 'arcane', percent: 0.50 }
    }
  };
}

export default { METADATA, handler };
EOF
```

**3. Create Effect Bunkers**:
```bash
# For Hex DoT (COPY THIS PATTERN!):
cat > src/simulation/bunkers/effectBunkers/runeglass_name_hex.js <<'EOF'
import { calculateWeaponDamage } from '../../formulas.js';

const METADATA = {
  id: 'runeglass_name_weapon_hex',
  name: 'Runeglass Name - Hex',
  type: 'EFFECT_BUNKER',
  stroke: 2
};

function handler({ event, source, target, timestamp }) {
  const damageActions = ['LIGHT_ATTACK', 'HEAVY_ATTACK', 'ABILITY', 'ABILITY_HIT'];
  if (!damageActions.includes(event?.action)) return null;
  
  const weaponDamage = calculateWeaponDamage(event.weapon, source.attributes, source);
  
  return {
    applyEffects: [{
      id: 'runeglass_name_hex',
      category: 'DOT',
      damageType: 'ARCANE',
      value: weaponDamage * 0.08,
      duration: 2,
      sourceId: source.id,
      targetId: target.id,
      metadata: {
        sourceName: 'Runeglass Name Hex',
        weaponType: event.weapon,      // REQUIRED!
        attributes: source.attributes  // REQUIRED!
      }
    }]
  };
}

export default { METADATA, handler };
EOF
```

**4. Create JSON Prefabs**:
```bash
# One JSON per bunker
cat > src/simulation/bunkers/prefabs/runeglass_name_weapon.json <<'EOF'
{
  "id": "runeglass_name_weapon",
  "type": "RUNEGLASS",
  "bucket": "runeglass_weapon",
  "label": "Runeglass Name (Weapon)",
  "name": "Runeglass of Name",
  "description": "Converts 50% of physical damage to arcane.",
  "event": "PASSIVE",
  "effects": [
    {
      "type": "damage_conversion",
      "from": "physical",
      "to": "arcane",
      "percent": 0.50
    }
  ],
  "labels": ["Runeglass_Weapon_Name"],
  "slot": "weapon_runeglass"
}
EOF
```

**5. Register in bunkerManifest.js**:
```javascript
// Add imports at top:
import runeglass_name_weapon from './modifiers/runeglass_name_weapon.js';
import runeglass_name_weapon_hex from './effectBunkers/runeglass_name_hex.js';

// Add to arrays:
export const modifierBunkers = [
    // ... existing
    runeglass_name_weapon,
];

export const effectBunkers = [
    // ... existing
    runeglass_name_weapon_hex,
];
```

**6. Upload JSON to Firestore**:
- Manual upload via UI, or
- Bulk upload script (if available)
- **Verify**: Firestore doc ID = JSON "id" field!

**7. Test**:
```javascript
// 1. Select all pieces in UI
// 2. Run simulation
// 3. Check console for:
console.log('[ENGINE] Effect bunker runeglass_name_weapon_hex: MATCHED');
// 4. Verify damage conversion in Combat Log
// 5. Verify Hex ticking in Inspector → Raw State
```

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

### Implemented Runeglasses (Complete Set as of 2025-10-21)

**Runeglass of Empowered Sapphire** (3 bunkers):
- `runeglass_empowered_sapphire_weapon.js` - 50% physical → arcane conversion
- `runeglass_empowered_sapphire_weapon_hex.js` - Hex DoT (8% arcane, 2s)
- `runeglass_empowered_sapphire_armor.js` - +2% arcane damage

**Runeglass of Punishing Malachite** (3 bunkers):
- `runeglass_punishing_malachite_weapon.js` - +14% damage vs CC targets
- `runeglass_punishing_malachite_weapon_misc.js` - +2% flat damage (weapon)
- `runeglass_punishing_malachite_armor.js` - +1% flat damage (armor)

**Runeglass of Empowered Malachite** (4 bunkers):
- `runeglass_empowered_malachite_weapon.js` - +14% damage vs CC targets
- `runeglass_empowered_malachite_weapon_hex.js` - Hex DoT (8% arcane, 2s)
- `runeglass_empowered_malachite_weapon_misc.js` - +2% arcane damage (weapon)
- `runeglass_empowered_malachite_armor.js` - +2% arcane damage (armor)

**Runeglass of Empowered Jasper** (4 bunkers):
- `runeglass_empowered_jasper_retaliate_stack.js` - Stack applier (+8% EMPOWER per stack, max 3, 5s duration, triggers on BLOCK events)
- `runeglass_empowered_jasper_hex.js` - Hex DoT (8% arcane, 2s) - **FIXED with metadata**
- `runeglass_empowered_jasper_retaliate_modifier.js` - Stack reader (reads stacks, applies 8% × count)
- `runeglass_empowered_jasper_armor.js` - +2% arcane damage

**Runeglass of Punishing Jasper** (4 bunkers):
- Uses same stack effect: `runeglass_empowered_jasper_retaliate_stack.js`
- `runeglass_punishing_jasper_retaliate_modifier.js` - Stack reader (reads stacks, applies 8% × count)
- `runeglass_punishing_jasper_weapon_misc.js` - +2% flat damage (weapon)
- `runeglass_punishing_jasper_armor.js` - +1% flat damage (armor)

**Total**: 18 code bunkers, 19 JSON prefabs (Empowered Jasper stack has 2 JSONs for UI selection)

**Key Learnings**:
1. Damage conversion = 3 bunkers (handled in-engine)
2. Conditional mechanics = 4 bunkers (declarative)
3. Stack effects can be shared between variants
4. Hex DoTs MUST include weaponType and attributes in metadata
5. All IDs must match exactly (JSON, code, Firestore)
6. User must select ALL pieces in UI for runeglass to work

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

## Runeglass Quick Reference 💎

### When to Use Which Pattern

| Runeglass Type | Bunker Count | Pattern | Example |
|----------------|--------------|---------|---------|
| **Damage Conversion** | 3 | Weapon modifier (conversion) + Hex effect + Armor modifier | Empowered Sapphire |
| **Conditional Damage** | 4+ | Condition checker/stack applier + Hex + Modifier readers + Armor | Empowered Jasper |
| **Simple Bonuses** | 3 | Weapon modifier + Weapon misc + Armor | Punishing Malachite |

### Checklist for New Runeglass

- [ ] Determine pattern (3 vs 4 bunker)
- [ ] Create modifier bunkers in `/modifiers/`
- [ ] Create effect bunkers in `/effectBunkers/`
- [ ] Create JSON prefabs in `/prefabs/` (one per bunker)
- [ ] **Verify all IDs match exactly** (JSON "id", code METADATA.id)
- [ ] Register in `bunkerManifest.js` (imports + arrays)
- [ ] If Hex DoT: Include weaponType and attributes in metadata
- [ ] Upload JSONs to Firestore (doc ID = JSON "id")
- [ ] Test: Select ALL pieces in UI
- [ ] Test: Check console logs for "MATCHED"
- [ ] Test: Verify effects in Combat Log and Inspector

### Common Runeglass Mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| ID mismatch | Bunker "not matched" in console | Triple-check JSON, code, Firestore IDs |
| Missing pieces | Runeglass partially working | Select ALL pieces in UI |
| Missing Hex metadata | Hex dealing 0 damage | Add weaponType and attributes |
| Wrong bunker array | Bunker not executing | Modifiers → modifierBunkers, Effects → effectBunkers |
| Forgot to upload JSON | Can't select in UI | Upload to Firestore |

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

**Runeglass Files** (added 2025-10-21):

| File | Purpose |
|------|---------|
| `/modifiers/runeglass_*.js` | Damage modifiers (Stroke 1) |
| `/effectBunkers/runeglass_*.js` | Effect appliers (Stroke 2) |
| `/prefabs/runeglass_*.json` | Firestore JSON definitions |
| `bunkerManifest.js` | Registration of all bunkers |

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

# List all runeglass bunkers:
ls -1 /workspaces/aia-engine/src/simulation/bunkers/modifiers/runeglass_*
ls -1 /workspaces/aia-engine/src/simulation/bunkers/effectBunkers/runeglass_*
ls -1 /workspaces/aia-engine/src/simulation/bunkers/prefabs/runeglass_*
```

---

## External Resources

- **React Docs**: https://react.dev/
- **JavaScript MDN**: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- **Git Docs**: https://git-scm.com/doc

---

## Session Notes: 2025-10-21 Runeglass Implementation

**Completed**: Full implementation of 5 runeglass types (18 bunkers, 19 JSON prefabs)

**Key Discoveries**:
1. **3-bunker pattern** for damage conversion (engine handles it)
2. **4-bunker pattern** for conditional mechanics (fully declarative)
3. **Shared stack effects** between variants (Empowered/Punishing Jasper)
4. **Hex DoT metadata requirement**: Must include weaponType and attributes
5. **Triple-ID rule**: JSON "id" = code METADATA.id = Firestore doc ID
6. **UI selection requirement**: Must select ALL pieces for runeglass to work

**Common Issues Debugged**:
- ID mismatches causing bunkers not to match
- Missing Hex metadata causing 0 damage
- Incomplete UI selection (2 of 3 pieces selected)
- Effect bunker vs modifier bunker registration confusion

**Files Modified**:
- 18 new bunker files (modifiers/ and effectBunkers/)
- 19 new JSON prefabs (prefabs/)
- bunkerManifest.js (imports and registrations)
- Added console.log diagnostics for debugging

**Documentation Updated**:
- ARCHITECTURE_DECISIONS.md (ADR-009 through ADR-012)
- COMMON_PITFALLS.md (runeglass-specific sections)
- PROJECT_STRUCTURE.md (comprehensive runeglass documentation)

---

*Last Updated: 2025-10-21*