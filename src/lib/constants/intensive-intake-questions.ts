/**
 * Intensive Intake Questions - Single Source of Truth
 * 
 * This file defines all questions for:
 *   - /intensive/intake (pre_intensive phase)
 *   - /intensive/intake/unlock (post_intensive phase)
 * 
 * Database table: intensive_responses
 * Last Updated: January 8, 2026
 */

// Question types
export type QuestionType = 'rating' | 'multiple_choice' | 'text' | 'boolean';

export interface IntakeQuestion {
  id: string;                    // Database column name
  order: number;                 // Display order on page
  type: QuestionType;
  label: string;                 // Short label for display
  questionPre: string;           // Question text for pre_intensive
  questionPost: string;          // Question text for post_intensive
  hint?: string;                 // Helper text (e.g., "0 if unknown")
  options?: { value: string; label: string }[];  // For multiple_choice
  min?: number;                  // For rating (default 0)
  max?: number;                  // For rating (default 10)
  showInPre: boolean;            // Show in pre_intensive survey
  showInPost: boolean;           // Show in post_intensive survey
  metricsKey?: string;           // Key for metrics_comparison JSONB
}

/**
 * All intake questions in display order
 */
export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: 'vision_clarity',
    order: 1,
    type: 'rating',
    label: 'Vision Clarity',
    questionPre: 'On a scale 1-10, how clear is your vision for your life right now?',
    questionPost: 'Right now, after completing the Intensive, how clear is your vision for your life?',
    min: 0,
    max: 10,
    showInPre: true,
    showInPost: true,
    metricsKey: 'vision_clarity',
  },
  {
    id: 'vibrational_harmony',
    order: 2,
    type: 'rating',
    label: 'Vibrational Harmony',
    questionPre: 'On a scale 1-10, how often do you feel "in vibrational harmony" with that vision?',
    questionPost: 'Right now, how often do you feel "in vibrational harmony" with that vision?',
    min: 0,
    max: 10,
    showInPre: true,
    showInPost: true,
    metricsKey: 'vibrational_harmony',
  },
  {
    id: 'vibrational_constraints_clarity',
    order: 3,
    type: 'rating',
    label: 'Vibrational Constraints',
    questionPre: 'On a scale 1-10, how clear are you on your vibrational constraints?',
    questionPost: 'How clear are you now on your vibrational constraints and what throws off your signal?',
    hint: 'If you don\'t know what this means, put 0.',
    min: 0,
    max: 10,
    showInPre: true,
    showInPost: true,
    metricsKey: 'vibrational_constraints_clarity',
  },
  {
    id: 'vision_iteration_ease',
    order: 4,
    type: 'rating',
    label: 'Vision Iteration Ease',
    questionPre: 'On a scale 1-10, how easy is it for you to create new iterations of your life vision?',
    questionPost: 'How easy is it for you to create new iterations of your life vision when things change?',
    min: 0,
    max: 10,
    showInPre: true,
    showInPost: true,
    metricsKey: 'vision_iteration_ease',
  },
  {
    id: 'has_audio_tracks',
    order: 5,
    type: 'multiple_choice',
    label: 'Audio Tracks Status',
    questionPre: 'Do you currently have audio tracks of your life vision?',
    questionPost: 'Do you have audio tracks of your life vision now?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes', label: 'Yes' },
    ],
    showInPre: true,
    showInPost: true,
  },
  {
    id: 'audio_iteration_ease',
    order: 6,
    type: 'rating',
    label: 'Audio Iteration Ease',
    questionPre: 'On a scale 1-10, how easy is it for you to create new iterations of your life vision audios?',
    questionPost: 'How easy is it for you to create new iterations of your life vision audios?',
    min: 0,
    max: 10,
    showInPre: true,
    showInPost: true,
    metricsKey: 'audio_iteration_ease',
  },
  {
    id: 'has_vision_board',
    order: 7,
    type: 'multiple_choice',
    label: 'Vision Board Status',
    questionPre: 'Do you have a vision board?',
    questionPost: 'Do you have a vision board now?',
    options: [
      { value: 'no', label: 'No' },
      { value: 'yes_physical', label: 'Yes, a physical one' },
      { value: 'yes_digital', label: 'Yes, a digital one' },
      { value: 'yes_both', label: 'Yes, both physical and digital' },
    ],
    showInPre: true,
    showInPost: true,
  },
  {
    id: 'vision_board_management',
    order: 8,
    type: 'rating',
    label: 'Vision Board Management',
    questionPre: 'On a scale 1-10, how easy is it for you to view and manage the items on your vision board?',
    questionPost: 'How easy is it for you now to view and manage the items on your vision board?',
    hint: 'Put 0 if you don\'t have one.',
    min: 0,
    max: 10,
    showInPre: true,
    showInPost: true,
    metricsKey: 'vision_board_management',
  },
  {
    id: 'journey_capturing',
    order: 9,
    type: 'rating',
    label: 'Journey Capturing',
    questionPre: 'On a scale 1-10, how well are you capturing your conscious creation journey (thoughts, synchronicities, patterns) over time?',
    questionPost: 'How well are you capturing your conscious creation journey (thoughts, synchronicities, patterns) over time now?',
    min: 0,
    max: 10,
    showInPre: true,
    showInPost: true,
    metricsKey: 'journey_capturing',
  },
  {
    id: 'roadmap_clarity',
    order: 10,
    type: 'rating',
    label: 'Roadmap Clarity',
    questionPre: 'On a scale 1-10, how clear is your current roadmap for how to activate your life vision in your day-to-day reality?',
    questionPost: 'How clear is your roadmap for how to activate your life vision in your day-to-day reality?',
    min: 0,
    max: 10,
    showInPre: true,
    showInPost: true,
    metricsKey: 'roadmap_clarity',
  },
  {
    id: 'transformation_tracking',
    order: 11,
    type: 'rating',
    label: 'Transformation Tracking',
    questionPre: 'On a scale 1-10, how well are you set up to track major life transformations over time?',
    questionPost: 'How well are you now set up to track major life transformations over time?',
    min: 0,
    max: 10,
    showInPre: true,
    showInPost: true,
    metricsKey: 'transformation_tracking',
  },
  {
    id: 'previous_attempts',
    order: 12,
    type: 'text',
    label: 'Previous Attempts',
    questionPre: 'What have you already tried to consciously create your dream life?',
    questionPost: '', // Not shown in post
    showInPre: true,
    showInPost: false,
  },
  {
    id: 'biggest_shift',
    order: 13,
    type: 'text',
    label: 'Biggest Shift',
    questionPre: '', // Not shown in pre
    questionPost: 'In your own words, what feels most different for you after completing the 72-Hour Activation Intensive?',
    showInPre: false,
    showInPost: true,
  },
  {
    id: 'testimonial_consent',
    order: 14,
    type: 'boolean',
    label: 'Testimonial Consent',
    questionPre: 'I\'m open to you using my feedback and results as anonymized or named testimonials once I approve them.',
    questionPost: 'I\'m open to you using my feedback and results as anonymized or named testimonials once I approve them.',
    showInPre: true,
    showInPost: true,
  },
];

/**
 * Get questions for a specific phase
 */
export const getQuestionsForPhase = (phase: 'pre_intensive' | 'post_intensive'): IntakeQuestion[] => {
  return INTAKE_QUESTIONS
    .filter(q => phase === 'pre_intensive' ? q.showInPre : q.showInPost)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get question by ID
 */
export const getQuestionById = (id: string): IntakeQuestion | undefined => {
  return INTAKE_QUESTIONS.find(q => q.id === id);
};

/**
 * Get all rating questions (for metrics comparison)
 */
export const getRatingQuestions = (): IntakeQuestion[] => {
  return INTAKE_QUESTIONS
    .filter(q => q.type === 'rating' && q.metricsKey)
    .sort((a, b) => a.order - b.order);
};

/**
 * Database column names in order (for reference)
 */
export const INTAKE_COLUMN_ORDER = INTAKE_QUESTIONS
  .sort((a, b) => a.order - b.order)
  .map(q => q.id);
