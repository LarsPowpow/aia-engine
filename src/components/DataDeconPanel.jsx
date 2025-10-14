import React, { useState } from 'react';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';

const DataDeconPanel = ({ db, addLog }) => {
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  const handleDryRun = async () => {
    setIsScanning(true);
    setScanResults(null);
    addLog({
      message: 'Decontamination Dry Run initiated...',
      type: 'info',
      timestamp: new Date(),
    });

    try {
      const results = {
        misplacedEffects: [], // Effects found in the sources collection
        misplacedSources: [], // Sources found in the effects collection
      };

      // 1. Find misplaced Effects (documents in sources that HAVE a 'category' field)
      const sourcesRef = collection(db, 'ukb_sources_v2');
      const misplacedEffectsQuery = query(sourcesRef, where('category', '>=', ''));
      const misplacedEffectsSnapshot = await getDocs(misplacedEffectsQuery);
      misplacedEffectsSnapshot.forEach((doc) => {
        results.misplacedEffects.push({ id: doc.id, ...doc.data() });
      });

      // 2. Find misplaced Sources (documents in effects that DO NOT HAVE a 'category' field)
      const effectsRef = collection(db, 'ukb_effects_v2');
      const allEffectsSnapshot = await getDocs(effectsRef);
      allEffectsSnapshot.forEach((doc) => {
        if (!doc.data().hasOwnProperty('category')) {
          results.misplacedSources.push({ id: doc.id, ...doc.data() });
        }
      });
      
      setScanResults(results);
      addLog({
        message: `Dry Run complete. Found ${results.misplacedEffects.length} misplaced Effects and ${results.misplacedSources.length} misplaced Sources.`,
        type: 'success',
        timestamp: new Date(),
      });

    } catch (error) {
      console.error('Decontamination Dry Run failed:', error);
      addLog({
        message: `Decontamination Dry Run failed: ${error.message}`,
        type: 'error',
        timestamp: new Date(),
      });
    }

    setIsScanning(false);
  };

  const handleExecuteFix = async () => {
    if (!scanResults || !hasContamination) {
        addLog({ message: 'No contamination to fix.', type: 'warning', timestamp: new Date() });
        return;
    }
    
    setIsFixing(true);
    addLog({ message: 'Executing decontamination...', type: 'info', timestamp: new Date() });

    try {
        const batch = writeBatch(db);

        // Process misplaced Effects
        scanResults.misplacedEffects.forEach(effectDoc => {
            const { id, ...data } = effectDoc;
            const oldRef = doc(db, 'ukb_sources_v2', id);
            const newRef = doc(db, 'ukb_effects_v2', id);
            batch.set(newRef, data);
            batch.delete(oldRef);
            addLog({ message: `[MOVE] Effect '${id}' -> ukb_effects_v2`, type: 'system', timestamp: new Date() });
        });

        // Process misplaced Sources
        scanResults.misplacedSources.forEach(sourceDoc => {
            const { id, ...data } = sourceDoc;
            const oldRef = doc(db, 'ukb_effects_v2', id);
            const newRef = doc(db, 'ukb_sources_v2', id);
            batch.set(newRef, data);
            batch.delete(oldRef);
            addLog({ message: `[MOVE] Source '${id}' -> ukb_sources_v2`, type: 'system', timestamp: new Date() });
        });

        await batch.commit();

        addLog({ message: 'Decontamination complete. Database integrity restored.', type: 'success', timestamp: new Date() });
        setScanResults(null); // Clear results after fix
    } catch (error) {
        console.error('Decontamination execution failed:', error);
        addLog({ message: `Decontamination execution failed: ${error.message}`, type: 'error', timestamp: new Date() });
    }

    setIsFixing(false);
  };

  const hasContamination = scanResults && (scanResults.misplacedEffects.length > 0 || scanResults.misplacedSources.length > 0);

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-2">
        Operation: Decontamination
      </h3>
      <p className="text-sm text-gray-400 mb-4">
        Scan the UKB for cross-contaminated Source and Effect documents and move them to their correct collections.
      </p>

      <div className="flex space-x-4">
        <button
          onClick={handleDryRun}
          disabled={isScanning || isFixing}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isScanning ? 'Scanning...' : 'Run Dry Scan'}
        </button>
        {hasContamination && (
            <button
                onClick={handleExecuteFix}
                disabled={isFixing || isScanning}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                {isFixing ? 'Executing...' : 'Execute Decontamination'}
            </button>
        )}
      </div>

      {scanResults && (
        <div className="mt-4 p-4 bg-gray-900 rounded-md border border-gray-600">
          <h4 className="text-md font-semibold text-gray-300 mb-2">Scan Results:</h4>
          {!hasContamination ? (
            <p className="text-green-400">No contamination detected. All documents are in their correct collections.</p>
          ) : (
            <div className="space-y-4">
              {scanResults.misplacedEffects.length > 0 && (
                <div>
                  <h5 className="text-yellow-400 font-medium">
                    Misplaced Effects ({scanResults.misplacedEffects.length}) found in 'ukb_sources_v2':
                  </h5>
                  <ul className="list-disc list-inside text-gray-400 text-sm font-mono mt-1">
                    {scanResults.misplacedEffects.map(doc => <li key={doc.id}>{doc.id}</li>)}
                  </ul>
                </div>
              )}
              {scanResults.misplacedSources.length > 0 && (
                <div>
                  <h5 className="text-yellow-400 font-medium">
                    Misplaced Sources ({scanResults.misplacedSources.length}) found in 'ukb_effects_v2':
                  </h5>
                  <ul className="list-disc list-inside text-gray-400 text-sm font-mono mt-1">
                    {scanResults.misplacedSources.map(doc => <li key={doc.id}>{doc.id}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataDeconPanel;