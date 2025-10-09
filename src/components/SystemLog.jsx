import { useState } from 'react';
import SystemLog from './components/SystemLog';
import TabNavigation from './components/TabNavigation';

function App() {
  const [activeTab, setActiveTab] = useState('viewer');

  // ACTION: Create a static array of log messages.
  const staticLogs = [
    { timestamp: '11:58:01', message: 'Cockpit v2.0 Initialized. All systems nominal.', typeClass: 'text-gray-400' },
    { timestamp: '11:58:05', message: 'Stalemate broken. Verifiable forward progress achieved.', typeClass: 'text-emerald-400' },
    { timestamp: '11:58:09', message: 'SystemLog component online and resilient.', typeClass: 'text-amber-400' }
  ];

  // ACTION: Add the content rendering logic back in.
  const renderContent = () => {
    switch (activeTab) {
      case 'viewer':
        return <div>UKB Viewer Content Panel</div>;
      case 'forge':
        return <div>The Forge Content Panel</div>;
      case 'migration':
        return <div>Migration Staging Content Panel</div>;
      case 'admin':
        return <div>System Administration Content Panel</div>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen font-sans">
      <div className="w-full max-w-screen-2xl mx-auto p-4 sm-p-6 lg:p-8">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-400">
            Aeternum Intelligence Agency
          </h1>
          <p className="text-xl text-gray-400">
            Cockpit v2.0
          </p>
        </div>

        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* ACTION: Render the panel content and the SystemLog. */}
        <div>{renderContent()}</div>
        <SystemLog logs={staticLogs} />

      </div>
    </div>
  );
}

export default App;