import React, { useState } from 'react';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const DataHygienePanel = ({ db, addLog }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Ready for command.');

    const handleTagMasteries = async () => {
        setIsProcessing(true);
        setStatusMessage('Initiating scan of UKB sources...');
        addLog({ type: 'info', message: 'Mastery Tagging operation started.' });

        try {
            // 1. Fetch all documents from the sources collection.
            const sourcesRef = collection(db, 'ukb_sources_v2');
            const snapshot = await getDocs(sourcesRef);
            const allSources = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setStatusMessage(`Scan complete. Analyzing ${allSources.length} source documents...`);

            // 2. Identify masteries that need updating.
            // Heuristic: A document is a mastery if its ID starts with 'mastery_'.
            // It needs updating if it does NOT already have the 'type' field.
            const masteriesToUpdate = allSources.filter(source => 
                source.id.startsWith('mastery_') && source.type !== 'WEAPON_MASTERY'
            );

            if (masteriesToUpdate.length === 0) {
                setStatusMessage('Analysis complete. No masteries require tagging.');
                addLog({ type: 'success', message: 'Data hygiene check passed. All masteries are correctly tagged.' });
                setIsProcessing(false);
                return;
            }

            setStatusMessage(`Found ${masteriesToUpdate.length} masteries to tag. Preparing batch update...`);

            // 3. Perform a batch update for efficiency and atomicity.
            const batch = writeBatch(db);
            masteriesToUpdate.forEach(source => {
                const docRef = doc(db, 'ukb_sources_v2', source.id);
                batch.update(docRef, { type: 'WEAPON_MASTERY' });
            });

            // 4. Commit the batch.
            await batch.commit();

            const successMsg = `Batch update complete. Successfully tagged ${masteriesToUpdate.length} weapon masteries.`;
            setStatusMessage(successMsg);
            addLog({ type: 'success', message: successMsg });

        } catch (error) {
            console.error("Data Hygiene operation failed:", error);
            const errorMsg = `Operation failed: ${error.message}`;
            setStatusMessage(errorMsg);
            addLog({ type: 'error', message: errorMsg });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
            <h3 className="text-2xl font-semibold text-gray-300 mb-4">Data Hygiene Operations</h3>
            <p className="text-sm text-gray-400 mb-6">Run targeted operations to clean and standardize UKB data.</p>
            
            <div className="bg-gray-900/50 p-4 rounded-md border border-gray-600">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-teal-400">Tag Weapon Masteries</h4>
                        <p className="text-xs text-gray-400 mt-1">Scans all sources and adds `type: "WEAPON_MASTERY"` to any untagged mastery document.</p>
                    </div>
                    <button
                        onClick={handleTagMasteries}
                        disabled={isProcessing}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        {isProcessing ? 'Processing...' : 'Execute'}
                    </button>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500 font-mono">
                        <span className="font-semibold">STATUS:</span> {statusMessage}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DataHygienePanel;