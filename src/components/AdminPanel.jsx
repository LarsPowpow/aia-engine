import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import JSONCleaner from './JSONCleaner.jsx';
import DeconstructorTestbed from './DeconstructorTestbed.jsx';

const ForgePanel = ({ db, addLog, userId, isRateLimited, setIsRateLimited }) => {
    const [archiveDocId, setArchiveDocId] = useState('');
    const [archiveData, setArchiveData] = useState('');

    const handleStashData = async () => {
        if (!archiveData) {
            addLog('Archive data cannot be empty.', 'error');
            return;
        }
        try {
            const docRef = await addDoc(collection(db, 'raw_data_archive'), {
                data: archiveData,
                timestamp: new Date(),
                stashedBy: userId || 'unknown',
            });
            setArchiveDocId(docRef.id);
            addLog(`Dirty JSON secured. Archive ID: ${docRef.id}`, 'success');
            setArchiveData('');
        } catch (error) {
            console.error("Error stashing document: ", error);
            addLog(`Error stashing Dirty JSON: ${error.message}`, 'error');
        }
    };

    return (
        // This is the main container for our new single-column assembly line.
        <div className="flex flex-col space-y-8">

            {/* Station 1: Dirty JSON Archive */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                <h3 className="text-2xl font-semibold text-gray-300 mb-4">1. Archive Dirty JSON</h3>
                <p className="text-sm text-gray-400 mb-4">Secure the master tape. Paste the raw, unaltered JSON here to archive it before cleaning. This ensures we never lose the original source data.</p>
                <textarea
                    className="w-full h-32 bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                    value={archiveData}
                    onChange={(e) => setArchiveData(e.target.value)}
                    placeholder="Paste raw 'dirty' JSON data here..."
                ></textarea>
                <button
                    onClick={handleStashData}
                    className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                    Stash Raw Data
                </button>
                {archiveDocId && (
                    <p className="text-sm text-green-400 mt-4 bg-gray-900 p-2 rounded">
                        Successfully Stashed. Archive ID: <span className="font-mono bg-gray-700 px-2 py-1 rounded">{archiveDocId}</span>
                    </p>
                )}
            </div>

            {/* Station 2: Carwash */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                 <h3 className="text-2xl font-semibold text-gray-300 mb-4">2. Operation: Carwash - JSON Cleaner</h3>
                <JSONCleaner addLog={addLog} />
            </div>

            {/* Station 3: Deconstructor */}
            <DeconstructorTestbed
                db={db}
                addLog={addLog}
                userId={userId}
                isRateLimited={isRateLimited}
                setIsRateLimited={setIsRateLimited}
            />

        </div>
    );
};

export default ForgePanel;