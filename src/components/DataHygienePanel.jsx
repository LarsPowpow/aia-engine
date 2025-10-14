import React, { useState } from 'react';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';

const DataHygienePanel = ({ db, addLog }) => {
    const [isTaggingMasteries, setIsTaggingMasteries] = useState(false);
    // ADDED: New state for the perk tagging operation.
    const [isTaggingPerks, setIsTaggingPerks] = useState(false);
    
    const [masteryStatus, setMasteryStatus] = useState('Ready for command.');
    // ADDED: New status message state for the perk operation.
    const [perkStatus, setPerkStatus] = useState('Ready for command.');

    const handleTagMasteries = async () => {
        setIsTaggingMasteries(true);
        setMasteryStatus('Initiating scan of UKB sources...');
        addLog({ type: 'info', message: 'Mastery Tagging operation started.' });

        try {
            const sourcesRef = collection(db, 'ukb_sources_v2');
            const snapshot = await getDocs(sourcesRef);
            const allSources = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setMasteryStatus(`Scan complete. Analyzing ${allSources.length} source documents...`);

            const masteriesToUpdate = allSources.filter(source => 
                (source.id.startsWith('mastery_') || source.id.startsWith('passive_flail_') || source.id.startsWith('passive_sword_') || source.id.startsWith('upgrade_sword_') || source.id.startsWith('ultimate_sword_')) 
                && source.type !== 'WEAPON_MASTERY'
            );

            if (masteriesToUpdate.length === 0) {
                setMasteryStatus('Analysis complete. No masteries require tagging.');
                addLog({ type: 'success', message: 'Data hygiene check passed. All masteries are correctly tagged.' });
                setIsTaggingMasteries(false);
                return;
            }

            setMasteryStatus(`Found ${masteriesToUpdate.length} masteries to tag. Preparing batch update...`);

            const batch = writeBatch(db);
            masteriesToUpdate.forEach(source => {
                const docRef = doc(db, 'ukb_sources_v2', source.id);
                batch.update(docRef, { type: 'WEAPON_MASTERY' });
            });

            await batch.commit();
            const successMsg = `Batch update complete. Successfully tagged ${masteriesToUpdate.length} weapon masteries.`;
            setMasteryStatus(successMsg);
            addLog({ type: 'success', message: successMsg });
        } catch (error) {
            console.error("Mastery Tagging operation failed:", error);
            const errorMsg = `Operation failed: ${error.message}`;
            setMasteryStatus(errorMsg);
            addLog({ type: 'error', message: errorMsg });
        } finally {
            setIsTaggingMasteries(false);
        }
    };

    // --- NEW FUNCTION ---
    // This function finds all documents WITHOUT a 'type' field and tags them as "PERK".
    const handleTagPerks = async () => {
        setIsTaggingPerks(true);
        setPerkStatus('Initiating scan for untagged perks...');
        addLog({ type: 'info', message: 'Perk Tagging operation started.' });

        try {
            const sourcesRef = collection(db, 'ukb_sources_v2');
            const snapshot = await getDocs(sourcesRef);
            const allSources = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setPerkStatus(`Scan complete. Analyzing ${allSources.length} source documents...`);
            
            // Heuristic: A document is an untagged perk if it does not have a 'type' property.
            const perksToUpdate = allSources.filter(source => !source.hasOwnProperty('type'));

            if (perksToUpdate.length === 0) {
                setPerkStatus('Analysis complete. No untagged perks found.');
                addLog({ type: 'success', message: 'Data hygiene check passed. All perks appear to be correctly tagged.' });
                setIsTaggingPerks(false);
                return;
            }

            setPerkStatus(`Found ${perksToUpdate.length} untagged perks. Preparing batch update...`);
            
            const batch = writeBatch(db);
            perksToUpdate.forEach(source => {
                const docRef = doc(db, 'ukb_sources_v2', source.id);
                batch.update(docRef, { type: 'PERK' });
            });
            
            await batch.commit();

            const successMsg = `Batch update complete. Successfully tagged ${perksToUpdate.length} perks.`;
            setPerkStatus(successMsg);
            addLog({ type: 'success', message: successMsg });

        } catch (error) {
            console.error("Perk Tagging operation failed:", error);
            const errorMsg = `Operation failed: ${error.message}`;
            setPerkStatus(errorMsg);
            addLog({ type: 'error', message: errorMsg });
        } finally {
            setIsTaggingPerks(false);
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700 flex flex-col space-y-6">
            <div>
                <h3 className="text-2xl font-semibold text-gray-300 mb-4">Data Hygiene Operations</h3>
                <p className="text-sm text-gray-400">Run targeted operations to clean and standardize UKB data.</p>
            </div>
            
            {/* Tag Masteries Section */}
            <div className="bg-gray-900/50 p-4 rounded-md border border-gray-600">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-teal-400">Tag Weapon Masteries</h4>
                        <p className="text-xs text-gray-400 mt-1">Adds `type: "WEAPON_MASTERY"` to any untagged mastery.</p>
                    </div>
                    <button
                        onClick={handleTagMasteries}
                        disabled={isTaggingMasteries || isTaggingPerks}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        {isTaggingMasteries ? 'Processing...' : 'Execute'}
                    </button>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500 font-mono">
                        <span className="font-semibold">STATUS:</span> {masteryStatus}
                    </p>
                </div>
            </div>

            {/* Tag Perks Section - NEW */}
            <div className="bg-gray-900/50 p-4 rounded-md border border-gray-600">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-sky-400">Tag All Perks</h4>
                        <p className="text-xs text-gray-400 mt-1">Finds all documents without a `type` field and tags them as `type: "PERK"`.</p>
                    </div>
                    <button
                        onClick={handleTagPerks}
                        disabled={isTaggingMasteries || isTaggingPerks}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        {isTaggingPerks ? 'Processing...' : 'Execute'}
                    </button>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500 font-mono">
                        <span className="font-semibold">STATUS:</span> {perkStatus}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DataHygienePanel;