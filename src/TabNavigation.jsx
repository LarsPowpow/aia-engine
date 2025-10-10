import React from 'react';

// --- COMPONENT: TabNavigation ---
function TabNavigation({ activeTab, setActiveTab }) {
    const tabs = [
        { id: 'viewer', label: 'UKB Viewer' },
        { id: 'forge', label: 'The Forge' },
        { id: 'migration', label: 'Migration Staging' },
        { id: 'admin', label: 'System Administration' },
    ];

    const getTabClassName = (tabId) => {
        const isActive = activeTab === tabId;
        let classes = 'py-2 px-5 cursor-pointer border-b-2 font-medium transition-colors duration-200 ';
        if (isActive) {
            if (tabId === 'admin') classes += 'border-red-500 text-red-400';
            else if (tabId === 'migration') classes += 'border-amber-500 text-amber-400';
            else classes += 'border-emerald-400 text-emerald-400';
        } else {
            classes += 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500';
        }
        return classes;
    };

    return (
        <div className="mb-8 border-b border-gray-700 flex justify-center">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={getTabClassName(tab.id)}
                    onClick={() => setActiveTab(tab.id)}
                >
                    {tab.label}
                </div>
            ))}
        </div>
    );
}

export default TabNavigation;
