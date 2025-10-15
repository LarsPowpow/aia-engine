import React, { useState } from 'react';
import { db } from '../services/firebase'; 
import { doc, writeBatch } from 'firebase/firestore';

const ManualUpsertPanel = () => {
  const collectionOptions = ['ukb_sources_v2', 'ukb_effects_v2'];
  const [targetCollection, setTargetCollection] = useState(collectionOptions[0]);
  const [jsonData, setJsonData] = useState('{\n  "id": "example_id",\n  "name": "Example Name"\n}'); // Default to a single object
  const [feedback, setFeedback] = useState({ message: '', isError: false });

  const buttonLabel = `Upsert to "${targetCollection}"`;

  const handleUpsert = async () => {
    setFeedback({ message: '', isError: false });

    let parsedData;
    try {
      parsedData = JSON.parse(jsonData);
    } catch (error) {
      console.error("JSON Parse Error:", error);
      setFeedback({ message: `Error parsing JSON: ${error.message}`, isError: true });
      return;
    }

    // THE UPGRADE: Intelligently handle both objects and arrays.
    const dataArray = Array.isArray(parsedData) ? parsedData : [parsedData];

    if (dataArray.length === 0) {
      setFeedback({ message: 'No data to upsert.', isError: true });
      return;
    }

    try {
      const batch = writeBatch(db);
      let docCount = 0;
      dataArray.forEach(docObject => {
        if (!docObject.id) {
          throw new Error('One or more documents is missing the required "id" field.');
        }
        const docRef = doc(db, targetCollection, docObject.id);
        batch.set(docRef, docObject);
        docCount++;
      });

      await batch.commit();
      setFeedback({ message: `Successfully upserted ${docCount} document(s) to ${targetCollection}.`, isError: false });
    } catch (error) {
      console.error("Firestore Upsert Error:", error);
      setFeedback({ message: `Firestore error: ${error.message}`, isError: true });
    }
  };
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manual UKB Upsert</h2>
      <p className="text-gray-400 mb-6">Directly write or update documents in a UKB collection.</p>

      <div className="mb-4">
        <label htmlFor="targetCollection" className="block text-sm font-medium text-gray-300 mb-2">
          Target UKB Collection
        </label>
        <select
          id="targetCollection"
          value={targetCollection}
          onChange={(e) => setTargetCollection(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {collectionOptions.map(collectionName => (
            <option key={collectionName} value={collectionName}>
              {collectionName}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        {/* UPDATED LABEL: No longer requires an array */}
        <label htmlFor="jsonData" className="block text-sm font-medium text-gray-300 mb-2">
          JSON Data
        </label>
        <textarea
          id="jsonData"
          rows="15"
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder='{"id": "example_id", "name": "Example"}'
        />
      </div>

      <button
        onClick={handleUpsert}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out"
      >
        {buttonLabel}
      </button>

      {feedback.message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${feedback.isError ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
};

export default ManualUpsertPanel;