# Build Management & Optimization System

**Status:** Planning Phase  
**Priority:** HIGH - This is the core feature  
**Dependencies:** Weapon Swap Loadout Refactor  
**Estimated Effort:** 30-40 hours total

---

## Executive Summary

The Build Management system is the **final boss feature** that brings everything together:
1. **Import real builds** from New World using OCR (12 screenshots)
2. **Mark slots as variable** (perks, runeglass you want to optimize)
3. **Run combinatorial testing** to find optimal upgrades
4. **Apply results** and save improved build

This is the entire reason the AIA Engine exists: **turn screenshots into actionable build recommendations.**

---

## The Dream Workflow

### User Story: "Optimize My Current PvP Build"

**Day 1: Import Current Build**
```
1. User opens Build Manager
2. Clicks "Import from Screenshots"
3. Uploads 12 screenshots:
   - 1 character sheet (attributes)
   - 2 weapons (flail + sword)
   - 5 armor pieces
   - 3 jewelry pieces
   - 1 consumables (optional)

4. System OCRs all screenshots → Gemini parses → Creates build:
   "My PvP Build - Oct 22, 2025"
   
5. Build saved to Firebase ✅
```

**Day 7: Got a new Flail, what perks?**
```
1. User loads "My PvP Build - Oct 22"
2. Sees Flail section:
   Slot 1: [Keenly Jagged II]  🔒 Fixed
   Slot 2: [Vicious]           🔒 Fixed
   Slot 3: [Enchanted]         🔒 Fixed
   Runeglass: [Jasper]         🔒 Fixed

3. User clicks "Unlock" on all 3 perk slots
   Slot 1: ❌ Variable (test all perks)
   Slot 2: ❌ Variable
   Slot 3: ❌ Variable
   Runeglass: 🔒 Fixed (keep Jasper)

4. Clicks "Optimize Flail Perks"

5. System generates 19,600 loadout variations:
   - All use current armor/jewelry/attributes/sword
   - Only flail perks vary (C(50,3) combinations)
   
6. Runs 19,600 simulations in ~3 minutes

7. Results show:
   CURRENT                      OPTIMIZED
   Keenly Jagged II             Keenly Jagged II (keep)
   Vicious                   →  Attunement (+12% DPS!)
   Enchanted                 →  Keenly Empowered (+8% DPS!)
   
   Total improvement: +21% DPS 🎯

8. User clicks "Apply Best" → Build updated → Saved to Firebase

9. User goes to Trading Post and buys Attunement + Keenly Empowered perks ✅
```

**Day 14: Should I switch runeglass?**
```
1. User loads updated build
2. Unlocks only runeglass slot
3. Clicks "Optimize Runeglass"
4. Runs 6 simulations (6 runeglass types)
5. Results: "Malachite is +3% better than Jasper"
6. Apply → Save → Done in 10 seconds
```

---

## System Architecture

### 1. Data Model: Build Schema

```javascript
const build = {
  // Metadata
  id: 'build_pvp_oct22_2025',
  name: 'My PvP Build - Oct 22',
  description: 'Heavy Flail/Sword bruiser build for OPR',
  tags: ['pvp', 'current', 'flail', 'sword'],
  createdAt: '2025-10-22T10:00:00Z',
  updatedAt: '2025-10-22T15:30:00Z',
  version: 2,  // Increment on each save
  
  // Source tracking
  importMethod: 'ocr',  // 'ocr' | 'manual' | 'arena_result'
  ocrConfidence: {
    overall: 0.95,
    lowConfidenceItems: ['helm_perk_3']  // Flagged for review
  },
  
  // Full loadout (matches weapon swap refactor schema)
  loadout: {
    weapons: {
      flail: {
        itemName: 'Voidbent Flail',
        gearScore: 725,
        perks: [
          { id: 'perk_keenly_jagged_ii', name: 'Keenly Jagged II' },
          { id: 'perk_vicious', name: 'Vicious' },
          { id: 'perk_enchanted', name: 'Enchanted' }
        ],
        runeglass: {
          id: 'runeglass_empowered_jasper_weapon',
          name: 'Empowered Jasper Runeglass of Sighted Jasper'
        },
        masteries: {
          // Mastery tree state
        }
      },
      sword: {
        itemName: 'Infamy',
        gearScore: 725,
        perks: [
          { id: 'perk_trenchant_strikes', name: 'Trenchant Strikes' },
          { id: 'perk_keenly_empowered', name: 'Keenly Empowered' },
          { id: 'perk_refreshing_move', name: 'Refreshing Move' }
        ],
        runeglass: {
          id: 'runeglass_empowered_malachite_weapon',
          name: 'Empowered Malachite Runeglass of Sighted Malachite'
        },
        masteries: {}
      }
    },
    
    armor: {
      helm: {
        itemName: 'Voidbent Helm',
        gearScore: 625,
        perks: [
          { id: 'perk_shirking_fortification', name: 'Shirking Fortification' },
          { id: 'perk_refreshing', name: 'Refreshing' },
          { id: 'perk_physical_aversion', name: 'Physical Aversion' }
        ]
      },
      chest: { /* ... */ },
      gloves: { /* ... */ },
      legs: { /* ... */ },
      boots: { /* ... */ }
    },
    
    jewelry: {
      amulet: {
        itemName: 'Doom\'s Chance Amulet',
        gearScore: 625,
        perks: [
          { id: 'perk_health', name: 'Health' },
          { id: 'perk_divine', name: 'Divine' },
          { id: 'perk_slash_protection', name: 'Slash Protection' }
        ]
      },
      ring: { /* ... */ },
      earring: { /* ... */ }
    },
    
    attributes: {
      STR: 300,
      DEX: 100,
      INT: 5,
      FOC: 60,
      CON: 105
    }
  },
  
  // Performance baseline (run simulation on import)
  baseline: {
    totalDamage: 38500,
    dps: 3850,
    critRate: 0.18,
    healingDone: 2400,
    lastTested: '2025-10-22T15:30:00Z',
    choreography: 'mid_combo_block'
  }
};
```

