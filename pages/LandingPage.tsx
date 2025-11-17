import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="h-full overflow-y-auto bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            Product to Market (P2M) Accelerator
          </h1>
          <p className="text-lg text-gray-300">
            Built by mostaghim@
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Micro-Trend Studio */}
          <Link
            to="/ufp"
            className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 group"
          >
            <div className="mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                Micro-Trend Studio
              </h2>
              <p className="text-gray-400 mb-3 text-sm">
                Virtual try-on with fabric swapping, edit garment's front and back views, and video preview capabilities.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Upload model & garment images</li>
                <li>• AI-powered virtual try-on</li>
                <li>• Swap fabrics & textures</li>
                <li>• Edit garments' front & back designs</li>
                <li>• Create 360° video previews</li>
              </ul>
            </div>
            <div className="mt-4 text-purple-400 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center text-sm">
              Launch Studio
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Moodboard */}
          <Link
            to="/moodboard"
            className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 group"
          >
            <div className="mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                Moodboard AI
              </h2>
              <p className="text-gray-400 mb-3 text-sm">
                Generate professional fashion moodboards with AI-curated color palettes and themed imagery.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Define collection theme & keywords</li>
                <li>• AI-generated color palettes</li>
                <li>• Curated fashion photography</li>
                <li>• Professional grid layouts</li>
                <li>• Instant visual inspiration</li>
              </ul>
            </div>
            <div className="mt-4 text-blue-400 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center text-sm">
              Create Moodboard
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Tech Illustration */}
          <Link
            to="/techpack"
            className="bg-gray-800 rounded-lg p-5 border border-gray-700 hover:border-teal-500 transition-all duration-300 hover:shadow-xl hover:shadow-teal-500/20 group"
          >
            <div className="mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-green-500 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
                Tech Illustration Assistant
              </h2>
              <p className="text-gray-400 mb-3 text-sm">
                Transform fashion sketches into professional renderings and technical flat illustrations for manufacturing.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Upload fashion design sketches</li>
                <li>• AI-generated photorealistic renderings</li>
                <li>• Technical flat illustrations (front & back)</li>
                <li>• Production-ready line drawings</li>
                <li>• Download all assets instantly</li>
              </ul>
            </div>
            <div className="mt-4 text-teal-400 font-semibold group-hover:translate-x-2 transition-transform inline-flex items-center text-sm">
              Generate Assets
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4 text-center">Why Use P2M Accelerator?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-1 text-sm">Rapid Acceleration</h4>
              <p className="text-xs text-gray-400">Complete design cycles in hours, not weeks</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-1 text-sm">AI-Powered</h4>
              <p className="text-xs text-gray-400">Leveraging Google's Gemini technology</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h4 className="font-semibold text-white mb-1 text-sm">Professional Quality</h4>
              <p className="text-xs text-gray-400">Production-ready designs and visuals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
