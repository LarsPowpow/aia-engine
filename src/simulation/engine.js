// Utility: classify condition types
const isOngoingCondition = (condition) => {
    // Add all ongoing condition types here
    return condition.startsWith('TARGET_HAS_CC');
};

const hasOngoingCondition = (conditions) => {
    if (!Array.isArray(conditions)) return false;
    return conditions.some(isOngoingCondition);
};
/**
 * @file engine.js
 * @description The core "Three Stage" simulation engine.
 * @version 4.0.0 - "Data for the Project Lead" Update
 */

import { statBunkers, modifierBunkers, effectBunkers } from './bunkers/bunkerManifest';
import { stateManager } from './stateManager';
import { calculateWeaponDamage } from './formulas';

// Weapon critical hit stats
const WEAPON_CRIT_STATS = {
    'Flail': { baseCritChance: 0.06, critMultiplier: 1.20 },
    'Sword': { baseCritChance: 0.07, critMultiplier: 1.30 }
};

/**
 * The main exportable function that the UI calls.
 */
export const runSimulation = (playerPayload, targetPayload, choreography, allSources) => {
    // ✅ NEW: Filter bunkers based on selected sources
    const selectedSourceIds = new Set((allSources || []).map(s => s.id));
    const hasSelections = selectedSourceIds.size > 0;
    
    // Log bunker IDs vs source IDs for debugging
    console.log('[ENGINE] Available bunker IDs:', {
        stat: statBunkers.map(b => b.id || b.METADATA?.id || b.metadata?.id),
        modifier: modifierBunkers.map(b => b.id || b.METADATA?.id || b.metadata?.id),
        effect: effectBunkers.map(b => b.id || b.METADATA?.id || b.metadata?.id)
    });
    console.log('[ENGINE] Selected source IDs:', Array.from(selectedSourceIds));
    
    const activeStatBunkers = hasSelections 
        ? statBunkers.filter(b => {
            const bunkerId = b.id || b.METADATA?.id || b.metadata?.id;
            const matched = selectedSourceIds.has(bunkerId);
            console.log(`[ENGINE] Stat bunker ${bunkerId}: ${matched ? 'MATCHED' : 'not matched'}`);
            return matched;
        })
        : [];
    
    const activeModifierBunkers = hasSelections
        ? modifierBunkers.filter(b => {
            const bunkerId = b.id || b.METADATA?.id || b.metadata?.id;
            const matched = selectedSourceIds.has(bunkerId);
            console.log(`[ENGINE] Modifier bunker ${bunkerId}: ${matched ? 'MATCHED' : 'not matched'}`);
            return matched;
        })
        : [];
    
    const activeEffectBunkers = hasSelections
        ? effectBunkers.filter(b => {
            const bunkerId = b.id || b.METADATA?.id || b.metadata?.id;
            const matched = selectedSourceIds.has(bunkerId);
            console.log(`[ENGINE] Effect bunker ${bunkerId}: ${matched ? 'MATCHED' : 'not matched'}`);
            return matched;
        })
        : [];
    
    console.log('[ENGINE] Bunker filtering result:', { 
        selectedIds: Array.from(selectedSourceIds),
        active: { stat: activeStatBunkers.length, modifier: activeModifierBunkers.length, effect: activeEffectBunkers.length }
    });
    
    // 🎯 Highlight crit-related modifiers
    const critModifiers = activeModifierBunkers.filter(b => {
        const id = b.id || b.METADATA?.id || b.metadata?.id || '';
        return id.toLowerCase().includes('keen') || id.toLowerCase().includes('crit') || id.toLowerCase().includes('vicious');
    });
    if (critModifiers.length > 0) {
        console.log('\n🎯 CRIT MODIFIERS ACTIVE:');
        critModifiers.forEach(b => {
            const id = b.id || b.METADATA?.id || b.metadata?.id;
            const name = b.name || b.METADATA?.name || id;
            console.log(`   ✅ ${name} (${id})`);
        });
        console.log('');
    }

    const rawLog = [];
    const analysisLog = [];

    let combatants = {
        [playerPayload.id]: { ...playerPayload, activeEffects: [] },
        [targetPayload.id]: { ...targetPayload, activeEffects: [] },
    };

    const addRawLog = (entry) => {
        const timestamp = performance.now() / 1000;
        rawLog.push({ ...entry, timestamp });
    };

    addRawLog({ level: 'info', message: 'Simulation starting.' });

    // --- STAGE 1: STAT CALCULATION ---
    addRawLog({ level: 'info', message: 'Entering Stage 1: Stat Calculation.' });
    combatants = calculateBaseStats(combatants, allSources, addRawLog, activeStatBunkers);

    // --- STAGE 2: "TWO STROKE" EVENT PROCESSING ---
    addRawLog({ level: 'info', message: 'Entering Stage 2: Event Processing.' });

    // Sort choreography
    let sortedChoreography = [...choreography].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

    // Pre-inject potential DOT tick timestamps (every 0.1s for checking)
    const maxTime = Math.max(...sortedChoreography.map(e => e.timestamp || 0), 13);
    const dotCheckTimestamps = [];
    for (let t = 1.0; t <= maxTime; t += 0.1) {
        dotCheckTimestamps.push(t);
    }

    // Merge with choreography
    const allTimestamps = [...new Set([
        ...sortedChoreography.map(e => e.timestamp),
        ...dotCheckTimestamps
    ])].sort((a, b) => a - b);

    console.log('[ENGINE] Will check for DOT ticks at these times:', allTimestamps.map(t => t.toFixed(1)));

    let eventIndex = 0;
    const processedDOTChecks = new Set();

    for (const checkTime of allTimestamps) {
        // First, inject any DOT ticks for this timestamp
        const timeKey = checkTime.toFixed(2);
        if (!processedDOTChecks.has(timeKey)) {
            const dotTicks = injectDOTTickEvents(sortedChoreography, combatants, checkTime);
            if (dotTicks.length > 0) {
                sortedChoreography.push(...dotTicks);
                sortedChoreography.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
            }
            processedDOTChecks.add(timeKey);
        }
        
        // Then process all real events at this timestamp
        while (eventIndex < sortedChoreography.length) {
            const event = sortedChoreography[eventIndex];
            if (Math.abs((event.timestamp || 0) - checkTime) > 0.05) break;
            
            // Process forced crit for Leaping Strike
            if (event.action === 'ABILITY_HIT' && event.abilityId === 'ability_sword_leaping_strike') {
                if (combatants['Player']) {
                    const forcedCritPerk = {
                        id: 'forced_leaping_strike_crit',
                        category: 'CRIT_MULTIPLIER',
                        value: 1.3,
                        notes: 'Injected by engine for test',
                    };
                    combatants['Player'].perks = [...(combatants['Player'].perks || []), forcedCritPerk];
                }
                
                // Apply 3-second slow to target
                const target = combatants[event.targetId || 'Target Dummy'];
                if (target) {
                    const slowEffect = {
                        id: 'ability_sword_leaping_strike_slow',
                        category: 'SLOW',
                        value: 0.3, // 30% slow
                        duration: 3,
                        appliedAt: event.timestamp,
                        expiresAt: event.timestamp + 3,
                        sourceId: event.sourceId || 'Player',
                        targetId: event.targetId || 'Target Dummy',
                        sourceName: 'Leaping Strike'
                    };
                    
                    if (!target.activeEffects) target.activeEffects = [];
                    target.activeEffects.push(slowEffect);
                    console.log(`[Leaping Strike] Applied 3s slow to ${event.targetId || 'Target Dummy'}`);
                }
            }
            
            const { updatedCombatants, eventAnalysis } = twoStrokeProcessEvent(
                event, 
                combatants, 
                allSources, 
                addRawLog, 
                analysisLog,
                activeModifierBunkers,
                activeEffectBunkers
            );
            
            combatants = JSON.parse(JSON.stringify(updatedCombatants));
            
            if (event.action === 'ABILITY_HIT' && event.abilityId === 'ability_sword_leaping_strike') {
                if (combatants['Player']) {
                    combatants['Player'].perks = (combatants['Player'].perks || []).filter(p => p.id !== 'forced_leaping_strike_crit');
                }
            }
            
            if (eventAnalysis) {
                if (eventAnalysis.healing && !Array.isArray(eventAnalysis.healing)) {
                    eventAnalysis.healing = [eventAnalysis.healing];
                }
                if (Array.isArray(eventAnalysis.healing)) {
                    eventAnalysis.totalHealing = eventAnalysis.healing.reduce((sum, h) => {
                        if (h.valueType === 'baseHealth') {
                            const target = h.targetId === 'Player' ? eventAnalysis.snapshot?.combatant : h.targetId === 'Target Dummy' ? eventAnalysis.snapshot?.target : null;
                            const baseHealth = target && (target.baseHealth || target.maxHealth || 0);
                            return sum + (typeof h.value === 'number' ? h.value * baseHealth : 0);
                        }
                        return sum + (typeof h.value === 'number' ? h.value : 0);
                    }, 0);
                }
                analysisLog.push(eventAnalysis);
            }
            
            eventIndex++;
        }
    }

    // 📊 CRIT SUMMARY (for easy testing/verification)
    const critEvents = analysisLog.filter(e => e.snapshot?.combatant?.isCrit || e.event?.isCrit);
    const damageEvents = analysisLog.filter(e => e.damage > 0);
    const critRate = damageEvents.length > 0 ? (critEvents.length / damageEvents.length * 100) : 0;
    
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║       📊 CRIT SUMMARY                  ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`Total damage events: ${damageEvents.length}`);
    console.log(`Critical hits: ${critEvents.length}`);
    console.log(`Crit rate: ${critRate.toFixed(1)}%`);
    
    if (critEvents.length > 0) {
        console.log('\n🎯 Crit Events:');
        critEvents.forEach((e, i) => {
            console.log(`  ${i + 1}. [${e.timestamp?.toFixed(2)}s] ${e.action} - Damage: ${e.damage}`);
        });
    }
    console.log('════════════════════════════════════════\n');

    addRawLog({ level: 'info', message: 'Simulation complete.' });
    return { rawLog, analysisLog };
};

