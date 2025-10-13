/**
 * Fetch multiple abilities documents by their IDs using Firestore 'in' operator.
 * @param {object} firestore - The Firestore instance
 * @param {Array<string>} docIds - Array of document IDs to fetch
 * @returns {Promise<Array<object>>} Array of ability documents
 */
export const fetchUKBDocuments = async (docIds, firestore) => {
  if (!docIds || docIds.length === 0) {
    return [];
  }
  const abilitiesRef = collection(firestore, 'abilities');
  const q = query(abilitiesRef, where('id', 'in', docIds));
  const querySnapshot = await getDocs(q);
  const documents = [];
  querySnapshot.forEach((doc) => {
    documents.push({ firestoreId: doc.id, ...doc.data() });
  });
  return documents;
};
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
