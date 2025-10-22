# Combinatorial Testing Arena - Complete Planning Document

## Date: October 22, 2025
## Status: Planning Phase - Ready for Implementation

---

## Executive Summary

**Goal**: Test perk/runeglass/attribute combinations to find optimal synergistic builds

**Key Insight**: Perks have multiplicative synergies (1+1=3). Must test combos, not individual slots.

**Scale**: 6,840 - 117,600 simulations depending on perk pool size

**Cost**: **$0** (browser-based, zero cloud compute) 🎉

**Time**: 70 seconds to 20 minutes (browser single-threaded)

---

## Constraints & Scope

- **50 perks total** (weapon + jewelry + armor)
- **~20 weapon perks** (realistic filtered pool)
- **6 runeglass** types
- **3 weapon perk slots** as variables (test full combos for synergy discovery!)
- **Attribute distributions** as separate independent variable
- **Budget**: $0 (browser-based simulations)

---

## Combinatorial Math - REVISED FOR SYNERGY TESTING

### Realistic Perk Testing (20 Weapon Perks)

**Question**: What's the best 3-perk combo for Flail weapon?

```
Choose 3 from 20 weapon perks (order doesn't matter):
C(20, 3) = 20! / (3! × 17!) = 1,140 combinations

With runeglass as 4th variable:
1,140 perk combos × 6 runeglass = 6,840 simulations

Browser performance:
- At 100 sims/sec: 68 seconds (~1 minute)
- At 50 sims/sec: 137 seconds (~2 minutes)
```

**Verdict**: ✅ **Totally viable in browser!**

### Exhaustive Perk Testing (All 50 Perks)

**Question**: What if we don't filter, test everything?

```
Choose 3 from 50 perks:
C(50, 3) = 50! / (3! × 47!) = 19,600 combinations

With runeglass:
19,600 × 6 = 117,600 simulations

Browser performance:
- At 100 sims/sec: 1,176 seconds (~20 minutes)
- At 50 sims/sec: 2,352 seconds (~39 minutes)
```

**Verdict**: ✅ **Still viable!** Just need good progress UX + coffee ☕

### Attribute Distribution Testing (Separate)

**The Problem**: Testing every attribute combination is impossible
```
If we tested every 10-point increment:
STR × DEX × INT × FOC × CON = 51^5 = 345 million combos 😱
```

**The Solution**: Smart constraints and coarse grids

#### Option 1: Coarse 2D Grid (Primary Stats Only)
```
Focus on STR + DEX, fix others

STR: [50, 100, 150, 200, 250, 300, 350] = 7 options (25-point steps)
DEX: [5, 50, 100, 150, 200, 250, 300] = 7 options

Secondary stats fixed:
INT: 5
FOC: 60
CON: 105

Total: 7 × 7 = 49 combinations
With budget constraint (STR + DEX ≤ 400): ~35 valid combos

Time: < 1 second
```

#### Option 2: Predefined Archetypes
```
const archetypes = [
  { name: 'Pure Strength', STR: 350, DEX: 50, INT: 5, FOC: 60, CON: 105 },
  { name: 'Balanced DPS', STR: 250, DEX: 150, INT: 5, FOC: 60, CON: 105 },
  { name: 'Crit Focus', STR: 150, DEX: 250, INT: 5, FOC: 60, CON: 105 },
  { name: 'Hybrid Tank', STR: 200, DEX: 100, INT: 5, FOC: 60, CON: 150 },
  // ... 10-15 total
];

Simulations: 10-15
Time: < 1 second
```

#### Option 3: Staged Refinement
```
Phase 1: Test STR with coarse increments (DEX fixed at 100)
  [50, 100, 150, 200, 250, 300, 350] = 7 sims
  Find best: STR 250

Phase 2: Test DEX with coarse increments (STR fixed at 250)
  [50, 100, 150, 200, 250, 300] = 6 sims
  Find best: DEX 150

Phase 3: Refine in 2D grid around best (10-point increments)
  STR: [230, 240, 250, 260, 270]
  DEX: [130, 140, 150, 160, 170]
  5 × 5 = 25 sims

Total: 7 + 6 + 25 = 38 simulations
Time: < 1 second
```

### Combined Testing Strategy

**Phase 1**: Find best perk combos (fixed attributes)
```
1,140 perk combos × 6 runeglass = 6,840 sims
Time: ~70 seconds
```

**Phase 2**: Test top 10 builds with attribute spreads
```
Top 10 perk combos × 35 attribute spreads = 350 sims
Time: ~4 seconds
```

