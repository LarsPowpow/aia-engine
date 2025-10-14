import React, { useState } from 'react';
// Correcting the import path to the 'services' directory as per project structure analysis.
import { db } from '../services/firebase'; 
import { doc, writeBatch } from 'firebase/firestore';

const ManualUpsertPanel = () => {
  // --- STATE MANAGEMENT ---
  // The new, correct list of collections for our v2 data model.
  const collectionOptions = ['ukb_sources_v2', 'ukb_effects_v2'];
  
  // State for the selected collection from the dropdown. Initialize with the first option.
  const [targetCollection, setTargetCollection] = useState(collectionOptions[0]);
  
  // State for the JSON data entered by the user.
  const [jsonData, setJsonData] = useState('[\n  {\n    "id": "example_id",\n    "name": "Example Name"\n  }\n]');
  
  // State for feedback messages to the user (e.g., success, error).
  const [feedback, setFeedback] = useState({ message: '', isError: false });

  // --- DERIVED STATE ---
  // The label for the upsert button changes based on the selected collection.
  const buttonLabel = `Upsert to "${targetCollection}"`;

  // --- HANDLERS ---
  /**
   * Handles the main upsert logic when the button is clicked.
   */
  const handleUpsert = async () => {
    // Clear previous feedback.
    setFeedback({ message: '', isError: false });

    let dataArray;
    try {
      // 1. Parse the input JSON string. It must be a valid JSON array.
      dataArray = JSON.parse(jsonData);
      if (!Array.isArray(dataArray)) {
        throw new Error('Input data must be a JSON array.');
      }
    } catch (error) {
      // Handle JSON parsing errors.
      console.error("JSON Parse Error:", error);
      setFeedback({ message: `Error parsing JSON: ${error.message}`, isError: true });
      return;
    }

    if (dataArray.length === 0) {
      setFeedback({ message: 'JSON array is empty. Nothing to upsert.', isError: true });
      return;
    }

    try {
      // 2. Use a Firestore batch write for efficiency.
      // This allows multiple documents to be written in a single atomic operation.
      const batch = writeBatch(db);

      let docCount = 0;
      dataArray.forEach(docObject => {
        // 3. Validate that each object in the array has a unique 'id' field.
        // This is the core requirement of our data model.
        if (!docObject.id) {
          throw new Error('One or more documents in the array is missing the required "id" field.');
        }
        
        // 4. Create a document reference using the object's ID.
        const docRef = doc(db, targetCollection, docObject.id);
        
        // 5. Add the 'set' operation to the batch. 
        // Using { merge: true } would perform an upsert (update if exists, create if not).
        // For a clean harvest, we will use a simple set, which overwrites.
        batch.set(docRef, docObject);
        docCount++;
      });

      // 6. Commit the batch write to the database.
      await batch.commit();

      // 7. Provide success feedback to the Captain.
      setFeedback({ message: `Successfully upserted ${docCount} documents to ${targetCollection}.`, isError: false });
    } catch (error) {
      // Handle Firestore errors.
      console.error("Firestore Upsert Error:", error);
      setFeedback({ message: `Firestore error: ${error.message}`, isError: true });
    }
  };
  
  // --- RENDER ---
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Manual UKB Upsert</h2>
      <p className="text-gray-400 mb-6">Directly write or update documents in a UKB collection.</p>

      {/* Target Collection Dropdown */}
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

      {/* JSON Data Textarea */}
      <div className="mb-6">
        <label htmlFor="jsonData" className="block text-sm font-medium text-gray-300 mb-2">
          JSON Data (must be an array)
        </label>
        <textarea
          id="jsonData"
          rows="15"
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          placeholder='[{"id": "example_id", "name": "Example"}]'
        />
      </div>

      {/* Upsert Button */}
      <button
        onClick={handleUpsert}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out"
      >
        {buttonLabel}
      </button>

      {/* Feedback Message Area */}
      {feedback.message && (
        <div className={`mt-4 p-3 rounded-md text-sm ${feedback.isError ? 'bg-red-900 text-red-200' : 'bg-green-900 text-green-200'}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
};

export default ManualUpsertPanel;

