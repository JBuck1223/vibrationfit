/**
 * Expedition Pack: Ocean Explorers — From the Dock to the Deep.
 *
 * Five authored days that beat The Good and the Beautiful Math 1 and
 * Language Arts 1 lessons 1–5, then add science and history TGTB week 1
 * barely touches. Pack lessons are the proving path — Today does not
 * depend on a lucky VIVA draft.
 */

import type { LessonPayload, LessonVisual } from '../types'
import type { ExpeditionPack } from './types'

const UNKNOWN_SCRIPT =
  "Great question — real explorers write those down. Let's put it on the Wonder Wall and find out together."

export const OCEANS_WHY =
  'You love animals, oceans, building, and asking why. Home is Gulf-side Florida: the water next to you is the Gulf of Mexico, west. The Atlantic is Florida’s other ocean, east across the state. This week you are a crew from the dock to the deep.'

const WHY = OCEANS_WHY

export const OCEAN_CHAPTERS: Array<{
  day: 1 | 2 | 3 | 4 | 5
  title: string
  start_page: number
  end_page: number
  animal: string
  facts: string[]
  decodable: string[]
  sight: string[]
  passage: string[]
}> = [
  {
    day: 1,
    title: 'Alive at the Edge',
    start_page: 1,
    end_page: 5,
    animal: 'Octavia',
    facts: [
      'Living things need air, water, food, and space.',
      'A crab is alive. A shell is a clue. A rock was never alive.',
    ],
    decodable: ['crab', 'shell', 'fish', 'rock', 'wet'],
    sight: ['the', 'is', 'a'],
    passage: [
      'Oliver and Leila run to the wet sand.',
      'Octavia waves a tentacle. “Sort it!”',
      'The crab is alive. The shell is a clue. The rock was never alive.',
      'Oliver grins. Leila looks again. “Hold up. Look at THIS.”',
    ],
  },
  {
    day: 2,
    title: 'Then Boat, Now Boat',
    start_page: 6,
    end_page: 10,
    animal: 'Professor Zigzag',
    facts: [
      'People crossed water with paddles and sails before motors.',
      'A push or a pull changes how a boat moves. Some boats float.',
    ],
    decodable: ['deep', 'reef', 'see', 'keep', 'boat'],
    sight: ['the', 'see'],
    passage: [
      'Oliver pushes the now-boat. Leila blows the then-boat.',
      'Professor Zigzag opens his notebook upside down.',
      '“EE says /ē/,” Leila says. See the deep. See the reef.',
      'Then they paddled. Now they motor. The job is the same: get across.',
    ],
  },
  {
    day: 3,
    title: 'What a Fish Needs',
    start_page: 11,
    end_page: 15,
    animal: 'Waffles',
    facts: [
      'A fish needs air, water, food, and space.',
      'Baby fish look like their parents — and a little different. Tens hide inside bigger numbers.',
    ],
    decodable: ['ship', 'fish', 'that', 'chin'],
    sight: ['the', 'that'],
    passage: [
      'Waffles packs snacks. “Does a fish need snacks?”',
      'Oliver walks to air, water, food, space.',
      'Leila taps the sounds: f-i-sh. Ship. That.',
      'Three tens and six ones is 36. The fish still needs water.',
    ],
  },
  {
    day: 4,
    title: 'Where Is Our Water?',
    start_page: 16,
    end_page: 20,
    animal: 'Pip',
    facts: [
      'Home is Gulf-side Florida. The Gulf is west. The Atlantic is east.',
      'A compass rose shows north, south, east, west. 3:00 is the hour. 3:30 is the half hour.',
    ],
    decodable: ['ship', 'dock', 'west', 'east'],
    sight: ['we', 'see', 'the', 'to'],
    passage: [
      'Pip builds a map that is way too big.',
      'Oliver points west. “Gulf.” Leila points east. “Atlantic.”',
      'We see the ship at the dock. The clock says 3:00. Then 3:30.',
      'First we find home. Next we slide west. Last we slide east.',
    ],
  },
  {
    day: 5,
    title: 'The Catch',
    start_page: 21,
    end_page: 25,
    animal: 'Boots',
    facts: [
      'A need keeps you going. A want is extra.',
      'Penny 1¢, nickel 5¢, dime 10¢, quarter 25¢. I love ___ because ___.',
    ],
    decodable: ['need', 'want', 'shop'],
    sight: ['I', 'love', 'because'],
    passage: [
      'Boots digs up the week’s catch. Tally it.',
      'Oliver counts. Leila compares. Which pile is more?',
      'Need first. Want later. Four coins on the dock shop table.',
      'I love the Gulf because it is our water.',
    ],
  },
]

function crewFor(day: 1 | 2 | 3 | 4 | 5): string[] {
  return ['Oliver', 'Leila', OCEAN_CHAPTERS[day - 1].animal]
}

function chapterFor(day: 1 | 2 | 3 | 4 | 5) {
  const c = OCEAN_CHAPTERS[day - 1]
  return { title: c.title, start_page: c.start_page, end_page: c.end_page }
}

function skillKeysFor(day: 1 | 2 | 3 | 4 | 5): string[] {
  switch (day) {
    case 1:
      return [
        'math-counting-cardinality',
        'read-cvc-blending',
        'write-print-one-sentence',
        'fl-living-nonliving',
        'fl-investigate',
        'll-sentences-one',
      ]
    case 2:
      return [
        'math-skip-counting',
        'read-vowel-teams',
        'write-print-one-sentence',
        'fl-then-now',
        'fl-push-pull',
        'fl-sink-float',
        'read-sight-vocabulary',
      ]
    case 3:
      return [
        'math-place-value-tens-ones',
        'read-digraphs',
        'write-print-one-sentence',
        'fl-animal-needs',
        'fl-offspring-parents',
        'bt-tens-ones',
      ]
    case 4:
      return [
        'll-time-hour',
        'll-time-half-hour',
        'read-comprehension-retell',
        'fl-gulf-atlantic',
        'fl-compass-rose',
        'fl-map-florida',
        'bt-time-hour-half',
        'bt-simple-map',
        'fl-draw-map',
      ]
    case 5:
      return [
        'math-data-tally-pictographs',
        'math-addition-within-10',
        'math-compare-order-100',
        'll-money-names',
        'write-opinion',
        'write-revise-with-guidance',
        'fl-money-exchange',
        'fl-scarcity-choice',
        'bt-coins',
        'bt-add-sub-20',
      ]
  }
}

function dayVisuals(day: 1 | 2 | 3 | 4 | 5): LessonVisual[] {
  const ch = OCEAN_CHAPTERS[day - 1]
  const chapterPassage: LessonVisual = {
    kind: 'passage',
    title: `Chapter ${day}: ${ch.title}`,
    kid_do: `Read with Oliver and Leila. ${ch.animal} is on duty. Then retell.`,
    lines: ch.passage,
  }
  switch (day) {
    case 1:
      return [
        {
          kind: 'exercise',
          title: 'Port and starboard',
          kid_do: 'Circle port (left) and starboard (right). Count the collection. Write how many.',
          exercise: { layout: 'port_starboard' },
        },
        {
          kind: 'exercise',
          title: 'Write 1 to 10',
          kid_do: 'Write 1–10. One number in each box. Keep going if you want.',
          exercise: { layout: 'number_grid', from: 1, to: 10, columns: 5 },
        },
        {
          kind: 'exercise',
          title: 'Short or long + a true sentence',
          kid_do: 'Sort the ocean words. Then write one true sentence.',
          exercise: {
            layout: 'word_sort',
            bins: ['Short vowel', 'Long vowel'],
            words: ['crab', 'shell', 'wave', 'fish', 'reef', 'whale'],
          },
        },
        {
          kind: 'exercise',
          title: 'My true sentence',
          kid_do: 'Oliver and Leila write one true sentence. You do too. Capital and end mark.',
          exercise: { layout: 'lines', prompt: 'I see a _____ .', line_count: 3 },
        },
        {
          kind: 'sort_mat',
          title: 'Tide-pool sort',
          kid_do: 'Put each object in a box. Say why it belongs there.',
          columns: ['Alive now', 'Used to be alive', 'Never alive'],
        },
        {
          kind: 'cards',
          title: 'Ocean vowel cards',
          kid_do: 'Cut apart. Sort short-vowel vs long-vowel. Blend each one.',
          cards: [
            { word: 'crab', hint: 'short' },
            { word: 'shell', hint: 'short' },
            { word: 'wave', hint: 'long' },
            { word: 'fish', hint: 'short' },
            { word: 'reef', hint: 'long' },
            { word: 'whale', hint: 'long' },
          ],
        },
        {
          kind: 'draw',
          title: 'Crew license',
          kid_do: 'Write your captain name. Draw the shore. One true sentence.',
          draw_prompt: 'My shore + one true sentence',
        },
        chapterPassage,
      ]
    case 2:
      return [
        {
          kind: 'exercise',
          title: 'Boat numbers 1–20',
          kid_do: 'Write 1–20. Watch 6–9 and the teens.',
          exercise: { layout: 'number_grid', from: 1, to: 20, columns: 10 },
        },
        {
          kind: 'exercise',
          title: 'Skip-count the fish',
          kid_do: 'Skip-count by 2s to 20, then by 5s to 50.',
          exercise: { layout: 'skip_count', skip_by: 2, skip_to: 20 },
        },
        {
          kind: 'exercise',
          title: 'Skip-count by 5s',
          kid_do: 'Fill the boxes: 5, 10, 15… to 50.',
          exercise: { layout: 'skip_count', skip_by: 5, skip_to: 50 },
        },
        {
          kind: 'exercise',
          title: 'Then / now sentence',
          kid_do: 'Read the EE words. Write one then/now sentence.',
          exercise: {
            layout: 'lines',
            prompt: 'Then people ____. Now people ____.',
            line_count: 3,
          },
        },
        {
          kind: 'compare',
          title: 'Then boat / now boat — push, pull, float',
          kid_do: 'Draw THEN and NOW. Label push or pull. Circle the boat that floats.',
          columns: ['THEN — paddle / sail / PULL', 'NOW — motor / PUSH · both FLOAT'],
        },
        {
          kind: 'cards',
          title: 'EE dock words',
          kid_do: 'Read each card. Use one in a spoken sentence.',
          cards: [
            { word: 'deep', hint: 'ee' },
            { word: 'reef', hint: 'ee' },
            { word: 'see', hint: 'ee' },
            { word: 'keep', hint: 'ee' },
            { word: 'the', hint: 'sight' },
          ],
        },
        chapterPassage,
      ]
    case 3:
      return [
        {
          kind: 'exercise',
          title: 'Tens and ones',
          kid_do: 'Fill tens and ones. Last row: build your own number.',
          exercise: { layout: 'place_value_rows', given: [16, 24, 30, 36] },
        },
        {
          kind: 'exercise',
          title: 'Spell SH CH TH',
          kid_do: 'Read the cards. Spell fish, ship, that.',
          exercise: { layout: 'spell', spell: ['fish', 'ship', 'that'] },
        },
        {
          kind: 'sort_mat',
          title: 'What a sea animal needs',
          kid_do: 'Walk to each box. Say why a fish needs it.',
          columns: ['Air', 'Water', 'Food', 'Space'],
        },
        {
          kind: 'place_value',
          title: 'Tens cups',
          kid_do: 'Build today’s number. Say how many tens and how many ones.',
          tens: 0,
          ones: 0,
        },
        {
          kind: 'cards',
          title: 'SH CH TH cards',
          kid_do: 'Read. Then spell fish, ship, that by sound.',
          cards: [
            { word: 'ship', hint: 'sh' },
            { word: 'fish', hint: 'sh' },
            { word: 'that', hint: 'th' },
            { word: 'chin', hint: 'ch' },
            { word: 'beach', hint: 'ch' },
          ],
        },
        chapterPassage,
      ]
    case 4:
      return [
        {
          kind: 'exercise',
          title: 'Boat clocks',
          kid_do: 'Draw hands for each time. Write the digital time.',
          exercise: { layout: 'blank_clocks', times: ['3:00', '3:30', '4:00', '6:30'] },
        },
        {
          kind: 'exercise',
          title: 'Dock log retell',
          kid_do: 'Read the log. Draw beginning, middle, end.',
          exercise: { layout: 'retell', boxes: ['Beginning', 'Middle', 'End'] },
        },
        {
          kind: 'map',
          title: 'Where is our water?',
          kid_do: 'Find home. Draw a compass rose. Draw home and a boat on the Gulf (west).',
          map: 'florida_home_water',
        },
        {
          kind: 'clocks',
          title: 'Boat times',
          kid_do: 'Read 3:00 and 3:30. Draw each time in the empty box.',
          times: ['3:00', '3:30'],
        },
        {
          kind: 'passage',
          title: 'Dock log',
          kid_do: 'Read the log. Retell beginning, middle, and end.',
          lines: [
            'We see the ship.',
            'The ship is at the dock.',
            'I see a fish.',
            'We go to the deep.',
          ],
        },
        chapterPassage,
      ]
    case 5:
      return [
        {
          kind: 'exercise',
          title: 'Catch math',
          kid_do: 'Tally. Which is more? Make-10. Compare.',
          exercise: {
            layout: 'facts',
            facts: ['4 + 6 = __', '3 + 7 = __', '9 + 1 = __', '5 + 5 = __', '2 + 8 = __', '8 + 2 = __'],
          },
        },
        {
          kind: 'exercise',
          title: 'Which is more?',
          kid_do: 'Write > or < or =.',
          exercise: {
            layout: 'compare',
            pairs: [
              { left: '7', right: '4' },
              { left: '12', right: '15' },
              { left: '10', right: '10' },
              { left: '9', right: '6' },
            ],
          },
        },
        {
          kind: 'exercise',
          title: 'Dock shop coins',
          kid_do: 'Draw each coin. Match a real penny, nickel, dime, quarter.',
          exercise: { layout: 'coins' },
        },
        {
          kind: 'exercise',
          title: 'I love ___ because ___',
          kid_do: 'Write an opinion. Then revise one mark.',
          exercise: {
            layout: 'lines',
            prompt: 'I love __________ because __________. Then fix one capital or end mark.',
            line_count: 4,
          },
        },
        {
          kind: 'tally',
          title: 'This week’s catch',
          kid_do: 'Tally what the crew found. Which pile is bigger?',
          rows: ['Living things', 'Boats / tools', 'Needs', 'Wants'],
        },
        {
          kind: 'sort_mat',
          title: 'Need or want',
          kid_do: 'Sort four things. Spend one coin on a need first.',
          columns: ['Need — keeps us going', 'Want — extra'],
        },
        {
          kind: 'cards',
          title: 'Dock-shop coins',
          kid_do: 'Name each coin. Match it to a real penny, nickel, dime, or quarter.',
          cards: [
            { word: 'penny', hint: '1¢' },
            { word: 'nickel', hint: '5¢' },
            { word: 'dime', hint: '10¢' },
            { word: 'quarter', hint: '25¢' },
          ],
        },
        chapterPassage,
      ]
  }
}

function lesson1(): LessonPayload {
  return {
    identity: {
      life_category: 'travel',
      expedition: 'Ocean Explorers',
      lesson_title: 'What Is Alive at the Water’s Edge?',
      lesson_number: 1,
      recommended_age_grade: 'Grade 1 (ages 6-7)',
      estimated_total_minutes: 80,
      essential_question: 'What is alive at the water’s edge — and what is not?',
      why_this_matters: WHY,
      world_cluster: 'living',
      world_taste: 'Hold a shell, a rock, and a leaf. Which one was alive?',
    },
    parent_prep: {
      prep_minutes: 8,
      materials: [
        'Bowl of water',
        'Shells, rocks, sticks, or toys to sort',
        'Paper, crayons, tape',
        'Sticky notes',
        'Index cards',
      ],
      books: ['Ocean Explorers crew book — today’s chapter (Oliver, Leila, and today’s animal)'],
      links: [
        {
          title: 'National Geographic Kids — Ocean habitat',
          url: 'https://kids.nationalgeographic.com/nature/habitats/article/ocean',
          resource_type: 'website',
          why_selected: 'Kid-level ocean habitat page — living things at the edge of the water.',
          question_it_answers: 'What lives in the ocean?',
          needs_parent_link: false,
          engagement_tier: 'verified',
        },
      ],
      beforehand: [
        'Print today’s math page and words page',
        'Fill a bowl with water',
        'Set out 6–10 mix of living/once-living/never-living objects',
      ],
      cleanup: 'Pour out the water. Hang the crew license on the fridge.',
      safety: ['No small shells if a toddler is at the table'],
    },
    objectives: [
      { area: 'science', objective: 'Sort objects into living / once-living / never-living and say why' },
      { area: 'reading', objective: 'Hear and blend short-vowel ocean words (crab, shell, wave) vs long-vowel (reef, whale)' },
      { area: 'writing', objective: 'Write one true sentence about the shore with a capital and an end mark' },
      { area: 'math', objective: 'Name port/starboard as left/right; count a real collection toward 100' },
    ],
    teacher_script: {
      opening:
        'Close your eyes. I am going to put something in your hand. (Place a shell or wet rock.) This came from the edge of a huge world of water. Tonight you are captain of a shore crew. Oliver and Leila are already on the sand. Octavia is waving a tentacle. Ready?',
      mystery_or_question:
        'Some things at the water’s edge are alive. Some used to be. Some never were. Can you tell which is which?',
      transitions: [
        'Captains name LEFT and RIGHT before they leave the dock. On a boat, left is PORT, right is STARBOARD. Hold up your port hand — that’s the one that makes an L.',
        'Now the vowel hunt: some ocean words have a short sound (crab, shell). Some have a long sound that says its name (reef, whale).',
      ],
      core_concept:
        'Living things need food, water, air, and space. A crab is alive. A shell may be what’s left. A rock was never alive. Explorers sort before they guess.',
      closing:
        'Captain, your crew license is official. Tomorrow we go to the dock: how did people cross this water then, and how do they cross it now?',
    },
    wonder_wall: {
      know_prompt: 'What do you already know about the ocean? (Write it exactly how they say it.)',
      wonder_prompts: ['What do you WONDER about the water’s edge?', 'What would you look for first on a real beach?'],
      learned_guidance: 'After sorting, ask: what surprised you — living, once-living, or never-living?',
      likely_follow_ups: ['Is a shell alive?', 'Are waves alive?', 'Do crabs need air?'],
    },
    core_resource: {
      title: 'National Geographic Kids — Ocean habitat',
      resource_type: 'website',
      url: 'https://kids.nationalgeographic.com/nature/habitats/article/ocean',
      why_selected: 'Short, true ocean page — not a cartoon ocean.',
      question_it_answers: 'What lives in the ocean?',
      engagement_tier: 'verified',
    },
    hands_on: {
      title: 'Tide-pool sort + port/starboard + count the collection',
      steps: [
        'Sort objects into three piles: alive, used to be alive, never alive. Say one reason for each pile.',
        'Stand as the boat. Point PORT (left) and STARBOARD (right). Walk three steps port, three starboard.',
        'Count every object in the “crew chest” by ones. If you pass 20, keep going. Goal: toward 100 over the week.',
      ],
    },
    foundational_skills: {
      subject: 'reading',
      activity:
        'Vowel sort: cards crab, shell, wave, fish, reef, whale. Child says the vowel sound, then blends the word. Short vs long. Mastery: blend crab and reef without help.',
      materials: ['Index cards'],
      notes: 'TGTB Lesson 1 is long/short vowels in isolation. We put them in ocean words he can actually read.',
    },
    child_output: {
      type: 'writing',
      description:
        'Crew license: name, shore drawing, and one true sentence (“I see a shell.”). Photo this for the calendar.',
    },
    reflection: ['Which pile was hardest to decide?', 'Is a shell alive, or is it a clue that something was alive?'],
    parent_observation: ['Did they blend the short-vowel words independently?', 'Did the sentence get a capital and an end mark?'],
    core_activities: [
      'Shore hook with a real object in the hand',
      'Port / starboard (left / right) on the “boat”',
      'Tide-pool living / nonliving sort',
      'Short vs long vowel ocean cards',
      'Count the collection',
      'Write one true sentence on the crew license',
    ],
    optional_extensions: ['Look at the Nat Geo ocean page together and add one new Wonder', 'Count kitchen spoons toward 100 if the chest is small'],
    good_stopping_point: 'After the sort + one written sentence. Counting and vowel cards can wait.',
    time_summary: {
      prep_minutes: 8,
      lesson_minutes: 65,
      reading_minutes: 10,
      foundational_minutes: 12,
      has_experiment: true,
      has_journal: true,
    },
    fun_contract: {
      hook: 'Something from the water’s edge lands in his hand before he opens his eyes.',
      story_mission: 'He is captain of a shore crew. License the crew. Sort the edge of the ocean.',
      embodiment: 'Port/starboard walking; hands-on living vs nonliving sort; counting real objects.',
      artifact: 'Crew license with a true sentence.',
      choice_point: 'He chooses the first pile to sort — living, once-living, or never-living.',
      celebration_close: 'License ceremony: parent signs, child says their captain name aloud.',
    },
    low_battery_mode: {
      total_minutes: 15,
      steps: [
        'Port/starboard hands (left/right)',
        'Sort 5 objects living vs not',
        'Read crab and reef; write one sentence if energy allows',
      ],
      log_title: 'Ocean Explorers day 1 (short): shore sort + left/right',
    },
    parent_answer_key: {
      expected_answers: [
        'Port is left, starboard is right',
        'A crab is living; a rock is not; a shell often used to be part of a living animal',
        'Short vowel: crab, shell. Long vowel: reef, whale',
      ],
      likely_questions: [
        {
          question: 'Is a shell alive?',
          kid_answer:
            'The shell is not alive now. It is like a house an animal left. The animal was alive.',
        },
        {
          question: 'Are waves alive?',
          kid_answer: 'No. Waves are water moving. Water is not an animal or a plant.',
        },
      ],
      unknown_script: UNKNOWN_SCRIPT,
    },
    visuals: dayVisuals(1),
    crew: crewFor(1),
    skill_keys: skillKeysFor(1),
    book_chapter: chapterFor(1),
    flashback: { game: 'First ocean day — no flashback yet. Start making memories!', items: [] },
    sibling_tag_along: [
      { activity: 'Tide-pool sort', adaptation: 'Little one dumps objects into two bowls: “alive” and “not.”' },
      { activity: 'Port/starboard', adaptation: 'They hop left when you say port, right when you say starboard.' },
      { activity: 'Crew license', adaptation: 'They scribble-decorate a license and get it signed too.' },
    ],
    block_minutes: [
      { block: 'Hook: mystery object', minutes: 3 },
      { block: 'Port / starboard + pencil page', minutes: 8 },
      { block: 'Tide-pool sort', minutes: 5 },
      { block: 'Read with Oliver and Leila', minutes: 10 },
      { block: 'Vowel cards + words page', minutes: 10 },
      { block: 'Count the chest', minutes: 5 },
      { block: 'Crew license sentence', minutes: 8 },
      { block: 'Nat Geo page', minutes: 8, optional: true },
    ],
    resource_queue: [
      {
        title: 'National Geographic Kids — Ocean habitat',
        url: 'https://kids.nationalgeographic.com/nature/habitats/article/ocean',
        resource_type: 'website',
        why_selected: 'Optional look after the sort.',
        question_it_answers: 'What lives in the ocean?',
        needs_parent_link: false,
        engagement_tier: 'verified',
      },
    ],
    standards_tags: [
      'ELA.1.F.1.3',
      'ELA.1.C.1.1',
      'MA.1.NSO.1.1',
      'SC.1.L.14',
      'SC.1.L.17',
      'SC.1.N.1.1',
    ],
  }
}

function lesson2(): LessonPayload {
  return {
    identity: {
      life_category: 'travel',
      expedition: 'Ocean Explorers',
      lesson_title: 'How Did People Cross the Water?',
      lesson_number: 2,
      recommended_age_grade: 'Grade 1 (ages 6-7)',
      estimated_total_minutes: 80,
      essential_question: 'How did people cross water then — and how do they cross it now?',
      why_this_matters: WHY,
      world_cluster: 'people',
      world_taste: 'A stick boat vs a toy motor boat in a tub.',
    },
    parent_prep: {
      prep_minutes: 8,
      materials: [
        'Tub or sink of water',
        'Stick or cork + leaf for a “then” boat',
        'Toy boat or plastic lid for a “now” boat',
        'Paper, crayon',
        'Index cards',
        '10–20 small counters (beans, coins, fish crackers)',
      ],
      books: ['Ocean Explorers crew book — today’s chapter (Oliver, Leila, and today’s animal)'],
      links: [],
      beforehand: ['Fill a tub or sink', 'Write boat numbers 1–20 on scraps of paper'],
      cleanup: 'Dump the water. Dry the boats.',
      safety: ['Stay with the water; wipe the floor'],
    },
    objectives: [
      { area: 'history', objective: 'Compare a then-boat (dugout/sail) with a now-boat (motor) in own words' },
      { area: 'reading', objective: 'Read EE words: deep, reef, see, keep — plus one sight word (the or see)' },
      { area: 'math', objective: 'Write numbers 1–20 as boat numbers; skip-count fish by 2s' },
      { area: 'writing', objective: 'Write one true sentence about then vs now' },
    ],
    teacher_script: {
      opening:
        'Yesterday you licensed a shore crew. Today the dock is open. People have always needed to cross water. The mystery: did they always have motors?',
      mystery_or_question: 'If you had no engine, how would YOU get across?',
      transitions: [
        'Make a then-boat (stick/leaf) and a now-boat. Push both. Which is faster? Why?',
        'EE says /ē/ like the name of the letter E. Read: deep, reef, see, keep. Then read the sight word the.',
      ],
      core_concept:
        'Long ago people crossed water with paddles and sails. Now many boats have motors. The job is the same — get across — the tool changed.',
      closing: 'Tomorrow we go under: what does a sea animal need to stay alive down there?',
    },
    wonder_wall: {
      know_prompt: 'What kinds of boats do you already know?',
      wonder_prompts: ['How did people cross before engines?', 'Would you rather paddle or motor? Why?'],
      learned_guidance: 'Ask: what is the same about then-boats and now-boats? What changed?',
      likely_follow_ups: ['Did pirates have motors?', 'Can a leaf really float?'],
    },
    core_resource: {
      title: 'Then-boat vs now-boat in the tub',
      resource_type: 'experiment',
      url: null,
      why_selected: 'He feels the difference instead of hearing a lecture about history.',
      question_it_answers: 'How did people cross water then and now?',
      engagement_tier: 'vf_original',
    },
    hands_on: {
      title: 'Then-boat / now-boat race + boat numbers',
      steps: [
        'Build a then-boat (stick, cork, leaf) and a now-boat (toy or lid). Predict which is faster. Race with a fingertip breeze vs a push.',
        'Line up paper boats numbered 1–20. Child writes any missing numbers (especially 6–9 and teens).',
        'Skip-count fish crackers by 2s: 2, 4, 6… to 20. Eat the skip-count if you want.',
      ],
    },
    foundational_skills: {
      subject: 'reading',
      activity:
        'EE review in mission words: deep, reef, see, keep. Child reads each, then uses one in a spoken sentence. Add sight word the. Mastery: read see and the on sight.',
      materials: ['Index cards'],
      notes: 'TGTB Lesson 2 is EE review. We put EE in the dock mission, not a worksheet island.',
    },
    child_output: {
      type: 'drawing',
      description: 'Split page: THEN boat / NOW boat, plus one sentence. Photo for the calendar.',
    },
    reflection: ['Which boat would you take across the Atlantic — then or now?', 'What tool changed?'],
    parent_observation: ['Did they write 6–9 and teens without reversing?', 'Did skip-count by 2s hold to 20?'],
    core_activities: [
      'Then vs now boat race',
      'EE word cards + sight word the',
      'Write boat numbers 1–20',
      'Skip-count by 2s',
      'Then/now drawing + sentence',
    ],
    optional_extensions: ['Walk to a real boat, dock, or marina photo on a phone map', 'Add month of the year: say today’s month while dating the drawing'],
    good_stopping_point: 'After the race + EE words + one drawing. Number writing can be the extension.',
    time_summary: {
      prep_minutes: 8,
      lesson_minutes: 65,
      reading_minutes: 10,
      foundational_minutes: 12,
      has_experiment: true,
      has_journal: true,
    },
    fun_contract: {
      hook: 'Two boats in a tub — which one wins, and why didn’t the old one have a motor?',
      story_mission: 'Dock day: the crew studies how people crossed water then and now.',
      embodiment: 'Building and racing boats in real water.',
      artifact: 'Then/now split drawing with a true sentence.',
      choice_point: 'He chooses which boat to race first, and whether to paddle or motor in pretend play.',
      celebration_close: 'Captain names one thing that changed and one thing that stayed the same.',
    },
    low_battery_mode: {
      total_minutes: 15,
      steps: [
        'Race two floating objects',
        'Read deep, see, the',
        'Write numbers 1–10 if that’s all the fuel',
      ],
      log_title: 'Ocean Explorers day 2 (short): then/now boats',
    },
    parent_answer_key: {
      expected_answers: [
        'Then: paddle or sail. Now: often a motor',
        'EE = /ē/ in deep, reef, see, keep',
        'Skip count by 2s to 20',
      ],
      likely_questions: [
        {
          question: 'Did they have cars on the water?',
          kid_answer: 'They had boats. Motors came later. First they used arms, wind, and oars.',
        },
      ],
      unknown_script: UNKNOWN_SCRIPT,
    },
    printable: {
      title: 'Then-boat vs now-boat',
      question: 'Which boat is faster — then or now — and why?',
      prediction_prompt: 'Which boat will win the tub race? Why?',
      steps: [
        'Build a then-boat (stick, cork, or leaf).',
        'Use a toy boat or lid as the now-boat.',
        'Race with a blow (sail) vs a push (motor).',
        'Write which won and one reason.',
      ],
      chart: {
        rows: ['Then-boat', 'Now-boat'],
        columns: ['My prediction', 'What happened'],
      },
      result_prompt: 'People used to cross water with… Now they often use…',
      draw_prompt: 'Draw both boats. Label THEN and NOW.',
    },
    visuals: dayVisuals(2),
    crew: crewFor(2),
    skill_keys: skillKeysFor(2),
    book_chapter: chapterFor(2),
    flashback: {
      game: 'Show me yesterday',
      items: [
        { prompt: 'Point to port. Point to starboard.', learned_statement: 'Port is left. Starboard is right.' },
        { prompt: 'Was the shell alive?', learned_statement: 'The shell is a clue, not a living animal now.' },
      ],
    },
    sibling_tag_along: [
      { activity: 'Boat race', adaptation: 'Little one blows the then-boat. Big kid pushes the now-boat.' },
      { activity: 'Skip-count', adaptation: 'They clap on every other fish.' },
    ],
    block_minutes: [
      { block: 'Hook + boat race (push, pull, float)', minutes: 10 },
      { block: 'Read with Oliver and Leila', minutes: 10 },
      { block: 'EE + sight word + sentence page', minutes: 10 },
      { block: 'Boat numbers 1–20', minutes: 8 },
      { block: 'Skip-count by 2s and 5s', minutes: 8 },
      { block: 'Then/now drawing', minutes: 10 },
      { block: 'Date + month', minutes: 5, optional: true },
    ],
    resource_queue: [],
    standards_tags: [
      'ELA.1.F.1.3',
      'ELA.1.F.1.4',
      'ELA.1.C.1.1',
      'MA.1.NSO.1.1',
      'MA.1.NSO.1.2',
      'SS.1.A.2.2',
    ],
  }
}

function lesson3(): LessonPayload {
  return {
    identity: {
      life_category: 'travel',
      expedition: 'Ocean Explorers',
      lesson_title: 'What Does a Sea Animal Need?',
      lesson_number: 3,
      recommended_age_grade: 'Grade 1 (ages 6-7)',
      estimated_total_minutes: 85,
      essential_question: 'What does a sea animal need to stay alive under the water?',
      why_this_matters: WHY,
      world_cluster: 'living',
      world_taste: 'Cups of ten shells — tens hiding under the waterline.',
    },
    parent_prep: {
      prep_minutes: 8,
      materials: [
        '4 paper cups',
        '40 small objects (shells, beans, pasta, coins)',
        'Bowl of water',
        'Index cards',
        'Paper',
      ],
      books: ['Ocean Explorers crew book — today’s chapter (Oliver, Leila, and today’s animal)'],
      links: [
        {
          title: 'NOAA Education — marine life',
          url: 'https://www.noaa.gov/education/resource-collections/marine-life',
          resource_type: 'website',
          why_selected: 'Real marine-life collection if you want a photo of a fish and its young.',
          question_it_answers: 'What do ocean animals need?',
          needs_parent_link: false,
          engagement_tier: 'verified',
        },
      ],
      beforehand: ['Put 10 objects in each of 3 cups; leave 6–10 loose (that is 36–40, past TGTB’s 16)'],
      cleanup: 'Objects back in a jar. Cups dry.',
      safety: [],
    },
    objectives: [
      { area: 'science', objective: 'Name four needs: air, water, food, space; match a baby animal to a parent' },
      { area: 'reading', objective: 'Read SH/CH/TH in ship, fish, the, that, beach; spell three by sound' },
      { area: 'math', objective: 'Show a number 30–40 as tens and ones with cups of 10' },
      { area: 'writing', objective: 'Write one true sentence about what a fish needs' },
    ],
    teacher_script: {
      opening:
        'The crew goes under. It is darker. It is wet. A fish still lives here. Mystery: you need air. Does a fish?',
      mystery_or_question: 'If a fish stayed on the dock, what would it be missing?',
      transitions: [
        'SH, CH, TH — mouth shapes. ship, fish, beach, the, that. Spell fish, ship, that by tapping sounds.',
        'Tens are crews of ten. Each cup is one ten. Loose ones are the ones. Build 36 (or whatever you have).',
      ],
      core_concept:
        'Every animal needs air, water, food, and space. A fish gets oxygen from water. Babies look like their parents — and a little different. Numbers bigger than 10 hide tens inside them.',
      closing: 'Tomorrow we map it: where is OUR ocean from this house?',
    },
    wonder_wall: {
      know_prompt: 'What does a fish need? Say it before we check.',
      wonder_prompts: ['How does a fish breathe?', 'Do baby fish look like grown fish?'],
      learned_guidance: 'Add one Learned: a need, or how tens hide inside a number.',
      likely_follow_ups: ['Do whales need air?', 'Is 16 two tens?'],
    },
    core_resource: {
      title: 'Tens cups — place value past 16',
      resource_type: 'manipulative',
      url: null,
      why_selected: 'TGTB stops at 10–16 this week. We take tens and ones to about 40 with the same idea.',
      question_it_answers: 'How do tens hide inside bigger numbers?',
      engagement_tier: 'vf_original',
    },
    hands_on: {
      title: 'Animal needs + baby/parent + tens cups',
      steps: [
        'Four corners of the room: air, water, food, space. Child walks to each and says why a fish needs it.',
        'Match: draw or toy baby fish next to parent. Same kind, not a copy.',
        'Build a number past 16 with cups of 10 plus leftovers. Say: “3 tens and 6 ones is 36.”',
      ],
    },
    foundational_skills: {
      subject: 'reading',
      activity:
        'Digraphs: ship, fish, the, that, beach, chin. Spell fish, ship, that aloud by sound (not from a list). Mastery: read fish and that without sounding out twice.',
      materials: ['Index cards'],
      notes: 'TGTB Lesson 4 is SH/CH/TH review. TGTB Lesson 3 is a spelling list. We spell by sound in the mission.',
    },
    child_output: {
      type: 'experiment_record',
      description: 'Needs map (four labels) + tens/ones picture of today’s number. One sentence: “A fish needs ___.”',
    },
    reflection: ['Could a fish live in a cup with no extra water? Why not?', 'How is 36 different from 16?'],
    parent_observation: ['Did they keep tens grouped, or dump all ones?', 'Could they spell fish by sound?'],
    core_activities: [
      'Four needs walk',
      'Baby / parent match',
      'SH CH TH cards + spell by sound',
      'Tens cups past 16',
      'Needs sentence',
    ],
    optional_extensions: ['NOAA marine life photos — find a parent and a baby', 'Count the whole chest again; did we pass yesterday?'],
    good_stopping_point: 'After digraphs + tens cups. The needs walk is the science core — don’t skip both.',
    time_summary: {
      prep_minutes: 8,
      lesson_minutes: 70,
      reading_minutes: 12,
      foundational_minutes: 12,
      has_experiment: true,
      has_journal: true,
    },
    fun_contract: {
      hook: 'If a fish sat on the dock, what would it be missing?',
      story_mission: 'Under-the-water mission: find what a sea animal needs, and how tens hide in a catch.',
      embodiment: 'Walking the four needs; building tens with cups.',
      artifact: 'Needs map + tens picture.',
      choice_point: 'He chooses which need to visit first, and which number to build.',
      celebration_close: 'Crew chants the number as tens and ones (“3 tens 6 ones!”).',
    },
    low_battery_mode: {
      total_minutes: 15,
      steps: ['Name four needs', 'Read fish, ship, that', 'Show 24 as 2 cups of 10 plus 4'],
      log_title: 'Ocean Explorers day 3 (short): needs + tens',
    },
    parent_answer_key: {
      expected_answers: [
        'Needs: air, water, food, space',
        'Fish get oxygen from water; whales still come up for air',
        'Tens and ones: 36 is 3 tens and 6 ones',
      ],
      likely_questions: [
        {
          question: 'Do fish drown?',
          kid_answer:
            'Fish take oxygen out of water with gills. If the water is gone, they cannot breathe. Whales are different — they have lungs and come up.',
        },
        {
          question: 'Why isn’t 16 two tens?',
          kid_answer: 'Two tens is 20. Sixteen is one ten and six ones.',
        },
      ],
      unknown_script: UNKNOWN_SCRIPT,
    },
    visuals: dayVisuals(3),
    crew: crewFor(3),
    skill_keys: skillKeysFor(3),
    book_chapter: chapterFor(3),
    flashback: {
      game: 'Teach the stuffed fish',
      items: [
        { prompt: 'Read see, deep, the', learned_statement: 'EE says /ē/. the is a sight word.' },
        { prompt: 'Then-boat or now-boat: which has a motor?', learned_statement: 'Now-boats often have motors. Then-boats used paddles or sails.' },
      ],
    },
    sibling_tag_along: [
      { activity: 'Needs walk', adaptation: 'Little one runs to “water” when you say splash.' },
      { activity: 'Tens cups', adaptation: 'They drop objects into cups until you say stop at ten.' },
    ],
    block_minutes: [
      { block: 'Hook + needs walk', minutes: 8 },
      { block: 'Read with Oliver and Leila', minutes: 10 },
      { block: 'Baby / parent', minutes: 5 },
      { block: 'Digraphs + spell page', minutes: 10 },
      { block: 'Tens cups + tens/ones page', minutes: 10 },
      { block: 'Sentence', minutes: 8 },
      { block: 'NOAA photos', minutes: 8, optional: true },
    ],
    resource_queue: [
      {
        title: 'NOAA Education — marine life',
        url: 'https://www.noaa.gov/education/resource-collections/marine-life',
        resource_type: 'website',
        why_selected: 'Optional parent-and-baby photos.',
        question_it_answers: 'Do babies look like parents?',
        needs_parent_link: false,
        engagement_tier: 'verified',
      },
    ],
    standards_tags: [
      'ELA.1.F.1.3',
      'ELA.1.C.1.1',
      'MA.1.NSO.1.3',
      'SC.1.L.17.1',
      'SC.1.L.16.1',
      'SC.1.L.14',
    ],
  }
}

function lesson4(): LessonPayload {
  return {
    identity: {
      life_category: 'travel',
      expedition: 'Ocean Explorers',
      lesson_title: 'Where Is Our Ocean From Here?',
      lesson_number: 4,
      recommended_age_grade: 'Grade 1 (ages 6-7)',
      estimated_total_minutes: 80,
      essential_question: 'Where is our ocean from this house — and when is the boat due?',
      why_this_matters: WHY,
      world_cluster: 'places',
      world_taste: 'Finger on Florida, then slide west into the Gulf.',
    },
    parent_prep: {
      prep_minutes: 6,
      materials: [
        'Globe, atlas, or phone map',
        'Analog clock (real or paper)',
        'Paper, crayon',
        'Index cards: I, a, the, see, we, to, and, is',
      ],
      books: ['Ocean Explorers crew book — today’s chapter (Oliver, Leila, and today’s animal)'],
      links: [],
      beforehand: ['Open a map that shows Florida, the Gulf (west), and the Atlantic (east)', 'Set a clock to 3:00, then later 3:30'],
      cleanup: 'None.',
      safety: [],
    },
    objectives: [
      { area: 'geography', objective: 'Find home, Florida, the Gulf (west), and the Atlantic (east) on a map or globe' },
      { area: 'math', objective: 'Read time to the hour and half hour on analog and digital (3:00 and 3:30)' },
      { area: 'reading', objective: 'Read a 4-line dock log with sight words and retell beginning/middle/end' },
      { area: 'writing', objective: 'Copy or write one log line with a capital and period' },
    ],
    teacher_script: {
      opening:
        'The crew has a map and a clock. If we miss the tide, we miss the boat. First: where ARE we?',
      mystery_or_question: 'Which way is our water from the door — and what time does the boat leave?',
      transitions: [
        'Find home. Find Florida. Face west: that is the Gulf, our water. Face east, across the state: that is the Atlantic, Florida’s other ocean. Trace from the door to the Gulf.',
        'Boat leaves at 3:00. We must be back at 3:30. Show both times on the clock.',
      ],
      core_concept:
        'Maps show where. Clocks show when. Our home ocean is the Gulf of Mexico, west of Florida. The Atlantic is the ocean on the east side. Hour is when the big hand is at 12. Half hour is when the big hand is at 6.',
      closing: 'Tomorrow is catch day: what did this crew find, and what is a want vs a need at the dock shop?',
    },
    wonder_wall: {
      know_prompt: 'Where is our ocean from this house? Point before we look.',
      wonder_prompts: ['Is the Gulf the same water as the Atlantic?', 'Why do boats care about time?'],
      learned_guidance: 'One Learned about WHERE (Gulf, west), one about WHEN.',
      likely_follow_ups: ['Can we drive to the Gulf?', 'What is a tide?'],
    },
    core_resource: {
      title: 'Map of Florida and nearby water + analog clock',
      resource_type: 'manipulative',
      url: null,
      why_selected: 'Home geography and boat time — TGTB’s clock lesson dressed as a real departure.',
      question_it_answers: 'Where is our ocean, and when is the boat due?',
      engagement_tier: 'vf_original',
    },
    hands_on: {
      title: 'Map hunt + tide clock + dock log',
      steps: [
        'Find home. Find the Gulf (west). Find the Atlantic (east). Child traces from the door to the Gulf.',
        'Set 3:00 (boat leaves). Set 3:30 (we are back). Child says both times. Optional: write 3:00 and 3:30.',
        'Read the dock log together, then the child reads it. Retell beginning, middle, end.',
      ],
    },
    foundational_skills: {
      subject: 'reading',
      activity:
        'Sight words in a 4-line log: “We see the ship. The ship is at the dock. I see a fish. We go to the deep.” Child retells B/M/E. Mastery: read the and see on sight; retell in three parts.',
      materials: ['Log written on paper'],
      notes: 'TGTB Lesson 5 is sight words group 1. We put them in connected text and demand a retell.',
    },
    child_output: {
      type: 'writing',
      description: 'Simple map (home, Florida, Gulf west, Atlantic east) + clock faces 3:00 and 3:30. Photo for the calendar.',
    },
    reflection: ['Which ocean or gulf is closer to us?', 'What would happen if we came at 4:00?'],
    parent_observation: ['Did they retell in order?', 'Hour vs half-hour — which stuck?'],
    core_activities: [
      'Home / Gulf (west) / Atlantic (east) map hunt',
      'Hour and half-hour boat times',
      'Decodable dock log + retell',
      'Draw map + two clocks',
    ],
    optional_extensions: ['Say today’s month and date on the log (TGTB months, used as life, not a unit)', 'Walk or drive toward water if you live close'],
    good_stopping_point: 'After map + one clock time + log retell.',
    time_summary: {
      prep_minutes: 6,
      lesson_minutes: 65,
      reading_minutes: 15,
      foundational_minutes: 15,
      has_experiment: false,
      has_journal: true,
    },
    fun_contract: {
      hook: 'Miss the clock, miss the boat.',
      story_mission: 'Navigate: where is our water, and when do we leave.',
      embodiment: 'Finger on the map; hands on a real clock.',
      artifact: 'Home-to-ocean map plus two clock times.',
      choice_point: 'He chooses analog first or digital first; he chooses which water to trace to.',
      celebration_close: 'Captain points west to the Gulf and says the boat time in a full sentence.',
    },
    low_battery_mode: {
      total_minutes: 15,
      steps: ['Point to Florida and the Gulf (west)', 'Show 3:00', 'Read: We see the ship.'],
      log_title: 'Ocean Explorers day 4 (short): Gulf map + 3:00',
    },
    parent_answer_key: {
      expected_answers: [
        'Gulf west of us (home water). Atlantic east, the other Florida ocean.',
        '3:00 hour, 3:30 half hour',
        'Log retell: see the ship, ship at dock, see a fish, go to the deep',
      ],
      likely_questions: [
        {
          question: 'Is the Gulf an ocean?',
          kid_answer:
            'It is a huge salt sea next to our house. We call it the Gulf of Mexico. The Atlantic is Florida’s other ocean, on the east side.',
        },
        {
          question: 'Why is the big hand on 6 for half past?',
          kid_answer: 'Halfway around the clock is 30 minutes. That’s half an hour.',
        },
      ],
      unknown_script: UNKNOWN_SCRIPT,
    },
    visuals: dayVisuals(4),
    crew: crewFor(4),
    skill_keys: skillKeysFor(4),
    book_chapter: chapterFor(4),
    flashback: {
      game: 'Clock or map — you pick',
      items: [
        { prompt: 'Show 36 with tens and ones', learned_statement: 'Tens hide inside bigger numbers.' },
        { prompt: 'Read ship, fish, that', learned_statement: 'SH, CH, TH are two letters, one sound.' },
      ],
    },
    sibling_tag_along: [
      { activity: 'Map', adaptation: 'Little one puts a sticker on Florida.' },
      { activity: 'Clock', adaptation: 'They move the big hand while you count 1–12.' },
    ],
    block_minutes: [
      { block: 'Map hunt + compass + draw home', minutes: 10 },
      { block: 'Read with Oliver and Leila', minutes: 10 },
      { block: 'Blank clocks (hour and half-hour)', minutes: 10 },
      { block: 'Dock log + retell boxes', minutes: 10 },
      { block: 'Draw map', minutes: 8 },
      { block: 'Month and date', minutes: 5, optional: true },
    ],
    resource_queue: [],
    standards_tags: [
      'ELA.1.F.1.4',
      'ELA.1.R.1.1',
      'ELA.1.R.3.2',
      'MA.1.M.2.1',
      'SS.1.G.1',
      'SS.1.G.1.5',
    ],
  }
}

function lesson5(): LessonPayload {
  return {
    identity: {
      life_category: 'travel',
      expedition: 'Ocean Explorers',
      lesson_title: 'What Did This Crew Find?',
      lesson_number: 5,
      recommended_age_grade: 'Grade 1 (ages 6-7)',
      estimated_total_minutes: 85,
      essential_question: 'What did this crew find — and what is a want vs a need at the dock shop?',
      why_this_matters: WHY,
      world_cluster: 'making',
      world_taste: 'A handful of coins and a tally of the week’s finds.',
    },
    parent_prep: {
      prep_minutes: 6,
      materials: [
        'Penny, nickel, dime, quarter (real or play)',
        'Paper for tally marks',
        'Week’s artifacts (license, drawings, cups)',
        'Crayons',
      ],
      books: ['Ocean Explorers crew book — today’s chapter (Oliver, Leila, and today’s animal)'],
      links: [],
      beforehand: ['Put the week’s artifacts on the table like a museum', 'Set out four coins'],
      cleanup: 'Coins away. Hang the catch poster.',
      safety: ['Coins are a choking hazard for toddlers'],
    },
    objectives: [
      { area: 'math', objective: 'Compare/order two catch counts; play facts-to-10; tally the week’s finds' },
      { area: 'writing', objective: 'Write “I love ___ because ___.” Revise one mark (capital, period, or because).' },
      { area: 'economics', objective: 'Name penny, nickel, dime, quarter; sort dock-shop items into want vs need' },
      { area: 'oral language', objective: 'Present the week’s catch in three sentences' },
    ],
    teacher_script: {
      opening:
        'Museum walk. Everything this crew made is on the table. You are the captain giving the report. Then we spend one coin at the dock shop — but only after we know want from need.',
      mystery_or_question: 'If you have one coin, do you buy food for the boat, or a toy crab?',
      transitions: [
        'Tally the artifacts. Compare two numbers: which catch is more? Facts-to-10: fish in the net (7 + ? = 10).',
        'Opinion: I love ___ because ___. Then fix one thing — a capital, a period, or a better because.',
      ],
      core_concept:
        'A need keeps the crew alive (food, water). A want is extra. Coins have names and values. Comparing numbers tells which catch was bigger. A because makes an opinion honest.',
      closing:
        'Ocean Explorers week one is in the log. Antarctica is paused, not erased. Next week we can go deeper, or change worlds — you get to notice what you still wonder.',
    },
    wonder_wall: {
      know_prompt: 'What did we find this week? Harvest the Learned column.',
      wonder_prompts: ['What do you still wonder about the deep?', 'Want or need: which was harder?'],
      learned_guidance: 'Move two Wonders to Learned if they are really answered. Leave the rest.',
      likely_follow_ups: ['How many cents is a quarter?', 'Can a want ever be a need?'],
    },
    core_resource: {
      title: 'Dock shop + week museum',
      resource_type: 'game',
      url: null,
      why_selected: 'Money names, wants/needs, data, and opinion writing in one closing day.',
      question_it_answers: 'What did the crew find, and how do we choose at the shop?',
      engagement_tier: 'vf_original',
    },
    hands_on: {
      title: 'Museum walk, tally, facts-to-10, dock shop',
      steps: [
        'Walk the artifacts. Child tells beginning/middle/end of the week in three sentences.',
        'Tally finds. Compare two numbers. Play make-10 with counters (“7 fish in the net — how many more to 10?”).',
        'Name penny, nickel, dime, quarter. Sort 4 pictures/toys: want vs need. Spend one coin on a need first.',
      ],
    },
    foundational_skills: {
      subject: 'writing',
      activity:
        'Opinion sentence: “I love ___ because ___.” Revise one mark with guidance. Mastery: capital, because, end mark.',
      materials: ['Paper'],
      notes: 'TGTB week 1 does not require a written opinion. We do. This is the exceed.',
    },
    child_output: {
      type: 'presentation',
      description: 'Catch poster: tally, opinion sentence, coin rubbing or names. Photo + calendar log of the whole week.',
    },
    reflection: ['What was the best find?', 'If we go to sea again, what do we still need to find out?'],
    parent_observation: ['Did because show up without a prompt?', 'Coin names — which stuck?'],
    core_activities: [
      'Museum walk / oral report',
      'Tally and compare',
      'Facts-to-10 net game',
      'Want vs need + coin names',
      'Opinion sentence + one revision',
    ],
    optional_extensions: ['Count a handful of mixed pennies and dimes (not required this week)', 'Record the 3-sentence report on the phone'],
    good_stopping_point: 'After oral report + opinion sentence + naming the four coins.',
    time_summary: {
      prep_minutes: 6,
      lesson_minutes: 70,
      reading_minutes: 5,
      foundational_minutes: 15,
      has_experiment: false,
      has_journal: true,
    },
    fun_contract: {
      hook: 'The table is a museum of YOUR week. You are the guide.',
      story_mission: 'Catch day: report, tally, shop — want vs need.',
      embodiment: 'Museum walk; coin handling; net game with real counters.',
      artifact: 'Catch poster with tally and because-sentence.',
      choice_point: 'He chooses the need to buy first, and the thing he loves enough to write because.',
      celebration_close: 'Applause after the three-sentence report. Stamp the crew license: Week 1 complete.',
    },
    low_battery_mode: {
      total_minutes: 15,
      steps: [
        'Name three things we found',
        'Name the four coins',
        'Say: I love ___ because ___ (oral is enough)',
      ],
      log_title: 'Ocean Explorers day 5 (short): catch report',
    },
    parent_answer_key: {
      expected_answers: [
        'Penny 1¢, nickel 5¢, dime 10¢, quarter 25¢',
        'Need = keeps you going; want = extra',
        'Opinion needs a because',
      ],
      likely_questions: [
        {
          question: 'Is a toy a need?',
          kid_answer: 'Usually a want. Food, water, a safe boat — those are needs.',
        },
      ],
      unknown_script: UNKNOWN_SCRIPT,
    },
    visuals: dayVisuals(5),
    crew: crewFor(5),
    skill_keys: skillKeysFor(5),
    book_chapter: chapterFor(5),
    flashback: {
      game: 'Captain’s quiz',
      items: [
        { prompt: 'Show 3:00 and 3:30', learned_statement: 'Hour and half hour on the clock.' },
        { prompt: 'Point west to the Gulf from Florida', learned_statement: 'The Gulf is west of us. The Atlantic is Florida’s other ocean, east.' },
        { prompt: 'Read: We see the ship.', learned_statement: 'Sight words live in real sentences.' },
      ],
    },
    sibling_tag_along: [
      { activity: 'Museum', adaptation: 'Little one carries one artifact to the “stage.”' },
      { activity: 'Coins', adaptation: 'They match coins to a paper circle the same size.' },
    ],
    block_minutes: [
      { block: 'Museum report', minutes: 8 },
      { block: 'Read with Oliver and Leila', minutes: 10 },
      { block: 'Tally + compare + make-10 pages', minutes: 12 },
      { block: 'Dock shop coins', minutes: 8 },
      { block: 'Opinion + revise', minutes: 10 },
      { block: 'Catch poster', minutes: 8 },
      { block: 'Phone recording', minutes: 5, optional: true },
    ],
    resource_queue: [],
    standards_tags: [
      'ELA.1.C.1.3',
      'ELA.1.C.1.5',
      'ELA.1.C.2.1',
      'MA.1.NSO.2.1',
      'MA.1.DP.1.1',
      'MA.1.M.2.2',
      'SS.1.E.1',
    ],
  }
}

export const OCEANS_PACK: ExpeditionPack = {
  slug: 'oceans',
  life_category: 'travel',
  title: 'Ocean Explorers',
  tagline: 'From the dock to the deep — the Gulf is next door.',
  essential_questions: [
    'What is alive at the water’s edge?',
    'How did people cross water then and now?',
    'What does a sea animal need?',
    'Where is our ocean from here?',
    'What did this crew find — want vs need?',
  ],
  likely_wonders: [
    { kind: 'know', statement: 'Fish live in the ocean.' },
    { kind: 'know', statement: 'Florida is near water.' },
    { kind: 'wonder', statement: 'How do fish breathe?' },
    { kind: 'wonder', statement: 'How did people cross the ocean before motors?' },
    { kind: 'wonder', statement: 'Which way is the Gulf from our house?' },
  ],
  resources: [
    {
      title: 'National Geographic Kids — Ocean habitat',
      url: 'https://kids.nationalgeographic.com/nature/habitats/article/ocean',
      resource_type: 'website',
      why_selected: 'Kid-level true ocean habitat.',
      question_it_answers: 'What lives in the ocean?',
      needs_parent_link: false,
      engagement_tier: 'verified',
    },
    {
      title: 'NOAA Education — marine life',
      url: 'https://www.noaa.gov/education/resource-collections/marine-life',
      resource_type: 'website',
      why_selected: 'Real marine-life photos for parent/baby talk.',
      question_it_answers: 'What do ocean animals need?',
      needs_parent_link: false,
      engagement_tier: 'verified',
    },
  ],
  vocabulary: [
    'port',
    'starboard',
    'living',
    'Atlantic',
    'Gulf',
    'tide',
    'need',
    'want',
    'tens',
    'captain',
  ],
  materials: {
    pantry: [
      'Paper, crayons, tape, sticky notes',
      'Bowl or tub of water',
      'Index cards',
      'Paper cups',
      'Beans, pasta, or coins for counting',
      'Analog clock or paper clock',
    ],
    plan_ahead: [
      'Shells, rocks, sticks for living/nonliving sort — lesson 1',
      'Stick/cork + toy boat for then/now race — lesson 2',
      'About 40 small counting objects — lesson 3',
      'Map or phone showing Florida / Gulf (west) / Atlantic (east) — lesson 4',
      'Penny, nickel, dime, quarter — lesson 5',
    ],
  },
  printables: {
    mission:
      'Your mission: from the dock to the deep — find what is alive, how people crossed, what animals need, where our ocean is, and what this crew found.',
    passport_lines: ['Captain name', 'Age', 'Home port (city)', 'Expedition begins on'],
    map_prompt:
      'Draw your house, Florida, and the water. Put a boat on the Gulf (west of home). You can add the Atlantic on the east later!',
    certificate_line:
      'completed Ocean Explorers Week 1 — sorted the shore, raced then-and-now boats, built tens, mapped Florida’s water, and reported the catch.',
    experiment_sheets: [
      {
        title: 'Then-Boat vs Now-Boat',
        question: 'Which boat is faster — then or now — and why?',
        prediction_prompt: 'Which boat will win the tub race? Why?',
        steps: [
          'Build a then-boat (stick, cork, or leaf).',
          'Use a toy boat or lid as the now-boat.',
          'Race with a blow (sail) vs a push (motor).',
          'Record which won and one reason.',
        ],
        chart_rows: ['Then-boat', 'Now-boat'],
        chart_columns: ['My prediction', 'What happened'],
        result_prompt: 'Finish the sentence: People used to cross water with… Now they often use…',
        draw_prompt: 'Draw both boats. Label THEN and NOW.',
      },
    ],
  },
  fallback_lessons: [lesson1(), lesson2(), lesson3(), lesson4(), lesson5()],
  facilitator_guide: {
    for_whom: 'For the adult teaching this week',
    promise:
      'The Good and the Beautiful is a tool, not a second school. These five days cover Math 1 and Language Arts 1 lessons 1–5, then name the science, geography, history, and money already inside the expedition. One week does not finish grade 1. It does put the explorer on pace with that boxed week — and ahead on the world.',
    week_map: [
      {
        subject: 'Math',
        this_week: 'Left/right, write 1–20, skip 2s/5s, tens/ones past 16, time to hour and half-hour, tally, facts to 10, four coins',
        leftover: 'Facts within 20; two-digit + one-digit — later expeditions / Life Learning',
      },
      {
        subject: 'Reading',
        this_week: 'Short/long vowels, EE, SH/CH/TH, a working sight handful, retell beginning/middle/end — in the crew book',
        leftover: 'Full 143 sight words — Life Learning, every week',
      },
      {
        subject: 'Writing',
        this_week: 'One true sentence with capital and end mark; one opinion with because; one revision',
        leftover: 'Full genres (narrative, how-to, letter) — later expeditions',
      },
      {
        subject: 'Science',
        this_week: 'Living / once-living / never-living; animal needs; baby/parent; investigate and record; push/pull and sink/float on the boat race',
        leftover: 'Plants and sun — later expedition',
      },
      {
        subject: 'Geography',
        this_week: 'Home, Florida, Gulf west, Atlantic east, compass rose, a map he draws',
      },
      {
        subject: 'History',
        this_week: 'How people crossed water then vs now',
      },
      {
        subject: 'Economics',
        this_week: 'Want vs need; coins as money',
      },
      {
        subject: 'Civics',
        this_week: 'Rules on a boat / miss the tide (why rules exist) — one line',
        leftover: 'Flag / Pledge — later',
      },
      {
        subject: 'Geometry',
        this_week: 'Sort 2D dock shapes if they show up (circle, triangle, rectangle, square)',
        leftover: '3D solids — later',
      },
      {
        subject: 'Art / making',
        this_week: 'Crew license, then/now drawing, map, catch poster',
      },
    ],
    rows: [
      {
        day: 1,
        lesson_title: 'What Is Alive at the Water’s Edge?',
        math: 'Port/starboard as left/right. Count a real collection. Write 1–10.',
        reading: 'Short vs long vowels in ocean words. Chapter 1 with Oliver and Leila.',
        writing: 'One true sentence with a capital and end mark.',
        world: 'Living / once-living / never-living sort. Octavia on duty.',
        chapter: 'Alive at the Edge',
        crew: 'Oliver, Leila, Octavia',
        boxed: 'Math 1 L1 left/right. Language Arts 1 L1 short vs long vowels.',
      },
      {
        day: 2,
        lesson_title: 'How Did People Cross the Water?',
        math: 'Write 1–20. Skip-count 2s to 20 and 5s to 50.',
        reading: 'EE in deep, reef, see, keep. Sight word the. Chapter 2.',
        writing: 'One then/now sentence.',
        world: 'Then vs now crossing. Push vs pull. Float. Professor Zigzag.',
        chapter: 'Then Boat, Now Boat',
        crew: 'Oliver, Leila, Professor Zigzag',
        boxed: 'Math 1 L2 write 1–20, skip-count by 2s. Language Arts 1 L2 EE and the.',
      },
      {
        day: 3,
        lesson_title: 'What Does a Sea Animal Need?',
        math: 'Tens and ones past 16 (16, 24, 30, 36, plus one he builds).',
        reading: 'SH/CH/TH. Spell fish, ship, that. Chapter 3.',
        writing: 'One true sentence about what a fish needs.',
        world: 'Air, water, food, space. Baby and parent. Waffles.',
        chapter: 'What a Fish Needs',
        crew: 'Oliver, Leila, Waffles',
        boxed: 'Math 1 L3 tens/ones through 16. Language Arts 1 L3–4 SH/CH/TH.',
      },
      {
        day: 4,
        lesson_title: 'Where Is Our Ocean From Here?',
        math: 'Blank clocks: 3:00, 3:30, 4:00, 6:30 analog and digital.',
        reading: 'Dock log. Retell beginning/middle/end. Chapter 4.',
        writing: 'Dock log lines.',
        world: 'Home, Florida, Gulf west, Atlantic east, compass rose. Pip.',
        chapter: 'Where Is Our Water?',
        crew: 'Oliver, Leila, Pip',
        boxed: 'Math 1 L4 time to hour and half hour. Language Arts 1 L5 sight words and retell.',
      },
      {
        day: 5,
        lesson_title: 'What Did This Crew Find?',
        math: 'Tally, which is more, make-10, compare, four coins.',
        reading: 'Chapter 5 with the whole crew named.',
        writing: 'I love ___ because ___. Revise one mark.',
        world: 'Want vs need. Coins as money. Boots.',
        chapter: 'The Catch',
        crew: 'Oliver, Leila, Boots',
        boxed: 'Math 1 L5 compare, tally, facts to 10, coins. Language Arts opinion seed.',
      },
    ],
    leftovers: [
      'Facts within 20 — later expedition / Life Learning Fast Numbers',
      'Two-digit plus one-digit — ladder climb, not this week',
      '3D solids — later expedition',
      'The full 143 sight-word list — Life Learning, every week (this week plants a handful)',
      'Plants and sun — later expedition',
      'Flag / Pledge civics — later',
      'Full writing genres (narrative, how-to, letter) — later expeditions',
    ],
  },
}
