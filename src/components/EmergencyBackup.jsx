import React, { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

const EmergencyBackup = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);

  const collections = [
    'abilities',
    'attribute_bonuses',
    'effects',
    'exception_overrides',
    'perks',
    'prompts',
    'raw_data_archive',
    'runeglass',
    'ukb_effects_v2',
    'ukb_schema_extensions',
    'ukb_sources_v2'
  ];

  const downloadJSON = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const backupAllCollections = async () => {
    setIsBackingUp(true);
    setStatus('Starting backup...');
    const timestamp = Date.now();
    const allData = {};
    
    try {
      for (let i = 0; i < collections.length; i++) {
        const collectionName = collections[i];
        setStatus(`Backing up ${collectionName}... (${i + 1}/${collections.length})`);
        setProgress(((i + 1) / collections.length) * 100);
        
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          const data = {};
          
          snapshot.forEach(doc => {
            data[doc.id] = doc.data();
          });
          
          allData[collectionName] = {
            count: snapshot.size,
            documents: data
          };
          
          console.log(`✅ Backed up ${collectionName}: ${snapshot.size} documents`);
        } catch (error) {
          console.error(`❌ Error backing up ${collectionName}:`, error);
          allData[collectionName] = {
            error: error.message
          };
        }
      }
      
      // Download the complete backup
      const filename = `firestore_backup_${timestamp}.json`;
      downloadJSON(allData, filename);
      
      // Also create a manifest
      const manifest = {
        timestamp: new Date().toISOString(),
        collections: collections.length,
        totalDocuments: Object.values(allData).reduce((sum, col) => sum + (col.count || 0), 0),
        collectionDetails: Object.keys(allData).map(name => ({
          name,
          count: allData[name].count || 0,
          error: allData[name].error || null
        }))
      };
      
      downloadJSON(manifest, `backup_manifest_${timestamp}.json`);
      
      setStatus(`✅ Backup complete! Downloaded ${manifest.totalDocuments} documents.`);
      
    } catch (error) {
      setStatus(`❌ Backup failed: ${error.message}`);
      console.error('Backup error:', error);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="p-6 bg-red-900/20 border-2 border-red-500 rounded-lg">
      <h2 className="text-2xl font-bold text-red-400 mb-4">🚨 Emergency Backup</h2>
      
      <div className="mb-4">
        <p className="text-slate-300 mb-2">
          This will download ALL your Firestore data as JSON files.
        </p>
        <p className="text-slate-400 text-sm">
          Collections to backup: {collections.length}
        </p>
      </div>
      
      {isBackingUp && (
        <div className="mb-4">
          <div className="bg-slate-700 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-slate-300 mt-2 text-sm">{status}</p>
        </div>
      )}
      
      {!isBackingUp && status && (
        <div className="mb-4 p-3 bg-slate-800 rounded">
          <p className="text-slate-300 text-sm">{status}</p>
        </div>
      )}
      
      <button
        onClick={backupAllCollections}
        disabled={isBackingUp}
        className={`
          px-6 py-3 rounded font-bold text-white
          ${isBackingUp 
            ? 'bg-gray-500 cursor-not-allowed' 
            : 'bg-red-600 hover:bg-red-700'
          }
        `}
      >
        {isBackingUp ? 'Backing up...' : 'Download Full Backup'}
      </button>
      
      <p className="text-slate-400 text-xs mt-3">
        Files will download to your Downloads folder
      </p>
    </div>
  );
};

export default EmergencyBackup;
