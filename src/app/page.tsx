
import { PageLayout, Container, Button } from '@/lib/design-system'

export default function Home() {
  return (
    <PageLayout>
      {/* Hero Section with Video */}
      <header className="relative w-full bg-black">
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none h-[480px]">
          <video
            className="w-full h-[480px] object-cover opacity-40"
            autoPlay
            loop
            muted
            playsInline
            poster="https://vumbnail.com/1069293549.jpg"
            style={{ pointerEvents: 'none' }}
          >
            <source src="https://vibrationfit-public.s3.amazonaws.com/hero-demo.mp4" type="video/mp4" />
            {/* Fallback message for browsers that don't support the video tag */}
            Your browser does not support the video tag.
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 to-black/90" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center pt-24 pb-16 px-6">
          <h2 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent drop-shadow-lg">
            Build Your Vision.<br />
            Align Daily.<br />
            Actualize Your Dreams.
          </h2>
          <p className="text-xl md:text-2xl text-neutral-200 mb-8 max-w-2xl mx-auto">
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
        {/* Video message note */}
        <div className="relative z-10 flex justify-center mt-[-40px]">
          <div className="bg-black/70 text-primary-500 px-6 py-2 rounded-full text-sm font-medium shadow-lg border border-primary-500">
            <span>
              <span className="font-bold">Note:</span> The video above is a message from our founder.
            </span>
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