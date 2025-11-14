
export default function TechPackPage() {
  return (
    <div className="h-full p-4 sm:p-6 lg:p-8 bg-gray-900 font-sans flex flex-col overflow-auto">
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center p-12 max-w-2xl">
          <div className="mb-8">
            <svg className="w-32 h-32 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-semibold text-white mb-4">Technical Illustrations Generator</h2>
          <p className="text-lg text-gray-400 mb-6">
            Coming Soon: Upload your fashion designs and generate detailed technical illustrations.
          </p>
          <div className="bg-gray-800 rounded-lg p-6 text-left">
            <h3 className="text-xl font-semibold text-white mb-3">Planned Features:</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span>Upload design sketches or photos</span>
              </li>
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span>AI-generated technical flat sketches</span>
              </li>
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span>Automated measurement specifications</span>
              </li>
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span>Material and construction callouts</span>
              </li>
              <li className="flex items-start">
                <span className="text-teal-500 mr-2">•</span>
                <span>Export to PDF for manufacturing</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
