import React from 'react';

// --- COMPONENT: SystemLog ---
function SystemLog({ logs = [] }) {
    return (
        <div className="mt-8 bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-semibold text-gray-300 mb-4">System Log</h3>
            <div className="bg-gray-900 h-48 rounded-md p-4 overflow-y-auto font-mono text-sm border border-gray-600">
                {logs.map((log, index) => (
                    <p key={index}>
                        <span className="text-gray-500">{log.timestamp}</span>
                        <span className={log.typeClass}>&nbsp;&nbsp;{log.message}</span>
                    </p>
                ))}
            </div>
        </div>
    );
}

export default SystemLog;
