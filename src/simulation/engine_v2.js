/**
 * AIA-Engine: The "Glass Engine" (v2.1 - Data-Aware)
 * This engine is data-driven and built for transparency.
 * This version introduces the ability to query the UKB for Source objects.
 */
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

// --- UKB DATA LOADER ---
// A specialized function to fetch all required Source documents in a single batch.
const fetchSources = async (abilityIds, db) => {
    const sourceCache = {};
    if (!abilityIds || abilityIds.length === 0) return sourceCache;

    const sourcesRef = collection(db, 'ukb_sources_v2');
    
    // Firestore 'in' queries are limited to 30 items. We batch to handle more.
    const batches = [];
    for (let i = 0; i < abilityIds.length; i += 30) {
        batches.push(abilityIds.slice(i, i + 30));
    }

    try {
        for (const batch of batches) {
            const q = query(sourcesRef, where(documentId(), 'in', batch));
            const snapshot = await getDocs(q);
            snapshot.forEach(doc => {
                sourceCache[doc.id] = { id: doc.id, ...doc.data() };
            });
        }
    } catch (error) {
        console.error("AIA ENGINE: Error fetching sources from UKB:", error);
    }
    return sourceCache;
};


// --- SIMULATION CORE ---
export const runSimulationV2 = async (combatant, target, choreography, db) => {
    const log = [];
    log.push(`[0.0s] SIMULATION START: ${combatant.id} vs. ${target.id}`);
    
    // --- Pre-Flight: Load all necessary data from the UKB ---
    const requiredAbilityIds = [...new Set(choreography.filter(e => e.abilityId).map(e => e.abilityId))];
    log.push(`[0.0s] ENGINE: Identified ${requiredAbilityIds.length} unique abilities in choreography. Querying UKB...`);
    
    const sourceCache = await fetchSources(requiredAbilityIds, db);
    log.push(`[0.0s] ENGINE: UKB query complete. Found ${Object.keys(sourceCache).length} matching Source documents.`);

    // --- Core Loop ---
    for (const event of choreography) {
        log.push(`[${event.timestamp.toFixed(2)}s] EVENT: ${event.action} - ${event.notes}`);

        if (event.action === 'ABILITY') {
            const source = sourceCache[event.abilityId];
            if (source) {
                log.push(`[${event.timestamp.toFixed(2)}s] ENGINE: Found Source '${source.name}' in UKB cache.`);
            } else {
                log.push(`[${event.timestamp.toFixed(2)}s] ENGINE ERROR: Could not find Source for ID '${event.abilityId}' in UKB.`);
            }
        }
    }

    const lastEventTime = choreography.length > 0 ? choreography[choreography.length - 1].timestamp : 0.0;
    log.push(`[${lastEventTime.toFixed(2)}s] SIMULATION END: Choreography complete.`);

    return {
        rawLog: log,
        analysisLog: [] 
    };
};