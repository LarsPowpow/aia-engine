import React, { useState } from 'react';
// Debug: log stagedData and its type
console.log('stagedData:', stagedData, 'Type:', typeof stagedData);
import { getFirestore, writeBatch, doc } from "firebase/firestore";

const MigrationPanel = ({ stagedData, setStagedData, addLog, db }) => {
    const [targetCollection, setTargetCollection] = useState('perks'); // Default to 'perks' for our current mission

    const handleClearAll = () => {
        setStagedData([]);
        addLog('info', 'Migration staging area has been cleared.');
    };

    const handleCommitAll = async () => {
        if (!db || !stagedData || stagedData.length === 0) {
            addLog('error', 'Commit failed: No data staged or database not connected.');
            return;
        }
        if (!targetCollection) {
            addLog('error', 'Commit failed: A target collection must be selected.');
            return;
        }

        addLog('special', `Initiating commit of ${stagedData.length} item(s) to "${targetCollection}"...`);
        const batch = writeBatch(db);
        
        // Dynamically determine the ID field based on the collection name (e.g., 'perks' -> 'perk_id')
        const singularForm = targetCollection.endsWith('s') ? targetCollection.slice(0, -1) : targetCollection;
        const idField = `${singularForm}_id`;

        let commitCount = 0;
        stagedData.forEach(item => {
            const docId = item[idField];
            if (docId) {
                const docRef = doc(db, targetCollection, String(docId));
                batch.set(docRef, item, { merge: true });
                commitCount++;
            } else {
                addLog('warning', `Skipping item without a valid ID field ('${idField}').`);
            }
        });

        if (commitCount === 0) {
            addLog('error', `Commit failed: No items in the staged data had a valid ID for the collection "${targetCollection}".`);
            return;
        }

        try {
            await batch.commit();
            addLog('success', `Commit successful: ${commitCount} document(s) saved to "${targetCollection}".`);
            handleClearAll();
        } catch (e) {
            addLog('error', `Error committing to UKB: ${e.message}`);
        }
    };

    const safeStagedData = Array.isArray(stagedData) ? stagedData : [];

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-amber-500/50">
            <h2 className="text-2xl font-semibold text-amber-300 mb-4 text-center">Migration Workshop</h2>
            
            {safeStagedData.length > 0 ? (
                <>
                    <div className="mb-6">
                        <label htmlFor="target-collection-selector" className="block text-sm font-medium text-gray-300 mb-2">Target UKB Collection</label>
                        <select
                            id="target-collection-selector"
                            value={targetCollection}
                            onChange={(e) => setTargetCollection(e.target.value)}
                            className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="perks">perks</option>
                            <option value="abilities">abilities</option>
                            <option value="effects">effects</option>
                            <option value="runeglass">runeglass</option>
                            <option value="attribute_bonuses">attribute_bonuses</option>
                        </select>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 border-t border-b border-gray-700 py-4">
                        {safeStagedData.map((item, index) => (
                            <div key={index} className="bg-gray-900/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-amber-400 font-mono break-all">
                                    {item.name || item.perk_id || item.ability_id || item.description || `Item ${index + 1}`}
                                </h3>
                                <pre className="mt-2 text-xs text-gray-300 bg-black p-2 rounded-md overflow-x-auto">
                                    {JSON.stringify(item, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                        <button onClick={handleCommitAll} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition">
                            Approve & Commit ({safeStagedData.length}) to "{targetCollection}"
                        </button>
                        <button onClick={handleClearAll} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-6 rounded-lg text-lg transition">
                            Reject & Clear All
                        </button>
                    </div>
                </>
            ) : (
                <p className="text-center text-gray-400 py-16">
                    The workshop is empty. Run the Deconstructor in The Forge to stage items for migration.
                </p>
            )}
        </div>
    );
};

export default MigrationPanel;console.log(JSON.stringify(stagedData, null, 2));
