import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, collection, getDocs, writeBatch } from "firebase/firestore";

// Constants for collections
const COLLECTIONS = [
  'perks', 'weapon_mastery', 'game_constants', 'status_effects',
  'attribute_bonuses', 'builds', 'effects', 'abilities', 'raw_data_archive'
];
const LEGACY_COLLECTIONS = ['perks', 'weapon_mastery', 'game_constants', 'status_effects', 'attribute_bonuses'];


const AdminPanel = ({ db, addLog }) => {
  // State for various panel features
  const [apiKey, setApiKey] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState('');
  const [archiveDocId, setArchiveDocId] = useState('');
  const [archiveData, setArchiveData] = useState('');
  const [archiveOutput, setArchiveOutput] = useState('');
  const [isArchiveVisible, setIsArchiveVisible] = useState(false);
  const [purgeState, setPurgeState] = useState(0); // 0: initial, 1: confirm, 2: countdown, 3: executing, 4: complete
  const [purgeCountdown, setPurgeCountdown] = useState(3);
  const countdownIntervalRef = useRef(null);

  // Effect to check for an existing API key on component mount
  useEffect(() => {
    const storedKey = sessionStorage.getItem('geminiApiKey');
    if (storedKey) {
      setApiKey(storedKey);
      setApiKeyStatus('API Key is set for this session.');
    } else {
      setApiKeyStatus('API Key is not set. AI features will fail.');
    }
  }, []);

  // Effect for the purge countdown timer
  useEffect(() => {
    if (purgeState === 2) {
      countdownIntervalRef.current = setInterval(() => {
        setPurgeCountdown(prev => {
          if (prev > 1) {
            return prev - 1;
          } else {
            clearInterval(countdownIntervalRef.current);
            return 0; // Allows the button to enable
          }
        });
      }, 1000);
    }
    // Cleanup interval on component unmount or state change
    return () => clearInterval(countdownIntervalRef.current);
  }, [purgeState]);


  // --- HANDLER FUNCTIONS ---

  const handleSaveApiKey = () => {
    const keyToSave = apiKey.trim();
    if (keyToSave) {
      sessionStorage.setItem('geminiApiKey', keyToSave);
      setApiKeyStatus('API Key saved for this session.');
      addLog('success', 'Gemini API key has been set for the session.');
    } else {
      sessionStorage.removeItem('geminiApiKey');
      setApiKeyStatus('API Key removed.');
      addLog('info', 'Gemini API key has been removed for the session.');
    }
  };

  const handleStashData = async () => {
    const docId = archiveDocId.trim();
    const data = archiveData.trim();
    if (!db || !docId || !data) {
      addLog('error', 'Stash Error: DB connection, Archive ID, and Data Payload are required.');
      return;
    }
    addLog('special', `Stashing raw data under ID '${docId}'...`);
    try {
      await setDoc(doc(db, 'raw_data_archive', docId), { raw_data: data, stashed_at: new Date().toISOString() });
      addLog('success', `Successfully stashed '${docId}'.`);
      setArchiveDocId('');
      setArchiveData('');
    } catch (e) {
      addLog('error', `Error stashing raw data: ${e.message}`);
    }
  };

  const handleGenerateArchive = async () => {
    if (!db) {
      addLog('error', 'Archive Failed: Database not connected.');
      return;
    }
    addLog('special', 'Generating full Genesis Archive...');
    setIsArchiveVisible(true);
    setArchiveOutput("Compiling data... please wait.");
    try {
      const archive = {
        metadata: { version: "AIA-React-v2.0", exportDate: new Date().toISOString() },
        ukb: {}
      };
      for (const col of COLLECTIONS) {
        archive.ukb[col] = [];
        const querySnapshot = await getDocs(collection(db, col));
        querySnapshot.forEach((doc) => archive.ukb[col].push({ doc_id: doc.id, ...doc.data() }));
      }
      setArchiveOutput(JSON.stringify(archive, null, 2));
      addLog('success', 'Genesis Archive generation successful.');
    } catch(e) {
      addLog('error', `Error generating archive: ${e.message}`);
      setArchiveOutput(`Error: ${e.message}`);
    }
  };
  
  const handlePurgeCancel = () => {
    clearInterval(countdownIntervalRef.current);
    setPurgeState(0);
    setPurgeCountdown(3);
    addLog('info', 'Operation: Clean Slate was cancelled.');
  };

  const executePurge = async () => {
    setPurgeState(3); // Set to "executing"
    addLog('delete', "OPERATION CLEAN SLATE INITIATED. THIS CANNOT BE UNDONE.");
    for (const collectionName of LEGACY_COLLECTIONS) {
      try {
        addLog('delete', `Purging collection: ${collectionName}...`);
        const querySnapshot = await getDocs(collection(db, collectionName));
        if (querySnapshot.empty) {
          addLog('info', `Collection '${collectionName}' is already empty.`);
          continue;
        }
        const batch = writeBatch(db);
        querySnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        addLog('success', `Successfully purged ${querySnapshot.size} documents from '${collectionName}'.`);
      } catch (e) {
        addLog('error', `Error purging collection '${collectionName}': ${e.message}`);
      }
    }
    addLog('success', "OPERATION CLEAN SLATE COMPLETE.");
    setPurgeState(4); // Set to "complete"
  };


  // --- RENDER ---
  return (
    <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-red-500/50 space-y-8">
      {/* Gemini API Key */}
      <div>
        <h2 className="text-2xl font-semibold text-yellow-300 mb-4">Gemini API Key</h2>
        <p className="text-sm text-gray-400 mb-2">Enter your Gemini API key below. It will be stored securely for this session only.</p>
        <div className="flex items-center space-x-2">
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300" placeholder="Enter your Gemini API key..."/>
          <button onClick={handleSaveApiKey} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition whitespace-nowrap">Save Key</button>
        </div>
        <p className={`text-xs mt-2 ${apiKeyStatus.includes('not set') || apiKeyStatus.includes('removed') ? 'text-red-400' : 'text-emerald-400'}`}>{apiKeyStatus}</p>
      </div>

      {/* Operation: Precious Cargo */}
      <div>
        <h2 className="text-2xl font-semibold text-teal-300 mb-4">Operation: Precious Cargo</h2>
        <p className="text-sm text-gray-400 mb-2">Securely stash raw source data (e.g., full API responses) into the UKB.</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="archiveDocIdInput" className="block text-sm font-medium text-gray-400">Archive ID (e.g., nwdb_perks_page_1)</label>
            <input type="text" id="archiveDocIdInput" value={archiveDocId} onChange={(e) => setArchiveDocId(e.target.value)} className="mt-1 block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300" placeholder="Enter a unique ID for this data..."/>
          </div>
          <div>
            <label htmlFor="archiveDataInput" className="block text-sm font-medium text-gray-400">Raw Data Payload</label>
            <textarea id="archiveDataInput" rows="6" value={archiveData} onChange={(e) => setArchiveData(e.target.value)} className="mt-1 block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300" placeholder="Paste the raw JSON or text data here..."/>
          </div>
          <button onClick={handleStashData} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-5 rounded-lg text-lg transition">Stash Raw Data</button>
        </div>
      </div>

      {/* Operation: Secure the Covenant */}
      <div>
        <h2 className="text-2xl font-semibold text-yellow-300 mb-4">Operation Secure the Covenant</h2>
        <button onClick={handleGenerateArchive} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition">Generate Genesis Archive</button>
        {isArchiveVisible && (
          <div className="mt-4">
            <textarea readOnly value={archiveOutput} className="w-full h-[500px] bg-gray-900 rounded-md p-3 font-mono text-sm border border-gray-600 text-sky-300"/>
          </div>
        )}
      </div>

      {/* Operation: Clean Slate */}
      <div>
        <h2 className="text-2xl font-semibold text-red-400 mb-4">Operation: Clean Slate</h2>
        <p className="text-sm text-gray-400 mb-2">This is a destructive and irreversible action. It will delete all documents from all legacy UKB collections. This action cannot be undone. Proceed with extreme caution.</p>
        <div>
          {purgeState === 0 && <button onClick={() => setPurgeState(1)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition">Initiate Purge...</button>}
          {purgeState === 1 && (
            <div>
              <p className="text-center text-red-400 mb-2">Are you sure? This action is permanent.</p>
              <button onClick={() => setPurgeState(2)} className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg transition">Confirm Purge Request</button>
              <button onClick={handlePurgeCancel} className="w-full mt-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded-lg transition text-sm">Cancel</button>
            </div>
          )}
          {purgeState === 2 && (
            <div>
               <p className="text-center text-red-500 font-bold mb-2">FINAL WARNING. Click to execute.</p>
               <button onClick={executePurge} disabled={purgeCountdown > 0} className="w-full bg-red-800 hover:bg-red-900 border border-red-500 text-white font-bold py-3 px-5 rounded-lg text-lg transition disabled:opacity-50 disabled:cursor-wait">
                 {purgeCountdown > 0 ? `Executing in ${purgeCountdown}...` : 'EXECUTE PURGE'}
               </button>
               <button onClick={handlePurgeCancel} className="w-full mt-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded-lg transition text-sm">Cancel</button>
            </div>
          )}
          {purgeState === 3 && <p className="text-center text-red-500 font-bold">PURGING...</p>}
          {purgeState === 4 && <p className="text-center text-emerald-400 font-bold">Purge Complete.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

