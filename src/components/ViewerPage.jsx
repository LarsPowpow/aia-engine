import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, doc, deleteDoc, writeBatch } from "firebase/firestore";
import InspectorModal from './InspectorModal';

// --- MASTER CONFIG & SCHEMAS ---
const COLLECTIONS = [
  'ukb_effects_v2', 'ukb_sources_v2'
];
const UKB_SCHEMAS = {
  perks: {
    // This is the new, comprehensive schema for perks
    type: { filterable: true, type: 'select' }, // e.g., Weapon, Armor
    category: { filterable: true, type: 'select' }, // e.g., Damage, Utility
    perk_bucket: { filterable: true, type: 'select' }, // e.g., On-Crit, On-Hit
    exclusive_to: { filterable: true, type: 'select' }, // e.g., Sword, null
  },
  weapon_mastery: {
    type: { filterable: true, type: 'select' },
    mastery_tree: { filterable: true, type: 'select' },
  },
  abilities: {
    type: { filterable: true, type: 'select' },
  }
};

const ViewerPage = ({ db, addLog }) => {
  const [selectedCollection, setSelectedCollection] = useState('');
  const [rawData, setRawData] = useState([]);
  const [tableHeaders, setTableHeaders] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [deleteDocId, setDeleteDocId] = useState('');
  const [ingestionData, setIngestionData] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [availableFilters, setAvailableFilters] = useState([]);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const tableContainerRef = useRef(null);

  // Effect to subscribe to Firestore collection changes
  useEffect(() => {
    setSearchTerm('');
    setColumnFilters({});

    if (db && selectedCollection) {
      addLog('info', `Subscribing to real-time updates for '${selectedCollection}'...`);
      const q = collection(db, selectedCollection);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() });
        });

        setRawData(data);

        if (data.length > 0) {
          const headers = Object.keys(data[0]).filter(key =>
            ![
              'effects', 'notes', 'description', 'crafting_mod', 'linked_effects',
              'absorption_effects', 'radius_by_equip_load', 'parent_ability'
            ].includes(key)
          );
          setTableHeaders(headers);
          if (!sortConfig.key || !headers.includes(sortConfig.key)) {
            setSortConfig({ key: headers[0], direction: 'ascending' });
          }

          const schema = UKB_SCHEMAS[selectedCollection];
          const generatedFilters = [];
          if (schema) {
            for (const key in schema) {
              if (schema[key].filterable) {
                const uniqueValues = [...new Set(data.map(item => item[key]).filter(Boolean))].sort();
                generatedFilters.push({ key, label: key.replace(/_/g, ' '), options: uniqueValues });
              }
            }
          }
          setAvailableFilters(generatedFilters);

        } else {
          setTableHeaders([]);
          setAvailableFilters([]);
        }

        addLog('success', `Live Viewer updated. Displaying ${data.length} document(s) for '${selectedCollection}'.`);

      }, (error) => {
        addLog('error', `Error subscribing to '${selectedCollection}': ${error.message}`);
      });

      return () => unsubscribe();
    } else {
      setRawData([]);
      setTableHeaders([]);
      setAvailableFilters([]);
    }
  }, [db, selectedCollection, addLog, sortConfig.key]);

  // Memoized filtering and sorting logic
  const processedData = useMemo(() => {
    let filteredItems = [...rawData];
    if (searchTerm) {
      const lowercasedTerm = searchTerm.toLowerCase();
      filteredItems = filteredItems.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(lowercasedTerm)
        )
      );
    }
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        filteredItems = filteredItems.filter(item => String(item[key]) === value);
      }
    });
    if (sortConfig.key !== null) {
      filteredItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filteredItems;
  }, [rawData, searchTerm, columnFilters, sortConfig]);

  // Effect to reset scroll position
  useEffect(() => {
    window.scrollTo(0, 0);
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
  }, [processedData]);

  const handleRowClick = (row) => {
    setSelectedItem(row);
    setDeleteDocId(row.id);
    addLog('info', `Inspecting document '${row.id}'.`);
    setIsInspectorOpen(true);
  };

  const handleColumnFilterChange = (key, value) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }));
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    addLog('info', `Sorting by ${key} (${direction}).`);
  };

  const handleDelete = async () => {
    if (!db || !selectedCollection || !deleteDocId) {
      addLog('error', 'Deletion failed: Collection and Document ID must be specified.');
      return;
    }
    addLog('special', `Initiating deletion of document '${deleteDocId}' from '${selectedCollection}'...`);
    try {
      await deleteDoc(doc(db, selectedCollection, deleteDocId));
      addLog('success', `Successfully deleted document '${deleteDocId}'.`);
      setDeleteDocId('');
    } catch (error) {
      addLog('error', `Error deleting document: ${error.message}`);
    }
  };

  const handleIngest = async () => {
    if (!db || !selectedCollection || !ingestionData) {
      addLog('error', 'Ingestion failed: Collection and data must be specified.');
      return;
    }
    addLog('special', `Initiating Smart Ingestion for '${selectedCollection}'...`);

    let dataArray;
    try {
      dataArray = JSON.parse(ingestionData);
      if (!Array.isArray(dataArray)) throw new Error("Input data must be a valid JSON array.");
    } catch (e) {
      addLog('error', `Ingestion failed: Invalid JSON format. ${e.message}`);
      return;
    }

    const batch = writeBatch(db);
    let count = 0;
    dataArray.forEach(obj => {
      const primaryKey = obj.id || obj.ability_id || obj.effect_id;
      if (!primaryKey) {
        addLog('error', `Skipping object due to missing primary key (id, ability_id, or effect_id): ${JSON.stringify(obj)}`);
        return;
      }
      const docRef = doc(db, selectedCollection, String(primaryKey));
      batch.set(docRef, obj, { merge: true });
      count++;
    });

    try {
      await batch.commit();
      addLog('success', `Smart Ingestion successful. ${count} documents were created/updated in '${selectedCollection}'.`);
      setIngestionData('');
    } catch (error) {
      addLog('error', `Error during Smart Ingestion: ${error.message}`);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Left Column: Data Table */}
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 flex flex-col xl:col-span-2">
        <h2 className="text-2xl font-semibold text-sky-300 mb-4">Live UKB Viewer</h2>
        <div className="mb-4">
          <label htmlFor="collectionSelectorViewer" className="block text-sm font-medium text-gray-400">Select Collection:</label>
          <select
            id="collectionSelectorViewer"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="">-- Select Collection --</option>
            {COLLECTIONS.map(col => (<option key={col} value={col}>{col}</option>))}
          </select>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="universalSearch" className="block text-sm font-medium text-gray-400">Universal Search</label>
            <input
              type="text" id="universalSearch" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              placeholder="Search all fields..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400">Column Filters</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {availableFilters.map(filter => (
                <select
                  key={filter.key} value={columnFilters[filter.key] || ''} onChange={(e) => handleColumnFilterChange(filter.key, e.target.value)}
                  className="block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-1 px-2 text-white text-xs focus:outline-none focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">Filter by {filter.label}</option>
                  {filter.options.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
              ))}
            </div>
          </div>
        </div>
        <div ref={tableContainerRef} className="flex-grow rounded-md overflow-auto border border-gray-600">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50 sticky top-0">
              <tr>
                {tableHeaders.map(header => (
                  <th key={header} onClick={() => requestSort(header)} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700">
                    {header.replace(/_/g, ' ')}
                    {sortConfig.key === header ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {processedData.length > 0 ? (
                processedData.map((row, index) => (
                  <tr key={row.id || index} onClick={() => handleRowClick(row)} className="bg-gray-800 even:bg-gray-800/50 hover:bg-gray-700/50 cursor-pointer">
                    {tableHeaders.map(header => (<td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{String(row[header])}</td>))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableHeaders.length || 1} className="text-center p-4 text-gray-500">
                    {selectedCollection ? 'No results match your search.' : 'Please select a collection to view its data.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Right Column: Command Center */}
      <div
        className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700 flex flex-col space-y-6 xl:col-span-1"
        style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}
      >
        <h2 className="text-2xl font-semibold text-emerald-300 mb-0">Command Center</h2>
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-300 mb-2">Smart Ingestion (Upsert)</h3>
          <p className="text-sm text-gray-400 mb-4">{selectedCollection ? `Paste JSON array to add/update in '${selectedCollection}'.` : 'Select a collection to enable ingestion.'}</p>
          <textarea value={ingestionData} onChange={(e) => setIngestionData(e.target.value)}
            className="w-full h-32 bg-gray-900 rounded-md p-3 font-mono text-sm border border-gray-600 text-amber-300"
            placeholder="[ { &quot;id&quot;: &quot;...&quot;, ... } ]" disabled={!selectedCollection} />
          <button onClick={handleIngest}
            className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!selectedCollection || !ingestionData}>
            Run Smart Ingestion
          </button>
        </div>
        <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 flex flex-col">
          <h3 className="text-xl font-semibold text-red-300 mb-2">Surgical Deletion</h3>
          <select value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)}
            className="mb-4 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500">
            <option value="">-- Select Collection --</option>
            {COLLECTIONS.map(col => (<option key={col} value={col}>{col}</option>))}
          </select>
          <input type="text" value={deleteDocId} onChange={(e) => setDeleteDocId(e.target.value)}
            className="mb-4 block w-full bg-gray-900 border-gray-600 rounded-md p-2 font-mono text-sm text-amber-300"
            placeholder="Paste document ID here..." />
          <button onClick={handleDelete} className="mt-auto w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition">
            Delete Document
          </button>
        </div>
      </div>
      <InspectorModal isOpen={isInspectorOpen} onClose={() => setIsInspectorOpen(false)} item={selectedItem} />
    </div>
  );
};

export default ViewerPage;