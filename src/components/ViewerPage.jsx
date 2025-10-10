import { useState, useEffect } from 'react';
import { onSnapshot, collection } from "firebase/firestore";

// --- CONSTANTS (Scoped to this component) ---
const COLLECTIONS = ['perks', 'weapon_mastery', 'game_constants', 'status_effects', 'attribute_bonuses', 'builds', 'effects', 'abilities'];

// --- SUB-COMPONENT: DataTable ---
// Note: This is included here to make this file self-contained for our first operation.
// We will refactor this into its own file in a later step.
function DataTable({ data }) {
    if (!data || data.length === 0) {
        return <p className="text-gray-500 p-4">No data to display for this collection.</p>;
    }
    const headers = Object.keys(data[0]).filter(key => !['description', 'long_description'].includes(key));
    return (
        <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50 sticky top-0">
                <tr>
                    {headers.map(header => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            {header.replace(/_/g, ' ')}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
                {data.map(item => (
                    <tr key={item.id} className="bg-gray-800 even:bg-gray-800/50 hover:bg-gray-700/50">
                        {headers.map(header => (
                            <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs">
                                {String(item[header])}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}


// --- MAIN COMPONENT: ViewerPage ---
function ViewerPage({ db, addLog }) {
    const [selectedCollection, setSelectedCollection] = useState('');
    const [collectionData, setCollectionData] = useState([]);

    useEffect(() => {
        if (!selectedCollection || !db) {
            setCollectionData([]);
            return;
        }
        addLog('info', `Subscribing to real-time updates for '${selectedCollection}'...`);
        const unsubscribe = onSnapshot(collection(db, selectedCollection), (querySnapshot) => {
            const data = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            setCollectionData(data);
            addLog('success', `Live Viewer updated. Displaying ${data.length} document(s) for '${selectedCollection}'.`);
        }, (error) => {
            addLog('error', `Error subscribing to '${selectedCollection}': ${error.message}`);
        });
        return () => unsubscribe();
    }, [selectedCollection, db, addLog]);

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
            <h2 className="text-2xl font-semibold text-sky-300 mb-4">AIA UKB Viewer</h2>
            <div className="mb-4">
                <label htmlFor="collectionSelectorViewer" className="block text-sm font-medium text-gray-400">Select Collection:</label>
                <select
                    id="collectionSelectorViewer"
                    className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                    value={selectedCollection}
                    onChange={(e) => setSelectedCollection(e.target.value)}
                >
                    <option value="">-- Select a Collection --</option>
                    {COLLECTIONS.map(col => (
                        <option key={col} value={col}>{col}</option>
                    ))}
                </select>
            </div>
            <div id="dataViewer" className="flex-grow rounded-md overflow-auto border border-gray-600 min-h-[300px]">
                {collectionData.length > 0 ? (
                    <DataTable data={collectionData} />
                ) : (
                    <p className="text-gray-500 p-4">Please select a collection to view its data.</p>
                )}
            </div>
        </div>
    );
}

export default ViewerPage;

