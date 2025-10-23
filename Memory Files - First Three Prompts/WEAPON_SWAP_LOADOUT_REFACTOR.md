# Weapon Swap & Loadout Structure Refactor

## Date: October 22, 2025
## Status: Planning Phase (Not Yet Implemented)

---

## Problem Statement

Currently, all perks/runeglass are treated as globally active throughout a simulation. This is unrealistic because:

1. **In New World**, each weapon has its own perk slots
2. **Weapon swapping** should change which perks/runeglass are active
3. **Build optimization** requires testing different perk combinations per weapon
4. **Strategic gameplay** involves timing weapon swaps to leverage different perk sets

### Current Behavior (Incorrect)

```javascript
// Current: Flat array, always active
allSources = [
  { id: 'perk_keenly_jagged_ii', type: 'perk' },
  { id: 'perk_fortifying_shield_rush', type: 'perk' },
  { id: 'runeglass_empowered_jasper_weapon', type: 'runeglass' }
];

// Keenly Jagged (Flail perk) applies even when Sword is equipped! ❌
```

### Desired Behavior (Correct)

```javascript
// Desired: Weapon-specific loadout
loadout = {
  weapons: {
    flail: {
      perks: ['perk_keenly_jagged_ii'],
      runeglass: 'runeglass_empowered_jasper_weapon'
    },
    sword: {
      perks: ['perk_fortifying_shield_rush'],
      runeglass: 'runeglass_empowered_malachite_weapon'
    }
  }
};

// Keenly Jagged only applies when Flail is equipped ✓
// On weapon swap → Flail perks deactivate, Sword perks activate ✓
```

---

## Effect Cleanup Rules on Weapon Swap

### Target (Opponent) Effects: Always Persist

**ALL target effects persist through weapon swap:**
- ✅ DOT/BLEED (Keenly Jagged bleed keeps ticking after swap)
- ✅ REND (Whirling Blade rend stays on target)
- ✅ WEAKEN (Shield Rush weaken stays on target)
- ✅ SLOW (Trip slow stays on target)
- ✅ HEX (Empowered Jasper hex keeps ticking)

**Rationale**: You applied these to the enemy, they persist regardless of what weapon you're holding.

### Player (Source) Effects: Slot-Based Cleanup

**Remove player effects IF sourced from:**
- ❌ **Weapon perks** (lives on the weapon being swapped away)
- ❌ **Weapon runeglass** (lives on the weapon being swapped away)
- ❌ **Weapon masteries** (weapon skill tree)
- ❌ **Weapon abilities** (ability buffs like Arcane Vortex 10% Empower expire on swap)

**Keep player effects IF sourced from:**
- ✅ **Jewelry** (ring/earring/amulet perks like Healing Breeze II)
- ✅ **Armor** (armor perks/runeglass)
- ✅ **Attribute bonuses** (character stats, not gear)
- ✅ **Consumables** (food, potions - if implemented)

**Example**:
```
Player has:
- Keenly Jagged bleed on target (weapon perk) → Target effect, PERSISTS ✓
- Healing Breeze II HoT on self (ring perk) → Non-weapon source, PERSISTS ✓
- Counter Attack Empower on self (sword mastery) → Weapon source, EXPIRES ❌
- Arcane Vortex Empower on self (flail ability) → Weapon source, EXPIRES ❌

On swap Flail → Sword:
- Keenly Jagged bleed continues ticking (on target)
- Healing Breeze HoT continues ticking (ring source)
- Counter Attack Empower removed (sword mastery, weapon changed)
- Arcane Vortex Empower removed (flail ability, weapon changed)
```

---

## Implementation Options Considered

### Option 1: Database-Driven Slot Metadata

**Concept**: Add `slot` field to Firestore perk definitions, UI fetches and passes to engine.

**Example**:
```json
{
  "id": "perk_healing_breeze_ii",
  "name": "Healing Breeze II",
  "slot": "ring",  // ← Add this field
  "description": "..."
}
```

**Pros**:
- ✅ Bunker code stays 100% dumb (no changes)
- ✅ Slot metadata stored once in DB, reused everywhere
- ✅ Easy to update (change DB, no code changes)

**Cons**:
- ❌ Need to upsert `slot` field to ~100 DB documents
- ❌ Engine needs loadout structure with slot info

**Verdict**: Good option, but requires DB updates.

---

### Option 2: Convention-Based Slot Detection

**Concept**: Engine infers slot from sourceId naming patterns.

**Example**:
```javascript
function inferSlot(sourceId) {
  if (sourceId.includes('_weapon')) return 'weapon';
  if (sourceId.includes('_armor')) return 'armor';
  if (sourceId.startsWith('ability_bonus_')) return 'attribute';
  if (sourceId.startsWith('perk_')) return 'weapon';  // ❌ Can't distinguish!
}
```

