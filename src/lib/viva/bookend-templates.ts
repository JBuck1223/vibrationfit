/**
 * Bookend Templates for Life Vision Documents
 * 
 * These are the Forward (opening) and Conclusion (closing) sections that
 * frame the vision document. They serve as spiritual bookends - opening
 * invocations to align with the vision process and closing statements to
 * release its unfolding to the universe.
 * 
 * Templates vary by:
 * - Woo Level: high | medium | low (based on user's voice profile)
 * - Perspective: singular (I/my) | plural (we/our)
 */

export type WooLevel = 'high' | 'medium' | 'low'
export type Perspective = 'singular' | 'plural'

export interface BookendTemplate {
  forward: string
  conclusion: string
}

export const BOOKEND_TEMPLATES: Record<WooLevel, Record<Perspective, BookendTemplate>> = {
  high: {
    plural: {
      forward: `We are doing this! We're taking the initiative to have a vibration transformation in our life!

As we align with this vision, we unleash the power of the universe and allow the most fun and satisfying version of us to be now. With this universal leverage on our side, everything is possible.

This vision serves as our magnet, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

We hereby give the Universe full permission to open all doors leading to the joyful experience of this or something even better.`,
      conclusion: `We have just intentionally aligned with this active vision and now consciously choose to activate its full creative power in our lives.

We are now powerful magnets in harmony with this active vision, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

We hereby give the Universe full permission to open all doors leading to the joyful experience of this or something even better. 

Thank you in advance for this fun and satisfying journey of unlimited creation. We are truly grateful for the opportunity to be here and experience ourselves as the conscious creators of the The Life We Choose.`
    },
    singular: {
      forward: `I am doing this! I'm taking the initiative to have a vibration transformation in my life!

As I align with this vision, I unleash the power of the universe and allow the most fun and satisfying version of me to be now. With this universal leverage on my side, everything is possible.

This vision serves as my magnet, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

I hereby give the Universe full permission to open all doors leading to the joyful experience of this or something even better.`,
      conclusion: `I have just intentionally aligned with this active vision and now consciously choose to activate its full creative power in my life.

I am now a powerful magnet in harmony with this active vision, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

I hereby give the Universe full permission to open all doors leading to the joyful experience of this or something even better. 

Thank you in advance for this fun and satisfying journey of unlimited creation. I am truly grateful for the opportunity to be here and experience myself as the conscious creator of the The Life I Choose.`
    }
  },
  medium: {
    plural: {
      forward: `We are doing this! We're taking the initiative to create a vibrational transformation in our life!

As we align with this vision, we tap into our highest potential and allow the most fulfilling version of us to emerge now. With this alignment and clarity on our side, everything is possible.

This vision serves as our magnet, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

We open ourselves fully to the joyful experience of this or something even better.`,
      conclusion: `We have just intentionally aligned with this active vision and now consciously choose to activate its full power in our lives.

We are now powerful magnets in harmony with this active vision, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

We remain open to all possibilities leading to the joyful experience of this or something even better.

Thank you in advance for this meaningful and satisfying journey. We are truly grateful for the opportunity to be here and experience ourselves as the conscious creators of the The Life We Choose.`
    },
    singular: {
      forward: `I am doing this! I'm taking the initiative to create a vibrational transformation in my life!

As I align with this vision, I tap into my highest potential and allow the most fulfilling version of me to emerge now. With this alignment and clarity on my side, everything is possible.

This vision serves as my magnet, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

I open myself fully to the joyful experience of this or something even better.`,
      conclusion: `I have just intentionally aligned with this active vision and now consciously choose to activate its full power in my life.

I am now a powerful magnet in harmony with this active vision, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. 

I remain open to all possibilities leading to the experience of this or something even better.

Thank you in advance for this meaningful and satisfying journey. I am truly grateful for the opportunity to be here and experience myself as the conscious creator of the The Life I Choose.`
    }
  },
  low: {
    plural: {
      forward: `We are doing this! We're taking the initiative to create a vibrational transformation in our life!

As we align with this vision, we unlock our full potential and allow the most fulfilling version of us to emerge now. With this clarity and focus on our side, everything is possible.

This vision serves as our magnet, attracting the people, ideas, resources, strategies, events, and circumstances that support its realization. 

We commit fully to the experience of this or something even better.`,
      conclusion: `We have just intentionally aligned with this active vision and now choose to activate its full power in our lives.

We are now powerful magnets in harmony with this active vision, attracting the people, ideas, resources, strategies, events, and circumstances that support its unfolding. 

We remain open to all possibilities leading to the experience of this or something even better.

Thank you in advance for this meaningful journey. We are truly grateful for the opportunity to be here and experience ourselves as the conscious creators of the The Life We Choose.`
    },
    singular: {
      forward: `I am doing this! I'm taking the initiative to create a vibrational transformation in my life!

As I align with this vision, I unlock my full potential and allow the most fulfilling version of me to emerge now. With this clarity and focus on my side, everything is possible.

This vision serves as my magnet, attracting the people, ideas, resources, strategies, events, and circumstances that support its realization. 

I commit fully to the experience of this or something even better.`,
      conclusion: `I have just intentionally aligned with this active vision and now choose to activate its full power in my life.

I am now a powerful magnet in harmony with this active vision, attracting the people, ideas, resources, strategies, events, and circumstances that support its unfolding. 

I remain open to all possibilities leading to the experience of this or something even better.

Thank you in advance for this meaningful journey. I am truly grateful for the opportunity to be here and experience myself as the conscious creator of the The Life I Choose.`
    }
  }
}

/**
 * Get bookend template based on woo level and perspective
 */
export function getBookendTemplate(wooLevel: WooLevel, perspective: Perspective): BookendTemplate {
  return BOOKEND_TEMPLATES[wooLevel][perspective]
}

/**
 * Determine woo level from voice profile
 * Uses the 'woo' score from voice_profiles table
 */
export function determineWooLevel(wooScore?: number): WooLevel {
  if (!wooScore) return 'medium' // Default to medium if no score
  
  if (wooScore >= 7) return 'high'      // 7-10: High woo
  if (wooScore >= 4) return 'medium'    // 4-6: Medium woo
  return 'low'                          // 1-3: Low woo
}

