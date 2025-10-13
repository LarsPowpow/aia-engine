import { getDocs, collection, query, where } from 'firebase/firestore';

/**
 * Fetches all documents from the 'perks' collection.
 * This is the definitive function for populating the Perk Loadout Panel.
 * @param {object} db - The Firestore database instance.
 * @returns {Promise<Array<object>>} An array of perk documents.
 * @throws {Error} If the database query fails.
 */
export async function fetchPerks(db) {
  try {
    // CORRECTED: The query now correctly targets the 'perks' collection.
    const perksQuery = query(
      collection(db, 'perks')
    );
    
    const snapshot = await getDocs(perksQuery);
    
    if (snapshot.empty) {
      console.warn("No documents found in the 'perks' collection.");
      return [];
    }
    
    // Note: The original query had a "where('type', '==', 'perk')" clause.
    // Since the entire collection is now dedicated to perks, this is no longer necessary.
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  } catch (error) {
    console.error("Error fetching perks from Firestore:", error);
    // Propagate the error so the UI component can handle it.
    throw error;
  }
}