**Pros**:
- ✅ Zero code changes
- ✅ No DB updates

**Cons**:
- ❌ **Can't distinguish weapon perks from jewelry perks** (both start with `perk_`)
- ❌ Fragile (relies on naming magic)
- ❌ Not explicit (hidden behavior)

**Verdict**: ❌ **Won't work** - can't tell if `perk_healing_breeze_ii` is weapon or ring.

---

### Option 3: Minimal Bunker Metadata

**Concept**: Add `slot: 'weapon'` to each bunker's METADATA (one line per bunker).

**Example**:
```javascript
const METADATA = {
  id: 'perk_healing_breeze_ii',
  name: 'Healing Breeze II',
  type: 'PERK',
  slot: 'ring'  // ← Add one line
};
```

**Pros**:
- ✅ Explicit and self-documenting
- ✅ No DB changes needed
- ✅ Engine can introspect bunkers

**Cons**:
- ❌ ~100 bunkers need one-line update
- ❌ Slightly violates "dumb bunker" philosophy

**Verdict**: Acceptable compromise, but still requires touching every bunker.

---

### Option 4: Loadout Structure Defines Slots ✅ **RECOMMENDED**

**Concept**: UI organizes loadout by slot (weapon/armor/jewelry), engine trusts the structure.

**Loadout Structure**:
```javascript
const loadout = {
  weapons: {
    flail: {
      perks: ['perk_keenly_jagged_ii', 'perk_vicious'],
      runeglass: 'runeglass_empowered_jasper_weapon',
      masteries: ['mastery_flail_vital_embrace', 'mastery_flail_leader_of_the_pack']
    },
    sword: {
      perks: ['perk_fortifying_shield_rush', 'perk_refreshing_move'],
      runeglass: 'runeglass_empowered_malachite_weapon',
      masteries: ['mastery_sword_leadership', 'mastery_sword_defensive_training']
    }
  },
  armor: {
    perks: ['perk_invigorated', 'perk_refreshing_evasion'],
    runeglass: 'runeglass_empowered_jasper_armor'
  },
  jewelry: {
    ring1: ['perk_healing_breeze_ii'],
    ring2: ['perk_refreshing'],
    earring: ['perk_refreshing_toast'],
    amulet: ['perk_health']
  },
  attributes: {
    STR: 332,
    DEX: 36,
    INT: 5,
    FOC: 60,
    CON: 105
  }
};
```

**Engine Logic**:
```javascript
// At simulation start, build set of weapon-sourced IDs
const weaponSourcedIds = new Set();

// Add all weapon perks/runeglass/masteries from both weapons
for (const weapon of ['flail', 'sword']) {
  if (loadout.weapons[weapon].perks) {
    loadout.weapons[weapon].perks.forEach(id => weaponSourcedIds.add(id));
  }
  if (loadout.weapons[weapon].runeglass) {
    weaponSourcedIds.add(loadout.weapons[weapon].runeglass);
  }
  if (loadout.weapons[weapon].masteries) {
    loadout.weapons[weapon].masteries.forEach(id => weaponSourcedIds.add(id));
  }
}

// On WEAPON_SWAP event, remove effects from weapon sources
if (event.action === 'WEAPON_SWAP') {
  const oldWeapon = source.weaponType;
  const newWeapon = event.targetWeapon;
  
  console.log(`[ENGINE] 🔄 Weapon swap: ${oldWeapon} → ${newWeapon}`);
  
  // Update weapon state
  source.weaponType = newWeapon;
  
  // Clean up weapon-sourced effects on player
  const beforeCount = source.activeEffects.length;
  source.activeEffects = source.activeEffects.filter(eff => {
    const isWeaponSourced = weaponSourcedIds.has(eff.sourceId);
    
    if (isWeaponSourced) {
      console.log(`[ENGINE] 🧹 Removing ${eff.id} (weapon-sourced: ${eff.sourceId})`);
      return false;  // Remove it
    }
    
    return true;  // Keep non-weapon effects
  });
  
  const removedCount = beforeCount - source.activeEffects.length;
  console.log(`[ENGINE] ✅ Removed ${removedCount} weapon-sourced effects`);
  
  // Re-filter active bunkers for new weapon
  activeBunkers = getActiveBunkersForWeapon(newWeapon, loadout);
  
  // TARGET effects: NO CLEANUP (all persist)
  
  continue;  // Don't process as damage event
}
```

**Pros**:
- ✅ **Zero bunker changes** (bunkers stay 100% dumb)
- ✅ **Zero DB changes** (slot info implicit in structure)
- ✅ Smart engine (builds weapon-sourced set once, reuses)
- ✅ UI naturally organizes by slot
- ✅ **Needed for simulation testing anyway** (comparing different weapon perk combos)
- ✅ Most flexible for future (easy to add more slots)

