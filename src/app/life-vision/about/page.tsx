'use client'

import {
  Container,
  Card,
  Stack,
  Text,
  Inline,
} from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { Target, Compass, Lightbulb, Sparkles, Headphones, Image, BookOpen, Repeat } from 'lucide-react'

const VISION_INTRO_VIDEO =
  'https://media.vibrationfit.com/site-assets/video/intensive/05-vision-builder-1080p.mp4'
const VISION_INTRO_POSTER =
  'https://media.vibrationfit.com/site-assets/video/intensive/05-vision-builder-thumb.0000000.jpg'

export default function LifeVisionAboutPage() {
  return (
    <Container size="xl">
      <Stack gap="lg">
        <div className="mx-auto w-full max-w-3xl">
          <OptimizedVideo
            url={VISION_INTRO_VIDEO}
            thumbnailUrl={VISION_INTRO_POSTER}
            context="single"
            className="w-full"
          />
        </div>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What is Your Life Vision?
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Life Vision is the blueprint for the life you choose to create across all 12 life categories. It's not just a list of goals. It's a living declaration of who you are becoming and the reality you're actively calling in.
            </p>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Think of it as your personal compass &ndash; it tells you where you're headed so your choices, actions, and focus can all line up with the life you actually want, not the one you think you "should" want.
            </p>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What You'll Create
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Target className="h-5 w-5 text-[#5EC49A] flex-shrink-0" />
                  <Text size="sm" className="text-white font-semibold">
                    Clarity in Every Life Area
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  You'll get specific about what you want in each of the 12 categories: Love, Family, Health, Home, Work, Money, Fun, Travel, Social, Stuff, Spirituality, and Giving.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Lightbulb className="h-5 w-5 text-[#2DD4BF] flex-shrink-0" />
                  <Text size="sm" className="text-white font-semibold">
                    Your Ideal State (In Your Own Words)
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  You'll describe your ideal reality in each area as if it already exists &ndash; how it looks, feels, sounds, and functions in your day-to-day life.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Compass className="h-5 w-5 text-[#8B5CF6] flex-shrink-0" />
                  <Text size="sm" className="text-white font-semibold">
                    A Unified Blueprint
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  VIVA takes what you write for each category and assembles it into one cohesive Life Vision &ndash; Forward, all 12 categories, and a Conclusion &ndash; expressed in language that still feels like you.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Sparkles className="h-5 w-5 text-[#FFB701] flex-shrink-0" />
                  <Text size="sm" className="text-white font-semibold">
                    Activation-Ready Content
                  </Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  This written vision becomes the source for your audio tracks, vision board images, and daily activation protocol, so everything you do is built from the same clear picture.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              How It Works
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="w-7 h-7 rounded-full bg-[#39FF14]/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#39FF14]">1</span>
                  </div>
                  <div>
                    <Text size="sm" className="text-white font-semibold">Build Your Categories</Text>
                    <p className="text-sm text-neutral-400 leading-relaxed mt-1">
                      Walk through each of the 12 life categories with VIVA. For each one, you'll identify what you want, flip contrast into clarity, and describe your ideal state in your own words.
                    </p>
                  </div>
                </Inline>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="w-7 h-7 rounded-full bg-[#00FFFF]/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#00FFFF]">2</span>
                  </div>
                  <div>
                    <Text size="sm" className="text-white font-semibold">Assemble Your Vision</Text>
                    <p className="text-sm text-neutral-400 leading-relaxed mt-1">
                      Once your categories are complete, VIVA weaves them into a unified Life Vision document with a Forward, all 12 sections, and a Conclusion.
                    </p>
                  </div>
                </Inline>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <div className="w-7 h-7 rounded-full bg-[#BF00FF]/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-[#BF00FF]">3</span>
                  </div>
                  <div>
                    <Text size="sm" className="text-white font-semibold">Refine Over Time</Text>
                    <p className="text-sm text-neutral-400 leading-relaxed mt-1">
                      Your vision is never finished. As you grow, you can refine any section with VIVA, create new versions, and keep your vision aligned with who you're becoming.
                    </p>
                  </div>
                </Inline>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="lg">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              What Your Vision Powers
            </Text>
            <Stack gap="lg">
              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Headphones className="h-5 w-5 text-[#00FFFF] flex-shrink-0" />
                  <Text size="sm" className="text-white font-semibold">Audio Tracks</Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your Life Vision is converted into personalized audio tracks you can listen to daily, reinforcing your vision at a subconscious level.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Image className="h-5 w-5 text-[#BF00FF] flex-shrink-0" />
                  <Text size="sm" className="text-white font-semibold">Vision Board</Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Visual representations generated from your vision give your nervous system something tangible to connect with.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <BookOpen className="h-5 w-5 text-[#FFB701] flex-shrink-0" />
                  <Text size="sm" className="text-white font-semibold">Journal Prompts</Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  VIVA uses your vision as context to generate journal prompts that keep your daily reflections aligned with your bigger picture.
                </p>
              </Stack>

              <Stack gap="sm">
                <Inline gap="sm" className="items-start">
                  <Repeat className="h-5 w-5 text-[#39FF14] flex-shrink-0" />
                  <Text size="sm" className="text-white font-semibold">Activation Protocol</Text>
                </Inline>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Your 28-day activation plan is built directly from your Life Vision, turning your written intentions into daily aligned action.
                </p>
              </Stack>
            </Stack>
          </Stack>
        </Card>

        <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
          <Stack gap="md">
            <Text size="sm" className="text-neutral-400 uppercase tracking-[0.3em] underline underline-offset-4 decoration-[#333]">
              Why Your Life Vision Matters
            </Text>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed">
              Your Life Vision is the foundation for intentional living inside Vibration Fit:
            </p>
            <Stack gap="sm" className="text-sm text-neutral-300 leading-relaxed">
              <p>
                <span className="text-white font-semibold">Direction</span> &ndash; You know exactly where you're going, so decisions get simpler: "Does this move me closer to my vision or not?"
              </p>
              <p>
                <span className="text-white font-semibold">Alignment</span> &ndash; Your daily actions, habits, and choices can finally match what you say you want.
              </p>
              <p>
                <span className="text-white font-semibold">Context for VIVA</span> &ndash; Your vision gives VIVA the context needed to personalize prompts, ideas, and guidance to your future, not someone else's.
              </p>
              <p>
                <span className="text-white font-semibold">Manifestation Power</span> &ndash; A clear, felt, written vision gives your nervous system something specific to believe in, which makes it far easier to become a vibrational match to the life you're creating.
              </p>
            </Stack>
            <p className="text-sm md:text-base text-neutral-300 leading-relaxed mt-4">
              This is the document everything else in Vibration Fit plugs into &ndash; your audio, your vision board, your Journal, and your 28-day Activation Plan all start here.
            </p>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
