import React from 'react';

const BuildManagerPanel = ({ savedBuilds, buildName, setBuildName, onSaveBuild, onLoadBuild }) => {
  return (
    <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
      <h2 className="text-lg font-bold text-sky-400 border-b border-slate-600 pb-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
        Build Manager
      </h2>

      <div className="flex flex-col space-y-2">
        <label htmlFor="build-select" className="text-sm font-medium text-slate-400">Load Build</label>
        <select 
            id="build-select"
            onChange={(e) => onLoadBuild(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 text-white rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
        >
            <option value="">-- Select a build --</option>
            {savedBuilds.map(build => (
                <option key={build.id} value={build.id}>{build.name}</option>
            ))}
        </select>
      </div>

      <div className="flex flex-col space-y-2">
        <label htmlFor="build-name" className="text-sm font-medium text-slate-400">Save Current Loadout As</label>
        <input 
            type="text" 
            id="build-name"
            placeholder="Enter build name..."
            value={buildName}
            onChange={(e) => setBuildName(e.target.value)}
            className="w-full bg-slate-700/80 border border-slate-600 rounded-md p-2 focus:bg-slate-600 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
        />
        <button 
            onClick={onSaveBuild}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
            Save Build
        </button>
      </div>
    </div>
  );
};

export default BuildManagerPanel;

