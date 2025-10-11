// FILE: src/components/SystemLog.jsx
import React, { useEffect, useRef } from 'react';

const SystemLog = ({ logs, isExpanded, setIsExpanded }) => {
    const logContainerRef = useRef(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-gray-800 rounded-lg shadow-xl p-4 border border-gray-700 relative">
            <h3 className="text-lg font-semibold text-gray-300 mb-2">System Log</h3>
            
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute top-3 right-3 text-gray-400 hover:text-white"
                title={isExpanded ? "Collapse Log" : "Expand Log"}
            >
                {isExpanded ? (
                    // When expanded, show the "collapse" icon (down arrow)
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 9.293a1 1 0 011.414 0L10 12.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                ) : (
                    // When collapsed, show the "expand" icon (up arrow)
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 10.707a1 1 0 01-1.414 0L10 7.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                )}
            </button>

            <div
                ref={logContainerRef}
                className={`bg-gray-900 rounded-md p-3 overflow-y-auto font-mono text-xs border border-gray-600 transition-all duration-300 ease-in-out ${isExpanded ? 'h-48' : 'h-24'}`}
            >
                {logs.map((log, index) => (
                    <p key={index} className="whitespace-pre-wrap">
                        <span className="text-gray-500">{log.timestanp}</span>
                        <span className={`ml-2 ${log.typeClass}`}>
                            {log.message}
                        </span>
                    </p>
                ))}
            </div>
        </div>
    );
};

export default SystemLog;