**Total**: 7,190 simulations in ~74 seconds

**Avoids**: Testing 1,140 × 6 × 35 = 239,400 combos (would take 40 minutes)

---

## Performance Estimates & Time Budgets

### Simulation Speed Benchmarks

**Measured engine performance** (to be confirmed):
- Simple simulation (20 events): ~1-5ms
- Complex simulation (100 events, weapon swaps, DoTs): ~10-20ms

**Estimated throughput**:
- **Conservative (50 sims/sec)**: Assume complex sims with lots of effects
- **Optimistic (100 sims/sec)**: Typical simulations
- **Node.js backend** (future): ~500-1000 sims/sec with worker threads (not needed!)

### Time Estimates - UPDATED FOR 3-PERK COMBO TESTING

| Test Configuration | Simulations | Browser (100/s) | Browser (50/s) |
|-------------------|-------------|-----------------|----------------|
| **Perk Combos Only** |
| 20 weapon perks (3 slots) | 1,140 | 11 sec | 23 sec |
| 50 perks (3 slots) | 19,600 | 3 min 16 sec | 6 min 32 sec |
| **Perk Combos + Runeglass** |
| 20 perks + runeglass | 6,840 | 1 min 8 sec | 2 min 17 sec |
| 50 perks + runeglass | 117,600 | 19 min 36 sec | 39 min 12 sec |
| **Attribute Testing (Separate)** |
| Coarse grid (2D) | 35-49 | < 1 sec | ~1 sec |
| Archetype presets | 10-15 | < 1 sec | < 1 sec |
| Staged refinement | 38 | < 1 sec | ~1 sec |
| **Combined (Smart Phasing)** |
| Perks (20) + Top 10 with attributes | 7,190 | 1 min 12 sec | 2 min 24 sec |

**Verdict**: ✅ Browser handles everything! Even exhaustive 50-perk search is viable.

---

## Implementation Architecture

### Browser-Based Simulation (Recommended) ✅

**Why Browser**:
- ✅ Zero cloud compute cost
- ✅ Instant feedback (results visible immediately)
- ✅ Easy to debug (console logs, React DevTools)
- ✅ Handles 6,840 - 117,600 simulations easily
- ✅ No backend infrastructure needed
- ✅ Works offline

**Implementation**:
```javascript
async function runArenaTest(configs, choreography) {
  const results = [];
  const startTime = Date.now();
  
  // Show progress UI
  setProgress({ current: 0, total: configs.length, status: 'running' });
  
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    
    // Build loadout from config
    const loadout = buildLoadoutFromConfig(config);
    
    // Run simulation
    const result = runSimulation(
      buildPlayer(config.attributes),
      targetDummy,
      choreography,
      loadout
    );
    
    // Calculate metrics
    results.push({
      config,
      loadout,
      metrics: {
        totalDamage: calculateTotalDamage(result.analysisLog),
        dps: calculateDPS(result.analysisLog),
        critRate: calculateCritRate(result.analysisLog),
        avgDotDamage: calculateAvgDotDamage(result.analysisLog)
      },
      analysisLog: result.analysisLog  // Keep for top performers
    });
    
    // Update progress every 100 sims
    if (i % 100 === 0 || i === configs.length - 1) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = i / elapsed;
      const remaining = (configs.length - i) / rate;
      
      setProgress({
        current: i + 1,
        total: configs.length,
        elapsed: elapsed.toFixed(1),
        remaining: remaining.toFixed(1),
        rate: rate.toFixed(0),
        currentBest: results[0]?.metrics.totalDamage || 0
      });
      
      // Yield to UI (prevent freezing)
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  // Sort by totalDamage (descending)
  results.sort((a, b) => b.metrics.totalDamage - a.metrics.totalDamage);
  
  return results;
}
```

### Optimizations

**1. Early Termination** (Skip clearly losing combos)
```javascript
// If after 30% of sim, damage < 70% of current best, abort
if (timestamp > duration * 0.3 && totalDamage < currentBest * 0.7) {
  return { 
    totalDamage, 
    dps: totalDamage / duration,
    earlyTermination: true 
  };
}

// Saves ~20-30% compute on tail-end combos
```

**2. Incremental Leaderboard Updates**
```javascript
// Update top 10 display every 100 sims
if (i % 100 === 0) {
  const currentTop10 = results
    .sort((a, b) => b.metrics.totalDamage - a.metrics.totalDamage)
    .slice(0, 10);
  
  updateLeaderboard(currentTop10);
}

// User sees best builds emerge in real-time!
```

