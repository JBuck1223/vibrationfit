'use client'

import { Container, Card, Button, Badge, PageHero, Stack } from '@/lib/design-system/components'
import Image from 'next/image'
import Link from 'next/link'

// Emotional Guidance Scale downloadable images
const scaleImages = [
  {
    id: 1,
    title: 'EGS for Print',
    url: 'https://media.vibrationfit.com/wp-content/uploads/2025/02/11124011/Emotional-Guidance-Scale-EGS-for-Print.jpg',
    alt: 'Emotional Guidance Scale for Print'
  },
  {
    id: 2,
    title: 'EGS with Labels',
    url: 'https://media.vibrationfit.com/wp-content/uploads/2025/02/11124011/Emotional-Guidance-Scale-EGS-for-Print.jpg',
    alt: 'Emotional Guidance Scale with Labels'
  },
  {
    id: 3,
    title: 'EGS Dark Mode',
    url: 'https://media.vibrationfit.com/wp-content/uploads/2025/02/11124011/Emotional-Guidance-Scale-EGS-for-Print.jpg',
    alt: 'Emotional Guidance Scale Dark Mode'
  },
  {
    id: 4,
    title: 'EGS Simplified',
    url: 'https://media.vibrationfit.com/wp-content/uploads/2025/02/11124011/Emotional-Guidance-Scale-EGS-for-Print.jpg',
    alt: 'Emotional Guidance Scale Simplified'
  }
]

const benefits = [
  'You feel in flow with life',
  'You attract experiences that match your elevated vibration',
  'You are in alignment with your true self and Source energy',
  'You develop a resilient vibrational state, making it easier to stay above the line'
]

const dailyQuestions = [
  'Where am I on the scale right now?',
  'What thought can I choose that feels slightly better?',
  'How can I cultivate momentum upward by focusing on appreciation, fun, or relief?'
]

function BenefitItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-6 h-6 md:w-7 md:h-7 bg-primary-500 rounded-full flex items-center justify-center mt-1">
        <span className="text-white text-xs md:text-sm">✓</span>
      </div>
      <p className="text-sm md:text-base text-neutral-300 flex-1">{children}</p>
    </div>
  )
}

export default function EmotionalGuidanceScalePage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        {/* Hero Section */}
        <PageHero
          title="Emotional Guidance Scale"
          subtitle="Your roadmap to staying above the green line and living in alignment"
        />

        {/* Downloadable Scale Images Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {scaleImages.map((scale) => (
            <Card 
              key={scale.id} 
              variant="elevated" 
              className="p-4 md:p-6"
            >
              <Stack gap="md">
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#1F1F1F]">
                  <Image 
                    src={scale.url}
                    alt={scale.alt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open(scale.url, '_blank')}
                >
                  Download {scale.title}
                </Button>
              </Stack>
            </Card>
          ))}
        </div>

        {/* Main Content - Above the Green Line */}
        <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
          <Stack gap="lg">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 md:h-16 bg-primary-500 rounded-full" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-500">
                Staying Above the Green Line
              </h2>
            </div>

            <p className="text-sm md:text-base lg:text-lg text-neutral-300 leading-relaxed">
              At <strong>Vibration Fit</strong>, we encourage people to cultivate vibrational 
              fitness by <span className="text-primary-500 font-semibold">staying above the green line</span>
              —which begins at contentment (7) and moves upward. Living above the green line means 
              consistently aligning with emotions like hopefulness, optimism, and joy.
            </p>
            
            {/* Benefits Section */}
            <Stack gap="md">
              <h3 className="text-lg md:text-xl font-semibold text-white">
                When you live above the green line:
              </h3>
              <Stack gap="sm">
                {benefits.map((benefit, index) => (
                  <BenefitItem key={index}>{benefit}</BenefitItem>
                ))}
              </Stack>
            </Stack>

            {/* Below the Green Line */}
            <div className="p-4 md:p-6 bg-red-500/10 rounded-xl border-l-4 border-red-500">
              <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
                Conversely, when <span className="text-red-500 font-semibold">below the green line</span>, 
                the pull of negative momentum can make it harder to shift gears, which is why deliberate 
                vibrational exercises, or{' '}
                <Link href="/tuning" className="text-primary-500 hover:text-primary-400 underline">
                  tuning
                </Link>
                , are key to raising your vibration intentionally.
              </p>
            </div>
          </Stack>
        </Card>

        {/* Large Scale Image */}
        <Card variant="elevated" className="p-4 md:p-6">
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-[#1F1F1F]">
            <Image 
              src="https://media.vibrationfit.com/wp-content/uploads/2025/02/11124011/Emotional-Guidance-Scale-EGS-for-Print.jpg"
              alt="Emotional Guidance Scale Full Chart"
              fill
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 1600px"
              priority
            />
          </div>
        </Card>

        {/* Practical Application */}
        <Card variant="elevated" className="p-4 md:p-6 lg:p-8">
          <Stack gap="lg">
            <div className="flex items-center gap-3">
              <div className="w-1 h-12 md:h-16 bg-secondary-500 rounded-full" />
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-secondary-500">
                How to Use the Scale
              </h2>
            </div>

            <p className="text-sm md:text-base lg:text-lg text-neutral-300 leading-relaxed">
              The Emotional Guidance Scale serves as a practical framework for conscious creation. 
              Instead of reacting to life, you can use your emotions as indicators to make deliberate 
              shifts in your vibration.
            </p>
            
            {/* Daily Practice */}
            <div className="p-4 md:p-6 bg-gradient-to-br from-primary-500/10 to-secondary-500/10 rounded-xl border-2 border-primary-500/20">
              <Stack gap="md">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-lg md:text-xl font-semibold text-white">
                    Ask yourself daily:
                  </h3>
                </div>
                <Stack gap="sm">
                  {dailyQuestions.map((question, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <span className="text-primary-500 font-bold mt-1">•</span>
                      <span className="text-sm md:text-base text-neutral-300 flex-1">
                        {question}
                      </span>
                    </div>
                  ))}
                </Stack>
              </Stack>
            </div>

            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              By working with the EGS, you train your vibration just like a muscle, making it 
              easier to stay in alignment and create a life you're excited to wake up to!
            </p>
          </Stack>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Card 
            variant="elevated" 
            className="p-6 md:p-8 lg:p-12 bg-gradient-to-br from-primary-500/5 to-secondary-500/5 border-2 border-primary-500/30"
          >
            <Stack gap="lg">
              <h3 className="text-xl md:text-2xl lg:text-3xl font-bold">
                Ready to Start Tuning Your Vibration?
              </h3>
              <p className="text-sm md:text-base text-neutral-300 max-w-2xl mx-auto">
                Explore our tuning resources and exercises to help you consistently stay above the green line
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
                <Link href="/tuning">
                  <Button variant="primary" size="sm" className="w-full sm:w-auto">
                    Explore Tuning Resources →
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm" className="w-full sm:w-auto">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </Stack>
          </Card>
        </div>

        {/* Additional Scale Image */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
          <Image 
            src="https://media.vibrationfit.com/wp-content/uploads/2025/02/11124011/Emotional-Guidance-Scale-EGS-for-Print.jpg"
            alt="Emotional Guidance Scale Reference"
            fill
            className="object-contain"
            sizes="(max-width: 1024px) 100vw, 1600px"
          />
        </div>
      </Stack>
    </Container>
  )
}




