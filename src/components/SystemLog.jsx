import React, { useEffect, useRef } from 'react';

const SystemLog = ({ logs, isExpanded, setIsExpanded }) => {
    const logEndRef = useRef(null);

    const logTypeClasses = {
        default: 'text-gray-400',
        info: 'text-sky-400',
        success: 'text-green-400',
        error: 'text-red-400',
        warning: 'text-yellow-400',
        special: 'text-purple-400',
    };

    useEffect(() => {
        // Auto-scroll to the bottom when a new log is added
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    return (
        <div className="flex flex-col h-full">
            <div 
                className={`bg-gray-900 rounded-md p-3 overflow-y-auto font-mono text-xs border border-gray-700 transition-all duration-300 ease-in-out resize-y ${isExpanded ? 'h-96' : 'h-40'}`}
                style={{ minHeight: '80px', maxHeight: '600px' }}
            >
                {logs && logs.map((log, index) => (
                    <p key={index} className={`whitespace-pre-wrap ${logTypeClasses[log.type] || logTypeClasses.default}`}>
                        <span className="text-gray-500 mr-2">{log.timestamp}</span>
                        {`> ${log.message}`}
                    </p>
                ))}
                <div ref={logEndRef} />
            </div>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
            >
                {isExpanded ? 'Collapse Log' : 'Expand Log'}
            </button>
        </div>
    );
};

export default SystemLog;