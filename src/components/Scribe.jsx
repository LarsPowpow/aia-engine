
import React, { useState, useRef } from 'react';

// This component represents the "Project Scribe" functionality for OCR ingestion.
const Scribe = ({ onScribeComplete, addLog, apiKey }) => {
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    // Gemini Vision API call - CORRECTED
    const callScribeAPI = async (base64ImageData) => {
        if (!apiKey) {
            addLog('error', 'Scribe Error: Gemini API key is missing.');
            return null;
        }
        addLog('info', 'Calling Scribe AI (gemini-pro-vision)...');
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;
        
        const payload = {
            contents: [{
                parts: [
                    { text: "You are an expert data entry assistant for the game New World. Your task is to analyze an image of a tooltip or list of tooltips and extract the name and description for each item into a structured JSON object. Return a single JSON array containing all the extracted objects. If there is only one object, still return it inside an array." },
                    {
                        inlineData: {
                            mimeType: 'image/png',
                            data: base64ImageData
                        }
                    }
                ]
            }],
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorBody}`);
            }
            const result = await response.json();
            
            // Log the raw output for diagnostics, as per your upgrade
            console.log('OCR raw output:', result); 

            if (result.candidates && result.candidates[0].content.parts[0].text) {
                const rawText = result.candidates[0].content.parts[0].text;
                addLog('success', 'Scribe AI call successful. Raw text received.');
                return rawText; // Return ONLY the raw text string
            } else {
                if (result.candidates && result.candidates[0].finishReason === 'SAFETY') {
                    throw new Error("Content blocked by API safety filters.");
                }
                console.error("Unexpected Scribe API response:", result);
                throw new Error("Scribe AI did not return valid text content.");
            }
        } catch (error) {
            addLog('error', `Scribe API call failed: ${error.message}`);
            console.error("Scribe API Error:", error);
            return null;
        }
    };

    // Convert image blob to base64 and process
    const processImage = async (imageBlob) => {
        setIsLoading(true);
        addLog('info', 'Processing image for Scribe...');
        try {
            const reader = new FileReader();
            reader.readAsDataURL(imageBlob);
            reader.onloadend = async () => {
                let base64 = reader.result;
                base64 = base64.split(',')[1];
                const rawJsonText = await callScribeAPI(base64);
                if (rawJsonText) {
                    onScribeComplete(rawJsonText); // Pass the raw JSON string to the next stage
                }
                setIsLoading(false);
            };
            reader.onerror = () => {
                addLog('error', 'Failed to read image file.');
                setIsLoading(false);
            };
        } catch (error) {
            addLog('error', `Image processing error: ${error.message}`);
            setIsLoading(false);
        }
    };

    // Handle paste event
    const handlePaste = (e) => {
        if (isLoading) return;
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                processImage(blob);
                return;
            }
        }
        addLog('warning', 'No image found in clipboard.');
    };

    // Handle file upload
    const handleFileUpload = (e) => {
        if (isLoading) return;
        const file = e.target.files[0];
        if (file) {
            processImage(file);
        }
    };

    // Trigger file input click
    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset file input
            fileInputRef.current.click();
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 space-y-4">
            <h2 className="text-2xl font-semibold text-sky-300 mb-2">1. Project Scribe - AI OCR</h2>
            <div>
                <label htmlFor="collectionSelectorScribe" className="block text-sm font-medium text-gray-400 mb-2">Target Object Type:</label>
                <select id="collectionSelectorScribe" className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500" disabled={isLoading}>
                    <option value="perks">Perks</option>
                    <option value="weapon_mastery">Weapon Mastery</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Provide Image:</label>
                <div 
                    onPaste={handlePaste}
                    className={`border-2 border-dashed border-gray-600 rounded-lg p-8 text-center transition-colors ${isLoading ? 'opacity-50 cursor-wait bg-gray-700' : 'cursor-pointer hover:bg-gray-700/50 hover:border-sky-500'}`}
                >
                    <p className="text-gray-400">{isLoading ? 'Processing...' : 'Click here and press Ctrl+V'}</p>
                </div>
                <div className="text-center text-sm text-gray-500 my-2">OR</div>
                <button 
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed" 
                    onClick={triggerFileInput} 
                    disabled={isLoading}
                >
                    {isLoading ? 'Processing...' : 'Upload Image File'}
                </button>
                <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileUpload}
                />
            </div>
        </div>
    );
};

export default Scribe;