**3. Pause/Resume Support**
```javascript
let isPaused = false;
let isCancelled = false;

async function runArenaTest(configs) {
  for (let i = 0; i < configs.length; i++) {
    // Check pause flag
    while (isPaused && !isCancelled) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (isCancelled) {
      return { results, incomplete: true };
    }
    
    // Run simulation...
  }
}

// User can pause for 20-min exhaustive searches
```

**4. Memoization** (Cache identical loadouts)
```javascript
const cache = new Map();

function runSimulationCached(player, target, choreography, loadout) {
  const cacheKey = JSON.stringify(loadout);
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const result = runSimulation(player, target, choreography, loadout);
  cache.set(cacheKey, result);
  
  return result;
}

// Prevents duplicate work if same combo appears twice
```

---

## Cost Analysis 💰

### **CRITICAL INSIGHT: Your Budget is 100% Safe!**

**GitHub Codespaces Pricing**:
- **Free tier**: 120 core-hours/month + 15 GB-months storage
- **Paid tier** (if you exceed): $0.18/hour for 2-core machine

### Where Simulations Actually Run

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  GitHub Codespace                                  │
│  ┌──────────────────────────────────────────┐      │
│  │  VS Code Server (serves files)           │      │
│  │  Node.js dev server (Vite)               │      │
│  │                                          │      │
│  │  CPU Usage: ~5% (just serving files)    │      │
│  └──────────────────────────────────────────┘      │
│                         │                          │
└─────────────────────────┼──────────────────────────┘
                          │ HTTP (static files)
                          ▼
┌─────────────────────────────────────────────────────┐
│  Your Browser (Chrome/Firefox/etc.)                 │
│  ┌──────────────────────────────────────────┐      │
│  │  React App                               │      │
│  │  engine.js ← SIMULATIONS RUN HERE!       │      │
│  │                                          │      │
│  │  CPU Usage: 100% (during simulation)    │      │
│  │  Cost: $0 (your computer, not GitHub!)  │      │
│  └──────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

**Key Point**: 
- Codespace = dev environment (text editor, file server)
- Browser = simulation compute (runs engine.js)
- **Running 1 million sims in browser = 0 Codespace hours!**

### Actual Usage & Costs

**Scenario 1**: Typical development week
```
Active coding: 10 hours/week = 40 hours/month
Codespace auto-stops after 30 min idle (you're already doing this)
Browser testing: Unlimited (doesn't count!)

Codespace hours: 40/month
Cost: FREE (under 120 hour limit)
```

**Scenario 2**: Heavy development + massive testing
```
Active coding: 20 hours/week = 80 hours/month
Running 100,000 sims in browser: 0 Codespace hours (runs client-side!)

Codespace hours: 80/month
Cost: FREE (still under 120 limit)
```

**Scenario 3**: You somehow go crazy and exceed free tier
```
Codespace running 24/7 for a week: 168 hours
Overage: 168 - 120 = 48 billable hours
Cost: 48 × $0.18 = $8.64/month

Still trivial! And simulations STILL cost $0!
```

### Storage Costs

**Your project size**:
- Source code: ~50 MB
- node_modules: ~300 MB
- Build artifacts: ~100 MB
- **Total**: ~0.5 GB

**GitHub storage limit**: 15 GB free/month

