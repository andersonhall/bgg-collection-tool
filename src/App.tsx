/**
 * BGG Collection Tool — App entry point
 *
 * Architecture note:
 * All BoardGameGeek (BGG) API calls are routed through a Cloudflare Pages Function
 * serverless proxy (see /functions/ at the project root). Direct browser-to-BGG API
 * calls are blocked by CORS, so the browser never calls the BGG API directly.
 */

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-6">

        {/* Icon / Badge */}
        <div className="flex justify-center">
          <div className="bg-amber-500 text-gray-950 font-bold text-sm px-3 py-1 rounded-full tracking-widest uppercase">
            BGG Collection Tool
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
          What should we play tonight?
        </h1>

        {/* Subheading */}
        <p className="text-lg text-gray-400 leading-relaxed">
          Connect your BoardGameGeek collection and get instant recommendations
          based on your group size, available time, and desired complexity.
        </p>

        {/* Coming soon pill */}
        <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 text-gray-400 text-sm px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
          Coming soon — build in progress
        </div>

        {/* Feature hints */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-sm text-gray-500">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl mb-2">👥</div>
            <div>Filter by group size</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl mb-2">⏱️</div>
            <div>Filter by play time</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl mb-2">🎲</div>
            <div>Filter by complexity</div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default App
