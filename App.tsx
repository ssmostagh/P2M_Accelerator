import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import UFPDesignStudio from './pages/UFPDesignStudio';
import MoodboardPage from './pages/MoodboardPage';
import TechIllustrationPage from './pages/TechIllustrationPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="h-screen bg-gray-900 flex flex-col">
        {/* Navigation Bar */}
        <nav className="bg-gray-800 border-b border-gray-700 flex-shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                  P2M Accelerator
                </h1>
                <span className="text-xs text-gray-500 border-l border-gray-600 pl-2">Built by mostaghim@</span>
              </div>
              <div className="flex space-x-4">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  Home
                </NavLink>
                <NavLink
                  to="/ufp"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  Ultra Fast Production Studio
                </NavLink>
                <NavLink
                  to="/moodboard"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  Moodboard
                </NavLink>
                <NavLink
                  to="/techpack"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  Technical Illustrations
                </NavLink>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/ufp" element={<UFPDesignStudio />} />
            <Route path="/moodboard" element={<MoodboardPage />} />
            <Route path="/techpack" element={<TechIllustrationPage />} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 border-t border-gray-700 py-4 flex-shrink-0">
          <p className="text-center text-xs text-gray-500">
            Powered by Gemini
          </p>
        </footer>
      </div>
    </Router>
  );
};

export default App;