**Cons**:
- ❌ Loadout structure more complex (but necessary for features)
- ❌ Engine signature changes (receives `loadout` instead of flat `allSources`)

**Verdict**: ✅ **RECOMMENDED** - Best balance of smart engine, dumb bunkers, and future-proofing.

---

## Implementation Plan

### Phase 1: Define Loadout Structure

**File**: Create `/src/types/loadout.js` (or TypeScript type definition)

```javascript
/**
 * Loadout Structure Definition
 * 
 * This structure defines all equipment and stats for a combatant.
 * Organized by slot to enable weapon-specific perk activation.
 */

export const LoadoutSchema = {
  weapons: {
    flail: {
      perks: [],         // Array of perk IDs
      runeglass: null,   // Single runeglass ID or null
      masteries: []      // Array of mastery IDs
    },
    sword: {
      perks: [],
      runeglass: null,
      masteries: []
    }
    // Future: Add more weapons (spear, bow, etc.)
  },
  armor: {
    perks: [],           // Array of armor perk IDs
    runeglass: null      // Single armor runeglass ID or null
  },
  jewelry: {
    ring1: [],           // Array of perk IDs (usually 1)
    earring: [],
    amulet: []
  },
  attributes: {
    STR: 0,
    DEX: 0,
    INT: 0,
    FOC: 0,
    CON: 0
  },
  consumables: []        // Future: Food, potions, etc.
};

/**
 * Example Loadout
 */
export const exampleLoadout = {
  weapons: {
    flail: {
      perks: ['perk_keenly_jagged_ii', 'perk_vicious'],
      runeglass: 'runeglass_empowered_jasper_weapon',
      masteries: ['mastery_flail_vital_embrace', 'mastery_flail_leader_of_the_pack']
    },
    sword: {
      perks: ['perk_fortifying_shield_rush'],
      runeglass: 'runeglass_empowered_malachite_weapon',
      masteries: ['mastery_sword_leadership']
    }
  },
  armor: {
    perks: ['perk_invigorated'],
    runeglass: 'runeglass_empowered_jasper_armor'
  },
  jewelry: {
    ring1: ['perk_healing_breeze_ii'],
    earring: [],
    amulet: []
  },
  attributes: {
    STR: 332,
    DEX: 36,
    INT: 5,
    FOC: 60,
    CON: 105
  }
};
```

---

### Phase 2: Update Engine Signature

**File**: `/src/simulation/engine.js`

**Current**:
```javascript
export const runSimulation = (playerPayload, targetPayload, choreography, allSources) => {
  // ...
};
```

**New**:
```javascript
export const runSimulation = (playerPayload, targetPayload, choreography, loadout) => {
  // loadout is now structured (weapons/armor/jewelry)
  // playerPayload.attributes comes from loadout.attributes
  
  // Build weapon-sourced ID set
  const weaponSourcedIds = buildWeaponSourcedSet(loadout);
  
  // Get active bunkers for starting weapon
  const startingWeapon = getStartingWeapon(choreography);
  let activeBunkers = getActiveBunkersForWeapon(startingWeapon, loadout);
  
  // ... rest of simulation
};
```

---

### Phase 3: Add Helper Functions to Engine

**File**: `/src/simulation/engine.js`

