import React from 'react';

const MasteryLoadoutPanel = () => {
  return (
    <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
      <h2 className="text-lg font-bold text-yellow-400 border-b border-slate-600 pb-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13z" clipRule="evenodd" />
        </svg>
        Mastery Loadout
      </h2>
      <div className="flex-grow overflow-auto custom-scrollbar pr-1" style={{ maxHeight: '200px' }}>
        <p className="text-center text-slate-500 py-8">Loading masteries from UKB...</p>
      </div>
    </div>
  );
};

export default MasteryLoadoutPanel;