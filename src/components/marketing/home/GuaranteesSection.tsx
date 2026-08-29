import { Clock, Shield } from 'lucide-react'
import { Card, Grid, Heading, Stack, Text } from '@/lib/design-system'

export function GuaranteesSection() {
  return (
    <div id="our-guarantees" className="scroll-mt-28">
      <div className="bg-[#1F1F1F] border-[#333] border-2 rounded-2xl p-4 md:p-6 lg:p-8">
        <Stack gap="xs" className="md:gap-3" align="center">
          <div className="w-16 h-16 bg-[#FFFF00] rounded-full flex items-center justify-center mb-2">
            <Shield className="w-8 h-8 text-black" />
          </div>
          <Heading level={2} className="text-center mb-0 md:mb-8">Our Guarantees</Heading>

          <Grid responsiveCols={{ mobile: 1, desktop: 2 }} gap="lg" className="w-full md:items-stretch">
            <div className="relative mt-28 md:mt-28 md:flex md:flex-col">
              <div className="absolute -top-20 md:-top-24 left-1/2 -translate-x-1/2 w-40 h-40 md:w-48 md:h-48 z-10">
                <img
                  src="https://media.vibrationfit.com/site-assets/brand/guarantees/72-hour-activation-guarantee.png"
                  alt="72 Hour Activation Guarantee"
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: '100%' }}
                />
              </div>
              <Card variant="elevated" className="bg-gradient-to-br from-[#39FF14]/10 to-[#14B8A6]/10 border-[#39FF14]/30 !pt-20 md:!pt-24 lg:!pt-24 md:flex-1 md:flex md:flex-col">
                <Stack gap="md" align="center" className="pb-4 md:pb-0 md:flex-1">
                  <Heading level={3} className="text-base md:text-lg lg:text-xl text-white text-center !mb-0">
                    72&#8209;Hour Activation Guarantee
                  </Heading>
                  <div className="text-center">
                    <p className="text-sm md:text-base text-[#39FF14] font-semibold flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Clock starts today
                    </p>
                  </div>
                  <Text size="sm" className="md:text-base text-white text-center">
                    Complete all 14 guided Activation steps in 72 hours. Not satisfied? Full refund of
                    your Activation fee. No questions asked.
                  </Text>
                  <Text size="xs" className="md:text-sm text-neutral-300 text-center">
                    Completion = all 14 guided Activation steps done within 72 hours:<br />Account Settings &amp; Baseline Intake, Profile complete, 12&#8209;category Life Vision built (with VIVA), Vision Audio &amp; Mix ready, Vision Board built (12 images), 1 journal entry logged, Vibe Tribe post + community engagement, Alignment Gym tour complete, MAP activated
                  </Text>
                </Stack>
              </Card>
            </div>

            <div className="relative mt-28 md:mt-28 md:flex md:flex-col">
              <div className="absolute -top-20 md:-top-24 left-1/2 -translate-x-1/2 w-40 h-40 md:w-48 md:h-48 z-10">
                <img
                  src="https://media.vibrationfit.com/site-assets/brand/guarantees/membership-guarantee.png"
                  alt="Membership Guarantee"
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: '100%' }}
                />
              </div>
              <Card variant="elevated" className="bg-gradient-to-br from-[#14B8A6]/10 to-[#8B5CF6]/10 border-[#14B8A6]/30 !pt-20 md:!pt-24 lg:!pt-24 md:flex-1 md:flex md:flex-col">
                <Stack gap="md" align="center" className="pb-4 md:pb-0 md:flex-1">
                  <Heading level={3} className="text-base md:text-lg lg:text-xl text-white text-center !mb-0">
                    Membership Guarantee
                  </Heading>
                  <div className="text-center">
                    <p className="text-sm md:text-base text-[#8B5CF6] font-semibold flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      Clock starts today
                    </p>
                  </div>
                  <div className="text-sm md:text-base text-white text-center space-y-1">
                    <p>You have a 16&#8209;week satisfaction guarantee from your checkout date, no matter which plan you&rsquo;re on.</p>
                  </div>
                  <div className="text-xs md:text-sm text-neutral-300 text-center space-y-2">
                    <p className="font-semibold">Not satisfied within your 16&#8209;week window?</p>
                    <p>If your membership <strong className="font-semibold">hasn&rsquo;t billed yet</strong> (first charge is Day 28), we cancel the upcoming charge and end your membership at the end of the current paid period.</p>
                    <p>If it <strong className="font-semibold">has billed</strong> inside your 16-week window, we refund that charge and cancel all future renewals.</p>
                  </div>
                </Stack>
              </Card>
            </div>
          </Grid>
        </Stack>
      </div>
    </div>
  )
}
