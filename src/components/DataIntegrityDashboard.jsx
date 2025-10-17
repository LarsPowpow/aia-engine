import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db as firestore } from '../services/firebase';
import { BUNKER_MANIFEST } from '../simulation/bunkers/bunkerManifest';

// --- Sub-Component for Status Badge ---
const StatusBadge = ({ status }) => {
    const styles = {
        OK: 'bg-green-500/20 text-green-400 border-green-500/30',
        ERROR: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    const style = styles[status] || 'bg-slate-600/20 text-slate-300 border-slate-600/30';
    return (
        <span className={`px-2 py-1 text-xs font-bold rounded-md border ${style}`}>
            {status}
        </span>
    );
};

// --- Main Dashboard Component ---
const DataIntegrityDashboard = () => {
    const [allSources, setAllSources] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const querySnapshot = await getDocs(collection(firestore, 'ukb_sources_v2'));
                const sources = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllSources(sources);
                setError(null);
            } catch (err) {
                setError('Failed to fetch sources from Firestore.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Core Reconciliation Logic ---
    const integrityReport = useMemo(() => {
        if (isLoading || error) return [];

        const sourceMap = new Map(allSources.map(s => [s.id, s]));
        const bunkerMap = new Map(BUNKER_MANIFEST.map(b => [b.metadata.id, b.metadata]));
        const allIds = new Set([...sourceMap.keys(), ...bunkerMap.keys()]);
        const report = [];

        for (const id of allIds) {
            const source = sourceMap.get(id);
            const bunker = bunkerMap.get(id);
            const row = {
                id,
                name: source?.name || bunker?.id || id,
                overallStatus: '',
                details: '',
            };

            if (source && bunker) {
                const sourceType = String(source.type || '').toUpperCase();
                const bunkerType = String(bunker.type || '').toUpperCase();

                if (sourceType === bunkerType) {
                    row.overallStatus = 'OK';
                    row.details = `Type: ${sourceType}`;
                } else {
                    row.overallStatus = 'ERROR';
                    row.details = `Type Mismatch - DB: ${sourceType} vs Code: ${bunkerType}`;
                }
            } else if (source && !bunker) {
                row.overallStatus = 'ERROR';
                row.details = 'Missing Bunker: Source exists in DB, but no Bunker is registered in the manifest.';
            } else if (!source && bunker) {
                row.overallStatus = 'ERROR';
                row.details = 'Missing Source: Bunker is registered, but no Source exists in the DB.';
            }
            report.push(row);
        }

        return report.sort((a, b) => {
            if (a.overallStatus === 'ERROR' && b.overallStatus !== 'ERROR') return -1;
            if (a.overallStatus !== 'ERROR' && b.overallStatus === 'ERROR') return 1;
            return a.id.localeCompare(b.id);
        });
    }, [allSources, isLoading, error]);

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center p-8 text-slate-400">Loading and analyzing data...</div>;
        }
        if (error) {
            return <div className="text-center p-8 text-red-400">{error}</div>;
        }
        return (
            <div className="overflow-auto custom-scrollbar pr-1 h-[60vh]">
                <table className="min-w-full text-sm text-left">
                    <thead className="bg-black/20 sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                            <th className="p-2 font-semibold text-slate-300">Overall Status</th>
                            <th className="p-2 font-semibold text-slate-300">Name</th>
                            <th className="p-2 font-semibold text-slate-300">ID</th>
                            <th className="p-2 font-semibold text-slate-300">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {integrityReport.map(item => (
                            <tr key={item.id} className="hover:bg-slate-700/50 transition-colors duration-150">
                                <td className="p-2 text-center"><StatusBadge status={item.overallStatus} /></td>
                                <td className="p-2 whitespace-nowrap text-white">{item.name}</td>
                                <td className="p-2 font-mono text-xs text-slate-400">{item.id}</td>
                                <td className="p-2 text-slate-400">{item.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700 shadow-lg backdrop-blur-sm">
            <h2 className="text-lg font-bold text-amber-400 border-b border-slate-600 pb-2 mb-4">
                Data Integrity Dashboard (Operation: Crystal Pane)
            </h2>
            <p className="text-sm text-slate-400 mb-4">
                This panel provides a real-time analysis of the synchronization between Firestore data (`ukb_sources_v2`) and the codebase (`bunkerManifest.js`).
            </p>
            {renderContent()}
        </div>
    );
};

export default DataIntegrityDashboard;

