00# Roadmap — Today (October 21, 2025)

## ✅ Completed: Full Ability System Implementation

### Abilities Implemented (5 total)
**Sword:**
1. ✅ **Whirling Blade** - 2 hits × 80% damage, 16% Weaken per hit (5s duration)
2. ✅ **Shield Rush** - 1 hit, 100% damage, 20% Weaken (10s) + Slow (4s CC)

**Flail:**
3. ✅ **Trip** - 1 hit, 50% damage, 15% Rend + Knocked Down (2s) + 15% Fortify (self, 5s)
4. ✅ **Arcane Vortex** - 4 hits × 75% Arcane damage (purple!), 10% Empower (self, 5s)
5. ✅ **Arcane Eruption** - Hit 1: 130% Arcane + Slow (3s), Hit 2: 150% Physical + Extend all status 30% + Heal self 35% weapon damage

### Technical Achievements
- ✅ **Bunker System**: Created ABILITY_BUNKER type (always active, no loadout needed)
- ✅ **Multi-hit Pattern**: Using hitCount parameter in choreography + conditional bunker logic
- ✅ **Self-buff Pattern**: `targetId: source.id` for player self-buffs
- ✅ **Weapon Swapping**: Choreography-driven weapon changes (removed UI selector)
- ✅ **Duration Extension**: Added REND_DURATION, WEAKEN_DURATION, SLOW_DURATION to engine (30% extension on Arcane Eruption hit 2)
- ✅ **Arcane Damage Type**: Purple color coding for all Arcane damage in UI
- ✅ **Heal Calculation**: Weapon damage-based healing (35% of weapon damage)
- ✅ **New Effect Categories**: WEAKEN (70% cap), SLOW (CC), KNOCKED_DOWN (non-CC)

### Files Created/Modified
**New Bunker Files:**
- `/src/simulation/bunkers/abilities/sword/whirlingBlade.js`
- `/src/simulation/bunkers/abilities/sword/shieldRush.js`
- `/src/simulation/bunkers/abilities/flail/trip.js`
- `/src/simulation/bunkers/abilities/flail/arcaneVortex.js`
- `/src/simulation/bunkers/abilities/flail/arcaneEruption.js` (dual MODIFIER + EFFECT)

**JSON Prefabs (ready for Firestore):**
- `ability_sword_whirling_blade.json`
- `ability_sword_shield_rush.json`
- `ability_flail_trip.json`
- `ability_flail_arcane_vortex.json`
- `ability_flail_arcane_eruption.json`

**Modified Files:**
- `engine.js`: Added duration extension logic for REND/WEAKEN/SLOW, added damageType to eventAnalysis
- `stateManager.js`: Added WEAKEN, SLOW, KNOCKED_DOWN categories
- `choreography.js`: Updated with all ability timings, moved block to 7.9s-8.02s (Sword)
- `bunkerManifest.js`: Registered all 5 abilities
- `CombatSimulatorPage.jsx`: Purple color for Arcane damage, removed weapon selector

### Key Patterns Established
```javascript
// Multi-hit ability
if (event.hitCount === 1) { /* first hit logic */ }
if (event.hitCount === 2) { /* second hit logic */ }

// Self-buff
{ targetId: source.id, category: 'FORTIFY', value: 0.15 }

// Duration extension (in MODIFIER bunker)
{ category: 'WEAKEN_DURATION', value: 0.30 }

// Weapon damage-based heal
const weaponDamage = calculateWeaponDamage(source.weaponType, source.attributes);
const healAmount = Math.round(weaponDamage * 0.35);
```

### Next Steps
- [ ] Upload JSON prefabs to Firestore: `node scripts/upsertPrefabToFirestore.js src/simulation/bunkers/prefabs/[filename].json`
- [ ] Test full combat sequence with all abilities
- [ ] Implement remaining weapon abilities as needed

---

**Philosophy Maintained:** "Smart Engine, Dumb Bunkers" - All complex logic lives in engine, bunkers are simple trigger-response handlers.

