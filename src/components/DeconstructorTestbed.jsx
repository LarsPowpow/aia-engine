import React from 'react';

const DeconstructorTestbed = ({ apiKey, onApiKeyChange, addLog }) => {

    const handleDeconstruct = () => {
        if (!apiKey) {
            addLog('error', 'API Key is missing. Cannot run the Deconstructor.');
            return;
        }
        addLog('info', 'Deconstructor engaged. (Placeholder for Gemini API call)');
        // Full API logic will be wired in a future operation.
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
            <h3 className="text-2xl font-semibold text-gray-300 mb-4">AI Deconstructor</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-1">
                        Gemini API Key (Set it and Forget it)
                    </label>
                    <input
                        type="password"
                        id="apiKey"
                        value={apiKey}
                        onChange={onApiKeyChange}
                        className="w-full bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                        placeholder="Enter your Gemini API Key once..."
                    />
                </div>
                <button
                    onClick={handleDeconstruct}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                    Run AI Deconstructor
                </button>
            </div>
        </div>
    );
};

export default DeconstructorTestbed;