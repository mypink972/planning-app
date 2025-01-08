import { useState } from 'react';
import ConfigPage from './components/ConfigPage';
import PlanningPage from './components/PlanningPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'config' | 'planning'>('planning');

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="w-full px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex space-x-8">
                <button
                  onClick={() => setCurrentPage('planning')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentPage === 'planning'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Planning
                </button>
                <button
                  onClick={() => setCurrentPage('config')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    currentPage === 'config'
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="w-full px-4">
        {currentPage === 'config' ? <ConfigPage /> : <PlanningPage />}
      </main>
    </div>
  );
}

export default App;