```javascript
/**
 * Build set of all weapon-sourced IDs (perks, runeglass, masteries)
 * These effects will be removed on weapon swap.
 */
function buildWeaponSourcedSet(loadout) {
  const weaponSourcedIds = new Set();
  
  // Iterate all weapons in loadout
  for (const weaponKey in loadout.weapons) {
    const weapon = loadout.weapons[weaponKey];
    
    // Add weapon perks
    if (weapon.perks) {
      weapon.perks.forEach(id => weaponSourcedIds.add(id));
    }
    
    // Add weapon runeglass
    if (weapon.runeglass) {
      weaponSourcedIds.add(weapon.runeglass);
    }
    
    // Add weapon masteries
    if (weapon.masteries) {
      weapon.masteries.forEach(id => weaponSourcedIds.add(id));
    }
  }
  
  // Also include ability bunker IDs (abilities are weapon-sourced)
  const abilityBunkerIds = effectBunkers
    .filter(b => (b.METADATA?.type || b.metadata?.type) === 'ABILITY_BUNKER')
    .map(b => b.METADATA?.id || b.metadata?.id);
  
  abilityBunkerIds.forEach(id => weaponSourcedIds.add(id));
  
  console.log('[ENGINE] Weapon-sourced IDs:', Array.from(weaponSourcedIds));
  
  return weaponSourcedIds;
}

/**
 * Get starting weapon from choreography
 * Looks for first event with weapon field.
 */
function getStartingWeapon(choreography) {
  const firstEvent = choreography.find(e => e.weapon);
  const weapon = firstEvent?.weapon || 'Flail';  // Default to Flail
  
  console.log('[ENGINE] Starting weapon:', weapon);
  return weapon;
}

/**
 * Filter bunkers based on current weapon and loadout.
 * Returns only bunkers that should be active for this weapon.
 * 
 * IMPORTANT: Handles stackable bunkers by duplicating them in the returned array.
 * Example: If 6 armor pieces have Jasper runeglass, the bunker appears 6 times.
 */
function getActiveBunkersForWeapon(weaponType, loadout) {
  const weaponKey = weaponType.toLowerCase();  // 'Flail' → 'flail'
  const currentWeaponConfig = loadout.weapons[weaponKey];
  
  if (!currentWeaponConfig) {
    console.warn(`[ENGINE] No loadout config for weapon: ${weaponType}`);
    return { stat: [], modifier: [], effect: [] };
  }
  
  // Build map of active source IDs with stack counts
  const activeSourceCounts = new Map();
  
  // Helper to add source ID with counting
  const addSource = (id) => {
    if (!id) return;
    activeSourceCounts.set(id, (activeSourceCounts.get(id) || 0) + 1);
  };
  
  // Add current weapon's perks/runeglass/masteries
  if (currentWeaponConfig.perks) {
    currentWeaponConfig.perks.forEach(addSource);
  }
  if (currentWeaponConfig.runeglass) {
    addSource(currentWeaponConfig.runeglass);
  }
  if (currentWeaponConfig.masteries) {
    currentWeaponConfig.masteries.forEach(addSource);
  }
  
  // Add armor (always active) - iterate all pieces
  for (const armorSlot in loadout.armor) {
    const armorPiece = loadout.armor[armorSlot];
    if (!armorPiece) continue;
    
    if (armorPiece.perks) {
      armorPiece.perks.forEach(addSource);
    }
    if (armorPiece.runeglass) {
      addSource(armorPiece.runeglass);
    }
  }
  
  // Add jewelry (always active) - iterate all pieces
  for (const jewelrySlot in loadout.jewelry) {
    const jewelryPiece = loadout.jewelry[jewelrySlot];
    if (!jewelryPiece || !jewelryPiece.perks) continue;
    
    jewelryPiece.perks.forEach(addSource);
  }
  
  // Helper to build bunker arrays with stack support
  const buildBunkerArray = (bunkerList) => {
    const result = [];
    
    for (const bunker of bunkerList) {
      const bunkerId = bunker.id || bunker.METADATA?.id || bunker.metadata?.id;
      const bunkerType = bunker.type || bunker.METADATA?.type || bunker.metadata?.type;
      
      // Always include ability bonuses and abilities (don't stack)
      if (bunkerType === 'ABILITY_BONUS_BUNKER' || bunkerType === 'ABILITY_BUNKER') {
        result.push(bunker);
        continue;
      }
      
      // Check if this bunker is active
      const stackCount = activeSourceCounts.get(bunkerId) || 0;
      if (stackCount === 0) continue;
      
      // Check if bunker is stackable
      const isStackable = bunker.stackable === true;
      
      if (isStackable && stackCount > 1) {
        // Add bunker multiple times (once per stack)
        for (let i = 0; i < stackCount; i++) {
          result.push(bunker);
        }
      } else {
        // Add bunker once (non-stackable or single stack)
        result.push(bunker);
      }
    }
    
    return result;
  };
  
  // Build active bunker arrays with stack support
  const activeStat = buildBunkerArray(statBunkers);
  const activeModifier = buildBunkerArray(modifierBunkers);
  const activeEffect = buildBunkerArray(effectBunkers);
  
  console.log(`[ENGINE] Active bunkers for ${weaponType}:`, {
    stat: activeStat.length,
    modifier: activeModifier.length,
    effect: activeEffect.length,
    stacks: Array.from(activeSourceCounts.entries()).filter(([_, count]) => count > 1)
  });
  
  return { stat: activeStat, modifier: activeModifier, effect: activeEffect };
}
```

---

### Phase 4: Update WEAPON_SWAP Handler

**File**: `/src/simulation/engine.js`

**Location**: In main simulation loop, before event processing

