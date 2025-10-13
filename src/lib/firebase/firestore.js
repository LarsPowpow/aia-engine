import { getDocs, collection, query, where } from 'firebase/firestore';

/**
 * Fetches all documents from the 'abilities' collection where type === 'perk'.
 * This is the definitive function for populating the Perk Loadout Panel.
 * @param {object} db - The Firestore database instance.
 * @returns {Promise<Array<object>>} An array of perk documents.
 * @throws {Error} If the database query fails.
 */
export async function fetchPerks(db) {
  try {
    const perksQuery = query(
      collection(db, 'abilities'),
      where('type', '==', 'perk')
    );
    const snapshot = await getDocs(perksQuery);
    if (snapshot.empty) {
      console.warn("No documents of type 'perk' found in the 'abilities' collection.");
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching perks from Firestore:", error);
    // Propagate the error so the UI component can handle it.
    throw error;
  }
}