### 2. Firebase Storage

**Collection:** `builds`

**Security Rules (Single User - No Auth Required):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /builds/{buildId} {
      // Allow all operations (single user, private repo)
      allow read, write: if true;
    }
  }
}
```

**Note:** Since this is a single-user passion project with no public deployment, we can use permissive rules. If you ever publish, add Firebase Auth.

### 3. Build Optimization Template

```javascript
const buildTemplate = {
  buildId: 'build_pvp_oct22_2025',
  buildName: 'My PvP Build - Oct 22',
  
  // Slot configuration for optimization
  slots: {
    // Weapons
    'flail_slot_1': { type: 'fixed', value: 'perk_keenly_jagged_ii' },
    'flail_slot_2': { type: 'variable', pool: 'all_weapon_perks' },
    'flail_slot_3': { type: 'variable', pool: 'all_weapon_perks' },
    'flail_runeglass': { type: 'variable', pool: 'all_runeglass' },
    
    'sword_slot_1': { type: 'fixed', value: 'perk_trenchant_strikes' },
    'sword_slot_2': { type: 'fixed', value: 'perk_keenly_empowered' },
    'sword_slot_3': { type: 'fixed', value: 'perk_refreshing_move' },
    'sword_runeglass': { type: 'fixed', value: 'runeglass_empowered_malachite_weapon' },
    
    // Armor (all fixed for weapon optimization)
    'armor_helm': { type: 'fixed', value: { /* ... */ } },
    'armor_chest': { type: 'fixed', value: { /* ... */ } },
    'armor_gloves': { type: 'fixed', value: { /* ... */ } },
    'armor_legs': { type: 'fixed', value: { /* ... */ } },
    'armor_boots': { type: 'fixed', value: { /* ... */ } },
    
    // Jewelry (all fixed)
    'jewelry_amulet': { type: 'fixed', value: { /* ... */ } },
    'jewelry_ring': { type: 'fixed', value: { /* ... */ } },
    'jewelry_earring': { type: 'fixed', value: { /* ... */ } },
    
    // Attributes (fixed for perk optimization)
    'attributes': { type: 'fixed', value: { STR: 300, DEX: 100, INT: 5, FOC: 60, CON: 105 } }
  },
  
  // Test configuration
  testConfig: {
    choreography: 'mid_combo_block',
    enemyType: 'medium_armor_player',
    variableCount: 3,  // flail_slot_2, flail_slot_3, flail_runeglass
    estimatedCombinations: 7350,  // C(50,2) × 6
    estimatedTime: 74  // seconds
  }
};
```

---

## OCR Integration: 12-Screenshot Workflow

### Screenshot Types & Gemini Parsing Prompts

#### 1. Character Attributes (1 screenshot)

**Input:** Character sheet showing STR, DEX, INT, FOC, CON

**OCR Flow:**
```javascript
// Upload to /scan-gear endpoint
const formData = new FormData();
formData.append('gear_screenshot', attributesScreenshot);
const { ocr_text } = await fetch('/scan-gear', { method: 'POST', body: formData });

// Send to Gemini for parsing
const prompt = `
Extract character attributes from this New World character sheet OCR text.
Return ONLY a JSON object with numeric values.

Expected attributes: STR, DEX, INT, FOC, CON

OCR TEXT:
${ocr_text}

RETURN FORMAT:
{
  "STR": <number>,
  "DEX": <number>,
  "INT": <number>,
  "FOC": <number>,
  "CON": <number>
}
`;

