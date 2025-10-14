import React, { useState, useRef, useEffect } from 'react';

const CombatLogPanel = ({ log }) => {
  const logContainerRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Auto-scroll to the bottom of the log when new entries are added
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [log]);


  // UPDATED: Now expects a log entry object and checks the 'message' property.
  const getEntryColor = (message) => {
    const lowerCaseMessage = message.toLowerCase();
    if (lowerCaseMessage.includes('attack')) return 'text-slate-300';
    if (lowerCaseMessage.includes('fatal') || lowerCaseMessage.includes('error')) return 'text-red-400 font-bold';
    if (lowerCaseMessage.includes('start') || lowerCaseMessage.includes('end')) return 'text-cyan-400 font-bold';
    if (lowerCaseMessage.includes('applying') || lowerCaseMessage.includes('found passive')) return 'text-amber-400';
    if (lowerCaseMessage.includes('initializing')) return 'text-violet-400';
    return 'text-slate-400';
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const containerClasses = isExpanded
    ? 'overflow-auto font-mono text-xs flex-grow custom-scrollbar pr-2'
    : 'h-full overflow-auto font-mono text-xs custom-scrollbar pr-2'; 

  return (
    <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700 flex flex-col h-full shadow-lg backdrop-blur-sm">
      <div className="flex justify-between items-center border-b border-slate-600 pb-2 mb-2">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
            Live Combat Log
        </h2>
        <button
          onClick={toggleExpand}
          className="p-2 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition"
          disabled={!log || log.length === 0}
          title={isExpanded ? 'Collapse Log' : 'Expand Log'}
        >
          {isExpanded 
            ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 12.586l3.293-3.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 7.414 6.707 10.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
          }
        </button>
      </div>
      
      <div ref={logContainerRef} className={containerClasses}>
        {log && log.length > 0 ? (
          log.map((entry, index) => (
            <div key={index} className={`whitespace-pre-wrap leading-relaxed py-1 border-b border-slate-800/50 flex`}>
              <span className="text-slate-500 w-16 flex-shrink-0">{entry.timestamp.toFixed(2)}s</span>
              <span className={`${getEntryColor(entry.message)}`}>{entry.message}</span>
            </div>
          ))
        ) : (
          <p className="text-slate-500 italic text-center py-16">Run simulation to view engine log.</p>
        )}
      </div>
    </div>
  );
};

export default CombatLogPanel;
