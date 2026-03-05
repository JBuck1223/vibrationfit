/**
 * Bookend Templates for Life Vision Documents
 * 
 * Forward (opening) and Conclusion (closing) sections that frame the vision.
 * Spiritual bookends - opening invocations to align with the vision process
 * and closing statements to release its unfolding to the universe.
 * 
 * Templates vary by perspective: singular (I/my) | plural (we/our)
 */

export type WooLevel = 'high' | 'medium' | 'low'
export type Perspective = 'singular' | 'plural'

export interface BookendTemplate {
  forward: string
  conclusion: string
}

const BOOKEND_TEMPLATES: Record<Perspective, BookendTemplate> = {
  plural: {
    forward: `We are doing this! We're taking the initiative to have a vibration transformation in our life!

As we align with this vision, we unleash the power of the universe and allow the most fun and satisfying version of us to be now. With this universal leverage on our side, everything is possible.

This vision serves as our magnet, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

We hereby give the Universe full permission to open all doors leading to the joyful experience of this or something even better.`,
    conclusion: `We have just intentionally aligned with this active vision and now consciously choose to activate its full creative power in our lives.

We are now powerful magnets in harmony with this active vision, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

We hereby give the Universe full permission to open all doors leading to the joyful experience of this or something even better. 

Thank you in advance for this fun and satisfying journey of unlimited creation. We are truly grateful for the opportunity to be here and experience ourselves as the conscious creators of The Life We Choose.`
  },
  singular: {
    forward: `I am doing this! I'm taking the initiative to have a vibration transformation in my life!

As I align with this vision, I unleash the power of the universe and allow the most fun and satisfying version of me to be now. With this universal leverage on my side, everything is possible.

This vision serves as my magnet, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

I hereby give the Universe full permission to open all doors leading to the joyful experience of this or something even better.`,
    conclusion: `I have just intentionally aligned with this active vision and now consciously choose to activate its full creative power in my life.

I am now a powerful magnet in harmony with this active vision, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

I hereby give the Universe full permission to open all doors leading to the joyful experience of this or something even better. 

Thank you in advance for this fun and satisfying journey of unlimited creation. I am truly grateful for the opportunity to be here and experience myself as the conscious creator of The Life I Choose.`
  }
}

/**
 * Get bookend template by perspective
 * WooLevel param kept for backward compatibility but is ignored
 */
export function getBookendTemplate(_wooLevel: WooLevel, perspective: Perspective): BookendTemplate {
  return BOOKEND_TEMPLATES[perspective]
}

/**
 * Legacy compatibility -- kept so callers don't break
 */
export function determineWooLevel(_wooScore?: number): WooLevel {
  return 'high'
}
