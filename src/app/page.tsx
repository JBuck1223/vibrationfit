
'use client'

import { PageLayout, Container, Button } from '@/lib/design-system'

export default function Home() {
  return (
    <PageLayout>
      {/* Hero Section with Video */}
      <header className="relative w-full bg-gradient-to-br from-neutral-900 to-black">
        {/* Video Section */}
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-16">
          <div className="bg-neutral-900 rounded-2xl p-6 shadow-2xl border border-neutral-700">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">Message from Our Founders</h3>
              <p className="text-neutral-400">Watch this introduction to understand the VibrationFit vision</p>
            </div>
            
            <div className="relative bg-black rounded-xl overflow-hidden shadow-lg">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-xl"
                  src="https://player.vimeo.com/video/1069293549?autoplay=0&controls=1&muted=0&title=1&byline=0&portrait=0"
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title="VibrationFit Founder Message"
                />
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-lg text-neutral-200 mb-8 max-w-2xl mx-auto">
                The all-in-one platform for conscious creators to manifest their goals with AI-powered guidance and daily alignment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="/auth/signup">Start Your Journey</a>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <a href="#features">See How It Works</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <main className="flex-1 w-full">
        <Container size="xl" className="py-24">
          <h3 className="text-4xl font-bold text-center mb-14">
            How VibrationFit Empowers You
          </h3>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-gray-900 border border-emerald-600 p-8 rounded-2xl shadow-lg flex flex-col items-center text-center">
              <div className="text-5xl mb-4">📝</div>
              <h4 className="text-2xl font-bold mb-2">Active Vision</h4>
              <p className="text-gray-400">
                Craft your <span className="text-emerald-400 font-semibold">Life I Choose™</span> document across 12 life categories. Get clarity on your goals and direction.
              </p>
            </div>
            <div className="bg-gray-900 border border-emerald-600 p-8 rounded-2xl shadow-lg flex flex-col items-center text-center">
              <div className="text-5xl mb-4">🤖</div>
              <h4 className="text-2xl font-bold mb-2">AI Alignment Coach</h4>
              <p className="text-gray-400">
                Daily check-ins and personalized AI guidance to keep you above the Green Line and in flow, every single day.
              </p>
            </div>
            <div className="bg-gray-900 border border-emerald-600 p-8 rounded-2xl shadow-lg flex flex-col items-center text-center">
              <div className="text-5xl mb-4">📈</div>
              <h4 className="text-2xl font-bold mb-2">Manifestation Tracker</h4>
              <p className="text-gray-400">
                Log your wins and track evidence of actualization. See your progress and prove to yourself that it works.
              </p>
            </div>
          </div>
        </Container>

        {/* Call to Action */}
        <section className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h4 className="text-3xl font-bold mb-4">
            Ready to Actualize Your Vision?
          </h4>
          <p className="text-lg text-neutral-300 mb-8">
            Join conscious creators using VibrationFit to align, manifest, and win. Start your free trial today.
          </p>
          <Button size="xl" asChild>
            <a href="/auth/signup">Get Started Free</a>
          </Button>
        </section>
      </main>
    </PageLayout>
  )
}