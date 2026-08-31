import { MarketingImage } from './MarketingImage'

type NotePhoto = {
  src: string
  alt: string
  width: number
  height: number
}

const LEFT: NotePhoto[] = [
  {
    src: '/home-preview/photos/jump-sunset.jpg',
    alt: 'Jordan and Vanessa leaping together on the beach at sunset',
    width: 1024,
    height: 576,
  },
  {
    src: '/home-preview/photos/japan-torii.jpg',
    alt: 'Jordan and Vanessa at a torii gate in Japan',
    width: 768,
    height: 1024,
  },
  {
    src: '/home-preview/photos/skydive-engagement.jpg',
    alt: 'Jordan and Vanessa skydiving together',
    width: 1536,
    height: 1024,
  },
  {
    src: '/home-preview/photos/family-sunset-rocks.jpg',
    alt: 'Jordan, Vanessa, and the kids on the rocks at the beach',
    width: 682,
    height: 1024,
  },
  {
    src: '/home-preview/photos/cabo-wedding.jpg',
    alt: 'Jordan and Vanessa at their wedding in Cabo',
    width: 1024,
    height: 682,
  },
  {
    src: 'https://media.vibrationfit.com/site-assets/home-preview/life-categories/fun-v2.jpg',
    alt: 'Family on the boat for a summer day on the water',
    width: 1500,
    height: 2000,
  },
  {
    src: 'https://media.vibrationfit.com/site-assets/home-preview/life-categories/work-v2.jpg',
    alt: 'Jordan holding a largemouth bass on the water',
    width: 2000,
    height: 1500,
  },
  {
    src: 'https://media.vibrationfit.com/site-assets/home-preview/life-categories/giving-v2.jpg',
    alt: 'Family and friends on the pontoon at the marina',
    width: 1500,
    height: 2000,
  },
  {
    src: '/home-preview/photos/spirituality-yoga.png',
    alt: 'The kids practicing yoga',
    width: 768,
    height: 1024,
  },
  {
    src: '/home-preview/photos/home-kitchen.png',
    alt: 'Family gathered around the kitchen table',
    width: 1024,
    height: 768,
  },
  {
    src: '/home-preview/photos/koala-australia.jpg',
    alt: 'Jordan and Vanessa with a koala in Australia',
    width: 768,
    height: 1024,
  },
  {
    src: '/home-preview/photos/work-studio.png',
    alt: 'Jordan and Vanessa on set with a professional camera',
    width: 1024,
    height: 682,
  },
]

const RIGHT: NotePhoto[] = [
  {
    src: '/home-preview/photos/maternity-beach-walk.jpg',
    alt: 'Jordan and Vanessa walking the beach while expecting their first child',
    width: 960,
    height: 637,
  },
  {
    src: '/home-preview/photos/travel-mountains.png',
    alt: 'Family on a mountain path with pine trees and open sky',
    width: 768,
    height: 1024,
  },
  {
    src: '/home-preview/photos/italy-sorrento.jpg',
    alt: 'Jordan and Vanessa on a street in Sorrento, Italy',
    width: 1024,
    height: 768,
  },
  {
    src: '/home-preview/photos/money-adeline.png',
    alt: 'Adeline smiling and holding cash',
    width: 768,
    height: 1024,
  },
  {
    src: '/home-preview/photos/founders-couch.png',
    alt: 'Jordan and Vanessa in Vibration Fit shirts, living the life they choose',
    width: 1024,
    height: 682,
  },
  {
    src: 'https://media.vibrationfit.com/site-assets/home-preview/life-categories/money-v2.jpg',
    alt: 'Family boat day with the waterfront homes behind them',
    width: 2000,
    height: 1500,
  },
  {
    src: 'https://media.vibrationfit.com/site-assets/home-preview/life-categories/stuff-v2.jpg',
    alt: 'Jordan and Oliver with a largemouth bass',
    width: 2000,
    height: 1498,
  },
  {
    src: '/home-preview/photos/australia-cliff-kiss.jpg',
    alt: 'Jordan and Vanessa kissing on a cliff in Australia',
    width: 1024,
    height: 576,
  },
  {
    src: '/home-preview/photos/stuff-golf-cart.png',
    alt: 'Vanessa and the kids on the golf cart',
    width: 1024,
    height: 768,
  },
  {
    src: '/home-preview/photos/family-lake-home.jpg',
    alt: 'Jordan, Vanessa, and their first baby at a lakeside home',
    width: 1024,
    height: 682,
  },
  {
    src: '/home-preview/photos/budget-truck.jpg',
    alt: 'Jordan and Vanessa with the moving truck, betting on the life they chose',
    width: 1024,
    height: 768,
  },
]

function Column({
  photos,
  direction,
}: {
  photos: NotePhoto[]
  direction: 'up' | 'down'
}) {
  return (
    <div className={`hp-note-collage-col is-${direction}`}>
      <div className="hp-note-collage-track">
        {photos.map((photo) => (
          <figure key={photo.src} className="hp-note-collage-tile">
            <MarketingImage
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 1024px) 22vw, 46vw"
            />
          </figure>
        ))}
        {photos.map((photo) => (
          <figure key={`${photo.src}-loop`} className="hp-note-collage-tile" aria-hidden="true">
            <MarketingImage
              src={photo.src}
              alt=""
              width={photo.width}
              height={photo.height}
              sizes="(min-width: 1024px) 22vw, 46vw"
            />
          </figure>
        ))}
      </div>
    </div>
  )
}

export function NoteCollage() {
  return (
    <div className="hp-note-collage" aria-label="Jordan and Vanessa living the life they choose">
      <Column photos={LEFT} direction="up" />
      <Column photos={RIGHT} direction="down" />
    </div>
  )
}
