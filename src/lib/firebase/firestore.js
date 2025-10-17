import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

/**
 * Fetches all documents from the ukb_sources_v2 collection that are specifically of type 'Mastery'.
 * This is used by the MasteryLoadoutPanel.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of mastery documents.
 */
export const fetchAllMasteries = async () => {
    try {
        const sourcesCollection = collection(db, 'ukb_sources_v2');
        const masteryQuery = query(sourcesCollection, where('type', '==', 'Mastery'));
        const querySnapshot = await getDocs(masteryQuery);
        
        const masteries = [];
        querySnapshot.forEach((doc) => {
            masteries.push({ id: doc.id, ...doc.data() });
        });
        
        return masteries;
    } catch (error) {
        console.error("Error fetching masteries from UKB:", error);
        throw new Error("Failed to fetch masteries from UKB.");
    }
};

/**
 * Fetches all documents from the ukb_sources_v2 collection that are of type 'Perk'.
 * This is used by the PerkLoadoutPanel.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of perk documents.
 */
export const fetchAllPerks = async () => {
    try {
        const sourcesCollection = collection(db, 'ukb_sources_v2');
        // This query correctly fetches only items intended to be perks.
        const perkQuery = query(sourcesCollection, where('type', '==', 'Perk'));
        const querySnapshot = await getDocs(perkQuery);
        
        const perks = [];
        querySnapshot.forEach((doc) => {
            perks.push({ id: doc.id, ...doc.data() });
        });
        
        return perks;
    } catch (error) {
        console.error("Error fetching perks from UKB:", error);
        throw new Error("Failed to fetch perks from UKB.");
    }
};

/**
 * Fetches all documents from the ukb_sources_v2 collection that are specifically of type 'Ability'.
 * This will be used by a future AbilityLoadoutPanel.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of ability documents.
 */
export const fetchAllAbilities = async () => {
    try {
        const sourcesCollection = collection(db, 'ukb_sources_v2');
        const abilityQuery = query(sourcesCollection, where('type', '==', 'Ability'));
        const querySnapshot = await getDocs(abilityQuery);
        
        const abilities = [];
        querySnapshot.forEach((doc) => {
            abilities.push({ id: doc.id, ...doc.data() });
        });
        
        return abilities;
    } catch (error) {
        console.error("Error fetching abilities from UKB:", error);
        throw new Error("Failed to fetch abilities from UKB.");
    }
};