const result = await callGemini(prompt);
// Result: { STR: 300, DEX: 100, INT: 5, FOC: 60, CON: 105 }
```

**Confidence Check:**
- Verify sum of attributes matches expected total (e.g., 570 for level 65)
- Flag if any attribute is 0 or > 500 (likely OCR error)

#### 2. Weapon Items (2 screenshots)

**Input:** Flail tooltip, Sword tooltip

**OCR Flow:**
```javascript
const prompt = `
Extract weapon details from this New World item tooltip OCR text.

You have access to a PERK_MANIFEST containing all valid perk IDs and names.
You have access to a RUNEGLASS_MANIFEST containing all valid runeglass IDs.

TASK:
1. Identify weapon type (flail, sword, greatsword, etc.)
2. Extract item name and gear score
3. Extract 3 perks - match to PERK_MANIFEST using fuzzy matching
4. Extract runeglass - match to RUNEGLASS_MANIFEST
5. Return confidence score for each field

OCR TEXT:
${ocr_text}

PERK_MANIFEST:
${JSON.stringify(allPerks, null, 2)}

RUNEGLASS_MANIFEST:
${JSON.stringify(allRuneglass, null, 2)}

RETURN FORMAT:
{
  "weaponType": "flail",
  "itemName": "Voidbent Flail",
  "gearScore": 725,
  "perks": [
    { "id": "perk_keenly_jagged_ii", "name": "Keenly Jagged II", "confidence": "high" },
    { "id": "perk_vicious", "name": "Vicious", "confidence": "high" },
    { "id": "perk_enchanted", "name": "Enchanted", "confidence": "high" }
  ],
  "runeglass": {
    "id": "runeglass_empowered_jasper_weapon",
    "name": "Empowered Jasper Runeglass of Sighted Jasper",
    "confidence": "medium"
  }
}
`;
```

**Confidence Indicators:**
- **High**: Exact match in manifest
- **Medium**: Fuzzy match with Levenshtein distance < 3
- **Low**: No good match found (user must review)

#### 3. Armor Items (5 screenshots)

**Input:** Helm, Chest, Gloves, Legs, Boots tooltips

**OCR Flow:** Similar to weapons, but extracts armor perks

```javascript
const prompt = `
Extract armor piece details from this New World item tooltip OCR text.

TASK:
1. Identify armor slot (helm, chest, gloves, legs, boots)
2. Extract item name and gear score
3. Extract up to 3 perks - match to PERK_MANIFEST
4. Return confidence scores

OCR TEXT:
${ocr_text}

PERK_MANIFEST:
${JSON.stringify(allArmorPerks, null, 2)}

RETURN FORMAT:
{
  "armorSlot": "helm",
  "itemName": "Voidbent Helm",
  "gearScore": 625,
  "perks": [
    { "id": "perk_shirking_fortification", "name": "Shirking Fortification", "confidence": "high" },
    { "id": "perk_refreshing", "name": "Refreshing", "confidence": "high" },
    { "id": "perk_physical_aversion", "name": "Physical Aversion", "confidence": "medium" }
  ]
}
`;
```

#### 4. Jewelry Items (3 screenshots)

**Input:** Amulet, Ring, Earring tooltips

**OCR Flow:** Similar pattern for jewelry perks

### OCR Review UI

After all 12 screenshots are processed:

```
┌─────────────────────────────────────────────────────────┐
│ Review OCR Results                                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ATTRIBUTES ✅ (High Confidence)                          │
│ STR: 300  DEX: 100  INT: 5  FOC: 60  CON: 105          │
│                                                          │
│ FLAIL ✅ (High Confidence)                               │
│ • Keenly Jagged II                                      │
│ • Vicious                                               │
│ • Enchanted                                             │
│ • Empowered Jasper Runeglass                            │
│                                                          │
│ SWORD ✅ (High Confidence)                               │
│ • Trenchant Strikes                                     │
│ • Keenly Empowered                                      │
│ • Refreshing Move                                       │
│ • Empowered Malachite Runeglass                         │
│                                                          │
│ HELM ⚠️ (Medium Confidence - Review Needed)             │
│ • Shirking Fortification                                │
│ • Refreshing                                            │
│ • Physical Aversion  ⚠️ OCR: "Physica1 Aversoin"        │
│   [Edit] [Confirm]                                      │
│                                                          │
│ [Save Build] [Retry All] [Manual Entry]                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**User actions:**
- ✅ Green = auto-confirmed
- ⚠️ Yellow = needs review (click to edit)
- ❌ Red = OCR failed (manual entry required)

---

## Build Optimization Mode

### UI Component: Build Editor with Lock/Unlock

```
┌─────────────────────────────────────────────────────────┐
│ Build Editor: "My PvP Build - Oct 22"                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ FLAIL (Primary Weapon)                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Slot 1: Keenly Jagged II          [🔒 Fixed] [Edit] │ │
│ │ Slot 2: Vicious                   [❌ Variable]      │ │
│ │ Slot 3: Enchanted                 [❌ Variable]      │ │
│ │ Runeglass: Empowered Jasper       [🔒 Fixed]        │ │
│ │                                                      │ │
│ │ Quick Actions:                                       │ │
│ │ [Optimize This Weapon] [Unlock All] [Lock All]      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ SWORD (Secondary Weapon)                                │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ All slots locked 🔒                                  │ │
│ │ [Unlock to optimize]                                 │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ARMOR (5 pieces) - All locked 🔒                        │
│ JEWELRY (3 pieces) - All locked 🔒                      │
│ ATTRIBUTES - All locked 🔒                              │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Optimization Summary                                 │ │
│ │ Variable slots: 2 (flail slot 2 & 3)               │ │
│ │ Test combinations: 1,225 (50 × 49 perks)           │ │
│ │ Estimated time: ~12 seconds                         │ │
│ │ Cost: $0                                            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Run Optimization] [Save Build] [Cancel]                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Quick Action Buttons

**1. Optimize This Slot**
```
User clicks on "Vicious" perk → Click "Optimize This Slot"