```javascript
// Handle weapon swap events specially
if (event.action === 'WEAPON_SWAP') {
    const oldWeapon = source.weaponType;
    const newWeapon = event.targetWeapon;
    
    console.log(`\n[ENGINE] ====================================`);
    console.log(`[ENGINE] 🔄 WEAPON SWAP: ${oldWeapon} → ${newWeapon}`);
    console.log(`[ENGINE] ====================================\n`);
    
    // Update weapon state
    source.weaponType = newWeapon;
    
    // === CLEAN UP WEAPON-SOURCED EFFECTS ON PLAYER ===
    const beforeCount = source.activeEffects.length;
    console.log(`[ENGINE] Player had ${beforeCount} active effects before swap`);
    
    source.activeEffects = source.activeEffects.filter(eff => {
        const isWeaponSourced = weaponSourcedIds.has(eff.sourceId);
        
        if (isWeaponSourced) {
            console.log(`[ENGINE] 🧹 Removing effect: ${eff.id} (source: ${eff.sourceId})`);
            return false;  // Remove it
        }
        
        // Keep non-weapon effects
        return true;
    });
    
    const removedCount = beforeCount - source.activeEffects.length;
    console.log(`[ENGINE] ✅ Removed ${removedCount} weapon-sourced effects`);
    console.log(`[ENGINE] Player now has ${source.activeEffects.length} active effects\n`);
    
    // === RE-FILTER BUNKERS FOR NEW WEAPON ===
    activeBunkers = getActiveBunkersForWeapon(newWeapon, loadout);
    
    // Update references (if bunkers stored separately)
    activeStatBunkers = activeBunkers.stat;
    activeModifierBunkers = activeBunkers.modifier;
    activeEffectBunkers = activeBunkers.effect;
    
    // === TARGET EFFECTS: NO CLEANUP (all persist) ===
    console.log(`[ENGINE] Target effects persist (no cleanup): ${target.activeEffects.length} effects\n`);
    
    // Add to analysis log
    const eventAnalysis = {
        timestamp: event.timestamp,
        source: source.name,
        action: 'Weapon Swap',
        target: target.name,
        damage: 0,
        healing: 0,
        notes: `Swapped from ${oldWeapon} to ${newWeapon}`,
        weaponSwap: {
            from: oldWeapon,
            to: newWeapon,
            effectsRemoved: removedCount
        },
        snapshot: {
            combatant: JSON.parse(JSON.stringify(source)),
            target: JSON.parse(JSON.stringify(target))
        }
    };
    
    analysisLog.push(eventAnalysis);
    
    continue;  // Don't process as damage event
}
```

---

### Phase 5: Update UI Components

**File**: `/src/components/CombatSimulatorPage.jsx`

**Current**:
```javascript
const [selectedSources, setSelectedSources] = useState([]);

const handleRunSimulation = () => {
  const result = runSimulation(
    playerData,
    targetData,
    choreography,
    selectedSources  // Flat array
  );
};
```

**New**:
```javascript
const [loadout, setLoadout] = useState({
  weapons: {
    flail: { perks: [], runeglass: null, masteries: [] },
    sword: { perks: [], runeglass: null, masteries: [] }
  },
  armor: { perks: [], runeglass: null },
  jewelry: {
    ring1: [], ring2: [], earring: [], amulet: []
  },
  attributes: { STR: 332, DEX: 36, INT: 5, FOC: 60, CON: 105 }
});

const handleRunSimulation = () => {
  // Build player payload with attributes from loadout
  const playerData = {
    ...basePlayerData,
    attributes: loadout.attributes
  };
  
  const result = runSimulation(
    playerData,
    targetData,
    choreography,
    loadout  // Structured loadout
  );
};
```

---

### Phase 6: Create Loadout Selector UI

**New Component**: `/src/components/LoadoutPanel.jsx`