/**
 * STAGE 1: Calculates all passive, "Always On" bonuses.
 */
const calculateBaseStats = (currentCombatants, allSources, addRawLog, activeBunkers = statBunkers) => {
    let updatedCombatants = JSON.parse(JSON.stringify(currentCombatants));

    for (const combatantId in updatedCombatants) {
        const combatant = updatedCombatants[combatantId];
        addRawLog({ level: 'info', message: `Calculating base stats for ${combatant.name}...`, combatantId });

        for (const bunker of activeBunkers) {
            const context = { source: combatant, allSources };
            const result = bunker.handler(context);
            if (result && result.addPassiveModifier) {
                 addRawLog({
                    level: 'debug',
                    message: `Stat Bunker "${bunker.METADATA.id}" returned passive modifiers for ${combatant.name}.`,
                    result,
                });
            }
        }
    }
    return updatedCombatants;
};

/**
 * The full implementation of the Grand Damage Formula from The Book of Law.
 */
const calculateFinalDamage = (context, modifierRequests, damageTerms) => {
    const { source, target, event } = context;

    const weaponDamage = calculateWeaponDamage(source.weaponType, source.attributes);
    // Auto-lookup baseDamageMultiplier if not provided
    let abilityBaseDamageMultiplier = event.baseDamageMultiplier;
    if (abilityBaseDamageMultiplier == null) {
        // Try to get from BASE_ABILITY_MODIFIERS
        try {
            const { BASE_ABILITY_MODIFIERS } = require('./formulas');
            const weaponMods = BASE_ABILITY_MODIFIERS[source.weaponType] || {};
            abilityBaseDamageMultiplier = weaponMods[event.action] || 1.0;
        } catch (e) {
            abilityBaseDamageMultiplier = 1.0;
        }
    }
    const baseDamage = weaponDamage * abilityBaseDamageMultiplier;

    // Use provided damageTerms (from activeEffects at start of step)
        // Apply misc damage percent after empower/rend, per schema
        const finalDamage = baseDamage *
            (1 + (damageTerms.empowerPercent || 0) + (damageTerms.rendPercent || 0)) *
            (1 + (damageTerms.baseCritDmgPercent || 0)) *
            (1 + (damageTerms.positionalDmgPercent || 0)) *
            (1 + (damageTerms.miscDmgPercent || 0));

    return Math.round(finalDamage);
};


