import React, { useState, useEffect } from 'react';

const AdminPanel = ({ addLog }) => {
    const [apiKey, setApiKey] = useState('');
    const [apiKeyStatus, setApiKeyStatus] = useState({ message: '', type: 'info' });

    // On component mount, check sessionStorage for an existing key
    useEffect(() => {
        const storedKey = sessionStorage.getItem('geminiApiKey');
        if (storedKey) {
            setApiKey(storedKey);
            setApiKeyStatus({ message: 'API Key is set for this session.', type: 'success' });
        } else {
            setApiKeyStatus({ message: 'API Key is not set. AI features will fail.', type: 'error' });
        }
    }, []);

    const handleSaveKey = () => {
        if (apiKey.trim()) {
            sessionStorage.setItem('geminiApiKey', apiKey.trim());
            setApiKeyStatus({ message: 'API Key saved for this session.', type: 'success' });
            addLog('Gemini API key has been set for the session.', 'success');
        } else {
            sessionStorage.removeItem('geminiApiKey');
            setApiKeyStatus({ message: 'API Key removed.', type: 'info' });
            addLog('Gemini API key has been removed for the session.', 'info');
        }
    };

    const getStatusColor = () => {
        if (apiKeyStatus.type === 'success') return 'text-emerald-400';
        if (apiKeyStatus.type === 'error') return 'text-red-400';
        return 'text-gray-500';
    };

    return (
        <div id="panel-admin">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-red-500/50 space-y-8">
                <div>
                    <h2 className="text-2xl font-semibold text-yellow-300 mb-4">Gemini API Key</h2>
                    <p className="text-sm text-gray-400 mb-2">Enter your Gemini API key below. It will be stored securely for this session only.</p>
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
                            id="saveApiKeyBtn" 
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition"
                            onClick={handleSaveKey}
                        >
                            Save Key
                        </button>
                    </div>
                    <p id="apiKeyStatus" className={`text-xs mt-2 ${getStatusColor()}`}>
                        {apiKeyStatus.message}
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-semibold text-cyan-300 mb-4">Deconstructor Testbed</h2>
                    <p className="text-sm text-gray-400">The Deconstructor Testbed has been permanently relocated to The Forge.</p>
                </div>
                 {/* Other Admin sections like Purge and Archive can be added here later */}
            </div>
        </div>
    );
};

export default AdminPanel;

