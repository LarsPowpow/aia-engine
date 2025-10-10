import React, { useState } from 'react';
import { doc, setDoc } from "firebase/firestore";

const AdminPanel = ({ addLog, db }) => {
    const [apiKey, setApiKey] = useState(sessionStorage.getItem('geminiApiKey') || '');
    const [apiKeyStatus, setApiKeyStatus] = useState('');
    const [archiveId, setArchiveId] = useState('');
    const [archivePayload, setArchivePayload] = useState('');


    const handleSaveApiKey = () => {
        if (apiKey) {
            sessionStorage.setItem('geminiApiKey', apiKey);
            setApiKeyStatus('API Key saved for this session.');
            addLog('success', 'Gemini API key has been set for the session.');
        } else {
            sessionStorage.removeItem('geminiApiKey');
            setApiKeyStatus('API Key removed.');
            addLog('info', 'Gemini API key has been removed for the session.');
        }
    };

    const handleStashData = async () => {
        if (!db || !archiveId || !archivePayload) {
            addLog('error', 'Stash failed: Archive ID and Payload cannot be empty.');
            return;
        }
        addLog('special', `Stashing raw data under ID '${archiveId}'...`);
        try {
            const docRef = doc(db, 'raw_data_archive', archiveId);
            await setDoc(docRef, {
                raw_data: archivePayload,
                stashed_at: new Date().toISOString()
            });
            addLog('success', `Successfully stashed '${archiveId}' into the raw data archive.`);
            setArchiveId('');
            setArchivePayload('');
        } catch (error) {
            addLog('error', `Error stashing raw data: ${error.message}`);
        }
    };


    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-red-500/50 space-y-8">
            {/* API Key Management */}
            <div>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">Gemini API Key</h2>
                <p className="text-sm text-gray-400 mb-2">Enter your Gemini API key below. It will be stored securely for this session only.</p>
                <div className="flex items-center space-x-2">
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300"
                        placeholder="Enter your Gemini API key..."
                    />
                    <button
                        onClick={handleSaveApiKey}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Save Key
                    </button>
                </div>
                {apiKeyStatus && <p className="text-xs text-emerald-400 mt-2">{apiKeyStatus}</p>}
                {!sessionStorage.getItem('geminiApiKey') && <p className="text-xs text-red-400 mt-2">API Key is not set. AI features will fail.</p>}
            </div>

            {/* Operation: Precious Cargo */}
            <div>
                <h2 className="text-2xl font-semibold text-teal-300 mb-4">Operation: Precious Cargo</h2>
                <p className="text-sm text-gray-400 mb-2">Securely stash raw source data (e.g., full API responses) into the UKB. This data is critical for future analysis and harvester development.</p>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="archiveDocIdInput" className="block text-sm font-medium text-gray-400">Archive ID (e.g., nwdb_perks_page_1)</label>
                        <input
                            type="text"
                            id="archiveDocIdInput"
                            value={archiveId}
                            onChange={(e) => setArchiveId(e.target.value)}
                            className="mt-1 block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300"
                            placeholder="Enter a unique ID for this data..."
                        />
                    </div>
                    <div>
                        <label htmlFor="archiveDataInput" className="block text-sm font-medium text-gray-400">Raw Data Payload</label>
                        <textarea
                            id="archiveDataInput"
                            rows="6"
                            value={archivePayload}
                            onChange={(e) => setArchivePayload(e.target.value)}
                            className="mt-1 block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300"
                            placeholder="Paste the raw JSON or text data here..."
                        ></textarea>
                    </div>
                    <button
                        onClick={handleStashData}
                        className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-5 rounded-lg text-lg transition"
                    >
                        Stash Raw Data
                    </button>
                </div>
            </div>

        </div>
    );
};

export default AdminPanel;