/**
 * STAGE 2: Processes a single event through the "Two Stroke" model.
 */
const twoStrokeProcessEvent = (event, currentCombatants, allSources, addRawLog, analysisLog, activeModifierBunkers = modifierBunkers, activeEffectBunkers = effectBunkers) => {
    let modifierRequests = [];
    const NON_DAMAGE_ACTIONS = [
        'BLOCK_START', 'BLOCK_HIT', 'BLOCK_END', 'CONSUMABLE', 'WEAPON_SWAP'
    ];
    let damageTerms = {
        empowerPercent: 0,
        rendPercent: 0,
        baseCritDmgPercent: 0,
        positionalDmgPercent: 0,
        miscDmgPercent: 0,
    };

    if (!event || !event.sourceId || !event.targetId) {
        addRawLog({ level: 'warn', message: 'Skipping malformed event: Missing sourceId or targetId.', event });
        return { updatedCombatants: currentCombatants, eventAnalysis: null };
    }

    let updatedCombatants = JSON.parse(JSON.stringify(currentCombatants));
    const source = updatedCombatants[event.sourceId];
    const target = updatedCombatants[event.targetId];

    // ✅ DETERMINE CRIT STATUS FIRST (before any bunker runs)
    let isCrit = false;
    let critMultiplier = 1.0;
    
    // Keep forced crit for Trip (for testing)
    if (event.action === 'ABILITY' && event.abilityId === 'ability_flail_trip') {
        isCrit = true;
        event.forcedCrit = true;  // Mark as forced
        console.log('[ENGINE] 🎯 Trip is a guaranteed crit (forced for testing)');
    }
    
    // FOR TESTING: Force first Arcane Vortex hit to crit
    if (event.action === 'ABILITY_HIT' && 
        event.abilityId === 'ability_arcane_vortex' && 
        event.timestamp < 5.0) {
        isCrit = true;
        event.forcedCrit = true;  // Mark as forced
        console.log('[ENGINE] 🎯 Forced crit for Arcane Vortex Hit 1 (testing Keenly Jagged)');
    }
    
    // Note: critMultiplier and event.isCrit will be set after modifier collection
    // This allows crit chance modifiers (like Keen II) to be included

    // ✅ TRACK LIGHT ATTACK CHAINS (for chain-finisher perks like End II)
    const WEAPON_CHAIN_FINISHERS = {
        'Flail': 2,
        'Sword': 3
    };
    const NON_BREAKING_ACTIONS = ['DOT_TICK', 'HOT_TICK']; // Passive periodic effects don't break chains
    
    // Initialize chain tracking if needed
    if (!source.lightAttackChain) {
        source.lightAttackChain = { count: 0, weapon: null };
    }
    
    if (event.action === 'LIGHT_ATTACK') {
        // Continue or start chain
        if (source.lightAttackChain.weapon === source.weaponType) {
            source.lightAttackChain.count++;
        } else {
            // Weapon changed or first LA, reset chain
            source.lightAttackChain.count = 1;
            source.lightAttackChain.weapon = source.weaponType;
        }
        
        // Check if this is a chain finisher
        const finisherPosition = WEAPON_CHAIN_FINISHERS[source.weaponType] || 999;
        event.isChainFinisher = (source.lightAttackChain.count === finisherPosition);
        event.chainPosition = source.lightAttackChain.count;
        
        console.log('[ENGINE] ⚔️ Light attack chain:', {
            weapon: source.weaponType,
            chainPosition: event.chainPosition,
            finisherPosition: finisherPosition,
            isChainFinisher: event.isChainFinisher
        });
        
    } else if (!NON_BREAKING_ACTIONS.includes(event.action)) {
        // Any active action (except passive ticks) breaks the chain
        if (source.lightAttackChain.count > 0) {
            console.log('[ENGINE] ⚔️ Light attack chain broken by:', event.action);
        }
        source.lightAttackChain.count = 0;
        source.lightAttackChain.weapon = null;
        event.isChainFinisher = false;
        event.chainPosition = 0;
    } else {
        // Passive action - preserve chain state but don't set flags
        event.isChainFinisher = false;
        event.chainPosition = source.lightAttackChain.count;
    }

    // --- DIAGNOSTIC PROBE: Healing Defense ---
    if (event.action && event.action.startsWith('BLOCK')) {
        addRawLog({
            level: 'debug',
            message: '[Healing Defense] Block event detected.',
            event,
            sourceActiveEffects: source.activeEffects,
            targetActiveEffects: target.activeEffects
        });
    }

    // Purge expired and invalid conditional effects for both combatants
    const now = (typeof event.timestamp === 'number') ? event.timestamp : (performance.now() / 1000);
    const purgeInvalidEffects = (combatant, context) => {
        if (!combatant.activeEffects) return [];
        return combatant.activeEffects.filter(eff => {
            // Remove if expired
            if (eff.expiresAt && eff.expiresAt <= now) return false;
            // Only auto-purge if effect has ongoing conditions
            if (Array.isArray(eff.conditions) && eff.conditions.length > 0 && hasOngoingCondition(eff.conditions)) {
                try {
                    const { checkConditions } = require('../bunkers/bunkerUtils');
                    const effectContext = { ...context, source: combatant, target: (combatant.id === context.sourceId ? context.target : context.source) };
                    if (!checkConditions(eff.conditions, effectContext)) return false;
                } catch (e) {
                    return false;
                }
            }
            return true;
        });
    };
    source.activeEffects = purgeInvalidEffects(source, event);
    target.activeEffects = purgeInvalidEffects(target, event);
    // Use event.timestamp if present, else fallback to performance.now
    const timestamp = (typeof event.timestamp === 'number') ? event.timestamp : (performance.now() / 1000);

    // Handle weapon swap event: update weaponType and skip damage
    if (event.action === 'WEAPON_SWAP' && event.targetWeapon) {
        source.weaponType = event.targetWeapon;
        addRawLog({ level: 'info', message: `Weapon swapped to ${event.targetWeapon} for ${source.name}.`, event });
        // Log the swap event but with no damage
        const eventAnalysis = {
            timestamp: timestamp,
            source: source.name,
            action: event.notes || event.abilityId || event.type,
            target: target.name,
            isCrit: false,
            damage: 0,
            snapshot: {
                combatant: JSON.parse(JSON.stringify(source)),
                target: JSON.parse(JSON.stringify(target)),
                stroke1_modifiers: [],
                stroke2_effects: [],
            }
        };
        return { updatedCombatants, eventAnalysis };
    }

    // Set eventType for condition matching (e.g., ON_ABILITY_HIT)
    let eventType = event.action;
    if (event.action === 'ABILITY_HIT') eventType = 'ABILITY_HIT';
    const context = { ...event, source, target, allSources, timestamp, event, eventType };
    addRawLog({ level: 'info', message: `Processing event: ${event.type}`, event });

    let finalDamage = 0;
    let effectRequests = [];

    // Read buffs from source (EMPOWER, MISC_DAMAGE)
    if (source.activeEffects) {
        for (const effect of source.activeEffects) {
            if (effect && effect.category && effect.id !== 'computed_misc_damage') {
                if (effect.category === 'EMPOWER') damageTerms.empowerPercent += effect.value || 0;
                if (effect.category === 'MISC_DAMAGE') damageTerms.miscDmgPercent += effect.value || 0;
            }
        }
    }

    // Read debuffs from target (REND)
    if (target.activeEffects) {
        for (const effect of target.activeEffects) {
            if (effect && effect.category === 'REND') {
                console.log('[ENGINE] 🎯 Found REND on target:', {
                    effectId: effect.id,
                    value: effect.value,
                    sourceId: effect.sourceId
                });
                damageTerms.rendPercent += effect.value || 0;
            }
        }
    }

    // Collect modifier requests from bunkers
    modifierRequests = [];
    let damageConversions = [];
    for (const bunker of activeModifierBunkers) {
        const result = bunker.handler({ ...context, timestamp });
        if (result && result.modifyDamage) {
            modifierRequests.push(...result.modifyDamage);
        }
        if (result && result.convertDamage) {
            damageConversions.push(result.convertDamage);
        }
    }

    // Apply modifierRequests to damageTerms before damage calculation
    if (modifierRequests.length > 0) {
        for (const mod of modifierRequests) {
            if (mod.category === 'EMPOWER') damageTerms.empowerPercent += mod.value || 0;
            if (mod.category === 'REND') damageTerms.rendPercent += mod.value || 0;
            if (mod.category === 'MISC_DAMAGE') damageTerms.miscDmgPercent += mod.value || 0;
            if (mod.category === 'HEALING_EFFICIENCY') damageTerms.healingEfficiency = (damageTerms.healingEfficiency || 0) + (mod.value || 0);
            if (mod.category === 'CRIT_CHANCE') damageTerms.critChance = (damageTerms.critChance || 0) + (mod.value || 0);
            if (mod.category === 'CRIT_DAMAGE') damageTerms.critDamage = (damageTerms.critDamage || 0) + (mod.value || 0);
            if (mod.category === 'EMPOWER_DURATION') damageTerms.empowerDuration = (damageTerms.empowerDuration || 0) + (mod.value || 0);
            if (mod.category === 'FORTIFY_DURATION') damageTerms.fortifyDuration = (damageTerms.fortifyDuration || 0) + (mod.value || 0);
            if (mod.category === 'LIFESTEAL_EFFICIENCY') damageTerms.lifestealEfficiency = (damageTerms.lifestealEfficiency || 0) + (mod.value || 0);
            if (mod.category === 'DIVINE_HEALING') damageTerms.divineHealing = (damageTerms.divineHealing || 0) + (mod.value || 0);
        }
    }

    // ✅ FINALIZE CRIT STATUS (after collecting modifiers)
    // If not already a forced crit, roll for it based on weapon stats + modifiers
    if (!event.forcedCrit && !NON_DAMAGE_ACTIONS.includes(event.action)) {
        const weaponStats = WEAPON_CRIT_STATS[source.weaponType] || { baseCritChance: 0.05, critMultiplier: 1.0 };
        const totalCritChance = weaponStats.baseCritChance + (damageTerms.critChance || 0);
        
        const roll = Math.random();
        isCrit = roll < totalCritChance;
        
        // Apply crit damage modifiers to the base multiplier (additive)
        critMultiplier = isCrit ? (weaponStats.critMultiplier + (damageTerms.critDamage || 0)) : 1.0;
        
        console.log('[ENGINE] 🎲 Crit roll:', {
            weapon: source.weaponType,
            baseCritChance: (weaponStats.baseCritChance * 100).toFixed(1) + '%',
            critModifiers: ((damageTerms.critChance || 0) * 100).toFixed(1) + '%',
            totalCritChance: (totalCritChance * 100).toFixed(1) + '%',
            roll: roll.toFixed(3),
            result: isCrit ? '✅ CRIT!' : '❌ No crit',
            baseCritMultiplier: weaponStats.critMultiplier.toFixed(2) + 'x',
            critDamageModifiers: '+' + ((damageTerms.critDamage || 0) * 100).toFixed(1) + '%',
            finalCritMultiplier: isCrit ? critMultiplier.toFixed(2) + 'x' : 'N/A'
        });
    }
    
    // For forced crits, use weapon-specific multiplier + modifiers
    if (event.forcedCrit) {
        const weaponStats = WEAPON_CRIT_STATS[source.weaponType] || { baseCritChance: 0.05, critMultiplier: 1.0 };
        critMultiplier = weaponStats.critMultiplier + (damageTerms.critDamage || 0);
        console.log('[ENGINE] 🎯 Using weapon multiplier for forced crit:', {
            weapon: source.weaponType,
            critMultiplier: critMultiplier.toFixed(2)
        });
    }
    
    // Store on event for bunkers to access
    event.isCrit = isCrit;
    event.critMultiplier = critMultiplier;

    let damageSubrows = [];
    if (!NON_DAMAGE_ACTIONS.includes(event.action)) {
        // --- DAMAGE CALCULATION WITH CONVERSION SUPPORT ---
        if (damageConversions.length > 0) {
            // Calculate base weapon damage (no modifiers)
            const weaponDamage = calculateWeaponDamage(source.weaponType, source.attributes);
            let abilityBaseDamageMultiplier = event.baseDamageMultiplier;
            if (abilityBaseDamageMultiplier == null) {
                try {
                    const { BASE_ABILITY_MODIFIERS } = require('./formulas');
                    const weaponMods = BASE_ABILITY_MODIFIERS[source.weaponType] || {};
                    abilityBaseDamageMultiplier = weaponMods[event.action] || 1.0;
                } catch (e) {
                    abilityBaseDamageMultiplier = 1.0;
                }
            }
            const baseDamage = weaponDamage * abilityBaseDamageMultiplier;
            
            // Apply conversions to split damage percentages
            let remainingPhysical = 1.0; // 100% starts as physical
            const damageByType = { physical: 1.0 };
            
            for (const conversion of damageConversions) {
                const convertPercent = conversion.percent || 0;
                const toType = conversion.to || 'arcane';
                
                // Reduce physical by conversion amount
                remainingPhysical -= convertPercent;
                
                // Add to target type
                damageByType[toType] = (damageByType[toType] || 0) + convertPercent;
            }
            
            damageByType.physical = remainingPhysical;
            
            console.log('[ENGINE] 💎 Damage conversion:', {
                conversions: damageConversions,
                split: damageByType,
                baseDamage
            });
            
            // Calculate final damage for each type WITH type-specific modifiers
            for (const [damageType, percent] of Object.entries(damageByType)) {
                if (percent <= 0) continue;
                
                // Create type-specific damage terms (start from base universal modifiers)
                const typeDamageTerms = {
                    empowerPercent: damageTerms.empowerPercent,
                    rendPercent: damageTerms.rendPercent,
                    baseCritDmgPercent: damageTerms.baseCritDmgPercent,
                    positionalDmgPercent: damageTerms.positionalDmgPercent,
                    miscDmgPercent: damageTerms.miscDmgPercent
                };
                
                // Run modifier bunkers AGAIN with damageType specified
                const typeEvent = { ...event, damageType: damageType.toUpperCase() };
                const typeContext = { ...context, event: typeEvent, damageType: damageType.toUpperCase() };
                
                for (const bunker of activeModifierBunkers) {
                    const result = bunker.handler({ ...typeContext, timestamp });
                    if (result && result.modifyDamage) {
                        for (const mod of result.modifyDamage) {
                            if (mod.category === 'EMPOWER') typeDamageTerms.empowerPercent += mod.value || 0;
                            if (mod.category === 'REND') typeDamageTerms.rendPercent += mod.value || 0;
                            if (mod.category === 'MISC_DAMAGE') typeDamageTerms.miscDmgPercent += mod.value || 0;
                        }
                    }
                }
                
                // Calculate final damage for this type
                const typeBaseDamage = baseDamage * percent;
                let typeDamage = Math.round(typeBaseDamage *
                    (1 + (typeDamageTerms.empowerPercent || 0) + (typeDamageTerms.rendPercent || 0)) *
                    (1 + (typeDamageTerms.baseCritDmgPercent || 0)) *
                    (1 + (typeDamageTerms.positionalDmgPercent || 0)) *
                    (1 + (typeDamageTerms.miscDmgPercent || 0))
                );
                
                if (isCrit) {
                    typeDamage = Math.round(typeDamage * critMultiplier);
                }
                
                console.log(`[ENGINE] 💎 ${damageType.toUpperCase()} damage:`, {
                    percent: (percent * 100).toFixed(0) + '%',
                    baseDamage: Math.round(typeBaseDamage),
                    modifiers: typeDamageTerms,
                    finalDamage: typeDamage
                });
                
                finalDamage += typeDamage;
                damageSubrows.push({
                    type: damageType,
                    damage: typeDamage,
                    percent: percent
                });
            }
        } else {
            // No conversion: standard damage calculation
            finalDamage = calculateFinalDamage(context, [], damageTerms);
            if (isCrit) {
                finalDamage = Math.round(finalDamage * critMultiplier);
            }
        }
    }
    effectRequests = [];
    for (const bunker of activeEffectBunkers) {
        // ✅ Pass finalDamage to effect bunkers for reactive effects (lifesteal, etc.)
        const result = bunker.handler({ ...context, timestamp, finalDamage });
        if (result && result.applyEffects) {
            effectRequests.push(...result.applyEffects);
        }
    }
    
    // --- SMART ENGINE: Apply healing efficiency to all HEAL effects ---
    const healingEfficiency = damageTerms.healingEfficiency || 0;
    const lifestealEfficiency = damageTerms.lifestealEfficiency || 0;
    const divineHealing = damageTerms.divineHealing || 0;
    
    if (healingEfficiency > 0 || lifestealEfficiency > 0 || divineHealing > 0) {
        for (const eff of effectRequests) {
            if (eff.category === 'HEAL') {
                const originalValue = eff.value;
                const isLifesteal = eff.metadata?.healType === 'lifesteal';
                const isConsumable = eff.metadata?.healType === 'consumable';
                
                // Apply general healing efficiency to all heals
                let totalMultiplier = 1 + healingEfficiency;
                
                // Apply lifesteal efficiency only to lifesteal heals (stacks additively)
                if (isLifesteal && lifestealEfficiency > 0) {
                    totalMultiplier += lifestealEfficiency;
                }
                
                // Apply divine healing only to non-lifesteal, non-consumable heals (stacks additively)
                if (!isLifesteal && !isConsumable && divineHealing > 0) {
                    totalMultiplier += divineHealing;
                }
                
                eff.value = eff.value * totalMultiplier;
                
                // Debug logging
                console.log('[ENGINE] 🩺 Healing efficiency applied:', {
                    effectId: eff.id,
                    original: originalValue.toFixed(2),
                    modified: eff.value.toFixed(2),
                    healingEfficiency: healingEfficiency > 0 ? `+${(healingEfficiency * 100).toFixed(1)}%` : 'none',
                    lifestealEfficiency: (isLifesteal && lifestealEfficiency > 0) ? `+${(lifestealEfficiency * 100).toFixed(1)}%` : 'none',
                    divineHealing: (!isLifesteal && !isConsumable && divineHealing > 0) ? `+${(divineHealing * 100).toFixed(1)}%` : 'none',
                    totalMultiplier: totalMultiplier.toFixed(3),
                    source: eff.metadata?.sourceName,
                    isLifesteal,
                    isConsumable
                });
                
                // Mark in metadata for debugging
                eff.metadata = eff.metadata || {};
                eff.metadata.healingEfficiencyApplied = true;
                eff.metadata.healingMultiplier = totalMultiplier;
            }
        }
    }

    // --- SMART ENGINE: Apply empower duration extension to all EMPOWER effects ---
    const empowerDuration = damageTerms.empowerDuration || 0;
    if (empowerDuration > 0) {
        for (const eff of effectRequests) {
            if (eff.category === 'EMPOWER' && eff.duration) {
                const originalDuration = eff.duration;
                eff.duration = Math.round(eff.duration * (1 + empowerDuration));
                
                // Debug logging
                console.log('[ENGINE] ⏱️ Empower duration extended:', {
                    effectId: eff.id,
                    originalDuration: originalDuration,
                    extendedDuration: eff.duration,
                    multiplier: (1 + empowerDuration).toFixed(3),
                    source: eff.metadata?.sourceName
                });
                
                // Mark in metadata for debugging
                eff.metadata = eff.metadata || {};
                eff.metadata.empowerDurationExtended = true;
                eff.metadata.durationMultiplier = (1 + empowerDuration);
            }
        }
    }

    // --- SMART ENGINE: Apply fortify duration extension to all FORTIFY effects ---
    const fortifyDuration = damageTerms.fortifyDuration || 0;
    if (fortifyDuration > 0) {
        for (const eff of effectRequests) {
            if (eff.category === 'FORTIFY' && eff.duration) {
                const originalDuration = eff.duration;
                eff.duration = Math.round(eff.duration * (1 + fortifyDuration));
                
                // Debug logging
                console.log('[ENGINE] ⏱️ Fortify duration extended:', {
                    effectId: eff.id,
                    originalDuration: originalDuration,
                    extendedDuration: eff.duration,
                    multiplier: (1 + fortifyDuration).toFixed(3),
                    source: eff.metadata?.sourceName
                });
                
                // Mark in metadata for debugging
                eff.metadata = eff.metadata || {};
                eff.metadata.fortifyDurationExtended = true;
                eff.metadata.durationMultiplier = (1 + fortifyDuration);
            }
        }
    }
    
    // --- GATEKEEPER: consolidate and apply effects with proper anti-stacking rules ---
    const grouped = {};
    for (const eff of effectRequests) {
        // Respect the effect's targetId if present, otherwise use category-based logic
        const applyToSource = eff.targetId 
            ? (eff.targetId === source.id)
            : (['MISC_DAMAGE', 'EMPOWER'].includes(eff.category) && source.id === 'Player');
        const targetKey = applyToSource ? source.id : target.id;
        
        // DEBUG: Log heal targeting
        if (eff.category === 'HEAL') {
            console.log('[ENGINE] HEAL effect grouping:', {
                effectId: eff.id,
                effectTargetId: eff.targetId,
                sourceId: source.id,
                targetId: target.id,
                applyToSource,
                targetKey
            });
        }
        
        const key = `${targetKey}::${eff.id}`;
        if (!grouped[key]) grouped[key] = { ...eff, targetId: eff.targetId || targetKey };
        else {
            // If duplicate, prefer the later expiresAt
            const existing = grouped[key];
            if ((eff.expiresAt || 0) > (existing.expiresAt || 0)) {
                grouped[key] = { ...eff, targetId: eff.targetId || targetKey };
            }
        }
    }

    // Apply the consolidated effects via stateManager which handles refresh logic
    for (const k of Object.keys(grouped)) {
        const eff = grouped[k];
        const applyToSource = (eff.targetId === source.id);
        const targetCombatant = applyToSource ? source : target;
        // Ensure duration/expiresAt are relative to current timestamp if not already set
        const now = timestamp;
        if (!eff.duration && eff.expiresAt) {
            eff.duration = Math.max(0, eff.expiresAt - now);
        }
        if (!eff.expiresAt && typeof eff.duration === 'number') {
            eff.expiresAt = now + eff.duration;
        }
        stateManager.applyEffect(targetCombatant, eff, { ...context, source, timestamp: now });
    }
    // [ENGINE] Stroke 2 (Effects) complete. Requests: ${effectRequests.length}
    // addRawLog({ level: 'debug', message: `Stroke 2 (Effects) complete. Requests: ${effectRequests.length}`, effectRequests });

    // --- ANALYSIS LOGGING (THE FIX) ---
    // Add miscDmgPercent to combatant and target snapshot for InspectorPanel
    const combatantSnapshot = { ...JSON.parse(JSON.stringify(source)), miscDmgPercent: damageTerms.miscDmgPercent };
    const targetSnapshot = { ...JSON.parse(JSON.stringify(target)), miscDmgPercent: damageTerms.miscDmgPercent };
    
    // ✅ Process ARCANE_DAMAGE effects as subrows
    const arcaneDamageSubrows = [];
    const arcaneEffects = effectRequests.filter(eff => eff.category === 'ARCANE_DAMAGE');
    
    for (const arcaneEff of arcaneEffects) {
        // Calculate arcane damage with current modifiers
        const arcaneBaseDamage = arcaneEff.baseDamage || 0;
        
        // Apply damage modifiers (empower, rend, misc damage) to arcane damage
        let arcaneDamageTerms = {
            empowerPercent: 0,
            rendPercent: 0,
            miscDmgPercent: 0,
        };
        
        // Read buffs from source
        if (source.activeEffects) {
            for (const effect of source.activeEffects) {
                if (effect.category === 'EMPOWER') arcaneDamageTerms.empowerPercent += effect.value || 0;
                if (effect.category === 'MISC_DAMAGE') arcaneDamageTerms.miscDmgPercent += effect.value || 0;
            }
        }
        
        // Read debuffs from target (REND)
        if (target.activeEffects) {
            for (const effect of target.activeEffects) {
                if (effect.category === 'REND') arcaneDamageTerms.rendPercent += effect.value || 0;
            }
        }
        
        // Apply modifiers from bunkers (arcane-specific modifiers could go here)
        for (const bunker of activeModifierBunkers) {
            const modContext = { ...context, timestamp, event: { ...event, damageType: 'ARCANE' } };
            const result = bunker.handler(modContext);
            if (result && result.modifyDamage) {
                for (const mod of result.modifyDamage) {
                    if (mod.category === 'EMPOWER') arcaneDamageTerms.empowerPercent += mod.value || 0;
                    if (mod.category === 'REND') arcaneDamageTerms.rendPercent += mod.value || 0;
                    if (mod.category === 'MISC_DAMAGE') arcaneDamageTerms.miscDmgPercent += mod.value || 0;
                }
            }
        }
        
        const finalArcaneDamage = Math.round(arcaneBaseDamage *
            (1 + (arcaneDamageTerms.empowerPercent || 0) + (arcaneDamageTerms.rendPercent || 0)) *
            (1 + (arcaneDamageTerms.miscDmgPercent || 0))
        );
        
        arcaneDamageSubrows.push({
            damageType: arcaneEff.damageType || 'ARCANE',
            damage: finalArcaneDamage,
            sourceName: arcaneEff.metadata?.sourceName || arcaneEff.id,
            sourceId: arcaneEff.sourceId,
            modifiers: arcaneDamageTerms
        });
        
        console.log('[ENGINE] 🔮 Arcane damage subrow:', {
            sourceName: arcaneEff.metadata?.sourceName,
            baseDamage: arcaneBaseDamage,
            finalDamage: finalArcaneDamage,
            modifiers: arcaneDamageTerms
        });
    }
    
    const eventAnalysis = {
        timestamp: timestamp,
        source: source.name,
        action: event.notes || event.abilityId || event.type,
        target: target.name,
        isCrit,
        damage: finalDamage,
        damageSubrows: damageSubrows.length > 0 ? damageSubrows : undefined, // ✅ Add damage type subrows
        arcaneDamageSubrows: arcaneDamageSubrows.length > 0 ? arcaneDamageSubrows : undefined, // ✅ Add subrows
        healing: effectRequests
            .filter(eff => eff.category === 'HEAL')
            .map(eff => ({ value: eff.value, valueType: eff.valueType, targetId: eff.targetId })),
        snapshot: {
            combatant: combatantSnapshot,
            target: targetSnapshot,
            stroke1_modifiers: modifierRequests, 
            stroke2_effects: effectRequests,
        }
    };

    // Handle DOT tick events specially
    if (event.action === 'DOT_TICK') {
        const source = updatedCombatants[event.sourceId];
        const target = updatedCombatants[event.targetId];
        
        if (!source || !target) {
            addRawLog({ level: 'warn', message: 'DOT tick skipped: source or target not found', event });
            return { updatedCombatants: currentCombatants, eventAnalysis: null };
        }
        
        // Calculate DOT damage based on stored metadata
        const weaponDamage = calculateWeaponDamage(
            event.metadata.weaponType,
            event.metadata.attributes
        );
        const dotDamage = Math.round(weaponDamage * event.damagePercent);
        
        // Apply damage modifiers from current effects
        let damageTerms = {
            empowerPercent: 0,
            rendPercent: 0,
            baseCritDmgPercent: 0,
            positionalDmgPercent: 0,
            miscDmgPercent: 0,
        };
        
        // Read buffs from source's activeEffects
        if (source.activeEffects) {
            for (const effect of source.activeEffects) {
                if (effect.category === 'EMPOWER') damageTerms.empowerPercent += effect.value || 0;
                if (effect.category === 'MISC_DAMAGE') damageTerms.miscDmgPercent += effect.value || 0;
            }
        }
        
        // Read debuffs from target's activeEffects (REND)
        if (target.activeEffects) {
            for (const effect of target.activeEffects) {
                if (effect.category === 'REND') damageTerms.rendPercent += effect.value || 0;
            }
        }
        
        // ✅ NEW: Apply modifier bunkers to DOT ticks!
        const modifierSources = []; // Track which bunkers contributed
        const dotContext = { ...event, source, target, allSources, timestamp, event, eventType: 'DOT_TICK' };
        for (const bunker of activeModifierBunkers) {
            const result = bunker.handler({ ...dotContext, timestamp });
            if (result && result.modifyDamage) {
                for (const mod of result.modifyDamage) {
                    if (mod.category === 'EMPOWER') damageTerms.empowerPercent += mod.value || 0;
                    if (mod.category === 'REND') damageTerms.rendPercent += mod.value || 0;
                    if (mod.category === 'MISC_DAMAGE') damageTerms.miscDmgPercent += mod.value || 0;
                    
                    // Track the source
                    const bunkerName = bunker.METADATA?.name || bunker.metadata?.name || bunker.id || 'Unknown';
                    modifierSources.push({
                        source: bunkerName,
                        category: mod.category,
                        value: mod.value
                    });
                }
            }
        }
        
        const finalDamage = Math.round(dotDamage *
            (1 + (damageTerms.empowerPercent || 0) + (damageTerms.rendPercent || 0)) *
            (1 + (damageTerms.miscDmgPercent || 0))
        );
        
        addRawLog({ 
            level: 'info', 
            message: `DOT Tick: ${finalDamage} damage to ${target.name}`, 
            event,
            baseDamage: dotDamage,
            finalDamage,
            modifiers: damageTerms
        });
        
        const eventAnalysis = {
            timestamp: event.timestamp,
            source: source.name,
            action: event.notes || 'Bleed Tick',
            target: target.name,
            isCrit: false,
            damage: finalDamage,
            snapshot: {
                combatant: JSON.parse(JSON.stringify(source)),
                target: JSON.parse(JSON.stringify(target)),
                stroke1_modifiers: modifierSources, // ✅ Track modifier sources
                stroke2_effects: [],
                damageTerms
            }
        };
        
        return { updatedCombatants, eventAnalysis };
    }

    return { updatedCombatants, eventAnalysis };
};

