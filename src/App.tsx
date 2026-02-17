import { useState } from 'react';
import { Wizard } from './components/Wizard';
import { Gallery } from './components/Gallery';
import { LayoutGrid, Wand2, RefreshCw } from 'lucide-react';

function App() {
  const [view, setView] = useState<'wizard' | 'gallery'>('wizard');
  // We can add a key to force re-render/reset of Wizard if needed when clicking "New Project"
  const [wizardKey, setWizardKey] = useState(0);

  const handleReset = () => {
    setWizardKey(prev => prev + 1);
    setView('wizard');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4 font-sans">
      <div className={`${view === 'gallery' ? 'max-w-7xl' : 'max-w-7xl'} mx-auto space-y-6`}>
        <header className="flex flex-row justify-between items-center mb-4 sm:mb-8 bg-white p-2 sm:p-4 rounded-xl shadow-sm gap-4">
          <div>
             <h1 className="text-xl sm:text-3xl font-bold text-gray-900 tracking-tight">Avatar Reaction</h1>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setView('wizard')} 
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'wizard' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <Wand2 className="w-4 h-4" /> 
                <span className="hidden sm:inline">Create</span>
            </button>
            <button 
                onClick={() => setView('gallery')} 
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${view === 'gallery' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
            >
                <LayoutGrid className="w-4 h-4" /> 
                <span className="hidden sm:inline">Gallery</span>
            </button>
          </div>

          <button onClick={handleReset} className={`flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-lg ${view === 'gallery' ? 'invisible' : ''}`}>
            <RefreshCw className="w-5 h-5" />
            <span className="hidden sm:inline">New Project</span>
          </button>
        </header>

        {view === 'gallery' ? (
           <Gallery />
        ) : (
           <Wizard key={wizardKey} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}

export default App;
