export const componentProps = {
  name: 'PageHero',
  description: 'Stunning gradient-bordered hero section for page headers. Features a rainbow gradient border with dual-layer background, perfect for dashboard pages and feature landing pages.',
  props: [
    {
      name: 'eyebrow',
      type: 'React.ReactNode',
      optional: true,
      description: 'Small uppercase text displayed above the title (e.g., "THE LIFE I CHOOSE")'
    },
    {
      name: 'title',
      type: 'React.ReactNode',
      optional: false,
      description: 'Main hero title (responsive: text-2xl on mobile, text-5xl on desktop)'
    },
    {
      name: 'subtitle',
      type: 'React.ReactNode',
      optional: true,
      description: 'Descriptive text displayed below the title'
    },
    {
      name: 'children',
      type: 'React.ReactNode',
      optional: true,
      description: 'Custom content (videos, buttons, badges, etc.) displayed below subtitle'
    },
    {
      name: 'className',
      type: 'string',
      optional: true,
      description: 'Additional CSS classes to apply to the wrapper (default includes mb-8)'
    }
  ],
  usage: `import { PageHero } from '@/lib/design-system/components'
import { OptimizedVideo } from '@/components/OptimizedVideo'

<PageHero
  eyebrow="THE LIFE I CHOOSE"
  title="Welcome to Your Profile"
  subtitle="Your profile is the foundation of your journey."
>
  {/* Video */}
  <div className="mb-6">
    <OptimizedVideo url={VIDEO_URL} />
  </div>

  {/* Buttons */}
  <div className="flex gap-4 justify-center">
    <Button variant="primary">Get Started</Button>
    <Button variant="ghost">Learn More</Button>
  </div>
</PageHero>`,
  notes: [
    'Features a dual-layer gradient system: rainbow border + soft background',
    'Border gradient: #39FF14 (green) → #14B8A6 (teal) → #BF00FF (purple)',
    'Background gradient: subtle green-to-teal fade with shadow',
    'Automatically responsive: text-2xl (mobile) → text-5xl (desktop)',
    'All content is centered by default',
    'Perfect for dashboard pages, welcome pages, and feature landing pages',
    'Consistent with the VibrationFit brand aesthetic',
    'Replaces ~30 lines of nested HTML with a single clean component'
  ],
  examples: [
    '/profile/page.tsx - Profile dashboard',
    '/profile/new/page.tsx - New user welcome',
    '/life-vision/page.tsx - Vision dashboard',
    '/profile/[id]/page.tsx - Individual profile view',
    '/profile/[id]/draft/page.tsx - Draft profile editing',
    '/profile/[id]/refine/page.tsx - Profile comparison'
  ]
}

