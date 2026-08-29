import Image from 'next/image'

const PERMISSION = 'Member-reported result. Shared with permission.'

const PHOTOS = {
  misty:
    'https://media.vibrationfit.com/user-uploads/5c49b204-0c1b-4c5e-bb33-118f9d251259/profile/avatar/1773446993357-7b91m913gzl-profile-picture.jpg',
  alicia:
    'https://media.vibrationfit.com/user-uploads/4ed2a268-9df0-44da-8a0b-641238f92378/profile/avatar/1773359526286-zs6slp1d2j-profile-picture.jpg',
  cindy:
    'https://media.vibrationfit.com/user-uploads/898e008f-d3d5-4f05-947b-138f6c8b92ba/profile/avatar/1773255229354-5vugx9p8leu-profile-picture.jpg',
  barbara:
    'https://media.vibrationfit.com/user-uploads/b12e9107-3ca4-4de2-8588-0e187248a7ee/profile/avatar/1784228229958-3hpboub14t3-profile-picture.jpg',
  michele:
    'https://media.vibrationfit.com/user-uploads/ef171ba4-746e-4065-8cff-c12dab6c9e6c/profile/avatar/1782860308527-kpkvb6uk9z-profile-picture-optimized.webp',
  lisa:
    'https://media.vibrationfit.com/user-uploads/25b2b667-9ebd-420c-916a-1ecc2baf9101/profile/avatar/1774900321590-xmksi7gopz-profile-picture.jpg',
}

function Permission() {
  return <p className="hp-proof-permission">{PERMISSION}</p>
}

function Beat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="hp-beat">
      <p className="hp-beat-label">{label}</p>
      <p>{children}</p>
    </div>
  )
}

function Shot({
  src,
  alt,
  width,
  height,
}: {
  src: string
  alt: string
  width: number
  height: number
}) {
  return (
    <figure className="hp-shot hp-shot-crop">
      <Image src={src} alt={alt} width={width} height={height} />
      <figcaption>{PERMISSION}</figcaption>
    </figure>
  )
}

function StoryHead({
  name,
  label,
  photo,
}: {
  name: string
  label: string
  photo: string
}) {
  return (
    <div className="hp-story-head">
      <div className="hp-story-avatar">
        <Image src={photo} alt={name} width={96} height={96} />
      </div>
      <div>
        <p className="hp-proof-label">{label}</p>
        <h3 className="hp-proof-name">{name}</h3>
      </div>
    </div>
  )
}