System:
- Unlocks only that slot
- Keeps all other slots fixed
- Tests 50 perks in that slot
- Runs 50 simulations
- Shows best alternative

Time: ~0.5 seconds
```

**2. Optimize This Weapon**
```
User clicks "Optimize Flail"

System prompts:
┌──────────────────────────────────┐
│ What do you want to optimize?    │
│                                  │
│ ○ All 3 perks (19,600 combos)  │
│ ○ Last 2 perks (1,225 combos)   │
│ ○ Just runeglass (6 combos)     │
│ ○ Perks + runeglass (117,600)   │
│                                  │
│ [Cancel] [Run Test]              │
└──────────────────────────────────┘
```

**3. Optimize Attributes**
```
User clicks "Optimize Attributes"

System prompts:
┌──────────────────────────────────┐
│ How do you want to test?         │
│                                  │
│ ○ Archetypes (10-15 presets)    │
│ ○ 2D Grid STR/DEX (35 combos)   │
│ ○ Full 5D search (expensive)    │
│                                  │
│ [Cancel] [Run Test]              │
└──────────────────────────────────┘
```

### Integration with Simulation Arena

**Code: Generate Test Configs from Build Template**

```javascript
function generateTestConfigsFromBuild(buildTemplate) {
  // 1. Separate fixed vs variable slots
  const fixedSlots = {};
  const variableSlots = {};
  
  for (const [slotName, slotConfig] of Object.entries(buildTemplate.slots)) {
    if (slotConfig.type === 'fixed') {
      fixedSlots[slotName] = slotConfig.value;
    } else {
      variableSlots[slotName] = slotConfig.pool;
    }
  }
  
  // 2. Generate all combinations of variable slots
  const variableCombinations = generateVariableCombinations(variableSlots);
  
  // Example: variableSlots = {
  //   'flail_slot_2': 'all_weapon_perks',  // 50 options
  //   'flail_slot_3': 'all_weapon_perks'   // 50 options
  // }
  // variableCombinations = [
  //   { flail_slot_2: 'perk_vicious', flail_slot_3: 'perk_enchanted' },
  //   { flail_slot_2: 'perk_vicious', flail_slot_3: 'perk_keenly_empowered' },
  //   ... 1,225 total
  // ]
  
  // 3. Merge fixed + variable to create full loadouts
  const testConfigs = variableCombinations.map(varValues => {
    return buildFullLoadout(fixedSlots, varValues);
  });
  
  return testConfigs;
}

function generateVariableCombinations(variableSlots) {
  const slotNames = Object.keys(variableSlots);
  
  if (slotNames.length === 1) {
    // Single variable slot - test all options
    const pool = getPool(variableSlots[slotNames[0]]);
    return pool.map(value => ({ [slotNames[0]]: value }));
  }
  
  if (slotNames.length === 2) {
    // Two variable slots - generate pairs (no duplicates)
    const pool = getPool(variableSlots[slotNames[0]]);
    const combinations = [];
    
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        combinations.push({
          [slotNames[0]]: pool[i],
          [slotNames[1]]: pool[j]
        });
      }
    }
    
    return combinations;
  }
  
  if (slotNames.length === 3) {
    // Three variable slots
    const pool = getPool(variableSlots[slotNames[0]]);
    const combinations = [];
    
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        for (let k = j + 1; k < pool.length; k++) {
          combinations.push({
            [slotNames[0]]: pool[i],
            [slotNames[1]]: pool[j],
            [slotNames[2]]: pool[k]
          });
        }
      }
    }
    
    return combinations;
  }
  
  // More than 3 variables - use generic combination generator
  return generateGenericCombinations(variableSlots);
}

function buildFullLoadout(fixedSlots, variableValues) {
  // Merge fixed + variable to create complete loadout
  const loadout = {
    weapons: {
      flail: {
        perks: [],
        runeglass: null
      },
      sword: {
        perks: [],
        runeglass: null
      }
    },
    armor: fixedSlots.armor || {},
    jewelry: fixedSlots.jewelry || {},
    attributes: fixedSlots.attributes || {}
  };
  
  // Fill in weapon perks from fixed + variable
  const flailPerks = [
    variableValues.flail_slot_1 || fixedSlots.flail_slot_1,
    variableValues.flail_slot_2 || fixedSlots.flail_slot_2,
    variableValues.flail_slot_3 || fixedSlots.flail_slot_3
  ].filter(Boolean);
  
  loadout.weapons.flail.perks = flailPerks;
  loadout.weapons.flail.runeglass = variableValues.flail_runeglass || fixedSlots.flail_runeglass;
  
  // Same for sword
  const swordPerks = [
    variableValues.sword_slot_1 || fixedSlots.sword_slot_1,
    variableValues.sword_slot_2 || fixedSlots.sword_slot_2,
    variableValues.sword_slot_3 || fixedSlots.sword_slot_3
  ].filter(Boolean);
  
  loadout.weapons.sword.perks = swordPerks;
  loadout.weapons.sword.runeglass = variableValues.sword_runeglass || fixedSlots.sword_runeglass;
  
  return loadout;
}

