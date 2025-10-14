import React, { useState } from 'react';

const OCRScannerPanel = ({ addLog }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [ocrResult, setOcrResult] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setOcrResult(''); // Clear previous results
        }
    };

    const handleScan = async () => {
        if (!selectedFile) {
            addLog({ type: 'error', message: 'No file selected for scanning.' });
            return;
        }

        setIsScanning(true);
        setOcrResult('');
        addLog({ type: 'info', message: `Uploading '${selectedFile.name}' for OCR analysis...` });

        const formData = new FormData();
        formData.append('gear_screenshot', selectedFile);

        try {
            // IMPORTANT: Ensure this URL matches your backend server's address
            const response = await fetch('https://zany-barnacle-wrq99qjjvr4xcgg5v-3001.app.github.dev/scan-gear', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to scan image.');
            }

            addLog({ type: 'success', message: 'Scan successful. Awaiting OCR processing implementation.' });
            setOcrResult(result.ocr_text);

        } catch (error) {
            console.error('OCR Scan failed:', error);
            addLog({ type: 'error', message: `OCR Scan failed: ${error.message}` });
            setOcrResult(`Error: ${error.message}`);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
            <h2 className="text-lg font-bold text-orange-400 border-b border-slate-600 pb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8h8V6zM8 8a1 1 0 100 2h4a1 1 0 100-2H8z" clipRule="evenodd" /></svg>
                OCR Scanner
            </h2>

            <div className="grid grid-cols-2 gap-4 items-center">
                <div className="flex flex-col space-y-2">
                    <input 
                        type="file" 
                        accept="image/png, image/jpeg"
                        onChange={handleFileChange}
                        className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-300 hover:file:bg-slate-600"
                    />
                    <button 
                        onClick={handleScan}
                        disabled={!selectedFile || isScanning}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isScanning ? 'Scanning...' : 'Scan Gear Screenshot'}
                    </button>
                </div>
                <div className="w-full h-24 bg-black/20 rounded border-2 border-dashed border-slate-600 flex items-center justify-center">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                    ) : (
                        <p className="text-slate-500 text-xs">Image Preview</p>
                    )}
                </div>
            </div>

            {ocrResult && (
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <h3 className="text-sm font-medium text-slate-400 mb-2">Scan Results:</h3>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">{ocrResult}</pre>
                </div>
            )}
        </div>
    );
};

export default OCRScannerPanel;