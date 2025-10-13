import React from 'react';
// If you have a chart library, import it here (e.g., Chart.js or Recharts)
// import { Bar } from 'react-chartjs-2';

function getSummaryMetrics(combatLog) {
  let totalDamage = 0;
  let firstTimestamp = null;
  let lastTimestamp = null;
  const damageBySource = {};

  combatLog.forEach(entry => {
    totalDamage += entry.damage || 0;
    if (firstTimestamp === null || entry.timestamp < firstTimestamp) firstTimestamp = entry.timestamp;
    if (lastTimestamp === null || entry.timestamp > lastTimestamp) lastTimestamp = entry.timestamp;
    const src = entry.action || 'Unknown';
    damageBySource[src] = (damageBySource[src] || 0) + (entry.damage || 0);
  });

  const duration = lastTimestamp !== null && firstTimestamp !== null ? lastTimestamp - firstTimestamp : 0;
  const dps = duration > 0 ? (totalDamage / duration) : 0;

  return { totalDamage, dps, duration, damageBySource };
}

export default function ResultsSummaryPanel({ combatLog }) {
  const { totalDamage, dps, duration, damageBySource } = getSummaryMetrics(combatLog);
  const sources = Object.keys(damageBySource);
  const damageValues = Object.values(damageBySource);
  const total = damageValues.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 mt-4">
      <h2 className="text-xl font-semibold text-white mb-4">Results Summary</h2>
      <div className="mb-4 grid grid-cols-3 gap-4">
        <div>
          <span className="text-gray-400">Total Damage</span>
          <div className="text-2xl font-bold text-white">{totalDamage}</div>
        </div>
        <div>
          <span className="text-gray-400">DPS</span>
          <div className="text-2xl font-bold text-white">{dps.toFixed(2)}</div>
        </div>
        <div>
          <span className="text-gray-400">Time-to-Kill</span>
          <div className="text-2xl font-bold text-white">{duration.toFixed(2)}s</div>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">Damage Breakdown</h3>
      <table className="min-w-full text-sm text-left mb-4">
        <thead className="bg-black/40">
          <tr>
            <th className="p-2 font-semibold">Source</th>
            <th className="p-2 font-semibold text-right">Damage</th>
            <th className="p-2 font-semibold text-right">% of Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {sources.map((src, idx) => (
            <tr key={src}>
              <td className="p-2">{src}</td>
              <td className="p-2 text-right">{damageBySource[src]}</td>
              <td className="p-2 text-right">{total > 0 ? ((damageBySource[src] / total) * 100).toFixed(1) : '0'}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Chart placeholder: Replace with a real chart if you add a chart library */}
      <div className="mt-4">
        <div className="text-gray-400 mb-2">Chart: Damage Breakdown (add chart library for visuals)</div>
        {/* Example: <Bar data={...} /> */}
      </div>
    </div>
  );
}
