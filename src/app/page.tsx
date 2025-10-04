export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 via-gray-900 to-black text-white">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold">⚡ VibrationFit</h1>
        <a href="/auth/login" className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2 rounded-lg font-semibold transition">
          Sign In
        </a>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          Create Your Vision.<br />
          Align Daily.<br />
          Watch It Actualize.
        </h2>
        
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          The SaaS platform for conscious creation with an AI assistant that knows your journey.
        </p>

        <div className="flex gap-4 justify-center">
          <a href="/auth/signup" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-lg text-lg font-semibold transition">
            Start Your Journey
          </a>
          <a href="#features" className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition">
            Learn More
          </a>
        </div>
      </main>

      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800 border border-emerald-600 p-8 rounded-xl">
            <div className="text-4xl mb-4">✨</div>
            <h4 className="text-xl font-bold mb-2">Active Vision</h4>
            <p className="text-gray-400">Create your Life I Choose™ document across 12 life categories</p>
          </div>
          <div className="bg-gray-800 border border-emerald-600 p-8 rounded-xl">
            <div className="text-4xl mb-4">🧘</div>
            <h4 className="text-xl font-bold mb-2">Consistent Alignment</h4>
            <p className="text-gray-400">Daily practices and AI guidance to stay above the Green Line</p>
          </div>
          <div className="bg-gray-800 border border-emerald-600 p-8 rounded-xl">
            <div className="text-4xl mb-4">📈</div>
            <h4 className="text-xl font-bold mb-2">Evidence of Actualization</h4>
            <p className="text-gray-400">Track your manifestations and prove it works</p>
          </div>
        </div>
      </section>
    </div>
  )
}