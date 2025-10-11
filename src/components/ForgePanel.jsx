import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import JSONCleaner from './JSONCleaner.jsx';
import DeconstructorTestbed from './DeconstructorTestbed.jsx';
import ScribePanel from './ScribePanel.jsx';
// Removed broken import for callGeminiVisionApi

const ForgePanel = ({ 
    db, 
    addLog, 
    apiKey, 
    onApiKeyChange, 
    setStagedData, 
    setActiveTab, 
    activePromptContent, 
    prompts, 
    selectedPromptId, 
    onPromptSelect,
    onPromptContentChange,
    onSaveNewPrompt,
    onDeletePrompt
}) => {
    const [archiveData, setArchiveData] = useState('');
    const [archiveDocId, setArchiveDocId] = useState('');
    const [cleanJsonForDeconstructor, setCleanJsonForDeconstructor] = useState('');

    const handleStashData = async () => {
        if (!archiveData) {
            addLog('error', 'Archive data cannot be empty.');
            return;
        }
        try {
            const docRef = await addDoc(collection(db, 'raw_data_archive'), {
                data: archiveData,
                timestamp: new Date(),
            });
            setArchiveDocId(docRef.id);
            addLog('success', `Raw Data secured. Archive ID: ${docRef.id}`);
            setArchiveData('');
        } catch (error) {
            console.error("Error stashing document: ", error);
            addLog('error', `Error stashing Raw Data: ${error.message}`);
        }
    };

    const handleScribeImageData = async (blob, onComplete) => {
        if (!apiKey) {
            addLog('error', 'Scribe Failure: API Key is not set.');
            onComplete();
            return;
        }
        if (!activePromptContent) {
            addLog('error', 'Scribe Failure: No prompt is selected.');
            onComplete();
            return;
        }

        addLog('special', 'Project Scribe engaged. Analyzing image...');

        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64ImageData = event.target.result.split(',')[1];
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{
                    parts: [
                        { text: activePromptContent },
                        { inline_data: { mime_type: blob.type, data: base64ImageData } }
                    ]
                }],
            };

            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
                }

                const result = await response.json();
                const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

                if (jsonText) {
                    const cleanedJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
                    setCleanJsonForDeconstructor(cleanedJson);
                    addLog('success', 'Scribe analysis complete. Extracted JSON sent to Cleaner.');
                } else {
                    throw new Error('No valid JSON content returned from API.');
                }
            } catch (error) {
                addLog('error', `Project Scribe AI Error: ${error.message}`);
            } finally {
                onComplete();
            }
        };
        reader.onerror = () => {
            addLog('error', 'Failed to read image file.');
            onComplete();
        };
        reader.readAsDataURL(blob);
    };

    return (
        <div className="flex flex-col space-y-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="text-2xl font-semibold text-gray-300 mb-2">Raw Data Archive</h3>
                        <p className="text-sm text-gray-400">Secure the master tape. Paste raw, unaltered data here to archive it before cleaning. This ensures we never lose the original source data.</p>
                    </div>
                    <div className="md:col-span-2 flex flex-col">
                        <textarea
                            className="w-full flex-grow bg-gray-900 text-gray-300 p-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                            value={archiveData}
                            onChange={(e) => setArchiveData(e.target.value)}
                            placeholder="Paste raw data here..."
                            rows="5"
                        ></textarea>
                        <button
                            onClick={handleStashData}
                            className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                            Stash Raw Data
                        </button>
                         {archiveDocId && (
                            <p className="text-xs text-green-400 mt-2 bg-gray-900 p-2 rounded text-center">
                                Stashed as: <span className="font-mono bg-gray-700 px-1 py-0.5 rounded">{archiveDocId}</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <ScribePanel 
                onImageData={setCleanJsonForDeconstructor}
                prompts={prompts}
                onPromptSelect={onPromptSelect}
                selectedPromptId={selectedPromptId}
                addLog={addLog}
            />

            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                <JSONCleaner 
                    addLog={addLog} 
                    onDataCleaned={setCleanJsonForDeconstructor}
                    initialData={cleanJsonForDeconstructor}
                />
            </div>

            <DeconstructorTestbed
                addLog={addLog}
                apiKey={apiKey}
                onApiKeyChange={onApiKeyChange}
                cleanJson={cleanJsonForDeconstructor}
                setStagedData={setStagedData}
                setActiveTab={setActiveTab}
                activePromptContent={activePromptContent}
                prompts={prompts}
                selectedPromptId={selectedPromptId}
                onPromptSelect={onPromptSelect}
                onPromptContentChange={onPromptContentChange}
                onSaveNewPrompt={onSaveNewPrompt}
                onDeletePrompt={onDeletePrompt}
            />
        </div>
    );
};

export default ForgePanel;