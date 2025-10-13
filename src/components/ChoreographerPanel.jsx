import React from 'react';
import { combatChoreography } from '../simulation/choreography.js';

export default function ChoreographerPanel() {
  return (
    <div className="bg-slate-800/40 rounded-xl p-4 flex flex-col space-y-4 border border-slate-700 shadow-lg backdrop-blur-sm">
        <h2 className="text-lg font-bold text-violet-400 border-b border-slate-600 pb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a1 1 0 00-1 1v1a1 1 0 002 0V3a1 1 0 00-1-1zM4 4h3a1 1 0 000-2H4a1 1 0 000 2zm1.5 8.5A.5.5 0 016 12v4a.5.5 0 01-1 0v-4a.5.5 0 01.5-.5zM15.5 8.5a.5.5 0 01.5.5v4a.5.5 0 01-1 0v-4a.5.5 0 01.5-.5zM10 12a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1zm8-8h-3a1 1 0 100 2h3a1 1 0 100-2z" />
            </svg>
            Combat Choreography
        </h2>
        <div className="flex-grow overflow-auto custom-scrollbar pr-1" style={{maxHeight: '200px'}}>
            <table className="min-w-full text-sm text-left">
                <thead className="bg-black/20 sticky top-0 backdrop-blur-sm z-10">
                    <tr>
                        <th className="p-2 font-semibold text-slate-300">Time</th>
                        <th className="p-2 font-semibold text-slate-300">Action</th>
                        <th className="p-2 font-semibold text-slate-300">Weapon</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                    {combatChoreography.map((step, idx) => (
                        <tr key={idx} className="hover:bg-slate-700/50 transition-colors duration-150">
                            <td className="p-2 whitespace-nowrap text-slate-400 font-mono">{step.time.toFixed(1)}s</td>
                            <td className="p-2 whitespace-nowrap">{step.action}</td>
                            <td className="p-2 whitespace-nowrap text-slate-400">{step.weapon}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
}

