import { useState, useEffect } from 'react';

function AdminPanel({ addLog }) {
    const [apiKey, setApiKey] = useState('');
    const [status, setStatus] = useState({ text: 'API Key is not set.', color: 'text-gray-500' });
    const [archiveDocId, setArchiveDocId] = useState('');
    const [archiveData, setArchiveData] = useState('');

    useEffect(() => {
        const storedKey = sessionStorage.getItem('geminiApiKey');
        if (storedKey) {
            setApiKey(storedKey);
            setStatus({ text: 'API Key is loaded from session storage.', color: 'text-emerald-400' });
        }
    }, []);

    const handleSaveKey = () => {
        if (apiKey) {
            sessionStorage.setItem('geminiApiKey', apiKey);
            setStatus({ text: 'API Key saved for this session.', color: 'text-emerald-400' });
            addLog('success', 'Gemini API Key has been set for the session.');
        } else {
            sessionStorage.removeItem('geminiApiKey');
            setStatus({ text: 'API Key removed.', color: 'text-red-400' });
            addLog('info', 'Gemini API Key has been removed for the session.');
        }
    };

    // Placeholder for the stash functionality
    const handleStashData = () => {
        addLog('info', 'Stash Raw Data button clicked. Logic not yet implemented.');
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-red-500/50">
            <div className="space-y-8">
                {/* Gemini API Key Section */}
                <div>
                    <h2 className="text-2xl font-semibold text-yellow-300 mb-4">Gemini API Key</h2>
                    <p className="text-sm text-gray-400 mb-2">Enter your Gemini API key below. It will be stored securely in your browser for this session only.</p>
                    <div className="flex items-center space-x-2">
                        <input
                            type="password"
                            id="apiKeyInput"
                            className="block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300 focus:ring-yellow-500 focus:border-yellow-500"
                            placeholder="Enter your Gemini API key..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <button
                            onClick={handleSaveKey}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                            Save Key
                        </button>
                    </div>
                    <p className={`text-xs mt-2 ${status.color}`}>{status.text}</p>
                </div>

                {/* Operation Precious Cargo Section */}
                <div>
                    <h2 className="text-2xl font-semibold text-teal-300 mb-4">Operation: Precious Cargo</h2>
                    <p className="text-sm text-gray-400 mb-2">Securely stash raw source data (e.g., full API responses) into the UKB. This data is critical for future analysis and harvester development.</p>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="archiveDocIdInput" className="block text-sm font-medium text-gray-400">Archive ID (e.g., nwdb_perks_page_1)</label>
                            <input
                                type="text"
                                id="archiveDocIdInput"
                                className="mt-1 block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Enter a unique ID for this data..."
                                value={archiveDocId}
                                onChange={(e) => setArchiveDocId(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="archiveDataInput" className="block text-sm font-medium text-gray-400">Raw Data Payload</label>
                            <textarea
                                id="archiveDataInput"
                                rows="6"
                                className="mt-1 block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Paste the raw JSON or text data here..."
                                value={archiveData}
                                onChange={(e) => setArchiveData(e.target.value)}
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
        </div>
    );
}

export default AdminPanel;

