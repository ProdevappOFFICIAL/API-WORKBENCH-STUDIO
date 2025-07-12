import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Ultra Light Electron
          </h1>
          
          <div className="mb-6">
            <div className="text-6xl font-bold text-indigo-600 mb-2">
              {count}
            </div>
            <p className="text-gray-600">Click count</p>
          </div>

          <button
            onClick={() => setCount(count + 1)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200 mb-4"
          >
            Increment
          </button>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Built with Vite + React + TypeScript + Tailwind
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Optimized for minimal bundle size
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;