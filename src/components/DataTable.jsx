import React from 'react';

function DataTable({ data, handleSort, sortConfig, handleRowClick }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-slate-400 py-8">No data to display.</p>;
  }

  const headers = Object.keys(data[0]);

  return (
    // CORE CHANGE: Applying glow-border and font-mono
    <div className="bg-slate-900/70 rounded-lg border border-cyan-500/30 glow-border backdrop-blur-sm overflow-hidden font-mono">
      <table className="w-full text-sm text-left">
        <thead className="text-xs bg-black/30 text-slate-300 backdrop-blur-sm sticky top-0">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-700 transition-colors"
                onClick={() => handleSort(header)}
              >
                <div className="flex items-center">
                  <span className="capitalize">{header.replace(/_/g, ' ')}</span>
                  {sortConfig.key === header && (
                    <span className="ml-2">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={row.id || index}
              className="border-b border-cyan-500/10 transition-colors hover:bg-sky-900/50 cursor-pointer"
              onClick={() => handleRowClick(row)}
            >
              {headers.map((header, headerIndex) => (
                <td 
                  key={`${row.id || index}-${header}`} 
                  className={`px-6 py-5 whitespace-nowrap ${headerIndex === 0 ? 'text-cyan-300 font-medium' : 'text-slate-400'}`}
                >
                  {typeof row[header] === 'boolean' ? (
                     <span className={`px-2 py-1 text-xs rounded-full ${row[header] ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                       {row[header].toString()}
                     </span>
                  ) : (
                    String(row[header])
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;