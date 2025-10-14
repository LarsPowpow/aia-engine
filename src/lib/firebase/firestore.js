import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Fetches all Source objects from the ukb_sources_v2 collection. (No changes)
export const fetchSources = async () => {
  try {
    const sourcesCol = collection(db, 'ukb_sources_v2');
    const sourceSnapshot = await getDocs(sourcesCol);
    const sourceList = sourceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Successfully fetched ${sourceList.length} sources from UKB.`);
    return sourceList;
  } catch (error) {
    console.error("Error fetching sources from UKB:", error);
    throw new Error("Failed to fetch Source data from the Universal Knowledge Base.");
  }
};

// Fetches all Source objects specifically tagged as WEAPON_MASTERY. (No changes)
export const fetchAllMasteries = async () => {
  try {
    const sourcesRef = collection(db, 'ukb_sources_v2');
    const q = query(sourcesRef, where("type", "==", "WEAPON_MASTERY"));
    const querySnapshot = await getDocs(q);
    const masteryList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Successfully fetched ${masteryList.length} masteries from UKB.`);
    return masteryList;
  } catch (error) {
    console.error("Error fetching masteries from UKB:", error);
    throw new Error("Failed to fetch Weapon Mastery data from the UKB.");
  }
};

// --- NEW AUTHORITATIVE FUNCTION FOR PERKS ---
// Fetches all Source objects that are NOT tagged as WEAPON_MASTERY.
export const fetchAllPerks = async () => {
  try {
    const sourcesRef = collection(db, 'ukb_sources_v2');
    // Create a query to filter for documents where 'type' is not equal to 'WEAPON_MASTERY'.
    const q = query(sourcesRef, where("type", "!=", "WEAPON_MASTERY"));
    const querySnapshot = await getDocs(q);
    const perkList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`Successfully fetched ${perkList.length} perks from UKB.`);
    return perkList;
  } catch (error) {
    console.error("Error fetching perks from UKB:", error);
    throw new Error("Failed to fetch Perk data from the UKB.");
  }
};