function getPool(poolName) {
  const pools = {
    'all_weapon_perks': allWeaponPerks,      // 50 perks
    'all_armor_perks': allArmorPerks,        // ~40 perks
    'all_jewelry_perks': allJewelryPerks,    // ~30 perks
    'all_runeglass': allRuneglass            // 6 types
  };
  
  return pools[poolName] || [];
}
```

**Code: Run Optimization & Show Results**

```javascript
async function runBuildOptimization(buildTemplate) {
  // 1. Generate test configs
  const testConfigs = generateTestConfigsFromBuild(buildTemplate);
  
  console.log(`Generated ${testConfigs.length} test configurations`);
  
  // 2. Run arena test (reuse existing arena code)
  const results = await runArenaTest(testConfigs, {
    choreography: buildTemplate.testConfig.choreography,
    onProgress: (current, total) => {
      updateProgressBar(current / total);
    }
  });
  
  // 3. Sort by performance
  results.sort((a, b) => b.metrics.totalDamage - a.metrics.totalDamage);
  
  // 4. Show comparison
  const currentBuild = await fetchBuildById(buildTemplate.buildId);
  const currentPerformance = currentBuild.baseline.totalDamage;
  const bestPerformance = results[0].metrics.totalDamage;
  const improvement = ((bestPerformance - currentPerformance) / currentPerformance) * 100;
  
  return {
    currentBuild,
    topResults: results.slice(0, 10),
    improvement,
    winner: results[0]
  };
}
```

### Results UI: Side-by-Side Comparison

```
┌─────────────────────────────────────────────────────────┐
│ Optimization Results                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ YOUR CURRENT BUILD          →    OPTIMIZED BUILD        │
│ ───────────────────────────────────────────────────────│
│                                                          │
│ FLAIL                                                    │
│ Keenly Jagged II            →    Keenly Jagged II       │
│ Vicious                     →    Attunement  (+12% DPS) │
│ Enchanted                   →    Keenly Empowered (+8%) │
│ Empowered Jasper            →    Empowered Jasper       │
│                                                          │
│ PERFORMANCE                                              │
│ Total Damage: 38,500        →    42,850  (+11.3%) 🎯   │
│ DPS:          3,850         →    4,285   (+11.3%)      │
│ Crit Rate:    18%           →    24%     (+6%)         │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Top 10 Alternative Builds (click to see details)    │ │
│ │ 1. [Keenly Jagged II, Attunement, K.Empowered] 42.8K│ │
│ │ 2. [Keenly Jagged II, Vicious, K.Empowered]    41.2K│ │
│ │ 3. [Keenly Jagged II, Attunement, Enchanted]   40.5K│ │
│ │ ... 7 more                                          │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ [Apply Best Build] [Save as New Build] [Export Results] │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Action Buttons:**

1. **Apply Best Build**
   - Updates current build with winning perks
   - Increments version number
   - Saves to Firebase
   - Shows toast: "Build updated! ✅"

2. **Save as New Build**
   - Creates new build: "My PvP Build - Oct 22 (Optimized)"
   - Preserves original build
   - User can compare both

3. **Export Results**
   - Downloads CSV with all 1,225 results
   - Includes: perks, damage, DPS, crit rate
   - For spreadsheet analysis

---

## UI Components

### 1. BuildLibrary.jsx

**Purpose:** Browse all saved builds (50+ builds)

```jsx
const BuildLibrary = () => {
  const [builds, setBuilds] = useState([]);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updatedAt');
  
  useEffect(() => {
    loadBuildsFromFirebase();
  }, []);
  
  const loadBuildsFromFirebase = async () => {
    const snapshot = await getDocs(collection(db, 'builds'));
    const buildList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBuilds(buildList);
  };
  
  return (
    <div className="build-library">
      <h2>Build Library ({builds.length} builds)</h2>
      
      {/* Filters */}
      <div className="filters">
        <select onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Builds</option>
          <option value="pvp">PvP</option>
          <option value="pve">PvE</option>
          <option value="flail">Flail Builds</option>
          <option value="current">Current</option>
        </select>
        
        <select onChange={(e) => setSortBy(e.target.value)}>
          <option value="updatedAt">Last Updated</option>
          <option value="createdAt">Date Created</option>
          <option value="name">Name</option>
          <option value="performance">Performance</option>
        </select>
      </div>
      
      {/* Build Grid */}
      <div className="build-grid">
        {builds.map(build => (
          <BuildCard key={build.id} build={build} />
        ))}
      </div>
      
      {/* Actions */}
      <button onClick={() => openImportWizard()}>
        Import from Screenshots
      </button>
      <button onClick={() => openManualEntry()}>
        Create Manually
      </button>
    </div>
  );
};
```

### 2. BuildEditor.jsx

**Purpose:** Edit build with lock/unlock controls

