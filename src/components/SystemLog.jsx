import React, { useRef, useEffect } from 'react';

const SystemLog = ({ logs = [] }) => {
    const logEndRef = useRef(null);

    // Auto-scroll to the bottom when new logs are added
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const getTypeClasses = (type) => {
        switch (type) {
            case 'success':
                return 'text-emerald-400';
            case 'error':
                return 'text-red-400';
            case 'special':
                return 'text-amber-400';
            case 'delete':
                return 'text-red-400';
            case 'info':
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className="mt-8 bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
            <h3 className="text-2xl font-semibold text-gray-300 mb-4">System Log</h3>
            <div id="log" className="bg-gray-900 h-48 rounded-md p-4 overflow-y-auto font-mono text-sm border border-gray-600">
                {logs.map((log, index) => (
                    <p key={index} className="whitespace-pre-wrap">
                        <span className="text-gray-500">{log.timestamp}</span>
                        <span className={`${getTypeClasses(log.type)}`}>&nbsp;&nbsp;{log.message}</span>
                    </p>
                ))}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};

export default SystemLog;

