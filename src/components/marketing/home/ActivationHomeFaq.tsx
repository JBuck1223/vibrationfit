import { FaqSection, type FaqItem } from '@/components/marketing/home/FaqSection'

const ITEMS: FaqItem[] = [
  {
    id: 'what-is-it',
    title: 'What is the free Activation?',
    description:
      'A personalized working sample of Vibration Fit — one area of your life, built around you, in about 10 to 15 minutes. You tell VIVA the truth about now. She helps you name what you are choosing instead. Then she forges the tools: your Life I Choose, Future-Self Story, Incantation, SparkQuery, Vision Audio, a song, and images for your board. You can read it, hear it, feel it, and keep it. No credit card.',
  },
  {
    id: 'after',
    title: 'What happens after I create it?',
    description:
      'You enter the Activation. You download everything. It is yours. If you want VIVA beside you across all 12 categories — new Activations, the daily practice, Vibe Tribe, weekly Alignment Gym, and a system that evolves as life changes — that is membership. $99 every 28 days. Cancel anytime. The Activation you just made does not depend on joining.',
  },
  {
    id: 'difference',
    title: 'What is the difference between the free Activation and membership?',
    description:
      'The free Activation is one complete rep of the loop, in one area. Membership is the living system: VIVA whenever you need her, Activations across all 12 life categories, your visions, stories, audio, music, and board in one place, the Vibe Tribe community, and weekly Alignment Gym — where we get together as conscious creators and practice the process of Conscious Creation together. Install it once. Run it daily. Evolve as life changes.',
  },
  {
    id: 'community',
    title: 'What are Vibe Tribe and Alignment Gym?',
    description:
      'Vibe Tribe is the member community — a place to share wins, wobbles, and the life you are choosing with people who actually practice this. Alignment Gym is weekly: we get together as conscious creators and practice the process of Conscious Creation together. Both come with membership. You do not have to run this loop alone.',
  },
  {
    id: 'cost',
    title: 'What does it cost?',
    description:
      'The Activation is free. Entering the system is $99 every 28 days. That is the whole offer. No initiation fee. No contract. Cancel anytime.',
  },
  {
    id: 'billing',
    title: 'When do you charge me?',
    description:
      'Only if you choose to join. The free Activation never asks for a card. Membership starts the day you enter, then $99 every 28 days until you cancel.',
  },
  {
    id: 'cancel',
    title: 'Can I cancel anytime?',
    description:
      'Yes. One click in your account. Future charges stop. You keep everything you have already created — including your free Activation.',
  },
  {
    id: 'dont-know',
    title: 'What if I don\'t know what I want?',
    description:
      'You do not need a finished vision to start. Tell VIVA what is not working — what feels frustrating, stuck, or calling you. She knows how to turn contrast into clarity, in your language, from your words.',
  },
  {
    id: 'tried-loa',
    title: 'What if I\'ve tried manifestation and it didn\'t stick?',
    description:
      'Knowing the law is not the same as living it. The free Activation is one complete rep of the loop. Membership is what makes the loop a practice — so a shitty day does not take your vision down with it.',
  },
  {
    id: 'skeptical',
    title: 'What if I\'m skeptical?',
    description:
      'Start free. Feel your own Activation. Read the receipts. Join only if you want the system. Cancel anytime if you do not. We would rather show you than convince you.',
  },
  {
    id: 'doesnt-work',
    title: 'What if it doesn\'t work for me?',
    description:
      'You already leave with a real Activation you can keep. If you join and it is not for you, cancel anytime. No hoops. No checklist. No initiation fee to claw back.',
  },
  {
    id: 'card',
    title: 'Do I need a credit card to start?',
    description:
      'No. First name and email. A card is only asked for if you choose to enter membership.',
  },
  {
    id: 'keep',
    title: 'What do I keep if I never join?',
    description:
      'Everything from your Activation — the writing, the audio, the song, the images. Download it. Revisit it. It is yours either way.',
  },
  {
    id: 'course',
    title: 'Is this a course I have to finish?',
    description:
      'No. Conscious Creation is not information you collect. It is a loop you live. Vibration Fit is the software system that helps you run it.',
  },
  {
    id: 'tax',
    title: 'Do you charge sales tax?',
    description:
      'Not at checkout right now. The price you see is the price you pay, plus any bank or currency fees your bank may add. If that ever changes, we will show the tax clearly before you pay.',
  },
]

export function ActivationHomeFaq() {
  return <FaqSection items={ITEMS} />
}