```jsx
const BuildEditor = ({ buildId }) => {
  const [build, setBuild] = useState(null);
  const [slotStates, setSlotStates] = useState({});
  
  const toggleSlotLock = (slotName) => {
    setSlotStates(prev => ({
      ...prev,
      [slotName]: prev[slotName] === 'fixed' ? 'variable' : 'fixed'
    }));
  };
  
  const getVariableCount = () => {
    return Object.values(slotStates).filter(s => s === 'variable').length;
  };
  
  const runOptimization = async () => {
    const template = buildBuildTemplate(build, slotStates);
    const results = await runBuildOptimization(template);
    showResultsModal(results);
  };
  
  return (
    <div className="build-editor">
      <h2>{build?.name}</h2>
      
      {/* Weapon Section */}
      <div className="weapon-section">
        <h3>Flail</h3>
        {build?.loadout.weapons.flail.perks.map((perk, idx) => (
          <div key={idx} className="perk-slot">
            <span>{perk.name}</span>
            <button onClick={() => toggleSlotLock(`flail_slot_${idx + 1}`)}>
              {slotStates[`flail_slot_${idx + 1}`] === 'fixed' ? '🔒 Fixed' : '❌ Variable'}
            </button>
          </div>
        ))}
        
        <button onClick={runOptimization} disabled={getVariableCount() === 0}>
          Optimize ({getVariableCount()} variables)
        </button>
      </div>
      
      {/* Similar sections for sword, armor, jewelry, attributes */}
    </div>
  );
};
```

### 3. BuildOCRImporter.jsx

**Purpose:** 12-screenshot wizard

```jsx
const BuildOCRImporter = () => {
  const [step, setStep] = useState(1);
  const [screenshots, setScreenshots] = useState({
    attributes: null,
    flail: null,
    sword: null,
    helm: null,
    chest: null,
    gloves: null,
    legs: null,
    boots: null,
    amulet: null,
    ring: null,
    earring: null
  });
  const [ocrResults, setOcrResults] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleScreenshotUpload = (slotName, file) => {
    setScreenshots(prev => ({ ...prev, [slotName]: file }));
  };
  
  const processAllScreenshots = async () => {
    setIsProcessing(true);
    
    for (const [slotName, file] of Object.entries(screenshots)) {
      if (!file) continue;
      
      // OCR
      const formData = new FormData();
      formData.append('gear_screenshot', file);
      const { ocr_text } = await fetch('/scan-gear', { method: 'POST', body: formData }).then(r => r.json());
      
      // Gemini parsing
      const prompt = buildParsingPrompt(slotName, ocr_text);
      const result = await callGemini(prompt);
      
      setOcrResults(prev => ({ ...prev, [slotName]: result }));
    }
    
    setIsProcessing(false);
    setStep(2); // Move to review step
  };
  
  const saveBuild = async () => {
    const build = constructBuildFromOCRResults(ocrResults);
    await addDoc(collection(db, 'builds'), build);
    showSuccessToast('Build saved!');
  };
  
  return (
    <div className="ocr-importer">
      {step === 1 && (
        <div>
          <h2>Import Build from Screenshots</h2>
          <p>Upload 12 screenshots to auto-populate your build</p>
          
          <div className="screenshot-grid">
            <ScreenshotUpload label="Attributes" onUpload={(f) => handleScreenshotUpload('attributes', f)} />
            <ScreenshotUpload label="Flail" onUpload={(f) => handleScreenshotUpload('flail', f)} />
            <ScreenshotUpload label="Sword" onUpload={(f) => handleScreenshotUpload('sword', f)} />
            {/* ... 9 more slots */}
          </div>
          
          <button onClick={processAllScreenshots} disabled={isProcessing}>
            {isProcessing ? 'Processing...' : 'Process All'}
          </button>
        </div>
      )}
      
      {step === 2 && (
        <OCRReviewPanel 
          results={ocrResults} 
          onSave={saveBuild}
          onRetry={() => setStep(1)}
        />
      )}
    </div>
  );
};
```

### 4. BuildComparator.jsx

**Purpose:** Side-by-side diff of 2 builds

```jsx
const BuildComparator = ({ buildId1, buildId2 }) => {
  const [build1, setBuild1] = useState(null);
  const [build2, setBuild2] = useState(null);
  
  useEffect(() => {
    loadBuilds();
  }, [buildId1, buildId2]);
  
  const loadBuilds = async () => {
    const b1 = await getDoc(doc(db, 'builds', buildId1));
    const b2 = await getDoc(doc(db, 'builds', buildId2));
    setBuild1(b1.data());
    setBuild2(b2.data());
  };
  
  const getDiff = (slot) => {
    const val1 = getSlotValue(build1, slot);
    const val2 = getSlotValue(build2, slot);
    
    if (val1 === val2) return { status: 'same', diff: null };
    
    // Calculate performance diff if available
    const perfDiff = calculatePerformanceDiff(build1, build2, slot);
    
    return { status: 'different', diff: perfDiff };
  };
  
  return (
    <div className="build-comparator">
      <div className="side-by-side">
        <div className="build-column">
          <h3>{build1?.name}</h3>
          <BuildDisplay build={build1} />
        </div>
        
        <div className="diff-column">
          <DiffIndicators build1={build1} build2={build2} />
        </div>
        
        <div className="build-column">
          <h3>{build2?.name}</h3>
          <BuildDisplay build={build2} />
        </div>
      </div>
    </div>
  );
};
```

---

## Implementation Phases

### Phase 1: Firebase Schema + Basic CRUD (6-8 hours)

