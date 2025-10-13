import React, { useEffect, useRef } from 'react';

const SystemLog = ({ logs, isSysLogOpen, setIsSysLogOpen }) => {
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

    // ChevronIcon definition (fixes ReferenceError)
    const ChevronIcon = ({ direction }) => (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
        >
            {direction === 'left' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            )}
        </svg>
    );

    return (
        <div className={`flex flex-col h-full transition-all duration-300 ease-in-out ${isSysLogOpen ? 'w-96 p-4' : 'w-12 p-2'} bg-gray-800 border-l-2 border-gray-600`}>
            <div
                className={`flex items-center mb-4 cursor-pointer select-none ${isSysLogOpen ? 'justify-between' : 'justify-center'} hover:bg-gray-700 rounded-md p-1`}
                onClick={() => setIsSysLogOpen(!isSysLogOpen)}
                aria-label={isSysLogOpen ? 'Collapse System Log' : 'Expand System Log'}
            >
                <h2 className={`text-lg font-bold whitespace-nowrap ${!isSysLogOpen && 'hidden'}`}>System Log</h2>
                {isSysLogOpen ? <ChevronIcon direction="right" /> : <ChevronIcon direction="left" />}
            </div>
            <div className={`flex-grow overflow-y-auto text-sm font-mono ${!isSysLogOpen && 'hidden'}`}>
                {(logs && logs.length > 0) ? (
                    logs.slice().reverse().map((log, index) => (
                        <div key={index} className="mb-1">
                            <span className="text-gray-400 mr-2">{log.timestamp}</span>
                            <span className={logTypeClasses[log.type] || logTypeClasses.default}>
                                [{log.source}]
                            </span>
                            <span className="text-gray-300 ml-2">{log.message}</span>
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500 text-center mt-8">No system logs yet.</div>
                )}
                <div ref={logEndRef} />
            </div>
        </div>
    );
};

export default SystemLog;