import React from 'react';

// This component represents the "Project Scribe" functionality for OCR ingestion.
const Scribe = ({ setStagedData, addLog, setActiveTab }) => {
    
    // Placeholder function for handling image paste.
    // In a full implementation, this would process the image and call the Gemini API.
    const handlePaste = () => {
        addLog('info', 'Paste event detected in Scribe. OCR processing would happen here.');
        // Example:
        // 1. Get image from clipboard.
        // 2. Convert to base64.
        // 3. Call Gemini API.
        // 4. setStagedData(result);
        // 5. setActiveTab('migration');
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 space-y-4">
            <h2 className="text-2xl font-semibold text-sky-300 mb-2">Project Scribe - AI Ingestion</h2>
            <div>
                <label htmlFor="collectionSelectorScribe" className="block text-sm font-medium text-gray-400 mb-2">1. Select Object Type to Ingest:</label>
                <select id="collectionSelectorScribe" className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500">
                    <option value="perks">perks</option>
                    <option value="weapon_mastery">weapon_mastery</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">2. Provide Image:</label>
                <div 
                    onPaste={handlePaste}
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-700/50 hover:border-sky-500 transition-colors"
                >
                    <p className="text-gray-400">Click here and press Ctrl+V</p>
                </div>
                <div className="text-center text-sm text-gray-500 my-2">OR</div>
                <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition">
                    Upload Image File
                </button>
            </div>
        </div>
    );
};

export default Scribe;
