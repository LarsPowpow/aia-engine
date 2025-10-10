import { useState, useEffect, useCallback } from 'react';

// This is the full system prompt for the deconstructor AI.
// It's kept here to be co-located with the component that uses it.
const DECONSTRUCTOR_SYSTEM_PROMPT = `You are a precision data deconstruction engine for the game New World. Your mission is to analyze an array of raw item data (name, description, etc.) and deconstruct each item into two structured JSON objects: an 'Ability' object and an array of one or more 'Effect' objects.

CRITICAL DIRECTIVES:
1.  **Strict Schema Adherence:** You MUST conform perfectly to the provided JSON schemas for 'abilities' and 'effects'. Do not invent new fields.
2.  **No Improvisation:** Do not summarize, interpret, or add any information not explicitly present in the source description. Your role is translation, not creation.
3.  **Preserve Original Description:** The 'description' field in both the 'ability_to_create' and 'effects_to_create' objects MUST contain the original, full description text from the input.
4.  **Extract Cooldowns:** If the description mentions a cooldown, you MUST extract the numeric value and place it in the 'internal_cooldown_seconds' field of the 'ability_to_create' object.
5.  **Pure JSON Output:** Your response MUST be a single, valid JSON array. Each element in the array will correspond to an input item and MUST contain two keys: 'ability_to_create' and 'effects_to_create'. Do not include any other text, markdown, or explanations.
6.  **Effect ID Generation:** Generate a descriptive, snake_case 'effect_id' for each effect (e.g., 'Bleed_10_Pct_Weapon_Damage_6s').
7.  **Ability ID Generation:** Generate an 'ability_id' using the format 'Perk_ItemName' (e.g., 'Perk_KeenlyJagged').

EXAMPLE INPUT:
[
  { "name": "Refreshing Move", "description": "Light and Heavy attacks reduce your active weapon cooldowns by 2.5% (0.2s cooldown).", "perk_bucket": "Weapon.Melee.RefreshingMove" }
]

EXAMPLE OUTPUT:
[
  {
    "ability_to_create": {
      "ability_id": "Perk_RefreshingMove",
      "name": "Refreshing Move",
      "type": "PERK",
      "trigger": "ON_HIT",
      "effects_to_apply": ["Reduce_Weapon_Cooldowns_2_5_Pct"],
      "internal_cooldown_seconds": 0.2,
      "description": "Light and Heavy attacks reduce your active weapon cooldowns by 2.5% (0.2s cooldown)."
    },
    "effects_to_create": [
      {
        "effect_id": "Reduce_Weapon_Cooldowns_2_5_Pct",
        "name": "Cooldown Reduction",
        "type": "HASTE",
        "application_trigger": "ON_HIT",
        "target": "SELF",
        "value_type": "PERCENTAGE",
        "value": 0.025,
        "description": "Light and Heavy attacks reduce your active weapon cooldowns by 2.5% (0.2s cooldown)."
      }
    ]
  }
]`;


function ForgePanel({ setStagedData, addLog, setActiveTab }) {
    const [selectedObjectType, setSelectedObjectType] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const callGeminiAPI = useCallback(async (userPrompt, systemPrompt, base64ImageData = null) => {
        const apiKey = sessionStorage.getItem('geminiApiKey');
        if (!apiKey) {
            throw new Error('Gemini API Key is not set. Please set it in the Admin Panel.');
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const parts = [{ text: userPrompt }];
        if (base64ImageData) {
            parts.push({ inlineData: { mimeType: "image/png", data: base64ImageData } });
        }

        const payload = {
            contents: [{ parts }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
        };

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

        if (result.candidates && result.candidates[0].content.parts[0].text) {
            const jsonText = result.candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '');
            return JSON.parse(jsonText);
        } else {
            if (result.candidates && result.candidates[0].finishReason === 'SAFETY') {
                throw new Error("Content blocked by API safety filters.");
            }
            console.error("Unexpected API response:", result);
            throw new Error("No valid content returned from API.");
        }
    }, []);

    const processImage = useCallback(async (blob) => {
        if (!blob) return;
        if (!selectedObjectType) {
            addLog('error', 'Scribe Failure: Please select an object type first.');
            return;
        }
        setIsProcessing(true);
        addLog('special', 'Project Scribe activated. Analyzing image...');

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64ImageData = reader.result.split(',')[1];
            try {
                // --- STAGE 1: OCR ---
                const ocrPrompt = `For each item in the image, extract its 'name', 'description', and 'perk_bucket' if it is visible. The perk_bucket is usually small text below the description. Return a single JSON array containing all the extracted objects.`;
                const ocrSystemPrompt = `You are an expert data entry assistant for the game New World. Your task is to analyze an image of a tooltip or list of tooltips and extract the requested data into a structured JSON object.`;
                const rawItems = await callGeminiAPI(ocrPrompt, ocrSystemPrompt, base64ImageData);
                addLog('success', `Scribe OCR complete. Found ${rawItems.length} item(s). Now deconstructing...`);

                // --- STAGE 2: DECONSTRUCTION ---
                const deconstructorPrompt = JSON.stringify(rawItems);
                const deconstructedItems = await callGeminiAPI(deconstructorPrompt, DECONSTRUCTOR_SYSTEM_PROMPT);
                addLog('success', `Deconstruction complete. Staging ${deconstructedItems.length} item(s) for review.`);

                setStagedData(deconstructedItems);
                setActiveTab('migration');

            } catch (e) {
                addLog('error', `Data Refinery Error: ${e.message}`);
            } finally {
                setIsProcessing(false);
            }
        };
    }, [selectedObjectType, addLog, setStagedData, setActiveTab, callGeminiAPI]);

    const handlePaste = useCallback((e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                processImage(blob);
                break;
            }
        }
    }, [processImage]);

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, [handlePaste]);


    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
                <h2 className="text-2xl font-semibold text-amber-300 mb-4">The Forge - Manual Entry</h2>
                <p className="text-gray-500">Manual entry form will be rebuilt here.</p>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 space-y-4">
                <h2 className="text-2xl font-semibold text-sky-300 mb-2">Project Scribe - AI Ingestion</h2>
                <div>
                    <label htmlFor="collectionSelectorScribe" className="block text-sm font-medium text-gray-400 mb-2">1. Select Object Type to Ingest:</label>
                    <select
                        id="collectionSelectorScribe"
                        className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                        value={selectedObjectType}
                        onChange={(e) => setSelectedObjectType(e.target.value)}
                        disabled={isProcessing}
                    >
                        <option value="">-- Select Object Type --</option>
                        <option value="perks">perk</option>
                        <option value="weapon_mastery">weapon_mastery</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">2. Provide Image:</label>
                    <div className={`border-2 border-dashed p-8 text-center rounded-lg transition-colors duration-300 ${isProcessing ? 'cursor-wait bg-gray-700/50 border-amber-500' : 'cursor-pointer hover:bg-gray-700/50 hover:border-sky-400 border-gray-600'}`}>
                        <p className="text-gray-400">{isProcessing ? 'Processing... (this may take a moment)' : 'Click in this window and press Ctrl+V'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgePanel;
