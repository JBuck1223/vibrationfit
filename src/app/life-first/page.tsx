'use client'

/**
 * System-lead sales page (staging at /life-first).
 * Leads with the daily offering: the Universe responds to the vibe you
 * train and maintain. Features appear only as parts of that container.
 * Promotion to / is a separate, later step. Do not edit src/app/page.tsx.
 */

import React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  DoorOpen,
  Eye,
  Headphones,
  Image,
  RadioTower,
  Sparkles,
  Target,
  TrendingUp,
  Wand2,
} from 'lucide-react'
import { OptimizedVideo } from '@/components/OptimizedVideo'
import { IntensiveCheckout } from '@/components/marketing/IntensiveCheckout'
import {
  Stack,
  Container,
  Cover,
  Card,
  Button,
  Heading,
  Text,
  Grid,
  TwoColumn,
  FeatureCard,
  SwipeableCards,
} from '@/lib/design-system'
import { ProofWall, SocialProofSection } from '@/lib/design-system/components'

const CATEGORIES =
  'Fun, Health, Travel, Love, Family, Social, Home, Work, Money, Stuff, Giving, Spirituality'

export default function LifeFirstPage() {
  return (
    <Stack gap="lg">

      {/* 1. Hero — train and maintain */}
      <section>
        <Cover minHeight="500px" className="!p-0">
          <Container size="xl" className="w-full">
            <div className="text-center mb-8 md:mb-10">
              <Text size="sm" className="text-[#39FF14] uppercase tracking-[0.25em] font-semibold mb-6">
                A Vibration Fit Intensive
              </Text>
              <Heading level={1} className="text-white text-4xl md:text-6xl leading-tight !mb-0">
                The Universe doesn&apos;t respond to a vibe you reach once.{' '}
                <span className="text-[#39FF14]">It responds to the one you train and maintain.</span>
              </Heading>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
              <Stack gap="md" className="text-center lg:text-left">
                <Text size="lg" className="text-neutral-300">
                  The Universe doesn&apos;t respond to one alignment session you ran on a Sunday morning. It responds to your consistent daily offering.
                </Text>
                <Text size="base" className="text-white font-semibold tracking-wide">
                  Ready to transform? You are one active vision away from the life of your dreams.
                </Text>
                <div className="flex flex-col items-center lg:items-start gap-3">
                  <Button variant="primary" size="xl" asChild>
                    <a href="#pricing">Start living the life you choose</a>
                  </Button>
                  <Text size="xs" className="text-neutral-400">
                    $499 today (or 2 payments of $275). First 28 days of Vision Pro included.
                  </Text>
                </div>
              </Stack>

              <div className="relative bg-black rounded-xl overflow-hidden w-full">
                <OptimizedVideo
                  url="https://media.vibrationfit.com/site-assets/video/marketing/offer/offer-video-5-13-26-1080p.mp4"
                  thumbnailUrl="https://media.vibrationfit.com/site-assets/video/marketing/offer/offer-video-5-13-26-thumb.0000000.jpg"
                  context="single"
                  caption="Jordan and Vanessa — why this exists"
                  trackingId="life-first-hero-video"
                  saveProgress={true}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </Container>
        </Cover>
      </section>

      {/* 2. Why a Sunday session dies */}
      <section>
        <Container size="xl">
          <TwoColumn gap="lg" className="py-8 items-start">
            <Heading level={2} className="text-white !mb-0">
              You are not failing because you don&apos;t believe hard enough.
            </Heading>
            <Stack gap="md">
              <Text size="lg" className="text-neutral-300">
                Let&apos;s kill that on the first line. You already believe thoughts become things. Some of you already wrote the vision, said it out loud, made the board — and the life is still a thought. Some of you want to be intentional and cannot even start, because you only know what you do not want.
              </Text>
              <Text size="lg" className="text-neutral-300">
                That is not because Universal Law stopped working. Most teachers told you to write the vision — and never taught you the language that will actually manifest. And they never gave you a daily offering the Universe could keep answering after the weekend you wrote it.
              </Text>
              <Text size="lg" className="text-neutral-300">
                So you wrote the hole. Or you wrote nothing. Then you ran a session on Sunday. Then Monday came, and the vibe was gone.
              </Text>
              <Text size="lg" className="text-white font-semibold">
                The Universe does not hear your intention. It hears the vibration in the sentence. And it hears the offering you actually make when nobody is watching.
              </Text>
            </Stack>
          </TwoColumn>
        </Container>
      </section>

      <section>
        <Container size="xl">
          <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
            <Heading level={2} className="text-white !mb-6">
              The lack is dressed up as a vision.
            </Heading>
            <Grid responsiveCols={{ mobile: 1, desktop: 2 }} gap="md">
              {[
                'You wrote what is missing, then put “I am so grateful” in front of it.',
                'You listed goals as if a life were a shopping list.',
                'You flip from I want it to I can’t have it in the same paragraph.',
                'You activate for three days, drop it, restart, and call the restart a new beginning.',
                'You leave a session above the Green Line and lose it in the kitchen.',
              ].map((line) => (
                <div key={line} className="flex items-start gap-3">
                  <span className="text-[#FF0040] font-bold mt-0.5">—</span>
                  <Text size="base" className="text-neutral-200">{line}</Text>
                </div>
              ))}
            </Grid>
            <Text size="base" className="text-neutral-400 mt-8">
              Every one of those is a vibe you reached once. Not a vibe you trained. Hope is not an offering.
            </Text>
          </Card>
        </Container>
      </section>

      <section>
        <Container size="xl">
          <TwoColumn gap="lg" className="py-8 items-start">
            <Heading level={2} className="text-white !mb-0">
              You want to be intentional. You just don&apos;t know what you want.
            </Heading>
            <Stack gap="md">
              <Text size="lg" className="text-neutral-300">
                That is not a personality flaw. That is contrast.
              </Text>
              <Text size="lg" className="text-neutral-300">
                Love just ended, or it is ending, and you cannot picture the one you would choose. Work is a job you cannot stand, and the only sentence you have is “not this.” Money is tight and every thought is the shortage. Home does not feel like Home. Health is running you. Family is loud. Social is empty. Fun is gone. Travel is a joke. Stuff is either nothing or too much. Giving has no extra. Spirituality feels like a luxury you will get to when life calms down.
              </Text>
              <Text size="lg" className="text-neutral-300">
                You are not missing a dream. You are standing in what you do not want. Contrast is still the lack, speaking. The Universe hears that too.
              </Text>
              <Text size="lg" className="text-white font-semibold">
                You do not have to arrive knowing what you want. You arrive knowing what hurts. That is enough to start.
              </Text>
            </Stack>
          </TwoColumn>
        </Container>
      </section>

      <section>
        <Container size="xl">
          <TwoColumn gap="lg" className="py-8 items-start">
            <div>
              <Heading level={2} className="text-white !mb-6">
                Add up the years the lack has been the loudest signal.
              </Heading>
              <Button variant="primary" size="lg" asChild>
                <a href="#pricing">Start living the life you choose</a>
              </Button>
            </div>
            <Stack gap="md">
              <Text size="lg" className="text-neutral-300">
                Every vision written from “I don’t have this yet.” Every month you waited because you did not know what you wanted. Every Sunday session that felt like the one. Every high you tried to hold, and lost by Wednesday.
              </Text>
              <Text size="lg" className="text-neutral-300">
                That is the most expensive habit you own. It compounds. Every time you skip the offering, you teach the life that it is optional.
              </Text>
              <Text size="lg" className="text-white font-semibold">
                Meanwhile someone with half your hunger wrote the life, trained the vibe, and the life started moving.
              </Text>
            </Stack>
          </TwoColumn>
        </Container>
      </section>

      {/* 3. The container */}
      <section>
        <Container size="xl">
          <div className="py-8">
            <Heading level={2} className="text-white text-center !mb-4">
              This is a Conscious Creation System.
            </Heading>
            <Text size="lg" className="text-neutral-300 text-center mb-10">
              Every part exists to close a wound. Nothing is a random tool. Two phases: Install, then Run. One guide: VIVA. One gauge: the Green Line. Four reps: Creations, Activations, Connections, Sessions. One plan that makes the reps the offering: MAP.
            </Text>
            <Grid responsiveCols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
              {[
                {
                  icon: Wand2,
                  title: 'VIVA writes the life you cannot get to alone.',
                  body: 'If you already wrote a vision, VIVA hears the hole in the sentence and catches the lack. If you do not know what you want, VIVA turns contrast into clarity. You tell the truth about what is not it. VIVA writes the vision in a language you can live inside — across Fun, Health, Travel, Love, Family, Social, Home, Work, Money, Stuff, Giving, and Spirituality.',
                },
                {
                  icon: Eye,
                  title: 'Your Life Vision is the destination the offering is aimed at.',
                  body: 'Not a list. The life, in Vibrational Grammar, present tense, all twelve categories. If only Money is in vision and Home is still in the hole, the hole keeps broadcasting.',
                },
                {
                  icon: Headphones,
                  title: 'Vision Audio is how the language gets into the morning.',
                  body: 'You hear the life, in your voice, before the old sentences start. This is training. Not a track you play when you feel inspired.',
                },
                {
                  icon: Image,
                  title: 'The Vision Board is how the life stays visible.',
                  body: 'Not decoration. A point of focus so your eyes have somewhere to go besides the contrast in the room.',
                },
                {
                  icon: BookOpen,
                  title: 'The journal is how you speak from the life, not toward it.',
                  body: 'First entry in 72 hours. Then a place to keep writing above the Green Line instead of narrating the lack. A rep, not a diary of the hole.',
                },
                {
                  icon: CalendarDays,
                  title: 'My Alignment Plan is the daily offering.',
                  body: 'When you are tired, you do not decide what a conscious creator would do. You do the next thing on the plan. That is how a vibe becomes one you train and maintain.',
                },
                {
                  icon: Target,
                  title: 'The four reps are the gears.',
                  body: 'Creations — you keep building the artifacts of the life. Activations — daily reps, so a vibe becomes identity. Connections — Vibe Tribe, so you do not do this alone. Sessions — Alignment Gym, live. Not a high to carry home. Training that puts you back above the Green Line so many times the floor rises.',
                },
                {
                  icon: TrendingUp,
                  title: 'The Green Line is the gauge.',
                  body: 'Above it, you are in the life. Below it, you are in contrast. Enjoy is not a souvenir from a session. It is the state you maintain.',
                },
                {
                  icon: RadioTower,
                  title: 'Vision Pro is the engine after day three.',
                  body: 'The Intensive installs the machine. Membership is how the offering keeps running — MAP, VIVA, community, gym — so you do not peak for 72 hours and disappear for the rest of the year.',
                },
              ].map((item) => (
                <FeatureCard
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  variant="outlined"
                  className="!items-start !text-left"
                >
                  {item.body}
                </FeatureCard>
              ))}
            </Grid>
            <Text size="base" className="text-neutral-400 text-center mt-10">
              Want the full machine map?{' '}
              <Link href="/system" className="text-[#39FF14] hover:text-[#5EC49A] underline underline-offset-4 inline-flex items-center gap-1">
                See how the system works <ArrowRight className="w-4 h-4" />
              </Link>
            </Text>
          </div>
        </Container>
      </section>

      {/* 4. The life it is aimed at */}
      <section>
        <Container size="xl">
          <div className="border-[#39FF14]/30 border-2 rounded-2xl p-6 md:p-10 bg-[#39FF14]/5">
            <div className="mb-8">
              <Sparkles className="w-8 h-8 text-[#39FF14] mb-4" />
              <Heading level={2} className="text-white !mb-2">
                Let yourself live it for a minute.
              </Heading>
              <Text size="base" className="text-neutral-400">It&apos;s a Tuesday.</Text>
            </div>
            <Grid responsiveCols={{ mobile: 1, desktop: 3 }} gap="lg">
              <Text size="lg" className="text-neutral-200 leading-relaxed">
                You wake up in a <span className="text-white font-semibold">Home</span> that feels like the one you described — because it is. Your body feels like an ally again, and <span className="text-white font-semibold">Health</span> is how you wake up, not something you fight for. <span className="text-white font-semibold">Work</span> is the work you chose, not the job you tolerate. <span className="text-white font-semibold">Money</span> isn&apos;t a flinch when you open the app — the number matches the sentence you wrote.
              </Text>
              <Text size="lg" className="text-neutral-200 leading-relaxed">
                The <span className="text-white font-semibold">Love</span> in your kitchen is the one you called in. <span className="text-white font-semibold">Family</span> is loud in the good way. There&apos;s something <span className="text-white font-semibold">Fun</span> on the calendar this week — not someday, this week — and the <span className="text-white font-semibold">Travel</span> is booked. Your <span className="text-white font-semibold">Social</span> life is easy: friends text back, plans actually happen.
              </Text>
              <Text size="lg" className="text-neutral-200 leading-relaxed">
                The thing you wanted showed up — you&apos;d almost forgotten you wrote it down (<span className="text-white font-semibold">Stuff</span>). You gave money away this month without doing math first (<span className="text-white font-semibold">Giving</span>). And underneath all of it runs a quiet signal that everything is working together (<span className="text-white font-semibold">Spirituality</span>).
              </Text>
            </Grid>
            <Text size="lg" className="text-[#39FF14] font-semibold pt-8">
              That is life above the Green Line. Manifestations arrive like evidence — because the vibe is one you train and maintain.
            </Text>
          </div>
        </Container>
      </section>

      {/* 5. 72 hours */}
      <section>
        <Container size="xl">
          <div className="py-8">
            <Heading level={2} className="text-white !mb-4">
              Stop writing the hole. Install the life. Begin the offering.
            </Heading>
            <Text size="lg" className="text-neutral-300 mb-8">
              In 72 hours you do not finish a homework list. You walk out with the life written and a daily offering that can hold it.
            </Text>
            <Grid responsiveCols={{ mobile: 1, desktop: 2 }} gap="md">
              {[
                `A Life Vision written in Vibrational Grammar, with VIVA, across all 12 categories: ${CATEGORIES}`,
                'Vision Audio you can live inside every day',
                'A Vision Board you can see',
                'Your first journal entry from the life, not toward it',
                'My Alignment Plan — so tomorrow morning the offering is already scheduled',
                'The four reps aimed: Creations, Activations, Connections, Sessions',
                'First 28 days of Vision Pro included — VIVA, Vibe Tribe, live Alignment Gym',
              ].map((line) => (
                <div key={line} className="flex items-start gap-3">
                  <span className="text-[#39FF14] font-bold mt-0.5">—</span>
                  <Text size="base" className="text-neutral-200">{line}</Text>
                </div>
              ))}
            </Grid>
            <Text size="base" className="text-neutral-500 text-center mt-8">
              The steps exist because a machine has parts. They are not what you came for.
            </Text>
            <div className="text-center mt-8">
              <Button variant="primary" size="lg" asChild>
                <a href="#pricing">Start living the life you choose</a>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. Proof */}
      <section>
        <Container size="xl">
          <ProofWall
            heading="We used this on ourselves first."
            subtitle="Before Vibration Fit existed, we were overdrafted and in debt, writing visions the way everyone else does — wanting, hoping, naming the gap. What changed was the language, and the daily offering that held it. Then the outside moved: debt gone, six figures in the bank, our first million made doing work we love."
            caption="Real screenshots from our accounts, before and after living the Vibration Fit system."
            showHeadingOutside={false}
            showStoryHighlight={false}
            items={[
              {
                id: 'life-first-proof',
                beforeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/boa-screenshot.jpg',
                afterImage: 'https://media.vibrationfit.com/site-assets/proof-wall/business-account-1.jpg',
                story: '',
              },
            ]}
          />
          <div className="mt-10">
            <Heading level={3} className="text-white !mb-0">
              Ready to transform? <span className="text-[#39FF14]">You are one active vision away from the life of your dreams.</span>
            </Heading>
          </div>
        </Container>
      </section>

      <section>
        <Container size="xl">
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8 bg-black/40 border-[#39FF14]/20 border-2">
            <SocialProofSection
              eyebrow="Vibration Fit Members"
              title="Lives That Used to Be Thoughts"
              subtitle="Watch unedited stories and scroll through real screenshots from members whose visions stopped being documents — Money, Love, Family, and everyday life moving to match what they wrote."
              microcopy="All videos and messages are from real Vibration Fit members, shared with permission. Screenshots are unedited."
              videos={[
                {
                  id: 'v1',
                  src: 'https://media.vibrationfit.com/user-uploads/5c49b204-0c1b-4c5e-bb33-118f9d251259/intensive/testimonials/1773515176961-susxm5ps05e-intensive-c8f87e55-24af-4eed-8520-025cc3547a12-testimonial-recording-1773515176541.webm',
                  poster: 'https://media.vibrationfit.com/user-uploads/5c49b204-0c1b-4c5e-bb33-118f9d251259/intensive/testimonials/1773515176961-susxm5ps05e-intensive-c8f87e55-24af-4eed-8520-025cc3547a12-testimonial-recording-1773515176541-thumb.jpg',
                  label: 'Testimonial',
                },
                {
                  id: 'v2',
                  src: 'https://media.vibrationfit.com/site-assets/video/proof-wall/michele-testimonial-1080p.mp4',
                  poster: 'https://media.vibrationfit.com/site-assets/video/proof-wall/michele-testimonial-thumb.0000000.jpg',
                  label: 'Michele',
                },
                {
                  id: 'v3',
                  src: 'https://media.vibrationfit.com/user-uploads/4ed2a268-9df0-44da-8a0b-641238f92378/intensive/testimonials/1774242947302-jc0ui5mokj9-intensive-cae9652b-0556-4372-960c-431ea8b7eb3e-testimonial-recording-1774242946695.webm',
                  poster: 'https://media.vibrationfit.com/user-uploads/4ed2a268-9df0-44da-8a0b-641238f92378/intensive/testimonials/1774242947302-jc0ui5mokj9-intensive-cae9652b-0556-4372-960c-431ea8b7eb3e-testimonial-recording-1774242946695-thumb.jpg',
                  label: 'Intensive',
                },
              ]}
              screenshots={[
                { id: 's1', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0002-4.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's2', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0003-5.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's3', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0004-7.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's4', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0005-8.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's5', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0006-9.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's6', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0007-13.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's7', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0008-jeanie.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's8', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0009-11.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's9', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0010-12.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's10', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0011-14.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's11', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0012-15.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's12', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0013-16.jpg', alt: 'Vibration Fit member testimonial' },
                { id: 's13', src: 'https://media.vibrationfit.com/site-assets/proof-wall/testimonial-screenshots/testimonial-screenshots/4-6-26/vfit-messages-0000s-0014-17.jpg', alt: 'Vibration Fit member testimonial' },
              ]}
            />
          </Card>
        </Container>
      </section>

      <section>
        <Container size="xl">
          <Card variant="elevated" className="p-4 md:p-6 lg:p-8 bg-black/40 border-[#39FF14]/20 border-2">
            <SwipeableCards
              title="From Written to Lived"
              subtitle="Each of these was a sentence in a vision before it was a day in a life."
              cards={[
                {
                  id: 'vision-breville',
                  activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/breville-active.jpg',
                  activeImageAlt: 'Active vision photo of Breville coffee maker',
                  actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/breville-actualized.jpg',
                  actualizedImageAlt: 'Actualized Breville coffee maker gifted to Jordan and Vanessa',
                  memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                  title: 'Breville Coffee Maker Actualized (as a gift!)',
                  content: (
                    <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                      <Text size="sm" className="text-justify">
                        We had this expensive coffee machine on our vision board and in our vision document. In our document we wrote about how amazing it feels to wake up and enjoy a luxurious cup of coffee in the comfort of our own home, and that it tastes even better than Starbucks! The thing was that it never felt like the right time to drop over $400 on a coffee machine.
                      </Text>
                      <Text size="sm" className="text-justify">
                        Then our baby shower came. There was one gift that was very large. We opened it and inside was a much more expensive model of the coffee machine we had put on our vision board! The one our friends gave us was nearly $2,000 and came with all the fancy features!! And we had never even told anyone about wanting this coffee machine. Talk about the Universe delivering something even better!!
                      </Text>
                    </Stack>
                  ),
                  showTitleOnCard: false,
                  showContentOnCard: false,
                  showModalImages: false,
                },
                {
                  id: 'vision-profit',
                  activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/gross-profit-vision.jpg',
                  activeImageAlt: 'Active vision journal entry outlining gross profit targets',
                  actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/gross-profit-actualized.jpg',
                  actualizedImageAlt: 'Actualized proof of gross profit aligned with the vision',
                  title: '$1M Actualized',
                  memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                  content: (
                    <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                      <Text size="sm" className="text-justify">
                        We experienced an amazingly awful day that changed our lives forever. We had just gotten married and were living in Japan. We woke up one morning and had no milk, no eggs, no bread, and no money. Our available capital that day was $4.87 (not even enough money to pay the ATM fee). And at the time we owed over $100,000 in debt: student loans, car loans, a dirt bike loan, home improvement loans, family loans, and infinite credit card debt.
                      </Text>
                      <Text size="sm" className="text-justify">
                        But this day was when everything changed vibrationally for us. We could no longer afford to play the vibrational hokey pokey. This is when we decided to fully commit the Vibration Fit Conscious Creation System. We started a new business doing what we loved and added a pretend $1,000,000 bill to our vision board. And boy are we glad we did!
                      </Text>
                      <Text size="sm" className="text-justify">
                        We went from no money in the bank and over 6 figures in debt to completely debt free with 6 figures in the bank. We made our first $1,000,000 in our own business from home. We achieved time, location, financial and inner freedom.
                      </Text>
                      <Text size="sm" className="font-semibold text-white">
                        Our lives were forever changed!
                      </Text>
                    </Stack>
                  ),
                  showTitleOnCard: false,
                  showContentOnCard: false,
                  showModalImages: false,
                },
                {
                  id: 'vision-italy',
                  activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/italy-active.jpg',
                  activeImageAlt: 'Active vision storyboard showing the Italy dream experience',
                  actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/italy-actualized.jpg',
                  actualizedImageAlt: 'Actualized photo from the Italy dream trip',
                  memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                  title: 'Exact Italy Destination Actualized (without any planning)',
                  content: (
                    <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                      <Text size="sm" className="text-justify">
                        <span className="text-white font-semibold">You can&apos;t make this stuff up.</span> So here we are in Amalfi, sitting at dinner on Day 2 talking about how surreal it is that we&apos;re in Italy marking off another place from our vision board. Jordan pulls up the exact photo from our vision board and we wonder where it was taken. We knew it was somewhere along the Amalfi Coast, but little did we know when we got here that the Amalfi coast is actually 34 miles long and spans across many towns. Jordan asks our waiter if he knows where our vision board photo was taken and he says, &ldquo;That&apos;s Atrani. Only one minute north of Amalfi.&rdquo;
                      </Text>
                      <Text size="sm" className="text-justify">
                        It turned out that we had driven right through Atrani on our way to Ravello earlier that day—and that we were only staying about 12 minutes away the whole time!
                      </Text>
                      <Text size="sm" className="text-justify">
                        So on Day 3, a bright, beautiful, sunny day, we started the morning off by driving straight to Atrani to get our very own photo in the exact same location as the one we&apos;ve been staring at and dreaming about from our vision board for years!
                      </Text>
                      <Text size="sm" className="text-justify">
                        This vision stuff truly works. We are constantly surprised and delighted by the Universe! We are across the world and somehow line up with the exact right places, people, and circumstances to experience the place we&apos;ve had on our vision board for years—with no planning ahead of time. That&apos;s conscious creation at its best.
                      </Text>
                    </Stack>
                  ),
                  showTitleOnCard: false,
                  showContentOnCard: false,
                  showModalImages: false,
                },
                {
                  id: 'vision-home',
                  activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/house-vision.jpg',
                  activeImageAlt: 'Active vision storyboard for the aligned dream home',
                  actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/house-actualized.jpg',
                  actualizedImageAlt: 'Actualized photo of the aligned dream home',
                  memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
                  title: 'Dream Home Actualized',
                  content: (
                    <Stack gap="md" className="text-left text-neutral-300 leading-relaxed">
                      <Text size="sm" className="text-justify">
                        We were recently married, living in a tiny apartment in Japan (for what was ultimately a failed business venture), thousands of miles from America when we put this picture of a home in Florida on our vision board.
                      </Text>
                      <Text size="sm" className="text-justify">
                        We had no idea where we ultimately wanted to live, but knew we wanted to be near the beach. As more clarity filled in on what kind of home we wanted, I (Vanessa) wrote a detailed letter to the Universe about what our home would look and feel like.
                      </Text>
                      <Text size="sm" className="text-justify">
                        Jordan found my letter I wrote to the Universe after we moved into our home, thinking I had written a gratitude letter for our house because it described every room and space in detail- then he looked at the date I wrote it - 2 years before we bought our home!
                      </Text>
                      <Text size="sm" className="text-justify">
                        Looking back at the letter and the picture we had on our vision board of our home gives us goose bumps! Everything we envisioned and dreamed about in a home actualized (in the destination of our dreams)- and even better than we imagined!
                      </Text>
                    </Stack>
                  ),
                  showTitleOnCard: false,
                  showContentOnCard: false,
                  showModalImages: false,
                },
              ]}
              mobileOnly={false}
              autoScroll
              autoScrollInterval={7000}
              desktopCardsPerView={3}
              swipeThreshold={0.25}
              hapticFeedback={true}
              autoSnap={true}
              showIndicators={true}
              cardVariant="elevated"
            />
          </Card>
        </Container>
      </section>

      {/* 7. Who this is for */}
      <section>
        <Container size="xl">
          <div>
            <div className="mb-8">
              <DoorOpen className="w-8 h-8 text-[#39FF14] mb-4" />
              <Heading level={2} className="text-white !mb-2">
                Two doors. Same missing offering.
              </Heading>
            </div>
            <Grid responsiveCols={{ mobile: 1, desktop: 2 }} gap="md">
              <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
                <Text size="lg" className="text-neutral-300">
                  <span className="text-white font-semibold">Door one:</span> you already wrote the vision. Journals, boards, “this time I mean it.” You left the session high. You lost it by Wednesday.
                </Text>
              </Card>
              <Card variant="outlined" className="bg-[#101010] border-[#1F1F1F]">
                <Text size="lg" className="text-neutral-300">
                  <span className="text-white font-semibold">Door two:</span> you want to be intentional and you do not know what you want. Love ended, Work is wrong, Money is loud, Home does not feel like Home, Health is a fight. You only have contrast. That is enough.
                </Text>
              </Card>
            </Grid>
            <Text size="lg" className="text-white font-semibold pt-8">
              Both of you reach a vibe once. Both of you lose it, because nothing is installed. If that landed in your chest, this was built for you.
            </Text>
          </div>
        </Container>
      </section>

      {/* 8. Checkout */}
      <IntensiveCheckout />

      {/* 9. Close */}
      <section>
        <Container size="xl">
          <Card variant="elevated" className="border-[#39FF14]/30 p-6 md:p-10 bg-[#39FF14]/10">
            <TwoColumn gap="lg" className="items-center">
              <Stack gap="md">
                <Heading level={2} className="text-white !mb-0">
                  Ready to transform? You are one active vision away from the life of your dreams.
                </Heading>
                <Text size="lg" className="text-neutral-300">
                  You have felt it in the pages you wrote and abandoned. In the years you could only name what you did not want. In every parking lot where the session wore off.
                </Text>
                <Text size="lg" className="text-white font-semibold">
                  The Universe doesn&apos;t respond to a vibe you reach once. It responds to the one you train and maintain.
                </Text>
              </Stack>
              <div className="flex flex-col items-start gap-3">
                <Button variant="primary" size="xl" asChild>
                  <a href="#pricing">Start living the life you choose</a>
                </Button>
                <Text size="xs" className="text-neutral-400">
                  $499 today (or 2 payments of $275). Covered by both guarantees from the moment you start.
                </Text>
              </div>
            </TwoColumn>
          </Card>
        </Container>
      </section>
    </Stack>
  )
}
