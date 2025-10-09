import { useState } from 'react';

const OBJECT_TYPES = ['perks', 'abilities', 'effects'];

function Scribe({ logMessage }) {
  const [selectedType, setSelectedType] = useState('');

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="scribe-select" className="block text-sm font-medium text-slate-300 mb-2">1. Select Object Type to Ingest</label>
        <select
          id="scribe-select"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="block w-full bg-slate-800 border-slate-700 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
        >
          <option value="">-- Select Object Type --</option>
          {OBJECT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">2. Provide Image</label>
        <div 
            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-700 border-dashed rounded-md cursor-pointer hover:border-cyan-400 transition-colors"
            onPaste={() => logMessage('Paste event detected for Scribe.', 'special')}
        >
          <div className="space-y-1 text-center">
            {/* --- DIRECT TEST: Forcing a fixed size on the rogue SVG --- */}
            <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm text-slate-400">Click here and press Ctrl+V to paste an image</p>
          </div>
        </div>
      </div>
      
      <div className="relative flex items-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-700"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-slate-900 px-2 text-sm text-slate-500">OR</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <input 
            id="file-upload" 
            name="file-upload" 
            type="file" 
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-900/50 file:text-cyan-300 hover:file:bg-cyan-900/80 cursor-pointer"
        />
        <button
            type="button"
            className="flex-shrink-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 focus:ring-offset-slate-900"
        >
            Upload
        </button>
      </div>

    </div>
  );
}

export default Scribe;