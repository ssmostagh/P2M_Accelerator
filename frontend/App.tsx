/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import MicroTrendStudio from './pages/MicroTrendStudio';
import MoodboardPage from './pages/MoodboardPage';
import TechIllustrationPage from './pages/TechIllustrationPage';
import PatternApplierPage from './pages/PatternApplierPage';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
          {/* Navigation Bar */}
          <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-12">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-600">
                    P2M Accelerator
                  </h1>
                  <span className="text-xs text-gray-500 dark:text-gray-500 border-l border-gray-300 dark:border-gray-600 pl-2">Built by mostaghim@</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-1">
                    <NavLink
                      to="/"
                      end
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                          ? 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                        }`
                      }
                    >
                      Home
                    </NavLink>
                    <NavLink
                      to="/designstudio"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                          ? 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                        }`
                      }
                    >
                      Quick Response Design Studio
                    </NavLink>
                    <NavLink
                      to="/moodboard"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                          ? 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                        }`
                      }
                    >
                      Moodboard
                    </NavLink>
                    <NavLink
                      to="/techpack"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                          ? 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                        }`
                      }
                    >
                      Technical Illustrations
                    </NavLink>
                    <NavLink
                      to="/patternapplier"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                          ? 'bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                        }`
                      }
                    >
                      Pattern Studio
                    </NavLink>
                  </div>
                  <div className="pl-4 border-l border-gray-200 dark:border-gray-700">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/designstudio" element={<MicroTrendStudio />} />
              <Route path="/moodboard" element={<MoodboardPage />} />
              <Route path="/techpack" element={<TechIllustrationPage />} />
              <Route path="/patternapplier" element={<PatternApplierPage />} />
            </Routes>
          </div>

          {/* Footer */}
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2 flex-shrink-0 transition-colors duration-200">
            <p className="text-center text-xs text-gray-500">
              Powered by Gemini
            </p>
          </footer>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;
