// ACTION: Receive the activeTab and setActiveTab props from App.jsx
function TabNavigation({ activeTab, setActiveTab }) {

  // An array of our tab data to keep the code clean and scalable.
  const tabs = [
    { id: 'viewer', label: 'UKB Viewer' },
    { id: 'forge', label: 'The Forge' },
    { id: 'migration', label: 'Migration Staging' },
    { id: 'admin', label: 'System Administration' },
  ];

  // This helper function determines the correct CSS classes for a tab based on whether it is active.
  const getTabClassName = (tabId) => {
    const isActive = activeTab === tabId;
    // Base styles applied to all tabs.
    let classes = 'py-2 px-5 cursor-pointer border-b-2 font-medium transition-colors duration-200 ';

    // Conditionally add styles for active vs. inactive tabs, including special colors.
    if (isActive) {
      if (tabId === 'admin') classes += 'border-red-500 text-red-400';
      else if (tabId === 'migration') classes += 'border-amber-500 text-amber-400';
      else classes += 'border-emerald-400 text-emerald-400'; // Default active color
    } else {
      classes += 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500';
    }
    return classes;
  };

  return (
    <div className="mb-8 border-b border-gray-700 flex justify-center">
      {/* We now loop over the tabs array to create each tab dynamically. */}
      {tabs.map((tab) => (
        // When a tab is clicked, it calls the setActiveTab function to update the state in App.jsx.
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