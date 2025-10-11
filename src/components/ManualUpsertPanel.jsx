import React, { useState, useEffect } from 'react';
import { collection, writeBatch, doc } from 'firebase/firestore';

const ManualUpsertPanel = ({ db, addLog, collections }) => {
    const [jsonData, setJsonData] = useState('');
    const [targetCollection, setTargetCollection] = useState('');

    useEffect(() => {
        if (collections && collections.length > 0) {
            setTargetCollection(collections[0]);
        }
    }, [collections]);

    const handleUpsert = async () => {
        if (!targetCollection) {
            addLog("Error: No target collection selected.");
            return;
        }
        addLog(`Initiating manual upsert to "${targetCollection}"...`);

        let data;
        try {
            data = JSON.parse(jsonData);
        } catch (error) {
            addLog(`Error parsing JSON: ${error.message}`);
            return;
        }

        if (!Array.isArray(data)) {
            addLog('Error: JSON data must be an array of objects.');
            return;
        }

        const collectionRef = collection(db, targetCollection);
        const batch = writeBatch(db);
        let savedCount = 0;
        
        // Special case for 'runeglass' collection
        let idField;
        if (targetCollection === 'runeglass') {
            idField = 'runeglass_id';
        } else {
            const singularForm = targetCollection.endsWith('s') ? targetCollection.slice(0, -1) : targetCollection;
            idField = `${singularForm}_id`;
        }

        const skippedItems = [];
        data.forEach(item => {
            const docId = item[idField];
            if (docId) {
                const docRef = doc(collectionRef, docId);
                batch.set(docRef, item, { merge: true });
                savedCount++;
            } else {
                skippedItems.push(item);
            }
        });
        if (skippedItems.length > 0) {
            addLog(`Skipped ${skippedItems.length} item(s) without a valid ID field ('${idField}').`);
        }

        try {
            await batch.commit();
            addLog(`Upsert successful: ${savedCount} document(s) saved to "${targetCollection}".`);
            setJsonData('');
        } catch (error) {
            addLog(`Error committing batch: ${error.message}`);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
            <h3 className="text-2xl font-semibold text-gray-300 mb-4">Manual UKB Upsert</h3>
            <p className="text-sm text-gray-400 mb-6">Directly write or update documents in a UKB collection.</p>
            
            <div className="mb-4">
                <label htmlFor="target-collection" className="block text-sm font-medium text-gray-300 mb-2">
                    Target UKB Collection
                </label>
                    <select
                    id="target-collection"
                    value={targetCollection}
                    onChange={(e) => setTargetCollection(e.target.value)}
                    className="w-full bg-gray-900 text-white border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                        {(collections || []).map(col => <option key={col} value={col}>{col}</option>)}
                </select>
            </div>

            <div className="mb-4">
                <label htmlFor="json-data" className="block text-sm font-medium text-gray-300 mb-2">
                    JSON Data (must be an array)
                </label>
                <textarea
                    id="json-data"
                    rows="12"
                    className="w-full bg-gray-900 text-white font-mono text-sm border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    value={jsonData}
                    onChange={(e) => setJsonData(e.target.value)}
                    placeholder='[{"ability_id": "example_id", "name": "Example"}, ...]'
                ></textarea>
            </div>

            <button
                onClick={handleUpsert}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out shadow-md hover:shadow-lg text-lg"
                disabled={!targetCollection}
            >
                {`Upsert to "${targetCollection || '...'}"`}
            </button>
        </div>
    );
};

export default ManualUpsertPanel;