/**
 * Injects DOT tick events into the choreography based on active BLEED/DOT effects
 */
const injectDOTTickEvents = (choreography, combatants, currentTime) => {
    const dotTicks = [];
    
    console.log(`[DOT] Checking for ticks at ${currentTime.toFixed(2)}s`);
    
    // Check all combatants for active DOT effects
    for (const combatantId in combatants) {
        const combatant = combatants[combatantId];
        
        if (!combatant.activeEffects || combatant.activeEffects.length === 0) {
            continue;
        }
        
        console.log(`[DOT] ${combatantId} has ${combatant.activeEffects.length} active effects:`, 
            combatant.activeEffects.map(e => ({ 
                id: e.id, 
                category: e.category, 
                nextTickAt: e.nextTickAt?.toFixed(2),
                expiresAt: e.expiresAt?.toFixed(2)
            }))
        );
        
        for (const effect of combatant.activeEffects) {
            // Process both BLEED and DOT category effects
            if (effect.category !== 'BLEED' && effect.category !== 'DOT') {
                continue;
            }
            
            console.log(`[DOT] Found ${effect.category} effect:`, {
                id: effect.id,
                nextTickAt: effect.nextTickAt?.toFixed(2),
                currentTime: currentTime.toFixed(2),
                difference: effect.nextTickAt ? Math.abs(effect.nextTickAt - currentTime).toFixed(3) : 'N/A',
                shouldTick: effect.nextTickAt && Math.abs(effect.nextTickAt - currentTime) < 0.01
            });
            
            // Check if a tick should happen at this time
            if (effect.nextTickAt && Math.abs(effect.nextTickAt - currentTime) < 0.01) {
                console.log(`[DOT] ✅ Injecting tick for ${effect.id} at ${currentTime.toFixed(2)}s`);
                
                dotTicks.push({
                    timestamp: currentTime,
                    action: 'DOT_TICK',
                    type: 'BLEED_TICK',
                    sourceId: effect.sourceId,
                    targetId: effect.targetId,
                    effectId: effect.id,
                    damagePercent: effect.damagePercent,
                    damageType: effect.damageType, // ✅ Pass through damageType for modifier bunkers
                    metadata: effect.metadata,
                    notes: `Bleed Tick (${effect.metadata?.sourceName || 'Unknown'})`
                });
                
                // Update next tick time (if not expired)
                if (currentTime + effect.tickInterval <= effect.expiresAt) {
                    effect.nextTickAt = currentTime + (effect.tickInterval || 1);
                    console.log(`[DOT] Updated nextTickAt to ${effect.nextTickAt.toFixed(2)}s`);
                } else {
                    effect.nextTickAt = null;
                    console.log(`[DOT] Bleed expired, no more ticks`);
                }
            }
        }
    }
    
    if (dotTicks.length > 0) {
        console.log(`[DOT] 🩸 Injected ${dotTicks.length} DOT tick(s)`);
    }
    
    return dotTicks;
};

