import { useState } from 'react';
import { db } from '../services/firebase';
import { doc, deleteDoc, writeBatch, collection } from 'firebase/firestore';

const COLLECTIONS = ['perks', 'weapon_mastery', 'game_constants', 'status_effects', 'attribute_bonuses', 'builds', 'effects', 'abilities'];

function CommandCenter({ logMessage }) {
  const [bulkData, setBulkData] = useState('');
  const [deleteCollection, setDeleteCollection] = useState('');
  const [deleteDocId, setDeleteDocId] = useState('');
  const [selectedIngestCollection, setSelectedIngestCollection] = useState('');

  const handleRunIngestion = async () => {
    if (!selectedIngestCollection) {
      logMessage("No collection selected for ingestion. Aborting.", "error");
      return;
    }
    if (!bulkData.trim()) {
      logMessage("Bulk Ingestion field is empty. Aborting.", 'error');
      return;
    }

    logMessage(`Initiating Smart Ingestion (Upsert) for '${selectedIngestCollection}'...`, 'special');
    try {
      const dataArray = JSON.parse(bulkData);
      if (!Array.isArray(dataArray)) {
        throw new Error("Input data must be a valid JSON array.");
      }

      const batch = writeBatch(db);
      let count = 0;
      dataArray.forEach(obj => {
        const docId = obj.ability_id || obj.effect_id; // Assumes a primary key
        if (!docId) {
          logMessage(`Skipping object due to missing primary key: ${JSON.stringify(obj)}`, 'error');
          return;
        }
        const docRef = doc(db, selectedIngestCollection, docId);
        batch.set(docRef, obj, { merge: true });
        count++;
      });

      await batch.commit();
      logMessage(`Smart Ingestion successful. ${count} documents were created/updated in '${selectedIngestCollection}'.`, 'success');
      setBulkData('');
    } catch (e) {
      logMessage(`Error during Smart Ingestion: ${e.message}`, 'error');
    }
  };

  const handleRunDelete = async () => {
    if (!deleteCollection || !deleteDocId.trim()) {
      logMessage("Collection and Document ID must be provided for deletion.", 'error');
      return;
    }

    logMessage(`Initiating Surgical Deletion for doc '${deleteDocId}' in '${deleteCollection}'...`, 'delete');
    try {
      await deleteDoc(doc(db, deleteCollection, deleteDocId));
      logMessage(`Successfully deleted document '${deleteDocId}' from '${deleteCollection}'.`, 'success');
      setDeleteDocId('');
    } catch (e) {
      logMessage(`Error deleting document: ${e.message}`, 'error');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 flex flex-col space-y-6">
      <h2 className="text-2xl font-semibold text-emerald-300 mb-0">Command Center</h2>

      {/* Smart Ingestion */}
      <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex-grow flex flex-col">
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Smart Ingestion (Upsert)</h3>
        <select
          value={selectedIngestCollection}
          onChange={(e) => setSelectedIngestCollection(e.target.value)}
          className="mb-4 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">-- Select Collection to Ingest Into --</option>
          {COLLECTIONS.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <textarea
          value={bulkData}
          onChange={(e) => setBulkData(e.target.value)}
          className="w-full h-32 bg-gray-900 rounded-md p-3 font-mono text-sm border border-gray-600 text-amber-300"
          placeholder='[ { "ability_id": "...", ... } ]'
          disabled={!selectedIngestCollection}
        />
        <button
          onClick={handleRunIngestion}
          className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition disabled:opacity-50"
          disabled={!selectedIngestCollection}
        >
          Run Smart Ingestion
        </button>
      </div>

      {/* Surgical Deletion */}
      <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex-grow flex flex-col">
        <h3 className="text-xl font-semibold text-red-300 mb-2">Surgical Deletion</h3>
        <select
          value={deleteCollection}
          onChange={(e) => setDeleteCollection(e.target.value)}
          className="mb-4 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500"
        >
          <option value="">-- Select Collection to Delete From --</option>
          {COLLECTIONS.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <input
          type="text"
          value={deleteDocId}
          onChange={(e) => setDeleteDocId(e.target.value)}
          className="mb-4 block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300"
          placeholder="Paste document ID here..."
        />
        <button
          onClick={handleRunDelete}
          className="mt-auto w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition"
        >
          Delete Document
        </button>
      </div>
    </div>
  );
}

export default CommandCenter;