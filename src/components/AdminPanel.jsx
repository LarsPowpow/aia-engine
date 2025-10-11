import React from 'react';

const AdminPanel = ({ onClearUkb, onClearArchive, onBootstrapData, onClearSystemLog, covenant, onGenerateCovenant }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Covenant Viewer Card */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700 col-span-1 lg:col-span-2">
                <h3 className="text-2xl font-semibold text-gray-300 mb-4">Operation: Secure the Covenant</h3>
                 <p className="text-sm text-gray-400 mb-4">Generate and display the Co-Pilot's core operational document.</p>
                <button
                    onClick={onGenerateCovenant}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 mb-4 shadow-md hover:shadow-lg"
                >
                    Generate Latest Covenant
                </button>
                <div className="bg-gray-900 h-96 rounded-md p-4 overflow-y-auto font-mono text-sm border border-gray-600">
                    <pre className="whitespace-pre-wrap text-gray-300">{covenant}</pre>
                </div>
            </div>

            {/* System Administration Card */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner border border-gray-700">
                <h3 className="text-2xl font-semibold text-gray-300 mb-4">System Administration</h3>
                <p className="text-sm text-gray-400 mb-6">Execute high-level system commands. Use with extreme caution.</p>

                <div className="flex flex-col space-y-4">
                    {/* Big Buttons */}
                    <button
                        onClick={onBootstrapData}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg text-lg"
                    >
                        Bootstrap UKB
                    </button>
                    <button
                        onClick={onClearSystemLog}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg text-lg"
                    >
                        Clear System Log
                    </button>
                    
                    {/* Small Buttons */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button
                            onClick={onClearArchive}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg text-sm"
                        >
                            Clean Slate: Dirty JSON
                        </button>
                         <button
                            onClick={onClearUkb}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200 shadow-md hover:shadow-lg text-sm"
                        >
                            Clean Slate: UKB
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;