**Tasks:**
1. Define `builds` Firestore collection schema
2. Create `buildService.js` with CRUD functions:
   ```javascript
   export const buildService = {
     async createBuild(build) { /* ... */ },
     async getBuild(id) { /* ... */ },
     async updateBuild(id, updates) { /* ... */ },
     async deleteBuild(id) { /* ... */ },
     async listBuilds(filters) { /* ... */ }
   };
   ```
3. Test with sample build data
4. Verify Firebase security rules

**Deliverables:**
- ✅ Builds can be saved to Firebase
- ✅ Builds can be loaded from Firebase
- ✅ buildService.js tested and working

### Phase 2: Manual Build Entry UI (6-8 hours)

**Tasks:**
1. Create `BuildEditor.jsx` component
2. Form with dropdowns for each slot:
   - Weapons: 3 perks + runeglass (×2)
   - Armor: 3 perks (×5)
   - Jewelry: 3 perks (×3)
   - Attributes: number inputs (×5)
3. Save/load integration with Firebase
4. Validation (no duplicate perks, attribute totals)

**Deliverables:**
- ✅ User can manually create a build
- ✅ User can edit existing build
- ✅ Changes save to Firebase

### Phase 3: OCR Import Wizard (8-10 hours)

**Tasks:**
1. Create `BuildOCRImporter.jsx` component
2. 12-screenshot upload UI
3. Integrate with existing `/scan-gear` endpoint
4. Create Gemini parsing prompts for each item type
5. Build OCR review panel with confidence indicators
6. Manual override UI for low-confidence items

**Deliverables:**
- ✅ User can upload 12 screenshots
- ✅ System OCRs and parses all items
- ✅ User reviews and corrects errors
- ✅ Build saves to Firebase

### Phase 4: Build Library UI (4-6 hours)

**Tasks:**
1. Create `BuildLibrary.jsx` component
2. Grid view of all builds
3. Filter by tags (pvp, pve, flail, current)
4. Sort by date, name, performance
5. Search functionality
6. Delete/duplicate build actions

**Deliverables:**
- ✅ User can browse 50+ builds
- ✅ Filtering and sorting works
- ✅ Quick actions (load, delete, duplicate)

### Phase 5: Build Optimization Mode (10-12 hours)

**Tasks:**
1. Add lock/unlock toggles to `BuildEditor.jsx`
2. Create `buildTemplateGenerator.js`:
   ```javascript
   function generateBuildTemplate(build, slotStates) {
     // Convert build + lock states → template
   }
   ```
3. Integrate with Simulation Arena:
   ```javascript
   const testConfigs = generateTestConfigsFromBuild(template);
   const results = await runArenaTest(testConfigs);
   ```
4. Create `OptimizationResults.jsx` component
5. Side-by-side comparison UI
6. "Apply Best" and "Save as New" actions

**Deliverables:**
- ✅ User can mark slots as variable
- ✅ System generates test configs from build
- ✅ Arena runs optimization
- ✅ Results show improvements
- ✅ User can apply winning build

### Phase 6: Build Comparator (4-6 hours)

**Tasks:**
1. Create `BuildComparator.jsx`
2. Side-by-side diff view
3. Highlight differences (perks, attributes)
4. Show performance delta if both have baseline
5. Integration with build library (select 2 builds to compare)

**Deliverables:**
- ✅ User can compare 2 builds
- ✅ Differences highlighted
- ✅ Performance comparison shown

---

## Total Estimated Effort

| Phase | Hours |
|-------|-------|
| Phase 1: Firebase CRUD | 6-8 |
| Phase 2: Manual Entry UI | 6-8 |
| Phase 3: OCR Import | 8-10 |
| Phase 4: Build Library | 4-6 |
| Phase 5: Optimization Mode | 10-12 |
| Phase 6: Build Comparator | 4-6 |
| **TOTAL** | **38-50 hours** |

**Note:** This assumes:
- Weapon Swap Loadout Refactor is complete
- Simulation Arena is complete
- OCR infrastructure already working (it is!)

---

## Integration Points

### With Combat Simulator
```javascript
// Load build → run single simulation
const build = await buildService.getBuild('build_pvp_oct22');
const result = runSimulation({
  loadout: build.loadout,
  choreography: midComboBlock
});
```

### With Simulation Arena
```javascript
// Load build → optimize specific slots
const build = await buildService.getBuild('build_pvp_oct22');
const template = generateBuildTemplate(build, {
  flail_slot_2: 'variable',
  flail_slot_3: 'variable'
});
const results = await runBuildOptimization(template);
```

### Export/Import
```javascript
// Export build as JSON
const buildJSON = JSON.stringify(build, null, 2);
downloadFile('my_build.json', buildJSON);

// Import build from JSON
const importedBuild = JSON.parse(uploadedJSON);
await buildService.createBuild(importedBuild);
```

---

## Testing Strategy

### Unit Tests

**1. Build CRUD Operations**
```javascript
test('createBuild saves to Firebase', async () => {
  const build = createMockBuild();
  const id = await buildService.createBuild(build);
  expect(id).toBeDefined();
  
  const loaded = await buildService.getBuild(id);
  expect(loaded.name).toBe(build.name);
});
```

