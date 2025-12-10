'use client'

import { PageHero, Button, Badge, VersionBadge, StatusBadge } from '@/lib/design-system/components'
import { ArrowRight, Eye, CheckCircle, CalendarDays } from 'lucide-react'

export const PageHeroExamples = {
  basic: {
    title: 'Basic Hero',
    description: 'Simple hero with just a title',
    component: (
      <PageHero
        title="Page Title"
      />
    ),
    code: `<PageHero
  title="Page Title"
/>`
  },

  withEyebrow: {
    title: 'With Eyebrow',
    description: 'Hero with eyebrow text above title',
    component: (
      <PageHero
        eyebrow="THE LIFE I CHOOSE"
        title="Life Vision"
      />
    ),
    code: `<PageHero
  eyebrow="THE LIFE I CHOOSE"
  title="Life Vision"
/>`
  },

  withSubtitle: {
    title: 'With Subtitle',
    description: 'Hero with descriptive subtitle',
    component: (
      <PageHero
        eyebrow="THE LIFE I CHOOSE"
        title="All Life Visions"
        subtitle="View all of your Life Vision versions below."
      />
    ),
    code: `<PageHero
  eyebrow="THE LIFE I CHOOSE"
  title="All Life Visions"
  subtitle="View all of your Life Vision versions below."
/>`
  },

  withButtons: {
    title: 'With Action Buttons',
    description: 'Hero with call-to-action buttons',
    component: (
      <PageHero
        eyebrow="THE LIFE I CHOOSE"
        title="Welcome to Your Profile"
        subtitle="Your profile is the foundation of your journey with VibrationFit."
      >
        <div className="flex flex-col md:flex-row gap-2 md:gap-4 justify-center items-center max-w-2xl mx-auto">
          <Button variant="primary" size="sm" className="w-full md:w-auto flex-1 md:flex-none">
            <ArrowRight className="mr-2 h-4 w-4" />
            Get Started
          </Button>
          <Button variant="ghost" size="sm" className="w-full md:w-auto flex-1 md:flex-none">
            Learn More
          </Button>
        </div>
      </PageHero>
    ),
    code: `<PageHero
  eyebrow="THE LIFE I CHOOSE"
  title="Welcome to Your Profile"
  subtitle="Your profile is the foundation of your journey."
>
  <div className="flex gap-4 justify-center">
    <Button variant="primary">
      <ArrowRight className="mr-2 h-4 w-4" />
      Get Started
    </Button>
    <Button variant="ghost">Learn More</Button>
  </div>
</PageHero>`
  },

  withBadges: {
    title: 'With Version Badges',
    description: 'Hero with version and status badges',
    component: (
      <PageHero
        eyebrow="DRAFT PROFILE"
        title="Refine Your Profile"
        subtitle="Changed fields will show in yellow. Once you are happy with your changes, click 'Commit as Active Profile'."
      >
        <div className="text-center mb-6">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
            <VersionBadge versionNumber={2} status="draft" />
            <StatusBadge status="draft" subtle={true} className="uppercase tracking-[0.25em]" />
            <span className="text-neutral-300 text-xs md:text-sm">
              Created: Jan 15, 2024
            </span>
            <Badge variant="warning" className="!bg-[#FFFF00]/20 !text-[#FFFF00] !border-[#FFFF00]/30">
              5 fields changed
            </Badge>
          </div>
        </div>
        <div className="flex flex-row flex-wrap gap-2 md:gap-4 max-w-2xl mx-auto">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View Active
          </Button>
          <Button variant="primary" size="sm" className="flex-1">
            <CheckCircle className="w-4 h-4 mr-2" />
            Commit Changes
          </Button>
        </div>
      </PageHero>
    ),
    code: `<PageHero
  eyebrow="DRAFT PROFILE"
  title="Refine Your Profile"
  subtitle="Changed fields will show in yellow..."
>
  <div className="text-center mb-6">
    <div className="inline-flex gap-3 px-4 py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50">
      <VersionBadge versionNumber={2} status="draft" />
      <StatusBadge status="draft" />
      <span>Created: Jan 15, 2024</span>
      <Badge variant="warning">5 fields changed</Badge>
    </div>
  </div>
  <div className="flex gap-4">
    <Button variant="outline">View Active</Button>
    <Button variant="primary">Commit Changes</Button>
  </div>
</PageHero>`
  },

  profileDashboard: {
    title: 'Profile Dashboard',
    description: 'Real-world example from /profile page',
    component: (
      <PageHero
        eyebrow="THE LIFE I CHOOSE"
        title="Jordan Buckingham"
        subtitle="View and manage your profile versions below."
      >
        <div className="text-center mb-6">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
            <VersionBadge versionNumber={1} status="active" />
            <StatusBadge status="active" className="uppercase tracking-[0.25em]" />
            <div className="flex items-center gap-1.5 text-neutral-300 text-xs md:text-sm">
              <CalendarDays className="w-4 h-4 text-neutral-500" />
              <span className="font-medium">Created:</span>
              <span>Dec 9, 2025</span>
            </div>
            <span className="text-xs md:text-sm font-semibold text-[#39FF14]">
              87%
            </span>
          </div>
        </div>
        <div className="flex flex-row flex-wrap gap-2 md:gap-4 max-w-2xl mx-auto">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View Profile
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Edit Profile
          </Button>
        </div>
      </PageHero>
    ),
    code: `<PageHero
  eyebrow="THE LIFE I CHOOSE"
  title="Jordan Buckingham"
  subtitle="View and manage your profile versions below."
>
  {/* Version badges */}
  <div className="text-center mb-6">
    <div className="inline-flex gap-3 px-4 py-3 rounded-2xl bg-neutral-900/60">
      <VersionBadge versionNumber={1} status="active" />
      <StatusBadge status="active" />
      <span>Created: Dec 9, 2025</span>
      <span className="text-[#39FF14]">87%</span>
    </div>
  </div>
  {/* Action buttons */}
  <div className="flex gap-4">
    <Button variant="outline">View Profile</Button>
    <Button variant="outline">Edit Profile</Button>
  </div>
</PageHero>`
  },

  comparison: {
    title: 'Comparison Header',
    description: 'Hero for side-by-side comparison pages',
    component: (
      <PageHero
        eyebrow="PROFILE COMPARISON"
        title="Review Profile Changes"
        subtitle="Compare active and draft profiles side-by-side by section"
      >
        <div className="text-center mb-6">
          <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-2xl bg-neutral-900/60 border border-neutral-700/50 backdrop-blur-sm">
            <VersionBadge versionNumber={2} status="draft" />
            <StatusBadge status="draft" subtle={true} className="uppercase tracking-[0.25em]" />
            <span className="text-neutral-300 text-xs md:text-sm">
              Created: Jan 20, 2024
            </span>
            <Badge variant="warning" className="!bg-[#FFFF00]/20 !text-[#FFFF00] !border-[#FFFF00]/30">
              3 of 12 Sections Changed
            </Badge>
          </div>
        </div>
        <div className="flex flex-row flex-wrap gap-2 md:gap-4 max-w-3xl mx-auto">
          <Button variant="outline" size="sm" className="flex-1">
            <Eye className="w-4 h-4 mr-2" />
            View Draft
          </Button>
          <Button variant="primary" size="sm" className="flex-1">
            <CheckCircle className="w-4 h-4 mr-2" />
            Review & Commit
          </Button>
        </div>
      </PageHero>
    ),
    code: `<PageHero
  eyebrow="PROFILE COMPARISON"
  title="Review Profile Changes"
  subtitle="Compare active and draft profiles side-by-side"
>
  <div className="text-center mb-6">
    <div className="inline-flex gap-3 px-4 py-3 rounded-2xl bg-neutral-900/60">
      <VersionBadge versionNumber={2} status="draft" />
      <StatusBadge status="draft" />
      <span>Created: Jan 20, 2024</span>
      <Badge variant="warning">3 of 12 Sections Changed</Badge>
    </div>
  </div>
  <div className="flex gap-4">
    <Button variant="outline">View Draft</Button>
    <Button variant="primary">Review & Commit</Button>
  </div>
</PageHero>`
  },
}

