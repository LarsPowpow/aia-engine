// src/lib/firebase/firestore.js
// Fetches all documents from the 'abilities' collection where type === 'perk'

import { getDocs, collection, query, where } from 'firebase/firestore';

/**
 * Fetch all perks from the abilities collection
 * @param {object} db - Firestore database instance
 * @returns {Promise<Array>} Array of perk documents
 */
export async function fetchAllPerks(db) {
  const perksQuery = query(
    collection(db, 'abilities'),
    where('type', '==', 'perk')
  );
  const snapshot = await getDocs(perksQuery);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Fetches all perks from the abilities collection in Firestore.
 * @param {object} firestore - The Firestore instance
 * @returns {Promise<Array<object>>} Array of perk documents
 */
export async function fetchPerks(firestore) {
  if (!firestore) throw new Error('Firestore instance required');
  const abilitiesRef = collection(firestore, 'abilities');
  const q = query(abilitiesRef, where('type', '==', 'perk'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