```javascript
import React from 'react';

export default function LoadoutPanel({ loadout, setLoadout, availablePerks }) {
  const [activeTab, setActiveTab] = React.useState('flail');
  
  const handlePerkToggle = (slot, perkId) => {
    setLoadout(prev => {
      const newLoadout = { ...prev };
      const currentPerks = newLoadout.weapons[slot].perks || [];
      
      if (currentPerks.includes(perkId)) {
        // Remove perk
        newLoadout.weapons[slot].perks = currentPerks.filter(id => id !== perkId);
      } else {
        // Add perk (max 3 per weapon)
        if (currentPerks.length < 3) {
          newLoadout.weapons[slot].perks = [...currentPerks, perkId];
        }
      }
      
      return newLoadout;
    });
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded">
      {/* Weapon Tabs */}
      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setActiveTab('flail')}
          className={`px-4 py-2 rounded ${activeTab === 'flail' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Flail
        </button>
        <button 
          onClick={() => setActiveTab('sword')}
          className={`px-4 py-2 rounded ${activeTab === 'sword' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Sword
        </button>
        <button 
          onClick={() => setActiveTab('armor')}
          className={`px-4 py-2 rounded ${activeTab === 'armor' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Armor
        </button>
        <button 
          onClick={() => setActiveTab('jewelry')}
          className={`px-4 py-2 rounded ${activeTab === 'jewelry' ? 'bg-blue-600' : 'bg-gray-700'}`}
        >
          Jewelry
        </button>
      </div>
      
      {/* Weapon Perks */}
      {(activeTab === 'flail' || activeTab === 'sword') && (
        <div>
          <h3 className="text-lg font-bold mb-2">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Perks 
            ({loadout.weapons[activeTab].perks.length}/3)
          </h3>
          
          <div className="space-y-2">
            {availablePerks.map(perk => (
              <label key={perk.id} className="flex items-center gap-2">
                <input 
                  type="checkbox"
                  checked={loadout.weapons[activeTab].perks.includes(perk.id)}
                  onChange={() => handlePerkToggle(activeTab, perk.id)}
                  disabled={
                    !loadout.weapons[activeTab].perks.includes(perk.id) &&
                    loadout.weapons[activeTab].perks.length >= 3
                  }
                />
                <span>{perk.name}</span>
              </label>
            ))}
          </div>
          
          {/* Runeglass selector */}
          {/* Mastery selector */}
        </div>
      )}
      
      {/* Armor/Jewelry similar structure */}
    </div>
  );
}
```

---

### Phase 7: Testing

**Test Cases**:

1. **Basic Weapon Swap**:
   - Flail equipped with Keenly Jagged
   - Apply bleed to target
   - Gain Counter Attack empower on self
   - Swap to Sword
   - ✅ Bleed on target persists
   - ✅ Counter Attack empower removed from self
   - ✅ Sword perks now active

2. **Jewelry Persistence**:
   - Healing Breeze HoT ticking on self
   - Swap weapons mid-HoT
   - ✅ HoT continues ticking (jewelry source)

3. **Ability Buffs**:
   - Cast Arcane Vortex (10% Empower)
   - Swap to Sword
   - ✅ Empower removed (ability is weapon-sourced)

4. **Multiple Swaps**:
   - Flail → Sword → Flail
   - ✅ Effects cleaned up correctly each swap
   - ✅ Correct perks active after each swap

5. **Attribute Bonuses**:
   - Player has 350 INT
   - Swap weapons
   - ✅ INT bonuses remain active (not weapon-sourced)

---

## Migration Strategy

### Backward Compatibility

**Option A: Support Both Formats** (Recommended for transition)
```javascript
export const runSimulation = (playerPayload, targetPayload, choreography, sourcesOrLoadout) => {
  // Detect format
  if (Array.isArray(sourcesOrLoadout)) {
    // Old format: flat array
    console.warn('[ENGINE] Using legacy allSources format. Please migrate to loadout structure.');
    // Convert to loadout structure internally
    const loadout = convertLegacyFormat(sourcesOrLoadout);
  } else {
    // New format: structured loadout
    const loadout = sourcesOrLoadout;
  }
  
  // ... rest of simulation
};
```

**Option B: Hard Cut** (Cleaner, but breaks existing code)
```javascript
// Update all call sites at once
// Old call sites will throw errors until updated
```

**Recommendation**: Option A for initial rollout, then deprecate after testing period.

---

## Stackable Perks & Runeglass: "Fire N Times" Strategy

### The Problem

Some perks and runeglass stack with themselves when equipped in multiple slots:

**Example:**
```javascript
loadout = {
  weapons: {
    flail: { runeglass: 'runeglass_empowered_jasper_weapon' }
  },
  armor: {
    helm: { runeglass: 'runeglass_empowered_jasper_armor' },
    chest: { runeglass: 'runeglass_empowered_jasper_armor' },
    gloves: { runeglass: 'runeglass_empowered_jasper_armor' },
    legs: { runeglass: 'runeglass_empowered_jasper_armor' },
    boots: { runeglass: 'runeglass_empowered_jasper_armor' }
  }
};

// Result: 6 stacks of Empowered Jasper
// Effect: Each adds +12% damage to next hit after ability
// Expected: 6 × 10% = +60% damage
// Note: these numbers are illustrative but not game-accurate. Consult the DB for proper numbers.
```

### Implementation Options Considered

#### ❌ Option 1: Pass Stack Count to Bunker
```javascript
// Engine calculates stacks, passes to bunker
bunker.onActivate(state, stackCount);

// Bunker scales effect
onActivate(state, stackCount = 1) {
  addEffect(state, {
    bonusDamage: 0.10 * stackCount  // Scale by stacks
  });
}
```

**Problem**: Violates "dumb bunker" philosophy. Bunker now needs to understand stacking logic.

#### ❌ Option 2: User Manually Duplicates Bunkers
```javascript
// User adds bunker 6 times manually
activeBunkers = [
  bunker_empowered_jasper,
  bunker_empowered_jasper,
  bunker_empowered_jasper,
  bunker_empowered_jasper,
  bunker_empowered_jasper,
  bunker_empowered_jasper
];
```

**Problem**: Manual, error-prone, can't auto-generate from loadout.

#### ✅ Option 3: Engine Duplicates Bunker in Array (CHOSEN)
```javascript
// Engine auto-detects 6 copies in loadout
// Builds active bunker array with 6 copies
activeBunkers = [
  bunker_empowered_jasper,  // 1st stack
  bunker_empowered_jasper,  // 2nd stack
  bunker_empowered_jasper,  // 3rd stack
  bunker_empowered_jasper,  // 4th stack
  bunker_empowered_jasper,  // 5th stack
  bunker_empowered_jasper,  // 6th stack
  bunker_vicious,           // Non-stackable (1 copy)
];

// When event triggers, engine fires each bunker
bunker_empowered_jasper.onActivate(state);  // Adds 1 stack
bunker_empowered_jasper.onActivate(state);  // Adds 1 stack
// ... 4 more times
// Result: 6 stacks of Empowered effect ✅
```

**Why This Works:**
- ✅ **Zero bunker code changes** - Bunker stays dumb, just adds 1 stack
- ✅ **Engine stays smart** - Handles counting and duplication
- ✅ **Accurate simulation** - Each stack fires independently
- ✅ **Auto-detects from loadout** - No manual counting needed
- ✅ **Works with Build Optimization** - System auto-counts stacks for 6,840 test configs

### Decision Rationale

**Smart Engine, Dumb Bunker Philosophy:**
```
┌─────────────────────────────────────────────────┐
│ SMART ENGINE                                    │
│ - Scans loadout for duplicate IDs              │
│ - Counts: 6 × Empowered Jasper                 │
│ - Builds array with 6 copies of bunker         │
│ - Fires bunker 6 times when triggered          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ DUMB BUNKER                                     │
│ - Receives trigger event                       │
│ - Adds 1 stack of Empowered effect            │
│ - Doesn't know it's being fired 6 times       │
│ - No stack logic in bunker code ✅             │
└─────────────────────────────────────────────────┘
```

**This preserves the architecture's core strength:** Bunkers remain simple, engine handles complexity.

### Implementation Details

**1. Add `stackable` flag to bunker definitions:**

```javascript
// In bunker definitions (e.g., src/simulation/bunkers/runeglass.js)

export const bunker_empowered_jasper_weapon = {
  id: 'runeglass_empowered_jasper_weapon',
  name: 'Empowered Jasper Runeglass (Weapon)',
  stackable: true,  // NEW FLAG
  
  triggers: [{ event: 'ABILITY_CAST', condition: (e) => true }],
  
  onActivate(state) {
    addEffect(state, {
      id: 'effect_empowered_jasper',
      duration: 1,  // Next hit only
      bonusDamage: 0.10  // +10% damage (1 stack)
    });
  }
};

export const bunker_keenly_jagged_ii = {
  id: 'perk_keenly_jagged_ii',
  name: 'Keenly Jagged II',
  stackable: false,  // Perks don't stack (game prevents duplicates)
  
  triggers: [{ event: 'CRIT_HIT', condition: (e) => true }],
  
  onActivate(state) {
    applyDoT(state, { damage: 145, ticks: 3 });
  }
};
```

**2. Update `getActiveBunkersForWeapon()` to handle stacking:**

See Phase 3 implementation above - already includes stack counting logic:
- Builds `Map<bunkerId, stackCount>` by scanning loadout
- For stackable bunkers with count > 1, adds bunker N times to array
- For non-stackable bunkers, adds once regardless of count

**3. Engine activation loop (no changes needed!):**

```javascript
// In engine.js - existing code unchanged
function activateBunkers(eligibleBunkers, state) {
  for (const bunker of eligibleBunkers) {
    bunker.onActivate(state);  // Fires once per bunker in array
  }
}
```

If `eligibleBunkers` contains 6 copies of the same bunker, it fires 6 times automatically.

### Which Perks/Runeglass Stack?

**Stackable (Common in New World):**
- ✅ **All Runeglass** (weapon + armor runeglass stack)
- ✅ **Refreshing** (multiple armor pieces with Refreshing stack additively)
- ✅ **Health** perks (add to max HP pool)
- ✅ **Resistance** perks (Physical/Elemental Aversion stack)

**Non-Stackable (Typical):**
- ❌ **Unique weapon perks** (Keenly Jagged, Vicious - game prevents duplicates)
- ❌ **Most weapon perks** (can't equip same perk twice on one weapon)

**Action Item:** Review perk/runeglass manifests and mark which are `stackable: true`.

### Benefits for Build Management

**OCR Import:**
```javascript
// User uploads 12 screenshots
// OCR detects: 5 armor pieces with Jasper runeglass
const loadout = {
  armor: {
    helm: { runeglass: 'runeglass_empowered_jasper_armor' },
    chest: { runeglass: 'runeglass_empowered_jasper_armor' },
    gloves: { runeglass: 'runeglass_empowered_jasper_armor' },
    legs: { runeglass: 'runeglass_empowered_jasper_armor' },
    boots: { runeglass: 'runeglass_empowered_jasper_armor' }
  }
};

// System auto-detects 5 stacks → simulation automatically accurate ✅
```

**Build Optimization:**
```javascript
// User optimizes: "Should I use all Jasper or all Malachite?"
// Arena tests both configs:

Config A: 6 × Jasper → 6 stacks → big Empowered buff
Config B: 6 × Malachite → 6 stacks → big elemental damage

// Arena finds winner based on actual stacking behavior ✅
```

### Cost of Implementation

**Changes needed:**
1. Add `stackable: true/false` to ~50 bunker definitions (~10 minutes)
2. Stack counting logic in `getActiveBunkersForWeapon()` (~20 lines, already implemented above)
3. **Zero changes to existing bunker code** ✅
4. **Zero changes to engine activation loop** ✅

**Estimated effort:** 30-60 minutes to add flags and test.

---

## Future Enhancements

### 1. Consumables
```javascript
loadout.consumables = [
  { id: 'food_strength_boost', expires: 30 },  // 30 minute duration
  { id: 'potion_health', expires: 5 }          // 5 minute duration
];
```

### 2. Gear Score / Item Level
```javascript
loadout.weapons.flail.gearScore = 625;
loadout.armor.gearScore = 625;
// Affects base damage/armor calculations
```

### 3. More Weapons
```javascript
loadout.weapons.spear = { perks: [], runeglass: null, masteries: [] };
loadout.weapons.bow = { perks: [], runeglass: null, masteries: [] };
```

### 4. Perk Tiers
```javascript
loadout.weapons.flail.perks = [
  { id: 'perk_keenly_jagged', tier: 2 },  // Keenly Jagged II
  { id: 'perk_vicious', tier: 1 }         // Vicious I
];
```

---

## Benefits for Simulation Testing

This structure enables powerful simulation testing scenarios:

### Example 1: Compare Perks on Same Weapon
```javascript
// Test A: Keenly Jagged + Vicious
const loadoutA = {
  weapons: {
    flail: { perks: ['perk_keenly_jagged_ii', 'perk_vicious'] }
  }
};

// Test B: Keenly Jagged + Enchanted
const loadoutB = {
  weapons: {
    flail: { perks: ['perk_keenly_jagged_ii', 'perk_enchanted'] }
  }
};

// Run both, compare total damage
```

### Example 2: Attribute Spread Optimization
```javascript
const configs = [
  { attributes: { STR: 300, DEX: 100, INT: 5, FOC: 50, CON: 100 } },
  { attributes: { STR: 250, DEX: 150, INT: 5, FOC: 50, CON: 100 } },
  { attributes: { STR: 350, DEX: 50, INT: 5, FOC: 50, CON: 100 } }
];

// Test which attribute spread yields highest DPS
```

### Example 3: Weapon-Specific Optimization
```javascript
// Find best perk combo for Flail
const flailPerks = generatePermutations(availablePerks, 3);
flailPerks.forEach(combo => {
  const loadout = { weapons: { flail: { perks: combo } } };
  const result = runSimulation(..., loadout);
  results.push({ combo, totalDamage: result.totalDamage });
});

// Sort by totalDamage to find optimal build
```

---

## Next Steps

1. ✅ Review this document (DONE - you're reading it!)
2. ⏳ Define `LoadoutSchema` and create `/src/types/loadout.js`
3. ⏳ Update `runSimulation()` signature in engine.js
4. ⏳ Implement helper functions (buildWeaponSourcedSet, getActiveBunkersForWeapon)
5. ⏳ Update WEAPON_SWAP handler with cleanup logic
6. ⏳ Create `LoadoutPanel.jsx` component
7. ⏳ Update `CombatSimulatorPage.jsx` to use new loadout state
8. ⏳ Test with existing choreographies
9. ⏳ Update documentation (ADR, Common Pitfalls, Project Structure)
10. ⏳ Build simulation testing orchestrator

---

## Estimated Effort

- **Phase 1-2** (Definitions + Engine Signature): 1 hour
- **Phase 3-4** (Helper Functions + WEAPON_SWAP): 2-3 hours
- **Phase 5-6** (UI Components): 3-4 hours
- **Phase 7** (Testing): 2 hours
- **Total**: ~8-10 hours of focused development

---

## Questions to Resolve Before Implementation

1. **Perk limits per slot**: 3 perks per weapon, 1 per jewelry piece, 5 on armor?
2. **Masteries**: Do we want to limit how many can be active? Or all selected masteries always on?
3. **UI organization**: Single panel with tabs, or separate panels per slot type?
4. **Data persistence**: Save loadouts to localStorage? Or fetch from Firestore?
5. **Validation**: Should engine validate loadout structure, or trust UI?

---

*Last Updated: October 22, 2025*
*Status: Planning Complete, Ready for Implementation*