**2. Build Template Generation**
```javascript
test('generateBuildTemplate creates correct variable slots', () => {
  const build = createMockBuild();
  const slotStates = {
    flail_slot_2: 'variable',
    flail_slot_3: 'variable'
  };
  
  const template = generateBuildTemplate(build, slotStates);
  
  expect(template.slots.flail_slot_2.type).toBe('variable');
  expect(template.slots.flail_slot_1.type).toBe('fixed');
});
```

**3. OCR Parsing**
```javascript
test('parseWeaponOCR extracts perks correctly', async () => {
  const ocrText = `
    Voidbent Flail
    Gear Score: 725
    Keenly Jagged II
    Vicious
    Enchanted
    Empowered Jasper Runeglass
  `;
  
  const result = await parseWeaponOCR(ocrText);
  
  expect(result.perks.length).toBe(3);
  expect(result.perks[0].id).toBe('perk_keenly_jagged_ii');
});
```

### Integration Tests

**1. Full OCR Import Flow**
```javascript
test('OCR import creates valid build', async () => {
  const screenshots = loadMockScreenshots();
  const build = await importBuildFromScreenshots(screenshots);
  
  expect(build.loadout.weapons.flail.perks.length).toBe(3);
  expect(build.loadout.attributes.STR).toBeGreaterThan(0);
});
```

**2. Build Optimization Flow**
```javascript
test('build optimization returns improved results', async () => {
  const build = await buildService.getBuild('mock_build');
  const template = generateBuildTemplate(build, { flail_slot_2: 'variable' });
  
  const results = await runBuildOptimization(template);
  
  expect(results.topResults.length).toBeGreaterThan(0);
  expect(results.improvement).toBeGreaterThanOrEqual(0);
});
```

### Manual Testing Checklist

- [ ] Import build from 12 screenshots
- [ ] Review OCR results (verify confidence indicators)
- [ ] Manually correct low-confidence item
- [ ] Save build to Firebase
- [ ] Load build in Build Library
- [ ] Edit build manually (change 1 perk)
- [ ] Mark 2 slots as variable
- [ ] Run optimization (verify progress bar)
- [ ] Review results (verify side-by-side comparison)
- [ ] Apply best build
- [ ] Verify build updated in Firebase
- [ ] Compare 2 builds (original vs optimized)
- [ ] Export build as JSON
- [ ] Import build from JSON
- [ ] Delete build

---

## Future Enhancements

### 1. Build Templates/Archetypes
```
Predefined builds for common playstyles:
- "Heavy Bruiser" (300 STR, high CON)
- "Glass Cannon" (350 STR, low CON)
- "Balanced Fighter" (250 STR, 150 DEX)

User can clone template and customize
```

### 2. Build Version History
```
Track all changes to a build:
- Oct 22: Created from OCR
- Oct 23: Optimized flail perks (+11% DPS)
- Oct 25: Changed attributes (300 → 325 STR)

User can rollback to previous version
```

### 3. Build Recommendations
```
AI suggests builds based on:
- Your current playstyle
- Meta trends (if you add community features)
- Arena test results across all your builds

"Try swapping Vicious for Attunement - 87% of high-DPS builds use it"
```

### 4. Gear Upgrade Planner
```
User goal: "I want to hit 42K DPS"
System shows:
- Current: 38.5K DPS
- Needed: +3.5K DPS (+9%)

Recommended upgrades:
1. Craft new flail with Attunement (+2K DPS, $500 gold)
2. Replace helm perk 3 with Shirking Heals (+1K DPS, $200 gold)
3. Increase STR to 325 (+500 DPS, 1 level up)

Total cost: $700 gold, achievable in 2 days
```

### 5. Community Sharing (If You Ever Go Public)
```
- Share builds with unique links
- Browse community builds
- Vote on best builds
- Clone other players' builds
```

---

## Success Metrics

**This feature is successful if:**

1. ✅ User can import their real build in < 5 minutes (12 screenshots)
2. ✅ OCR accuracy is > 90% (< 2 manual corrections per build)
3. ✅ Build optimization finds > 5% DPS improvement on average
4. ✅ User can run optimization in < 2 minutes for 2-slot tests
5. ✅ User discovers at least 1 non-obvious perk synergy via testing

**The ultimate win:**
- User crafts a new weapon based on optimization results
- Tests it in-game
- Confirms DPS improvement matches simulation predictions
- **This validates the entire AIA Engine project** 🎯

---

## Questions to Resolve Before Implementation

1. **Attribute point budget**: What's the total for level 65? (Need for validation)
2. **Perk categorization**: Do we have a manifest of all perks with slot restrictions?
3. **Choreography defaults**: Which rotation to use for baseline testing?
4. **Enemy type defaults**: Which enemy profile for PvP vs PvE testing?
5. **Performance baseline**: Run simulation on import, or lazy-load on first optimization?

---

*Last Updated: October 22, 2025*  
*Status: Planning Complete - This Is The Feature! 🚀*  
*Priority: Build this after Weapon Swap Loadout Refactor*  
*Ultimate Goal: Turn screenshots into actionable build improvements*