**Cost**: FREE (you're using 3% of free tier)

### Alternative: Move to Node.js Backend (If You Want)

**When you might**: Testing 500,000+ simulations, want parallelism

**Option 1: Run in Codespace**
```
node runArenaTest.js
100,000 sims at 500 sims/sec (with workers) = 200 seconds

Codespace hours used: 0.056 hours (3.3 minutes)
Cost: $0.18 × 0.056 = $0.01 (ONE PENNY!)
```

**Option 2: GitHub Actions (recommended for batch jobs)**
```
GitHub Actions free tier: 2,000 minutes/month

Create workflow: .github/workflows/arena-test.yml
Trigger: Manual or on schedule
100,000 sims = 3.3 minutes of workflow time

Cost: FREE (under 2,000 min limit)
```

**Option 3: Run locally**
```
git clone your-repo
npm install
node runArenaTest.js

Cost: $0 (uses your laptop, not cloud)
```

### Cost Breakdown Summary

| Activity | Where It Runs | Codespace Hours | Cost |
|----------|---------------|-----------------|------|
| Coding/development | Codespace | 40/month | $0 (free tier) |
| Running 1,000 browser sims | **Your Browser** | 0 | $0 |
| Running 10,000 browser sims | **Your Browser** | 0 | $0 |
| Running 117,600 browser sims | **Your Browser** | 0 | $0 |
| Running 1M browser sims | **Your Browser** | 0 | $0 |
| **TOTAL** | - | 40/month | **$0** ✅ |

**Even if you move to backend**:

| Activity | Where It Runs | Cost |
|----------|---------------|------|
| 100K sims in Codespace Node.js | Codespace | $0.01 |
| 100K sims in GitHub Actions | GitHub Actions | $0 (free tier) |
| 1M sims in GitHub Actions | GitHub Actions | $0.09 (still free tier) |

### **Bottom Line: Your $0 Budget is 100% Safe** 🎉

- Browser-based sims = zero cloud compute cost
- Codespace free tier easily covers development
- Even if you need backend, GitHub Actions has massive free tier
- Worst case scenario (Codespace backend, exceed free tier) = pennies/month

**You could run the entire combinatorial arena 100 times and still pay $0.** 🚀

**Pros**:
- ✅ No backend needed
- ✅ Instant feedback (results visible immediately)
- ✅ Easy to debug (console logs, inspector)
- ✅ Works for < 5,000 simulations

**Cons**:
- ❌ Single-threaded (Web Workers possible but complex)
- ❌ Blocks UI during runs
- ❌ Memory limits for huge datasets

**Implementation**:
```javascript
function runBatchSimulations(configs, choreography) {
  const results = [];
  
  // Show progress UI
  setProgress({ current: 0, total: configs.length });
  
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    const result = runSimulation(
      buildPlayer(config),
      targetDummy,
      choreography,
      config.loadout
    );
    
    results.push({
      config,
      totalDamage: calculateTotalDamage(result.analysisLog),
      dps: calculateDPS(result.analysisLog),
      analysisLog: result.analysisLog  // Keep for top performers
    });
    
    // Update progress every 100 sims
    if (i % 100 === 0) {
      setProgress({ current: i, total: configs.length });
      
      // Yield to UI (prevent freezing)
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  // Sort by totalDamage
  results.sort((a, b) => b.totalDamage - a.totalDamage);
  
  return results;
}
```

### Option 2: Node.js Backend (Future Enhancement)

**When to use**: > 10,000 simulations, overnight batch jobs

**Implementation**: Simple HTTP endpoint
```javascript
// server/simulate.js
app.post('/api/batch-simulate', async (req, res) => {
  const { configs, choreography } = req.body;
  
  // Use worker threads for parallelism
  const workers = createWorkerPool(8);
  const results = await workers.runBatch(configs, choreography);
  
  res.json({ results });
});
```

**Not needed for current scope** - browser handles 1,000+ sims fine.

---

## UX Design - Complete Interface Specs

### Setup Page: "Arena Configuration"

**Full Layout**:
```
┌──────────────────────────────────────────────────────────┐
│ ⚔️  Combinatorial Testing Arena                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Test Mode: ● Perk Synergy Testing                       │
│            ○ Attribute Optimization                      │
│            ○ Combined (Advanced)                         │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ PERK SYNERGY TESTING                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Perk Pool: ● Weapon Perks Only (20 perks)  [Quick]      │
│            ○ All Perks (50 perks)          [Exhaustive] │
│            ○ Custom Selection...                         │
│                                                          │
│ Test Variables:                                          │
│ ☑ Flail 3-Perk Combos     [C(20,3) = 1,140]            │
│ ☑ Weapon Runeglass        [6 options]                   │
│                                                          │
│ Fixed Values:                                            │
│ - Attributes: STR 300, DEX 100, INT 5, FOC 60, CON 105  │
│ - Armor: [View/Edit Loadout]                            │
│ - Jewelry: [View/Edit Loadout]                          │
│ - Masteries: [View/Edit Selection]                      │
│                                                          │
│ Choreography: [Mid Combo Block ▼]                       │
│                                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Estimated Simulations: 6,840                             │
│ Estimated Time: 68 seconds (~1 minute)                   │
│ Compute Cost: $0 (runs in browser)                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│ [🚀 Run Arena Test]                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Attribute Testing Mode**:
```
┌──────────────────────────────────────────────────────────┐
│ ATTRIBUTE OPTIMIZATION                                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Test Strategy: ● Archetype Presets (10-15 builds)       │
│                ○ Coarse 2D Grid (STR × DEX)              │
│                ○ Staged Refinement (3-phase)             │
│                                                          │
│ Archetype Presets: [Show/Hide Details ▼]                │
│ ☑ Pure Strength (STR 350, DEX 50)                       │
│ ☑ Balanced DPS (STR 250, DEX 150)                       │
│ ☑ Crit Focus (STR 150, DEX 250)                         │
│ ☑ Hybrid Tank (STR 200, DEX 100, CON 150)               │
│ ... (10 total selected)                                 │
│                                                          │
│ Fixed Values:                                            │
│ - Flail Perks: Keenly Jagged + Vicious + Enchanted      │
│ - Runeglass: Empowered Jasper (Weapon)                  │
│ - Armor: [View/Edit Loadout]                            │
│                                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Estimated Simulations: 10                                │
│ Estimated Time: < 1 second                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                          │
│ [🚀 Run Arena Test]                                      │
└──────────────────────────────────────────────────────────┘
```

### Progress Page: "Test Running..."

```
┌──────────────────────────────────────────────────────────┐
│ ⚡ Arena Test In Progress                                │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Testing: Flail 3-Perk Combos + Runeglass                │
│                                                          │
│ Progress: 3,420 / 6,840 (50%)                           │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░             │
│                                                          │
│ ⏱️  Elapsed: 34.2 seconds                                │
│ ⏳ Remaining: ~34 seconds                                │
│ 🚀 Rate: 100 sims/sec                                    │
│                                                          │
│ 🏆 Current Best:                                         │
│    Keenly Jagged II + Vicious + Enchanted               │
│    + Empowered Jasper (Weapon)                          │
│    42,857 total damage                                  │
│                                                          │
│ Top 3 So Far:                                           │
│ 1. Keenly Jagged + Vicious + Enchanted (42,857)        │
│ 2. Keenly Jagged + Vicious + Lifesteal (41,234)        │
│ 3. Keenly Jagged + Enchanted + Refreshing (40,892)     │
│                                                          │
│ [⏸️  Pause] [❌ Cancel]                                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Results Page: "Arena Results"

**Top Section - Leaderboard**:
```
┌──────────────────────────────────────────────────────────────────────┐
│ 🏆 Top 10 Synergistic Builds                                         │
│                                                                      │
│ Test: Flail 3-Perk Combos + Runeglass                              │
│ Ran: 6,840 simulations in 68.4 seconds                             │
│ Choreography: Mid Combo Block (10 seconds)                         │
├──────┬─────────────────────────────────────┬───────────┬───────┬─────┤
│ Rank │ Build Configuration                 │ Total DMG │  DPS  │ View│
├──────┼─────────────────────────────────────┼───────────┼───────┼─────┤
│  🥇  │ Keenly Jagged II + Vicious + Ench.  │  42,857   │ 4,286 │ [👁️]│
│      │ + Empowered Jasper (Weapon)         │           │       │     │
│      │ Synergy: DoT × Crit × Arcane        │   (-)     │       │     │
├──────┼─────────────────────────────────────┼───────────┼───────┼─────┤
│  🥈  │ Keenly Jagged II + Vicious + Life.  │  41,234   │ 4,123 │ [👁️]│
│      │ + Empowered Jasper (Weapon)         │           │       │     │
│      │ Synergy: DoT × Crit × Sustain       │  (-3.8%)  │       │     │
├──────┼─────────────────────────────────────┼───────────┼───────┼─────┤
│  🥉  │ Keenly Jagged II + Ench. + Refresh. │  40,892   │ 4,089 │ [👁️]│
│      │ + Empowered Malachite (Weapon)      │           │       │     │
│      │ Synergy: DoT × Light × CDR          │  (-4.6%)  │       │     │
├──────┼─────────────────────────────────────┼───────────┼───────┼─────┤
│  4   │ Keenly Jagged II + Vicious + Angry  │  40,501   │ 4,050 │ [👁️]│
│  5   │ Vicious + Enchanted + Lifesteal     │  39,847   │ 3,985 │ [👁️]│
│  6   │ Keenly Jagged II + Enchanted + CDR  │  39,234   │ 3,923 │ [👁️]│
│  7   │ Keenly Jagged II + Angry + Vicious  │  38,892   │ 3,889 │ [👁️]│
│  8   │ Vicious + Lifesteal + Angry         │  38,451   │ 3,845 │ [👁️]│
│  9   │ Keenly Jagged II + Vicious + Keen   │  38,102   │ 3,810 │ [👁️]│
│  10  │ Enchanted + Vicious + Lifesteal     │  37,854   │ 3,785 │ [👁️]│
└──────┴─────────────────────────────────────┴───────────┴───────┴─────┘

💡 Insights:
• Keenly Jagged II appears in 8/10 top builds (must-have perk!)
• Vicious appears in 7/10 builds (strong synergy with DoTs and crits)
• Empowered Jasper (Weapon) in 6/10 builds (arcane conversion wins)
• Enchanted appears in 6/10 builds (light attack boost is key)
```

**Middle Section - Comparison Visualizations**:
```
┌──────────────────────────────────────────────────────────┐
│ 📊 Damage Comparison (Top 10)                            │
│                                                          │
│ 45k ┤                                                    │
│     ┤  █                                                 │
│ 43k ┤  █                                                 │
│     ┤  █  █                                              │
│ 41k ┤  █  █  █                                           │
│     ┤  █  █  █  █                                        │
│ 39k ┤  █  █  █  █  █  █  █  █                           │
│     ┤  █  █  █  █  █  █  █  █  █  █                     │
│ 37k ┤  █  █  █  █  █  █  █  █  █  █                     │
│     └──┴──┴──┴──┴──┴──┴──┴──┴──┴───                    │
│      1  2  3  4  5  6  7  8  9  10                      │
│                                                          │
│ Sort by: ● Total Damage  ○ DPS  ○ Crit Rate             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ 🔍 Perk Frequency in Top 10                              │
│                                                          │
│ Keenly Jagged II  ████████ 8/10 (80%)                   │
│ Vicious           ███████  7/10 (70%)                    │
│ Enchanted         ██████   6/10 (60%)                    │
│ Lifesteal         ███      3/10 (30%)                    │
│ Angry Earth       ██       2/10 (20%)                    │
│ Refreshing        ██       2/10 (20%)                    │
│ Keen              █        1/10 (10%)                    │
└──────────────────────────────────────────────────────────┘
```

**Bottom Section - Detailed View (opens on [👁️] click)**:
```
┌──────────────────────────────────────────────────────────────┐
│ 🔬 Build #1 - Detailed Analysis                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ LOADOUT                                                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Weapon (Flail):                                              │
│  • Keenly Jagged II                                          │
│  • Vicious                                                   │
│  • Enchanted                                                 │
│  • Runeglass: Empowered Jasper (Weapon)                     │
│                                                              │
│ Attributes: STR 300, DEX 100, INT 5, FOC 60, CON 105        │
│                                                              │
│ PERFORMANCE METRICS                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Total Damage:     42,857 (Rank #1)                          │
│ DPS:              4,286                                      │
│ Crit Rate:        24.5%                                      │
│ Crit Multiplier:  1.20×                                      │
│ Avg Hit:          1,234                                      │
│ Avg Crit:         1,481                                      │
│ DoT Ticks:        18 ticks                                   │
│ Avg DoT Damage:   145/tick                                   │
│ Total DoT Damage: 2,610 (6.1% of total)                     │
│ Arcane Damage:    21,428 (50% of total)                     │
│ Physical Damage:  21,429 (50% of total)                     │
│                                                              │
│ SYNERGY BREAKDOWN                                            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ ✨ Keenly Jagged × Vicious:                                 │
│    DoT applies on crit (24.5% uptime), then Vicious boosts  │
│    all damage vs bleeding targets (+10%)                    │
│                                                              │
│ ✨ Enchanted × Empowered Jasper:                            │
│    Light attacks buffed (+15%), then converted to arcane    │
│    (50%), then arcane damage boosted (+2%)                  │
│                                                              │
│ ✨ Arcane Conversion × DoT Scaling:                         │
│    Jasper Hex DoT benefits from arcane armor bonus          │
│                                                              │
│ [📊 View Full Combat Log] ← Opens existing Inspector Modal  │
│ [📥 Export Build to JSON]                                   │
│ [📋 Copy Build Code]                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Action Buttons**:
```
┌──────────────────────────────────────────────────────────┐
│ [🔄 Run New Test] [📥 Export All Results (CSV)]          │
│ [💾 Save Top 10] [🔗 Share Results]                      │
└──────────────────────────────────────────────────────────┘
```

---

## Recommended Test Configurations (Presets)

### Preset 1: "Quick Synergy Check" ⚡
```
Purpose: Fast perk synergy discovery
Perk pool: Top 15 weapon perks (curated)
Variables: 3 perk slots
Fixed: Best-in-slot runeglass, optimal attributes

Combos: C(15,3) = 455
Time: ~5 seconds
Cost: $0
```

### Preset 2: "Full Weapon Optimization" 🔧
```
Purpose: Find absolute best weapon build
Perk pool: 20 weapon perks (filtered)
Variables: 3 perk slots + runeglass (6 options)
Fixed: Attributes, armor, jewelry

Combos: C(20,3) × 6 = 6,840
Time: ~70 seconds
Cost: $0
```

### Preset 3: "Exhaustive Perk Search" 🔬
```
Purpose: Test everything, find hidden gems
Perk pool: All 50 perks
Variables: 3 perk slots + runeglass
Fixed: Attributes, armor, jewelry

Combos: C(50,3) × 6 = 117,600
Time: ~20 minutes
Cost: $0
Warning: "Grab coffee ☕ - this will take a while"
```

### Preset 4: "Attribute Archetypes" 📊
```
Purpose: Compare build styles
Perk pool: Fixed best combo from Preset 2
Variables: 10-15 predefined attribute archetypes
Fixed: Perks, runeglass, armor, jewelry

Combos: 10-15
Time: < 1 second
Cost: $0
```

### Preset 5: "Fine-Tune Attributes" 🎯
```
Purpose: Optimize attributes for specific build
Perk pool: Fixed (user's chosen build)
Variables: STR/DEX 2D grid (25-point increments)
Fixed: Perks, runeglass

Combos: ~35 (with budget constraints)
Time: < 1 second
Cost: $0
```

### Preset 6: "Complete Build Optimization" 🏆
```
Purpose: Find absolute best build (perk + attributes)
Strategy: Two-phase testing

Phase 1: Find top 10 perk combos
  Combos: 6,840 (20 perks × 6 runeglass)
  Time: ~70 seconds

Phase 2: Test top 10 with attribute grid
  Combos: 10 × 35 = 350
  Time: ~4 seconds

Total: 7,190 simulations in ~74 seconds
Cost: $0
```

---

## Data Storage & Export

### In-Memory Storage (Results Object)

```javascript
const arenaResults = {
  // Test configuration
  config: {
    testMode: 'perk_synergy',
    perkPool: ['perk_keenly_jagged_ii', /* ... 19 more */],
    runglassPool: ['runeglass_empowered_jasper_weapon', /* ... 5 more */],
    fixedLoadout: {
      attributes: { STR: 300, DEX: 100, INT: 5, FOC: 60, CON: 105 },
      armor: { /* ... */ },
      jewelry: { /* ... */ }
    },
    choreography: 'mid_combo_block'
  },
  
  // Test metadata
  metadata: {
    startTime: '2025-10-22T10:30:00Z',
    endTime: '2025-10-22T10:31:08Z',
    duration: 68.4,  // seconds
    totalSimulations: 6840,
    averageSimTime: 0.01  // seconds
  },
  
  // Top performers (keep full logs)
  topPerformers: [
    {
      rank: 1,
      loadout: {
        weapons: {
          flail: {
            perks: ['perk_keenly_jagged_ii', 'perk_vicious', 'perk_enchanted'],
            runeglass: 'runeglass_empowered_jasper_weapon'
          }
        },
        // ... rest of loadout
      },
      metrics: {
        totalDamage: 42857,
        dps: 4286,
        critRate: 0.245,
        avgHit: 1234,
        avgCrit: 1481,
        dotTicks: 18,
        avgDotDamage: 145,
        totalDotDamage: 2610,
        arcaneDamage: 21428,
        physicalDamage: 21429
      },
      analysisLog: [ /* full combat log for inspection */ ]
    },
    // ... 9 more top performers
  ],
  
  // Summary statistics
  summary: {
    bestDamage: 42857,
    worstDamage: 18234,  // From all 6,840 combos
    avgDamage: 35420,
    medianDamage: 36100,
    stdDev: 3250,
    
    // Perk frequency analysis
    perkFrequency: {
      'perk_keenly_jagged_ii': { count: 8, percentage: 0.80 },
      'perk_vicious': { count: 7, percentage: 0.70 },
      'perk_enchanted': { count: 6, percentage: 0.60 },
      // ... all perks
    },
    
    // Runeglass performance
    runglassPerformance: {
      'runeglass_empowered_jasper_weapon': { avgDamage: 39500, count: 6 },
      'runeglass_empowered_malachite_weapon': { avgDamage: 38200, count: 2 },
      // ... all runeglass
    }
  }
};
```

**Storage size**: ~2 MB for top 10 with full logs (browser can handle)

### Export Formats

**CSV Export** (for Excel/Google Sheets analysis):
```csv
Rank,Perk1,Perk2,Perk3,Runeglass,TotalDamage,DPS,CritRate,DotDamage
1,Keenly Jagged II,Vicious,Enchanted,Empowered Jasper,42857,4286,24.5%,2610
2,Keenly Jagged II,Vicious,Lifesteal,Empowered Jasper,41234,4123,23.8%,2450
...
```

**JSON Export** (for sharing/importing):
```json
{
  "testConfig": { /* ... */ },
  "topPerformers": [ /* ... */ ],
  "summary": { /* ... */ }
}
```

**Share Link** (encode results in URL):
```
https://your-app.com/arena-results?id=abc123xyz

// Results stored in localStorage or Firebase
// Shareable link for friends/guild
```

---

## Implementation Phases

### Phase 1: Core Simulation Engine (Already Done! ✅)
- Your engine already handles single simulations
- Deterministic, side-effect-free
- Perfect for batch testing

### Phase 2: Combo Generation (~3-4 hours)
```javascript
// Generate all C(n,k) combinations
function* generateCombinations(array, k) {
  if (k === 1) {
    for (const item of array) {
      yield [item];
    }
    return;
  }
  
  for (let i = 0; i <= array.length - k; i++) {
    for (const combo of generateCombinations(array.slice(i + 1), k - 1)) {
      yield [array[i], ...combo];
    }
  }
}

// Usage
const perkCombos = [...generateCombinations(weaponPerks, 3)];
// 1,140 combos from 20 perks
```

### Phase 3: Batch Simulator (~4-6 hours)
- Implement `runArenaTest()` function
- Progress tracking & UI updates
- Pause/resume/cancel support
- Early termination optimization

### Phase 4: Results UI (~6-8 hours)
- Leaderboard table with sorting
- Comparison charts (bar chart, perk frequency)
- Detailed view modal (reuse Inspector)
- Export to CSV/JSON

### Phase 5: Attribute Testing (~3-4 hours)
- Archetype presets
- 2D grid generation
- Staged refinement strategy
- Integration with perk testing

### Phase 6: Polish & Optimization (~3-4 hours)
- Save/load test configs
- Share results feature
- Synergy insights automation
- Performance optimizations

**Total Estimated Effort**: ~23-30 hours of development

---

## Testing & Validation

### Test Cases

**1. Combo Generation Correctness**
```javascript
// Verify C(20,3) = 1,140
const combos = generateCombinations(20perks, 3);
assert(combos.length === 1140);

// Verify no duplicates
const unique = new Set(combos.map(c => c.sort().join(',')));
assert(unique.size === 1140);
```

**2. Simulation Consistency**
```javascript
// Same combo should produce same result
const result1 = runSimulation(config);
const result2 = runSimulation(config);
assert(result1.totalDamage === result2.totalDamage);
```

**3. Progress Tracking Accuracy**
```javascript
// Progress should match actual simulations run
let progressUpdates = [];
await runArenaTest(configs, {
  onProgress: (p) => progressUpdates.push(p)
});
assert(progressUpdates[progressUpdates.length - 1].current === configs.length);
```

**4. Leaderboard Sorting**
```javascript
// Top 10 should be sorted by totalDamage descending
const top10 = results.slice(0, 10);
for (let i = 0; i < 9; i++) {
  assert(top10[i].metrics.totalDamage >= top10[i+1].metrics.totalDamage);
}
```

---

## Future Enhancements

### 1. Multi-Weapon Testing
```
Test both weapons (Flail + Sword) simultaneously
Find best combo for weapon swap rotations
Combos: C(20,3) × C(20,3) × 6 × 6 = 8.2M 😱
Solution: Test separately, combine top 10 from each
```

### 2. Choreography Optimization
```
Test same build with 10 different rotations
Find rotation that maximizes specific build
Useful for finding optimal ability timing
```

### 3. AI-Powered Recommendations
```
"Based on your playstyle (heavy DoT), recommend builds"
Machine learning on past test results
Predict synergies without testing all combos
```

### 4. Community Leaderboard
```
Upload your best builds to global leaderboard
See what top players are using
Download and test their builds
```

### 5. Genetic Algorithm (Advanced)
```
Instead of exhaustive search, evolve solutions
Start with random population
Breed best performers
Mutate to explore new combos
Converges to near-optimal in ~5,000 sims vs 117,600
```

---

## Questions to Resolve Before Implementation

1. **Perk categorization**: How do you want to filter weapon vs jewelry vs armor perks?
2. **Attribute budget**: What's the total attribute points to distribute?
3. **Metrics priority**: Sort by total damage, DPS, or let user choose?
4. **Result persistence**: Save to localStorage, Firebase, or just in-memory?
5. **Synergy detection**: Manual annotation or auto-detect from results?

---

*Last Updated: October 22, 2025*
*Status: Planning Complete - Ready to Build! 🚀*
*Cost: $0 (Browser-Based FTW!) 💰*
