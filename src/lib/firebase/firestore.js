import { collection, getDocs } from 'firebase/firestore';
// We are now correctly importing the 'db' instance from our service file.
import { db } from '../../services/firebase';

// --- LEGACY FUNCTION - DO NOT USE FOR NEW DEVELOPMENT ---
export const fetchPerks = async () => {
  try {
    const perksCol = collection(db, 'perks');
    const perkSnapshot = await getDocs(perksCol);
    const perkList = perkSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return perkList;
  } catch (error) {
    console.error("Error fetching legacy perks:", error);
    throw new Error("Failed to fetch legacy perk data from Firestore.");
  }
};

// --- NEW AUTHORITATIVE FUNCTION ---
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