export function ReceiptsSection() {
  return (
    <div className="hp-receipts">
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-[#39FF14]">
          Proof
        </p>
        <h2 className="text-[2rem] font-extrabold leading-[1.1] text-white md:text-[2.75rem]">
          The <span className="hp-display text-[#39FF14]">Receipts</span>
        </h2>
        <div className="mt-5 space-y-3 text-lg leading-[1.6] text-neutral-300">
          <p>We can talk about conscious creation all day. We&rsquo;d rather show you.</p>
          <p>Different people. Different desires. Different categories.</p>
          <p className="hp-display text-[1.65rem] leading-tight text-[#39FF14] md:text-[2rem]">
            One system.
          </p>
        </div>
      </div>

      <div className="hp-featured">
        <article className="hp-story">
          <StoryHead name="Misty" label="Family" photo={PHOTOS.misty} />
          <p className="hp-proof-punch">Six days later, her son texted.</p>
          <div className="hp-beats">
            <Beat label="What she wanted">Connection with her son and grandchildren.</Beat>
            <Beat label="What contrast revealed">Her son had not communicated with her in years.</Beat>
            <Beat label="What she practiced">
              She journaled the emotional reaction, wrote a new story, and listened to it.
            </Beat>
            <Beat label="What she reported">
              Six days later, her son texted. They spoke for an entire weekend.
            </Beat>
          </div>
          <Permission />
        </article>

        <article className="hp-story">
          <StoryHead name="Alicia" label="Stuff" photo={PHOTOS.alicia} />
          <p className="hp-proof-punch">Ten miles from her house. Fully stocked.</p>
          <div className="hp-beats">
            <Beat label="What she wanted">A camper for family trips and summer income.</Beat>
            <Beat label="What contrast revealed">
              She believed she could only spend $5,000 to $6,000, and could not find the right one.
            </Beat>
            <Beat label="What she reported">
              Her dad found a fully stocked camper ten miles from her house. She bought it.
            </Beat>
          </div>
          <p className="hp-proof-quote">
            &ldquo;I wanted it so bad to take all my grandkids camping all summer... He goes, Alicia. You
            have to buy this right this minute.&rdquo;
          </p>
          <Permission />
        </article>

        <article className="hp-story">
          <StoryHead name="Cindy" label="Work" photo={PHOTOS.cindy} />
          <p className="hp-proof-punch">A major paying gig, then three more in one day.</p>
          <div className="hp-beats">
            <Beat label="What she wanted">Recognition, collaboration, and a career in music.</Beat>
            <Beat label="What she reported">
              A major paying gig, three new gigs in one day, and the first scene of her musical staged.
              She later said people were recognizing her and asking to work together.
            </Beat>
          </div>
          <p className="hp-proof-quote">
            &ldquo;Just got 3 new gigs today to go with the 2 invitations I got this weekend... it is like
            walking into a garden and seeing the seeds are finally sprouting!&rdquo;
          </p>
          <Permission />
        </article>

        <article className="hp-story">
          <StoryHead name="Barbara" label="Fun" photo={PHOTOS.barbara} />
          <p className="hp-proof-punch">Then friends invited her to a lake house.</p>
          <div className="hp-beats">
            <Beat label="What she wanted">Friendship and adventures. She took the lake house out of her vision.</Beat>
            <Beat label="What she reported">
              Days later, friends invited her and her husband to a lake cabin in the Smokies.
            </Beat>
          </div>
          <p className="hp-proof-quote">
            &ldquo;Of course, we said YES! ... It&rsquo;s a big win.&rdquo;
          </p>
          <Permission />
        </article>

        <article className="hp-story">
          <StoryHead name="Michele" label="Family" photo={PHOTOS.michele} />
          <p className="hp-proof-punch">This is not just a WIN, it is a miracle.</p>
          <div className="hp-beats">
            <Beat label="What she wanted">
              Easy, two-way communication with her brothers, and her daughter close to her youngest
              brother.
            </Beat>
            <Beat label="What contrast revealed">
              After a fight around 2021, she and her brother were barely speaking.
            </Beat>
            <Beat label="What she practiced">
              She wrote it into her Life Vision: conversations that were open and easy, communication
              flowing both ways.
            </Beat>
            <Beat label="What she reported">
              That same brother called, acknowledged the difficulty, and invited her to Thanksgiving
              dinner with her mother and daughter.
            </Beat>
          </div>
          <p className="hp-proof-quote">
            &ldquo;What a HUGE shift in my life today!!!&rdquo;
          </p>
          <Permission />
        </article>

        <article className="hp-story">
          <StoryHead name="Lisa" label="Home" photo={PHOTOS.lisa} />
          <p className="hp-proof-punch">That same day, the solutions started ringing.</p>
          <div className="hp-beats">
            <Beat label="What she practiced">
              She journaled a wobble and had VIVA rewrite the story.
            </Beat>
            <Beat label="What she reported">
              Her phone started ringing the same day: brush hog, AC service before a heat wave, and a
              working dryer.
            </Beat>
          </div>
          <p className="hp-proof-quote">
            &ldquo;I journaled a definite wobble, had VIVA rewrite the story, and all the sudden my phone
            starts ringing.&rdquo;
          </p>
          <Permission />
        </article>
      </div>

      <article className="hp-more-misty">
        <div className="hp-more-misty-copy">
          <StoryHead name="More From Misty" label="Money" photo={PHOTOS.misty} />
          <p className="hp-proof-punch">More than $100,000 hit the bank.</p>
          <p className="hp-proof-quote">
            After journaling through frustration and rewriting the story, Misty reported that more than
            $100,000 hit the bank within two hours, along with new work opportunities.
          </p>
          <div className="hp-beats">
            <Beat label="What she practiced">
              She journaled the frustration that morning, used VIVA to rewrite the story, and stayed
              with her Life I Choose.
            </Beat>
            <Beat label="What she reported">
              Within two hours, more than $100,000 hit the bank. She also reported a song going live on
              North Dakota radio, a $100,000 job opportunity, and a trip to Grenada.
            </Beat>
          </div>
          <ol className="hp-timeline">
            <li>Song going live on North Dakota radio</li>
            <li>$100,000 job opportunity</li>
            <li>Grenada trip</li>
            <li>Money hitting the bank</li>
          </ol>
          <p className="hp-proof-quote">
            &ldquo;I would say VibrationFit is working for me, can&rsquo;t even tell you how appreciative I
            am of you two bringing this forth!&rdquo;
          </p>
          <Permission />
        </div>
        <div className="hp-more-misty-shots">
          <Shot
            src="/home-preview/receipts/misty-100k-bank-redacted.png"
            alt="Misty reporting more than 100k hitting the bank after journaling"
            width={720}
            height={520}
          />
        </div>
      </article>
    </div>
  )
}
