/**
 * First-grade high-frequency (sight) words — Polk County Schools (FL)
 * First Grade High Frequency Word List. 143 words paced across four
 * nine-week quarters; students are expected to read all of them on
 * sight by the end of first grade.
 *
 * Parent-provided source (verified): Polk County Schools word list PDF.
 */

export const FIRST_GRADE_SIGHT_WORDS: { quarter: number; words: string[] }[] = [
  {
    quarter: 1,
    words: [
      'down', 'got', 'up', 'and', 'in', 'oh', 'yes', 'make', 'they', 'walk',
      'help', 'now', 'play', 'too', 'want', "don't", 'of', 'so', 'buy', 'that',
      'very', 'where', 'day', 'every', 'her', 'said', 'was', 'with', 'could',
      'friends', 'new', 'put', 'she', 'use', 'soon', 'turns', 'city', 'house',
    ],
  },
  {
    quarter: 2,
    words: [
      'gives', 'night', 'people', 'says', 'when', 'your', 'eat', 'from', 'gone',
      'grows', 'or', 'two', 'be', 'good', 'Mr.', 'need', 'our', 'right', 'saw',
      'time', 'try', 'away', 'food', 'funny', 'hide', 'how', 'many', 'some',
      'their', 'air', 'animals', 'around', 'fly', 'live', 'love', 'opened',
      'another', 'change', 'sometimes', 'take', 'there', 'about', 'by', 'family',
      'grew', 'read', 'work', 'writing', 'find', 'follow', 'found', 'four',
      'full', 'these', 'way', 'were', 'each', 'great', 'other', 'place', 'talk',
      'together', "won't", "isn't",
    ],
  },
  {
    quarter: 3,
    words: [
      'door', 'kind', 'made', 'who', 'would', 'also', 'know', 'moved', 'only',
      'room', 'should', 'those', 'write', 'over', 'town', 'world', 'different',
      'old', 'water', 'years', 'because', 'most', 'picture', 'why', 'always',
      'does', 'even', 'pretty', 'say', 'sound', 'any', 'took', 'again', 'high',
    ],
  },
  {
    quarter: 4,
    words: ['nothing', 'thought', 'cold', 'sure', 'both', 'head', 'name'],
  },
]

/** School-year quarter (nine-week periods, FL calendar): Aug–Oct = 1 … Mar–May = 4. */
export function schoolQuarter(date = new Date()): number {
  const m = date.getMonth() // 0-11
  if (m >= 7 && m <= 9) return 1 // Aug, Sep, Oct
  if (m >= 10 || m === 0) return 2 // Nov, Dec, Jan
  if (m >= 1 && m <= 2) return 3 // Feb, Mar
  return 4 // Apr–Jul (year-round homeschool keeps reviewing)
}

/**
 * This week's 12 sight-word cards: all quarters up to the current one are in
 * play (cumulative, matching the pacing guide), and a 12-word window rotates
 * through them week by week so every word keeps coming back around.
 */
export function weeklySightWords(date = new Date(), count = 12): string[] {
  const q = schoolQuarter(date)
  const pool = FIRST_GRADE_SIGHT_WORDS.filter((g) => g.quarter <= q).flatMap((g) => g.words)
  if (pool.length <= count) return pool

  const msPerWeek = 7 * 86_400_000
  const week = Math.floor(date.getTime() / msPerWeek)
  const start = (week * count) % pool.length
  const window = []
  for (let i = 0; i < count; i++) window.push(pool[(start + i) % pool.length])
  return window
}
