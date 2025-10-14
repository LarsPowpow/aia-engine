import React, { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db as firestore } from '../services/firebase';

const OCRScannerPanel = ({ addLog, setEquippedMasteries, equippedMasteries }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    const [masteryManifest, setMasteryManifest] = useState([]);
    const [parserPrompt, setParserPrompt] = useState('');
    const [triageList, setTriageList] = useState([]);

    const pasteZoneRef = useRef(null);

    // Fetch Manifest and Prompt on component load
    useEffect(() => {
        const fetchPrerequisites = async () => {
            try {
                const q = query(collection(firestore, 'ukb_sources_v2'), where("type", "==", "WEAPON_MASTERY"));
                const snapshot = await getDocs(q);
                const manifest = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMasteryManifest(manifest);
            } catch (error) {
                addLog({ type: 'error', message: `Failed to fetch Mastery Manifest: ${error.message}`});
            }
            try {
                const q = query(collection(firestore, 'prompts'), where("name", "==", "OCR Mastery Parser"));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    setParserPrompt(snapshot.docs[0].data().content);
                } else {
                     addLog({ type: 'error', message: "Critical: 'OCR Mastery Parser' prompt not found."});
                }
            } catch (error) {
                addLog({ type: 'error', message: `Failed to fetch OCR prompt: ${error.message}`});
            }
        };
        fetchPrerequisites();
    }, [addLog]);


    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            if (previewUrl) URL.revokeObjectURL(previewUrl); // Clean up previous blob URL
            setPreviewUrl(URL.createObjectURL(file));
            setTriageList([]);
        } else {
            addLog({ type: 'warning', message: 'Pasted item was not a valid image file.' });
        }
    };

    const handleFileChange = (event) => processFile(event.target.files[0]);

    const handlePaste = useCallback((event) => {
        event.preventDefault();
        const items = event.clipboardData.items;
        for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
                const blob = item.getAsFile();
                processFile(blob);
                addLog({ type: 'info', message: 'Image pasted from clipboard.' });
                return;
            }
        }
    }, [addLog]);

    useEffect(() => {
        const pasteZone = pasteZoneRef.current;
        if (pasteZone) pasteZone.addEventListener('paste', handlePaste);
        return () => { if (pasteZone) pasteZone.removeEventListener('paste', handlePaste); };
    }, [handlePaste]);

    const handleScanAndAnalyze = async () => {
        if (!selectedFile) return addLog({ type: 'error', message: 'No file selected for scanning.' });
        if (!parserPrompt) return addLog({ type: 'error', message: 'Mastery Parser Prompt not loaded. Cannot analyze.' });
        if (masteryManifest.length === 0) return addLog({ type: 'error', message: 'Mastery Manifest not loaded. Cannot analyze.' });

        setIsScanning(true);
        setTriageList([]);
        addLog({ type: 'info', message: `Uploading '${selectedFile.name || 'pasted_image.png'}' for OCR analysis...` });
        const formData = new FormData();
        formData.append('gear_screenshot', selectedFile, selectedFile.name || 'pasted_image.png');
        try {
            const scanResponse = await fetch('https://zany-barnacle-wrq99qjjvr4xcgg5v-3001.app.github.dev/scan-gear', { method: 'POST', body: formData });
            const scanResult = await scanResponse.json();
            if (!scanResponse.ok) throw new Error(scanResult.error || 'Failed to scan image.');
            addLog({ type: 'success', message: 'OCR Scan successful. Sending to AI Analyst...' });
            
            setIsScanning(false);
            setIsAnalyzing(true);
            const analysisPayload = {
                prompt: parserPrompt,
                jsonInput: JSON.stringify({ RAW_OCR_TEXT: scanResult.ocr_text, MASTERY_MANIFEST: masteryManifest }, null, 2)
            };
            const analysisResponse = await fetch('https://zany-barnacle-wrq99qjjvr4xcgg5v-3001.app.github.dev/deconstruct', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(analysisPayload) });
            const analysisResult = await analysisResponse.json();
            if (!analysisResponse.ok) throw new Error(analysisResult.error || 'AI analysis failed.');
            
            addLog({ type: 'success', message: 'AI analysis complete. Found masteries are ready for triage.' });
            
            const foundMasteries = JSON.parse(analysisResult.result);
            setTriageList(foundMasteries.map(m => ({ ...m, isSelected: false })));

        } catch (error) {
            console.error('Scan/Analysis failed:', error);
            addLog({ type: 'error', message: `Operation Failed: ${error.message}` });
        } finally {
            setIsScanning(false);
            setIsAnalyzing(false);
        }
    };

    const handleTriageToggle = (masteryId) => {
        setTriageList(prev => prev.map(m => m.id === masteryId ? { ...m, isSelected: !m.isSelected } : m));
    };

    const handleAddSelectedToBuild = () => {
        const selectedMasteries = triageList.filter(m => m.isSelected);
        const currentMasteryIds = new Set(equippedMasteries.map(m => m.id));
        const newMasteries = selectedMasteries.filter(m => !currentMasteryIds.has(m.id));

        if (newMasteries.length > 0) {
            setEquippedMasteries(prev => [...prev, ...newMasteries]);
            addLog({ type: 'success', message: `Added ${newMasteries.length} masteries to the build.`});
        } else {
            addLog({ type: 'info', message: 'No new masteries were selected to be added.'});
        }
        setTriageList([]);
        setSelectedFile(null);
        if(previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
    };

    return (
        <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
            <h2 className="text-lg font-bold text-orange-400 border-b border-slate-600 pb-2 flex items-center gap-2">OCR Scanner</h2>
            <div ref={pasteZoneRef} className="grid grid-cols-2 gap-4 items-center bg-slate-900/30 p-4 rounded-lg border-2 border-dashed border-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" tabIndex="0">
                <div className="flex flex-col space-y-2">
                    <p className="text-center text-slate-400 text-sm font-semibold">Click here and paste image</p>
                    <p className="text-center text-slate-500 text-xs">or</p>
                     <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600 cursor-pointer" />
                </div>
                <div className="w-full h-24 bg-black/20 rounded border border-slate-700 flex items-center justify-center">
                    {previewUrl ? (<img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />) : (<p className="text-slate-500 text-xs">Image Preview</p>)}
                </div>
            </div>
             <button onClick={handleScanAndAnalyze} disabled={!selectedFile || isScanning || isAnalyzing} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed">
                {isScanning ? 'Scanning...' : isAnalyzing ? 'Analyzing...' : 'Scan & Analyze Masteries'}
            </button>
            
            {triageList.length > 0 && (
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">AI Analyst Results: Select equipped masteries</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                        {triageList.map(mastery => (
                            <label key={mastery.id} className="flex items-center space-x-3 p-2 bg-slate-800/50 rounded-md hover:bg-slate-700/50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={mastery.isSelected}
                                    onChange={() => handleTriageToggle(mastery.id)}
                                    className="form-checkbox h-4 w-4 bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                                />
                                <span className="text-slate-300 text-sm">{mastery.name}</span>
                            </label>
                        ))}
                    </div>
                    <button onClick={handleAddSelectedToBuild} className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200">
                        Add Selected to Build
                    </button>
                </div>
            )}
        </div>
    );
};

export default OCRScannerPanel;