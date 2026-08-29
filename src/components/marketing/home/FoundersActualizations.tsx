'use client'

import { Card, SwipeableCards } from '@/lib/design-system'

const CARDS = [
  {
    id: 'vision-profit',
    title: '$1M Actualized',
    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/gross-profit-vision.jpg',
    activeImageAlt: 'Active vision journal entry outlining gross profit targets',
    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/gross-profit-actualized.jpg',
    actualizedImageAlt: 'Actualized proof of gross profit aligned with the vision',
    content:
      'We went from no money in the bank and over six figures in debt to completely debt free with six figures in the bank. We made our first $1,000,000 in our own business from home.',
  },
  {
    id: 'vision-italy',
    title: 'Exact Italy Destination Actualized',
    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/italy-active.jpg',
    activeImageAlt: 'Italy on our vision board',
    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/italy-actualized.jpg',
    actualizedImageAlt: 'Standing in the exact Italy photo from our vision board',
    content:
      'We were already in Amalfi when we learned the vision-board photo was Atrani, one minute north. The next morning we stood in the exact spot we had been staring at for years.',
  },
  {
    id: 'vision-home',
    title: 'Dream Home Actualized',
    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/house-vision.jpg',
    activeImageAlt: 'Dream home on our vision board',
    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/house-actualized.jpg',
    actualizedImageAlt: 'Our actualized waterfront home',
    content:
      'We put a Florida home on our vision board while living in a tiny apartment in Japan. Years later, every room matched the letter Vanessa wrote to the Universe two years before we bought it.',
  },
  {
    id: 'vision-van-life',
    title: 'Paid Cash for Our Minivan',
    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/van-board-1.jpg',
    activeImageAlt: 'Honda Odyssey on our vision board',
    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/van-actualized-2.jpg',
    actualizedImageAlt: 'The actualized Honda Odyssey',
    content:
      'March 23, 2022: we paid cash for a brand new Honda Odyssey Elite. The same van that had been on our vision board for seven years, and on Jordan\'s for over a decade.',
  },
  {
    id: 'vision-beach-wedding',
    title: 'Dream Wedding Actualized',
    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/beach-wedding-vision.jpg',
    activeImageAlt: 'Beach wedding on our vision board',
    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/beach-wedding-actualized.jpg',
    actualizedImageAlt: 'Our actualized beach wedding in Cabo',
    content:
      'We put a random beach wedding photo on our vision board. Our actual wedding in Cabo matched it so closely they may have been taken in the exact same spot.',
  },
  {
    id: 'vision-japan',
    title: 'Japan Actualized',
    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/japan-vision.jpg',
    activeImageAlt: 'Japan on our vision board',
    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/japan-friends.jpg',
    actualizedImageAlt: 'Living the Japan vision',
    content:
      'We had no money and added Japan to our vision board anyway. The company later sponsored us to live in Osaka for over a year.',
  },
  {
    id: 'vision-australia',
    title: 'Australia Actualized',
    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/australia-vision.jpg',
    activeImageAlt: 'Australia on our vision board',
    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/australia-actualized.jpg',
    actualizedImageAlt: 'Our actualized month in Australia',
    content:
      'Australia was on the board. We used airline points for free tickets and spent a month driving the East Coast from Sydney to Mackay.',
  },
  {
    id: 'vision-fit-couple',
    title: 'Fit Couple Actualized',
    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/fit-couple-active.jpg',
    activeImageAlt: 'Fitness vision on our board',
    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/fit-3-actualized.jpg',
    actualizedImageAlt: 'The actualized fit couple photo',
    content:
      'Jordan gained 30 pounds after our second child, then got into harmony with wanting a better body before a cruise. By boarding day, the 30 pounds were gone.',
  },
  {
    id: 'vision-mountain-chalet',
    title: 'Mountain Chalet Vacation Actualized',
    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/mountain-lodge-active.jpg',
    activeImageAlt: 'Mountain chalet on our vision board',
    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/mountain-lodge-actualized.jpg',
    actualizedImageAlt: 'The actualized Aspen chalet trip',
    content:
      'We marked off renting a mountain chalet and treating our family: a week near Aspen for a 75th birthday and a retirement, on 40 acres.',
  },
  {
    id: 'vision-breville',
    title: 'Breville Coffee Maker Actualized',
    activeImage: 'https://media.vibrationfit.com/site-assets/proof-wall/breville-active.jpg',
    activeImageAlt: 'Breville on our vision board',
    actualizedImage: 'https://media.vibrationfit.com/site-assets/proof-wall/breville-actualized.jpg',
    actualizedImageAlt: 'The actualized Breville coffee maker',
    content:
      'We never told anyone we wanted this coffee machine. At the baby shower, friends gave us a nearly $2,000 model of the one on our vision board.',
  },
]

export function FoundersActualizations() {
  return (
    <Card variant="elevated" className="border-2 border-[#39FF14]/20 bg-black/40 p-4 md:p-6 lg:p-8">
      <SwipeableCards
        title="Vision Transformations"
        subtitle="From Vision to Actualized Reality"
        cards={CARDS.map((card) => ({
          ...card,
          memberNames: ['Jordan Buckingham', 'Vanessa Buckingham'],
          showTitleOnCard: false,
          showContentOnCard: false,
          showModalImages: false,
        }))}
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
  )
}
