// Filepath: src/components/InspectorModal.jsx
import React from 'react';

const StatDetail = ({ label, value, unit = '', className = '' }) => (
  <div className={`flex justify-between items-baseline ${className}`}>
    <span className="text-slate-400">{label}:</span>
    <span className="font-mono text-cyan-300">{value}{unit}</span>
  </div>
);

const CombatantStateCard = ({ title, combatant }) => {
  if (!combatant) return null;

  const activeEmpowers = combatant.activeEffects.filter(e => e.damageBucket === 'Empower');
  const activeRends = combatant.activeEffects.filter(e => e.damageBucket === 'Rend');
  const activeFortifies = combatant.activeEffects.filter(e => e.statusId === 'FORTIFY'); // Assuming this mapping

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-green-400 border-b border-slate-600 pb-2 mb-3">{title}</h3>
      <div className="space-y-3 text-sm">
        <div>
          <h4 className="font-bold text-slate-300 mb-1">Empower</h4>
          {activeEmpowers.length > 0 ? (
            activeEmpowers.map((effect, index) => (
              <StatDetail key={index} label={effect.name} value={effect.modifications[0].valueFormula} unit="%" className="text-xs pl-2"/>
            ))
          ) : <p className="text-xs text-slate-500 pl-2">None</p>}
          <StatDetail label="Total Empower" value={combatant.stats.empower} unit="%" className="border-t border-slate-700 mt-2 pt-2 font-bold" />
        </div>
        <div>
          <h4 className="font-bold text-slate-300 mb-1">Fortify</h4>
           {activeFortifies.length > 0 ? (
            activeFortifies.map((effect, index) => (
              <StatDetail key={index} label={effect.name} value={effect.modifications[0].valueFormula} unit="%" className="text-xs pl-2"/>
            ))
          ) : <p className="text-xs text-slate-500 pl-2">None</p>}
          <StatDetail label="Total Fortify" value={combatant.stats.fortify} unit="%" className="border-t border-slate-700 mt-2 pt-2 font-bold" />
        </div>
        <div>
            <h4 className="font-bold text-slate-300 mb-1">Uncapped Damage %</h4>
            <StatDetail label="Total Uncapped" value={combatant.stats.miscDmg} unit="%" className="font-bold"/>
        </div>
      </div>
    </div>
  );
};


const TargetStateCard = ({ title, target, damageDealt }) => {
    if(!target) return null;

    const activeRends = target.activeEffects.filter(e => e.damageBucket === 'Rend');

    return (
        <div className="bg-slate-800/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-400 border-b border-slate-600 pb-2 mb-3">{title}</h3>
            <div className="space-y-3 text-sm">
                <div>
                    <h4 className="font-bold text-slate-300 mb-1">Damage Dealt</h4>
                    <p className="text-3xl font-bold text-yellow-400 text-center py-2">{damageDealt}</p>
                </div>
                 <div>
                    <h4 className="font-bold text-slate-300 mb-1">Rend</h4>
                    {activeRends.length > 0 ? (
                        activeRends.map((effect, index) => (
                        <StatDetail key={index} label={effect.name} value={effect.modifications[0].valueFormula} unit="%" className="text-xs pl-2"/>
                        ))
                    ) : <p className="text-xs text-slate-500 pl-2">None</p>}
                    <StatDetail label="Total Rend" value={target.stats.rend} unit="%" className="border-t border-slate-700 mt-2 pt-2 font-bold" />
                </div>
            </div>
        </div>
    );
}


const InspectorModal = ({ isOpen, onClose, item }) => {
  if (!isOpen) {
    return null;
  }

  // Check if this is a combat log item by looking for a snapshot
  const isCombatLog = item && item.snapshot;

  const title = isCombatLog ? `Inspector: ${item.action}` : (item ? `Inspector: ${item.name || item.id}` : 'Inspector');
  const timestamp = isCombatLog ? `@${item.timestamp.toFixed(2)}s` : null;


  const renderBody = () => {
    if (isCombatLog) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <CombatantStateCard title="Combatant State" combatant={item.snapshot.combatant} />
          <TargetStateCard title="Target State" target={item.snapshot.target} damageDealt={item.damage}/>
        </div>
      );
    }
    
    // Fallback for non-combat log items (like from UKB Viewer)
    return (
      <div className="p-4 overflow-y-auto">
        <pre className="text-sky-300 whitespace-pre-wrap">
          {item ? JSON.stringify(item, null, 2) : 'Awaiting data...'}
        </pre>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-cyan-500/30 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 rounded-t-lg">
          <h2 className="text-2xl font-semibold text-cyan-300 flex items-center gap-3">
            {title}
            {timestamp && <span className="text-sm font-mono bg-slate-700 text-yellow-300 px-2 py-0.5 rounded">{timestamp}</span>}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl leading-none"
          >
            &times;
          </button>
        </div>
        {renderBody()}
      </div>
    </div>
  );
};

export default InspectorModal;