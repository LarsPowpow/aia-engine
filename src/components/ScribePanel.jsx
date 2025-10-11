// FILE: src/components/ScribePanel.jsx
import React, { useState, useRef, useEffect } from 'react';

const ScribePanel = ({ onImageData, prompts, onPromptSelect, selectedPromptId, addLog }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPasteActive, setIsPasteActive] = useState(false);
    const fileInputRef = useRef(null);

    const handlePaste = (e) => {
        const items = (e.clipboardData || e.originalEvent.clipboardData).items;
        let blob = null;
        for (const item of items) {
            if (item.type.indexOf('image') === 0) {
                blob = item.getAsFile();
                break;
            }
        }
        if (blob) {
            addLog('info', 'Image data pasted into Project Scribe.');
            processImage(blob);
        } else {
            addLog('warning', 'Paste did not contain image data.');
        }
        setIsPasteActive(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            addLog('info', `Image file "${file.name}" uploaded to Project Scribe.`);
            processImage(file);
        }
    };

    const processImage = (blob) => {
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const base64ImageData = event.target.result.split(',')[1];
            // Compose the prompt from the selected prompt
            const selectedPrompt = scribePrompts.find(p => p.id === selectedPromptId);
            const promptText = selectedPrompt ? selectedPrompt.content : '';
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
            const payload = {
                contents: [
                    {
                        parts: [
                            { text: promptText },
                            { inline_data: { mime_type: blob.type, data: base64ImageData } }
                        ]
                    }
                ]
            };
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-goog-api-key': apiKey
                    },
                    body: JSON.stringify(payload)
                });
                if (!response.ok) {
                    const errorBody = await response.text();
                    addLog('error', `API Error: ${response.status} ${response.statusText} - ${errorBody}`);
                } else {
                    const result = await response.json();
                    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (jsonText) {
                        const cleanedJson = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
                        if (typeof onImageData === 'function') {
                            onImageData(cleanedJson);
                        }
                        addLog('success', 'Scribe analysis complete.');
                    } else {
                        addLog('error', 'No valid JSON content returned from API.');
                    }
                }
            } catch (error) {
                addLog('error', `Project Scribe AI Error: ${error.message}`);
            } finally {
                setIsProcessing(false);
            }
        };
        reader.onerror = () => {
            addLog('error', 'Failed to read image file.');
            setIsProcessing(false);
        };
        reader.readAsDataURL(blob);
    };
    
    useEffect(() => {
        if (isPasteActive) {
            document.addEventListener('paste', handlePaste);
        } else {
            document.removeEventListener('paste', handlePaste);
        }
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [isPasteActive]);


    // Show all prompts, no filter
    const scribePrompts = Array.isArray(prompts) ? prompts : [];

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-sky-300">Project Scribe - AI OCR</h2>
                        <div className="mt-4">
                            <label htmlFor="collectionSelectorScribe" className="block text-sm font-medium text-gray-400 mb-2">1. Select Scribe Prompt:</label>
                            <select 
                                id="collectionSelectorScribe" 
                                className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                                value={selectedPromptId}
                                onChange={(e) => onPromptSelect(e.target.value)}
                                disabled={isProcessing}
                            >
                                <option value="">-- Select a Prompt --</option>
                                {scribePrompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mt-4 mb-2">2. Provide Image:</label>
                        <p className="text-xs text-gray-500 mb-2">Use the paste zone on the right or the upload button below.</p>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" />
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            disabled={isProcessing}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
                        >
                            Upload Image File
                        </button>
                    </div>
                </div>
                <div className="md:col-span-2 flex flex-col">
                    <div 
                        id="scribe-paste-zone" 
                        onClick={() => !isProcessing && setIsPasteActive(true)}
                        onBlur={() => setIsPasteActive(false)}
                        tabIndex={0}
                        className={`min-h-[150px] flex-grow p-4 text-center rounded-lg cursor-pointer transition-all duration-300 border-2 dashed flex items-center justify-center
                            ${isProcessing ? 'border-amber-500 bg-gray-900/50 cursor-wait' : 
                            isPasteActive ? 'border-emerald-500 bg-gray-700/50' : 
                            'border-gray-600 hover:border-sky-500 hover:bg-gray-700/30'}`}
                    >
                        <p className="text-gray-400">
                            {isProcessing ? 'Analyzing Image...' : isPasteActive ? 'Ready for Paste (Ctrl+V)...' : 'Click Here to Activate Paste Zone'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScribePanel;