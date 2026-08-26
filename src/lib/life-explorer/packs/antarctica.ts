/**
 * Expedition Pack: Antarctica — Expedition 1 of this life.
 * Ours. Not a Travel unit. Not a third-party curriculum.
 *
 * Five complete lessons, each passing the Fun Contract, with facilitation
 * guarantees baked in (low-battery mode, sibling tag-along, parent answer
 * key, time-boxed blocks, resource queue). These double as generation
 * fallbacks — Today never fails to render a teachable lesson.
 */

import { antarcticaCoreResourcesPayload } from '../antarctica-resources'
import type { LessonPayload, WeekArcDay, WorldCluster } from '../types'
import type { ExpeditionPack } from './types'
import { OCEANS_PACK } from './oceans'

const UNKNOWN_SCRIPT =
  "Great question — real explorers write those down. Let's put it on the Wonder Wall and find out together."

function lesson1(): LessonPayload {
  return {
    identity: {
      life_category: 'travel',
      expedition: 'Antarctica',
      lesson_title: 'The Coldest Place on Earth Needs Explorers',
      lesson_number: 1,
      recommended_age_grade: 'Grade 1 (ages 6-7)',
      estimated_total_minutes: 75,
      essential_question: "How do explorers learn about places they've never been?",
    },
    parent_prep: {
      prep_minutes: 8,
      materials: ['Globe or world map', 'Bowl of ice water', 'Towel', 'Paper, crayons, tape', 'Sticky notes'],
      books: ['Sophie Scott Goes South'],
      links: [],
      beforehand: ['Fill a bowl with ice water just before starting', 'Put the globe where the child can spin it'],
      cleanup: 'Pour out the ice water; hang the explorer license on the fridge.',
      safety: ['Ice water hand dips are 5-10 seconds max'],
    },
    objectives: [
      { area: 'geography', objective: 'Locate Antarctica on a globe and trace a route from home' },
      { area: 'oral language', objective: 'State one Know and two Wonders in own words' },
      { area: 'art', objective: 'Design an explorer license with name and mission patch' },
    ],
    teacher_script: {
      opening: 'Close your eyes and hold out your hand. (Guide their hand near the ice water.) Somewhere on Earth, the AIR feels colder than this water — all day, every day. Want to find out where?',
      mystery_or_question: 'This place is a desert — but it is covered in ice. How can a desert be frozen?',
      transitions: [
        'Explorers always find their destination on the map first. Spin the globe — I will give you a clue: go all the way DOWN.',
        'Every explorer needs a license. Time to make yours official.',
      ],
      core_concept: 'Antarctica is the coldest, windiest, driest continent, and explorers learn about it with maps, books, and experiments before they ever go.',
      closing: 'Explorer, your license is official. Tomorrow, your first mission: find out why the penguins who live there never freeze.',
    },
    wonder_wall: {
      know_prompt: 'What do you already know about Antarctica? (Write it exactly how they say it — even if it is wrong.)',
      wonder_prompts: ['What do you WONDER about the coldest place on Earth?', 'What would YOU pack?'],
      learned_guidance: 'After the lesson, ask: what surprised you today?',
      likely_follow_ups: ['Do people live there?', 'How cold is it really?', 'Are there polar bears?'],
    },
    core_resource: {
      title: 'Sophie Scott Goes South',
      resource_type: 'book',
      url: null,
      why_selected: 'A real voyage to Antarctica through a child\u2019s eyes — the perfect mission briefing.',
      question_it_answers: "How do explorers learn about places they've never been?",
      engagement_tier: 'verified',
    },
    hands_on: {
      title: 'Ice-water hand challenge + globe hunt',
      steps: [
        'Dip a hand in ice water for 5 seconds. Describe the feeling in one word.',
        'Find Antarctica on the globe. Trace with a finger from your home all the way south.',
        'Count the oceans you cross on the way.',
      ],
    },
    foundational_skills: {
      subject: 'reading',
      activity: 'Phonics warm-up: blend 5 expedition words (ice, map, ship, cold, snow). Child reads each aloud, then picks one to write on the explorer license.',
      materials: ['Index cards'],
      notes: 'Mastery check: can they blend "ship" and "snow" without help?',
    },
    child_output: {
      type: 'craft',
      description: 'Explorer License: name, self-portrait, mission patch drawing, and one word they can read and wrote themselves.',
    },
    reflection: ['What surprised you about Antarctica?', 'What does an explorer need most: courage, maps, or warm socks? Why?'],
    parent_observation: ['Did they blend the phonics words independently?', 'Which Wonder had the most energy behind it?'],
    core_activities: [
      'Ice-water hand challenge (hook)',
      'Read Sophie Scott Goes South (stop at pages that spark questions)',
      'Globe hunt: find Antarctica, trace the route',
      'Wonder Wall: 2 Knows + 2 Wonders on sticky notes',
      'Make the Explorer License',
    ],
    optional_extensions: ['Pack a pretend expedition bag and justify each item', 'Measure how long a bag of ice takes to melt indoors vs outside'],
    good_stopping_point: 'After the Explorer License is made — everything after is bonus.',
    time_summary: { prep_minutes: 8, lesson_minutes: 60, reading_minutes: 15, foundational_minutes: 10, has_experiment: true, has_journal: false },
    fun_contract: {
      hook: 'Hand in ice water: somewhere on Earth the AIR is colder than this — all day.',
      story_mission: 'Mission briefing: you are being licensed as a polar explorer; today you locate your destination.',
      embodiment: 'Physical ice-water challenge; walking fingers across the globe.',
      artifact: 'Explorer License with mission patch.',
      choice_point: 'Design your own mission patch OR draw what you think Antarctica looks like (we check later if you were right).',
      celebration_close: 'License ceremony: parent signs it, child says their explorer name aloud.',
    },
    low_battery_mode: {
      total_minutes: 15,
      steps: [
        'Ice-water hand dip + "somewhere the air is colder" reveal',
        'Find Antarctica on the globe together',
        'One Know + one Wonder on sticky notes',
      ],
      log_title: 'Antarctica launch (short version): globe geography + Wonder Wall',
    },
    parent_answer_key: {
      expected_answers: ['Antarctica is at the bottom of the globe', 'It is a desert because almost no rain or snow falls — the ice is very old'],
      likely_questions: [
        { question: 'Are there polar bears in Antarctica?', kid_answer: 'No! Polar bears live at the TOP of the world (the Arctic). Antarctica has penguins instead. They never meet.' },
        { question: 'How cold is it?', kid_answer: 'The coldest ever measured was about -128°F. Your freezer is only 0°F — Antarctica can be four freezers colder!' },
        { question: 'Do people live there?', kid_answer: 'No one lives there forever, but scientists visit and stay in special stations — like a sleepover for science.' },
      ],
      unknown_script: UNKNOWN_SCRIPT,
    },
    flashback: { game: 'First lesson — no flashback yet. Start making memories!', items: [] },
    sibling_tag_along: [
      { activity: 'Ice-water challenge', adaptation: 'Little one dips a finger and says "COLD!" — count to 3 together.' },
      { activity: 'Globe hunt', adaptation: 'They spin the globe and you stop it with one finger on Antarctica.' },
      { activity: 'Explorer License', adaptation: 'They scribble-decorate their own license and get it signed too.' },
    ],
    block_minutes: [
      { block: 'Hook: ice-water challenge', minutes: 5 },
      { block: 'Read-aloud: Sophie Scott', minutes: 15 },
      { block: 'Globe hunt', minutes: 10 },
      { block: 'Wonder Wall', minutes: 10 },
      { block: 'Explorer License craft', minutes: 20 },
      { block: 'Phonics warm-up', minutes: 10 },
      { block: 'Expedition bag packing', minutes: 15, optional: true },
    ],
    resource_queue: [],
    standards_tags: ['SS.1.G (maps/globes)', 'ELA.1.F (phonics/blending)', 'VA.1 (art)'],
  }
}

function lesson2(): LessonPayload {
  return {
    identity: {
      life_category: 'travel',
      expedition: 'Antarctica',
      lesson_title: "Why Don't Penguins Freeze?",
      lesson_number: 2,
      recommended_age_grade: 'Grade 1 (ages 6-7)',
      estimated_total_minutes: 80,
      essential_question: "Why don't penguins freeze?",
    },
    parent_prep: {
      prep_minutes: 10,
      materials: ['Vegetable shortening (Crisco)', '2 gallon zip-top bags', 'Bowl of ice water', 'Towels', 'Measuring tape or string', 'Blubber experiment sheet (Expedition Kit)'],
      books: [],
      links: [
        {
          title: 'How Do Whales, Penguins, and Polar Bears Keep Warm? — SciShow Kids',
          url: 'https://www.youtube.com/watch?v=TwfKCX_8fbA',
          resource_type: 'video',
          runtime: '3:45',
          why_selected: 'Blubber explained in kid language — watch right after the experiment',
          question_it_answers: "Why don't penguins freeze?",
          needs_parent_link: false,
          engagement_tier: 'franchise',
        },
        {
          title: 'PBS Nature – Penguins: Meet the Family',
          url: 'https://www.pbs.org/video/penguins-meet-the-family-bzdmpa/',
          resource_type: 'video',
          why_selected: 'Verified PBS penguin film from the experiment guide',
          question_it_answers: "Why don't penguins freeze?",
          needs_parent_link: false,
          engagement_tier: 'franchise',
        },
      ],
      beforehand: ['Make the blubber glove: fill one bag with shortening, turn the second bag inside out and nest it so a hand slides in without touching the fat', 'Queue the PBS video'],
      cleanup: 'Blubber glove seals shut and stores in the fridge for reuse.',
      safety: ['Ice dips 5-10 seconds', 'Wipe drips so the floor is not slippery'],
    },
    objectives: [
      { area: 'science', objective: 'Predict, test, and explain how blubber insulates against cold' },
      { area: 'math', objective: 'Count and compare waddle steps; measure distances' },
      { area: 'writing', objective: 'Record a prediction and a result on the experiment sheet' },
    ],
    teacher_script: {
      opening: 'Yesterday you felt the ice water with your bare hand. Today, a mystery: a penguin stands on ice ALL DAY with bare feet — and never freezes. How?!',
      mystery_or_question: 'What do penguins have that we do not? (Take every guess seriously and write it down.)',
      transitions: [
        'You made your prediction like a real scientist. Now we TEST it.',
        'Scientists watch the real thing. Let\u2019s meet the penguin family.',
      ],
      core_concept: 'Penguins have a thick layer of fat called blubber (plus waterproof feathers) that traps their body heat — like a built-in winter coat.',
      closing: 'You tested it with your own hands. Say it like a scientist: blubber keeps the cold OUT and the warm IN.',
    },
    wonder_wall: {
      know_prompt: 'Before the experiment: what do you think keeps penguins warm?',
      wonder_prompts: ['What else do you wonder about penguins now?'],
      learned_guidance: 'Capture their exact words about what the blubber glove proved.',
      likely_follow_ups: ['Do penguin babies have blubber?', 'How do penguins swim so fast?'],
    },
    core_resource: {
      title: 'PBS Nature – Penguins: Meet the Family',
      resource_type: 'video',
      url: 'https://www.pbs.org/video/penguins-meet-the-family-bzdmpa/',
      why_selected: 'Verified PBS film — real footage beats any worksheet.',
      question_it_answers: "Why don't penguins freeze?",
      engagement_tier: 'franchise',
    },
    hands_on: {
      title: 'Blubber Glove Experiment (VF original)',
      steps: [
        'Predict: which hand stays warm longer — bare or blubber-gloved? Write it in the journal.',
        'Dip the bare hand in ice water. Count seconds until it feels too cold.',
        'Dip the blubber-gloved hand. Count again.',
        'Compare the counts. What did the fat do?',
      ],
    },
    foundational_skills: {
      subject: 'math',
      activity: 'Waddle-race math: waddle like a penguin across the room. Count steps out loud. Then take giant explorer steps and count. Which needed more steps? How many more? (Subtraction with real bodies.)',
      materials: ['Measuring tape or string'],
      notes: 'Mastery check: can they find the difference between the two step counts?',
    },
    child_output: {
      type: 'experiment_record',
      description: 'Journal page: prediction, seconds counted for each hand, and one sentence: "Blubber ___." Draw the glove.',
    },
    reflection: ['Was your prediction right? How do you know?', 'What surprised your hands?'],
    parent_observation: ['Did they count seconds accurately?', 'Can they explain blubber in their own words?'],
    core_activities: [
      'Penguin mystery hook',
      'Prediction on the experiment sheet',
      'Blubber Glove Experiment with ice water',
      'PBS penguin video (pause when they shout questions)',
      'Waddle-race math',
      'Journal: result sentence + drawing',
    ],
    optional_extensions: ['Penguin huddle: whole family huddles, take turns being on the cold outside — why do penguins rotate?', 'Egg-on-feet balance walk like an emperor penguin dad'],
    good_stopping_point: 'After the journal result sentence — the video can move to snack time.',
    time_summary: { prep_minutes: 10, lesson_minutes: 65, reading_minutes: 0, foundational_minutes: 10, has_experiment: true, has_journal: true },
    fun_contract: {
      hook: 'A penguin stands barefoot on ice all day and never freezes — you have 60 minutes to crack the case.',
      story_mission: 'Mission 2: the Penguin Survival Mystery. Your lab: the kitchen. Your instrument: a glove full of fat.',
      embodiment: 'Ice-water dips with both hands; full-body waddle race.',
      artifact: 'Experiment journal page with prediction, data, and conclusion drawing.',
      choice_point: 'Test with left or right hand first? And: waddle race OR penguin huddle for the family game.',
      celebration_close: 'Scientist declaration: child states their finding aloud; parent writes their exact words on the Wonder Wall Learned column.',
    },
    low_battery_mode: {
      total_minutes: 15,
      steps: ['Blubber glove vs bare hand dip (the whole mystery in 5 minutes)', 'One-sentence journal conclusion', 'PBS video clip while you make lunch'],
      log_title: 'Penguin blubber science (short version): insulation experiment + journal',
    },
    parent_answer_key: {
      expected_answers: ['The blubber-glove hand stays comfortable much longer', 'Fat slows down how fast heat leaves the body'],
      likely_questions: [
        { question: 'Do penguins get cold feet?', kid_answer: 'Their feet get cool but never freeze — special blood flow keeps just enough warmth going, like a radiator.' },
        { question: 'Do people have blubber?', kid_answer: 'We have some fat that helps keep us warm, but not nearly enough for Antarctica — that is why we need coats.' },
        { question: 'Why do penguins huddle?', kid_answer: 'They share warmth like a group hug, and take turns being on the cold outside edge — teamwork!' },
      ],
      unknown_script: UNKNOWN_SCRIPT,
    },
    flashback: { game: 'Three quick questions — one point each, high five per point', items: [] },
    sibling_tag_along: [
      { activity: 'Blubber glove', adaptation: 'Little one squishes the glove from outside and dips one finger in the water.' },
      { activity: 'Waddle race', adaptation: 'They waddle too — count their steps out loud together to 10.' },
      { activity: 'Video', adaptation: 'Sits and watches; ask them to shout "PENGUIN!" every time a baby appears.' },
    ],
    block_minutes: [
      { block: 'Hook + prediction', minutes: 10 },
      { block: 'Blubber Glove Experiment', minutes: 20 },
      { block: 'PBS penguin video', minutes: 15 },
      { block: 'Waddle-race math', minutes: 10 },
      { block: 'Journal record', minutes: 10 },
      { block: 'Penguin huddle game', minutes: 15, optional: true },
    ],
    resource_queue: [
      {
        title: 'How Do Whales, Penguins, and Polar Bears Keep Warm? — SciShow Kids',
        url: 'https://www.youtube.com/watch?v=TwfKCX_8fbA',
        resource_type: 'video',
        engagement_tier: 'franchise',
      },
      {
        title: 'PBS Nature – Penguins: Meet the Family',
        url: 'https://www.pbs.org/video/penguins-meet-the-family-bzdmpa/',
        resource_type: 'video',
        engagement_tier: 'franchise',
      },
    ],
    standards_tags: ['SC.1.L (living things/adaptation)', 'SC.1.N (scientific inquiry)', 'MA.1.NSO (counting/comparison)', 'ELA.1.C (writing)'],
  }
}

function lesson3(): LessonPayload {
  return {
    identity: {
      life_category: 'travel',
      expedition: 'Antarctica',
      lesson_title: 'Icebergs: The Hidden 90%',
      lesson_number: 3,
      recommended_age_grade: 'Grade 1 (ages 6-7)',
      estimated_total_minutes: 75,
      essential_question: 'How much of an iceberg hides underwater?',
    },
    parent_prep: {
      prep_minutes: 5,
      materials: ['Iceberg (freeze water in a bowl or container OVERNIGHT — see forecast)', 'Clear tub or big bowl of water', 'Salt', 'Small toy figure', 'Ruler', 'Blue/white paint or crayons, cotton balls, glue, paper'],
      books: [],
      links: [],
      beforehand: ['THE NIGHT BEFORE: freeze a bowl of water (drop a small toy in half-way through freezing for the rescue mission)', 'Fill the clear tub with water'],
      cleanup: 'Icebergs melt in the sink; towels for splashes.',
      safety: ['Supervise salt — it stings eyes'],
    },
    objectives: [
      { area: 'science', objective: 'Observe that most of a floating iceberg sits underwater; test how salt melts ice' },
      { area: 'math', objective: 'Predict and measure above/below waterline with a ruler' },
      { area: 'art', objective: 'Paint an iceberg showing the hidden underwater part' },
    ],
    teacher_script: {
      opening: 'Ships in Antarctica are terrified of icebergs. Not because of the part they can SEE… because of the part they CAN\u2019T. Want to see the invisible part?',
      mystery_or_question: 'When we float our iceberg — how much will hide underwater? A little? Half? Almost all of it?',
      transitions: [
        'Your prediction is locked in. Launch the iceberg!',
        'Now a rescue mission: an explorer is frozen inside. Your tool: salt.',
      ],
      core_concept: 'About 90% of an iceberg hides below the waterline — that is why ships fear them. Salt makes ice melt faster, which is how we rescue our frozen explorer.',
      closing: 'Now you know the iceberg secret that every ship captain knows. Draw it so everyone can see the hidden 90%.',
    },
    wonder_wall: {
      know_prompt: 'What do you know about icebergs?',
      wonder_prompts: ['What do you wonder about ice and the ocean?'],
      learned_guidance: 'Capture the moment they see how much hides underwater — their exact words.',
      likely_follow_ups: ['How big is the biggest iceberg?', 'Why does salt melt ice?', 'What happened to the Titanic?'],
    },
    core_resource: {
      title: 'Iceberg float tank (VF original experiment)',
      resource_type: 'experiment',
      url: null,
      why_selected: 'Seeing the hidden 90% with your own eyes beats any video.',
      question_it_answers: 'How much of an iceberg hides underwater?',
      engagement_tier: 'vf_original',
    },
    hands_on: {
      title: 'Iceberg float + salt-ice rescue (VF original)',
      steps: [
        'Predict how much will hide underwater; mark your guess on the tub with tape.',
        'Float the iceberg. Look from the SIDE. Measure above and below with the ruler.',
        'Rescue mission: sprinkle salt to carve tunnels and free the frozen explorer.',
        'Watch the salt channels — that is erosion in fast-forward.',
      ],
    },
    foundational_skills: {
      subject: 'math',
      activity: 'Iceberg measuring: measure the part above water in centimeters, then below. Which number is bigger? Talk about "most" and "almost all." Count how many spoonfuls of salt the rescue took.',
      materials: ['Ruler', 'Spoon'],
      notes: 'Mastery check: can they read the ruler to the nearest centimeter and compare the two numbers?',
    },
    child_output: {
      type: 'drawing',
      description: 'Iceberg painting with the waterline drawn: cotton-ball texture above, the huge hidden part below in blue.',
    },
    reflection: ['Why are ships scared of icebergs?', 'What did the salt do to the ice?'],
    parent_observation: ['Did they measure above/below accurately?', 'Did the hidden-90% moment land? What did they say?'],
    core_activities: [
      'Iceberg mystery hook + prediction',
      'Float the iceberg; side-view observation',
      'Measure above vs below waterline',
      'Salt-ice rescue mission',
      'Iceberg painting with hidden 90%',
    ],
    optional_extensions: ['Float the iceberg in salt water vs fresh water — does it float higher?', 'Look up the iceberg that met the Titanic (parent picks source)'],
    good_stopping_point: 'After the painting — the salt water comparison is bonus science.',
    time_summary: { prep_minutes: 5, lesson_minutes: 60, reading_minutes: 0, foundational_minutes: 10, has_experiment: true, has_journal: false },
    fun_contract: {
      hook: 'Ships fear the part of the iceberg they CANNOT see. Today you make the invisible visible.',
      story_mission: 'Mission 3: Iceberg Patrol. Float one, measure it, then rescue a frozen explorer from inside one.',
      embodiment: 'Hands in the tub, sprinkling salt tunnels, side-view crouching to see the waterline.',
      artifact: 'Iceberg painting showing the hidden underwater mass.',
      choice_point: 'Rescue mission first or measuring first? Child picks the mission order.',
      celebration_close: 'Hold up the painting: "You discovered what ship captains fear!" One new Wonder for tomorrow.',
    },
    low_battery_mode: {
      total_minutes: 15,
      steps: ['Float ice cubes in a clear glass — how much hides under?', 'Salt one cube, watch it carve', 'One sentence: "Most of an iceberg is ___."'],
      log_title: 'Iceberg science (short version): floating ice observation + salt melt',
    },
    parent_answer_key: {
      expected_answers: ['Most of the iceberg (about 9 out of 10 parts) hides underwater', 'Salt makes ice melt faster'],
      likely_questions: [
        { question: 'Why does ice float at all?', kid_answer: 'When water freezes it puffs up and gets a little lighter for its size — so it floats, like a puffy life jacket.' },
        { question: 'Why does salt melt ice?', kid_answer: 'Salt makes it harder for water to stay frozen, so the ice turns back into water faster.' },
        { question: 'How big can icebergs get?', kid_answer: 'Some are bigger than whole cities! Scientists track the giant ones with satellites.' },
      ],
      unknown_script: UNKNOWN_SCRIPT,
    },
    flashback: { game: 'Draw it in 30 seconds and explain your drawing', items: [] },
    sibling_tag_along: [
      { activity: 'Iceberg float', adaptation: 'Little one drops ice cubes in and pokes them — do they sink or float?' },
      { activity: 'Salt rescue', adaptation: 'They get their own ice cube and a pinch of salt to sprinkle.' },
      { activity: 'Painting', adaptation: 'Cotton balls and glue on their own paper — a baby iceberg.' },
    ],
    block_minutes: [
      { block: 'Hook + prediction', minutes: 10 },
      { block: 'Float + measure', minutes: 15 },
      { block: 'Salt-ice rescue', minutes: 15 },
      { block: 'Iceberg painting', minutes: 20 },
      { block: 'Measuring math', minutes: 10 },
      { block: 'Salt vs fresh water float', minutes: 10, optional: true },
    ],
    resource_queue: [],
    standards_tags: ['SC.1.E (earth/water)', 'SC.1.N (inquiry/observation)', 'MA.1.M (measurement)', 'VA.1 (art)'],
  }
}

function lesson4(): LessonPayload {
  return {
    identity: {
      life_category: 'travel',
      expedition: 'Antarctica',
      lesson_title: "Shackleton's Impossible Journey",
      lesson_number: 4,
      recommended_age_grade: 'Grade 1 (ages 6-7)',
      estimated_total_minutes: 80,
      essential_question: 'How did 28 explorers survive when their ship was crushed by ice?',
    },
    parent_prep: {
      prep_minutes: 8,
      materials: ['World map or the Expedition Kit map page', 'Aluminum foil', 'Tub of water', '5 LEGO figures (the crew)', 'Field-notes page (weekly packet)'],
      books: [],
      links: [
        {
          title: "Shackleton's Journey (William Grill, Flying Eye Books)",
          url: 'https://nobrow.net/book/shackletons-journey/',
          resource_type: 'book',
          why_selected: 'Kate Greenaway Medal winner — the gold-standard illustrated telling; grab from the library or the publisher link',
          needs_parent_link: false,
          engagement_tier: 'franchise',
        },
      ],
      beforehand: ['If no Shackleton book is home yet, the teacher script tells the story — read it once first'],
      cleanup: 'Boats dry on a towel; crew returns to the LEGO bin.',
      safety: [],
    },
    objectives: [
      { area: 'social studies', objective: 'Trace the Endurance route on a map; sequence the story events' },
      { area: 'engineering', objective: 'Design, build, and test a foil lifeboat that holds 5 crew' },
      { area: 'writing', objective: 'Write a bravery journal entry as a crew member' },
    ],
    teacher_script: {
      opening: 'This is a TRUE story. In 1914, a ship called Endurance sailed for Antarctica with 28 men. The ice grabbed the ship… squeezed it… and CRUSHED it. Every single man survived. Today you find out how.',
      mystery_or_question: 'No ship. No phone. No rescue coming. Ice everywhere. What would YOU do first?',
      transitions: [
        'Trace their escape with your finger — every centimeter of this line took months.',
        'They survived because their little boats held. Can YOU build a boat that holds all your crew?',
      ],
      core_concept: 'Shackleton kept every man alive for almost two years through leadership, teamwork, and never giving up — then sailed a tiny lifeboat 800 miles to get help.',
      closing: 'Every explorer gets scared. Brave means doing the next right thing anyway. Write what YOU would tell the crew on the scariest night.',
    },
    wonder_wall: {
      know_prompt: 'What do you know about ships and ice?',
      wonder_prompts: ['What do you wonder about the crew? About the captain?'],
      learned_guidance: 'Capture their words about bravery and teamwork.',
      likely_follow_ups: ['Did they eat penguins?', 'How cold was the water?', 'Did they find the ship again?'],
    },
    core_resource: {
      title: "Shackleton's Journey (William Grill) — or told from the teacher script",
      resource_type: 'book',
      url: 'https://nobrow.net/book/shackletons-journey/',
      needs_parent_link: false,
      why_selected: 'Kate Greenaway Medal winner — the greatest survival story ever, beautifully illustrated.',
      question_it_answers: 'How did 28 explorers survive?',
      engagement_tier: 'franchise',
    },
    hands_on: {
      title: 'Build-a-lifeboat engineering challenge (VF original)',
      steps: [
        'Design: fold aluminum foil into a boat you believe holds 5 LEGO crew.',
        'Launch it in the tub. Load the crew ONE at a time.',
        'If it sinks: that is DATA, not failure. Redesign and relaunch.',
        'Victory condition: all 5 crew afloat for a 10-count.',
      ],
    },
    foundational_skills: {
      subject: 'reading',
      activity: 'Decodable mission log: child reads aloud a 4-sentence survival log ("The ship is stuck. The ice is big. We must be brave. We row and row."). Then reads their own bravery sentence back.',
      materials: ['Field-notes page (weekly packet)'],
      notes: 'Mastery check: fewer than 3 stumbles on the decodable log.',
    },
    child_output: {
      type: 'writing',
      description: 'Bravery journal entry (1-3 sentences, invented spelling welcome): "If I was on the Endurance, I would…" plus the tested lifeboat as a build artifact — photograph both.',
    },
    reflection: ['What was the bravest moment of the story?', 'Why did rebuilding the boat make it better?'],
    parent_observation: ['How did they handle the boat sinking — frustration or iteration?', 'Read their bravery sentence back: what does it show about them?'],
    core_activities: [
      'Tell/read the Endurance story (the hook IS the story)',
      'Map trace: Endurance route with a finger, then crayon',
      'Lifeboat engineering challenge with 5 LEGO crew',
      'Decodable mission log reading',
      'Bravery journal entry',
    ],
    optional_extensions: ['Act out the ice crushing the ship (child is the ice, parent is the ship — then swap)', 'Family "expedition dinner": one-pot meal like the crew ate, everyone shares one brave moment from their week'],
    good_stopping_point: 'After the bravery journal entry.',
    time_summary: { prep_minutes: 8, lesson_minutes: 65, reading_minutes: 15, foundational_minutes: 10, has_experiment: true, has_journal: true },
    fun_contract: {
      hook: 'A TRUE story: the ice crushed their ship 100 years ago — and every single man survived.',
      story_mission: 'Mission 4: you are crew on the Endurance. Survive the crushing, build the lifeboat, make it home.',
      embodiment: 'Acting out the ice crush; hands-on boat building and loading.',
      artifact: 'A tested foil lifeboat + a written bravery journal entry.',
      choice_point: 'Boat shape is 100% the child\u2019s design call — flat barge, canoe, or wild invention.',
      celebration_close: 'Crew salute: read their bravery sentence aloud like a captain\u2019s log; all 5 crew survived because of their boat.',
    },
    low_battery_mode: {
      total_minutes: 15,
      steps: ['Tell the story in 5 minutes (opening + core concept)', 'Trace the route on the map', 'One spoken sentence: "Brave means ___."'],
      log_title: 'Shackleton history (short version): survival story + map route',
    },
    parent_answer_key: {
      expected_answers: ['The crew survived by teamwork and never giving up; Shackleton sailed a small boat 800 miles for help', 'A wider foil boat spreads the weight and floats better'],
      likely_questions: [
        { question: 'Why does a foil boat float but a foil ball sinks?', kid_answer: 'The boat shape pushes away lots of water — the water pushes back and holds it up. Squished into a ball, it cannot push enough water away.' },
        { question: 'Did anyone die?', kid_answer: 'On this expedition, not one person — that is why it is the most famous survival story ever.' },
        { question: 'Did they find the ship?', kid_answer: 'Yes! Scientists found the Endurance at the bottom of the sea in 2022 — still in one piece, 10,000 feet down.' },
      ],
      unknown_script: UNKNOWN_SCRIPT,
    },
    flashback: { game: 'True or silly? Parent says it wrong on purpose; child corrects it', items: [] },
    sibling_tag_along: [
      { activity: 'Story time', adaptation: 'Little one holds the "ship" (a block) and squeezes it when the ice attacks.' },
      { activity: 'Lifeboat challenge', adaptation: 'They get their own foil piece to crumple and float — does it hold ONE crew?' },
      { activity: 'Map trace', adaptation: 'They drive a toy boat along the route you trace.' },
    ],
    block_minutes: [
      { block: 'The Endurance story', minutes: 15 },
      { block: 'Map route trace', minutes: 10 },
      { block: 'Lifeboat engineering', minutes: 25 },
      { block: 'Decodable mission log', minutes: 10 },
      { block: 'Bravery journal', minutes: 10 },
      { block: 'Ice-crush theater', minutes: 10, optional: true },
    ],
    resource_queue: [],
    standards_tags: ['SS.1.A (history/sequencing)', 'SS.1.G (maps)', 'SC.1.P (properties/floating)', 'ELA.1.F (decodable reading)', 'ELA.1.C (writing)'],
  }
}

function lesson5(): LessonPayload {
  return {
    identity: {
      life_category: 'travel',
      expedition: 'Antarctica',
      lesson_title: 'My Antarctica Expedition Report',
      lesson_number: 5,
      recommended_age_grade: 'Grade 1 (ages 6-7)',
      estimated_total_minutes: 75,
      essential_question: 'What did I discover, and where do I explore next?',
    },
    parent_prep: {
      prep_minutes: 5,
      materials: ['All Wonder Wall sticky notes', 'Field-notes pages + artifacts from lessons 1-4', 'Poster board OR device to record video OR paper for a comic OR shoebox for a diorama', 'Art supplies'],
      books: [],
      links: [],
      beforehand: ['Lay out every artifact from the expedition where the child can see the whole journey', 'Invite the "audience" (family members, stuffed animals count) for the 4pm presentation'],
      cleanup: 'The report joins the portfolio; artifacts get photographed first.',
      safety: [],
    },
    objectives: [
      { area: 'speaking', objective: 'Present discoveries to an audience in their own words' },
      { area: 'writing', objective: 'Harvest the Learned column: turn Wonders into Learned statements' },
      { area: 'metacognition', objective: 'Choose the next expedition direction with reasons' },
    ],
    teacher_script: {
      opening: 'Explorer — look at this table. The license. The blubber data. The iceberg painting. The lifeboat. YOU did all of this. Today, the world finds out what you discovered.',
      mystery_or_question: 'If someone knew NOTHING about Antarctica, what are the three most amazing things you would tell them?',
      transitions: [
        'Pick your reporting style — every real scientist shares discoveries their own way.',
        'The audience arrives soon. One practice run — I will be your test audience.',
      ],
      core_concept: 'Explorers finish expeditions by sharing what they found — that is how the whole world learns. And every answer they found points to a new question.',
      closing: 'Expedition 1: complete. The Wonder Wall never empties — where does your curiosity point next?',
    },
    wonder_wall: {
      know_prompt: 'Read the ORIGINAL Know notes from day 1 aloud — which were right? Which changed?',
      wonder_prompts: ['What NEW places or topics is your curiosity pointing to?'],
      learned_guidance: 'The big harvest: move every answered Wonder to Learned, in their exact words.',
      likely_follow_ups: ['Can we do the Arctic next?', 'What about the ocean? Space? Volcanoes?'],
    },
    core_resource: {
      title: 'The child\u2019s own expedition artifacts',
      resource_type: 'portfolio',
      url: null,
      why_selected: 'The proof of learning IS the resource — their own work tells the story.',
      question_it_answers: 'What did I discover?',
      engagement_tier: 'vf_original',
    },
    hands_on: {
      title: 'Expedition Report — child\u2019s choice of format',
      steps: [
        'Choose: poster, video documentary, comic strip, or shoebox diorama.',
        'Include: 3 discoveries, 1 favorite moment, 1 thing that surprised you.',
        'Build/make/record it.',
        'Present to the audience at the appointed time. Applause mandatory.',
      ],
    },
    foundational_skills: {
      subject: 'math',
      activity: 'Expedition by the numbers: count the artifacts, the Wonder notes, the Learned notes. "We started with 3 Wonders and answered 2 — how many are still open?" Chart lessons 1-5 on a simple number line.',
      materials: ['Sticky notes', 'Paper'],
      notes: 'Mastery check: subtraction with the Wonder counts, no fingers needed.',
    },
    child_output: {
      type: 'presentation',
      description: 'The Expedition Report in the child\u2019s chosen format, presented live to family — recorded on video for the Journey Feed.',
    },
    reflection: ['Which discovery are you proudest of?', 'What was true on your day-1 Know wall? What changed?', 'Where next, explorer?'],
    parent_observation: ['Presentation confidence vs day 1', 'Which next-direction options got genuine energy?'],
    core_activities: [
      'Artifact museum walk (see the whole journey)',
      'Learned column harvest from the Wonder Wall',
      'Build the Expedition Report (child\u2019s format choice)',
      'Live presentation + applause',
      'Choose-next-direction ceremony',
    ],
    optional_extensions: ['Mail a photo of the report to a grandparent with one dictated sentence', 'Expedition completion certificate from the Expedition Kit'],
    good_stopping_point: 'After the presentation — the ceremony can happen at dinner.',
    time_summary: { prep_minutes: 5, lesson_minutes: 65, reading_minutes: 0, foundational_minutes: 10, has_experiment: false, has_journal: true },
    fun_contract: {
      hook: 'Museum walk: every artifact on the table is something YOU made. Today the world hears about it.',
      story_mission: 'Final mission: file your official Expedition Report and choose your next destination.',
      embodiment: 'Building the report; presenting standing up to a real audience.',
      artifact: 'The Expedition Report itself (poster/video/comic/diorama) — the keystone portfolio piece.',
      choice_point: 'The whole lesson IS a choice point: report format, three discoveries, and the next expedition direction.',
      celebration_close: 'Applause, expedition certificate, and the ceremonial first Wonder of the NEXT expedition.',
    },
    low_battery_mode: {
      total_minutes: 15,
      steps: ['Museum walk of the artifacts', 'Child tells you their 3 discoveries out loud (record on phone)', 'Move answered Wonders to Learned together'],
      log_title: 'Expedition report (short version): oral presentation + Wonder Wall harvest',
    },
    parent_answer_key: {
      expected_answers: ['Three discoveries in their own words (blubber, hidden icebergs, Shackleton\u2019s survival are likely)', 'A genuine preference for the next direction'],
      likely_questions: [
        { question: 'Is Antarctica finished forever?', kid_answer: 'Expeditions never really end — we can come back the moment a new Antarctica question appears on your Wonder Wall.' },
        { question: 'Can I do TWO reports?', kid_answer: 'Yes — explorers publish in lots of formats. Pick the second one for tomorrow.' },
      ],
      unknown_script: UNKNOWN_SCRIPT,
    },
    flashback: { game: 'Teach it to your stuffed animal like you are the teacher', items: [] },
    sibling_tag_along: [
      { activity: 'Museum walk', adaptation: 'Little one carries one artifact to the table like a museum guard.' },
      { activity: 'Report building', adaptation: 'They make their own "report" scribble page and present it first (warm-up act).' },
      { activity: 'Presentation', adaptation: 'Official audience member with the applause job.' },
    ],
    block_minutes: [
      { block: 'Artifact museum walk', minutes: 10 },
      { block: 'Learned column harvest', minutes: 10 },
      { block: 'Build the report', minutes: 25 },
      { block: 'Presentation + applause', minutes: 10 },
      { block: 'Expedition math', minutes: 10 },
      { block: 'Next-direction ceremony', minutes: 10 },
    ],
    resource_queue: [],
    standards_tags: ['ELA.1.C (presenting/writing)', 'MA.1.NSO (counting/subtraction)', 'SS.1 (review)', 'VA.1 (art)'],
  }
}

export const ANTARCTICA_PACK: ExpeditionPack = {
  slug: 'antarctica',
  life_category: 'travel',
  title: 'Antarctica',
  tagline: 'The coldest place on Earth needs explorers.',
  essential_questions: [
    "How do explorers learn about places they've never been?",
    'Where is Antarctica and what makes it unique?',
    "Why don't penguins freeze?",
    'How much of an iceberg hides underwater?',
    'How did 28 explorers survive when their ship was crushed by ice?',
  ],
  likely_wonders: [
    { kind: 'know', statement: 'Penguins live there.' },
    { kind: 'know', statement: 'It is really cold.' },
    { kind: 'wonder', statement: "Why don't penguins freeze?" },
    { kind: 'wonder', statement: 'Is there ice everywhere?' },
    { kind: 'wonder', statement: 'Can people live in Antarctica?' },
  ],
  resources: antarcticaCoreResourcesPayload(),
  vocabulary: [
    'continent', 'expedition', 'blubber', 'insulation', 'iceberg',
    'waterline', 'huddle', 'survival', 'endurance', 'glacier',
  ],
  materials: {
    pantry: [
      'Paper, crayons, tape, glue', 'Sticky notes', 'Ice + bowls + towels',
      'Salt', 'Aluminum foil', 'LEGO figures', 'Ruler / measuring tape',
      'Index cards', 'Cotton balls',
    ],
    plan_ahead: [
      'Vegetable shortening (Crisco) — lesson 2 blubber glove',
      '2 gallon zip-top bags — lesson 2',
      'Sophie Scott Goes South (book) — lesson 1',
      'Freeze a bowl-sized iceberg overnight before lesson 3 (toy inside)',
      "Library: Shackleton's Journey by William Grill — lesson 4",
      'Poster board or shoebox — lesson 5 report',
    ],
  },
  printables: {
    mission:
      'Your mission: explore the coldest, windiest, driest place on Earth — and come back with discoveries to share.',
    passport_lines: ['Explorer name', 'Age', 'Home base (city)', 'Expedition begins on'],
    map_prompt:
      'Trace the route from your home all the way DOWN to Antarctica. Then draw what you think you will see when you arrive — you can fix it later when you know more!',
    certificate_line:
      'completed the Antarctica Expedition — braved the ice, ran the experiments, asked brilliant questions, and reported their discoveries to the world.',
    experiment_sheets: [
      {
        title: 'Penguin Blubber Experiment',
        question: "Why don't penguins freeze?",
        prediction_prompt:
          'Which hand will stay warm longer in the ice water — your bare hand, or your hand inside the blubber glove? Write your prediction.',
        steps: [
          'Make the blubber glove: one zip-top bag inside another, with shortening spread between them.',
          'Dip your BARE hand in the ice water. Count the seconds until it feels too cold!',
          'Now dip your hand wearing the BLUBBER GLOVE. Count again!',
          'Write both numbers in the chart.',
        ],
        chart_rows: ['Bare hand', 'Blubber glove'],
        chart_columns: ['My prediction (seconds)', 'What really happened (seconds)'],
        result_prompt: 'Finish the sentence: Blubber …',
        draw_prompt: 'Draw the blubber glove — and your face during the experiment',
      },
      {
        title: 'Hidden Iceberg Experiment',
        question: 'How much of an iceberg hides underwater?',
        prediction_prompt:
          'When your iceberg floats, how much will hide under the water — a little, half, or almost all of it? Write your prediction.',
        steps: [
          'Float your frozen iceberg in the clear tub of water.',
          'Look from the SIDE. Where is the waterline?',
          'Measure: how much ice is above the water? How much is below?',
          'Rescue mission: use salt to free the frozen explorer!',
        ],
        chart_rows: ['Above the water', 'Below the water'],
        chart_columns: ['My prediction', 'What I measured'],
        result_prompt: 'Finish the sentence: Ships fear icebergs because …',
        draw_prompt: 'Draw your iceberg with the waterline — show the huge hidden part below',
      },
    ],
  },
  fallback_lessons: [lesson1(), lesson2(), lesson3(), lesson4(), lesson5()],
}

export const EXPEDITION_PACKS: Record<string, ExpeditionPack> = {
  antarctica: ANTARCTICA_PACK,
  'ocean explorers': OCEANS_PACK,
  ocean: OCEANS_PACK,
  oceans: OCEANS_PACK,
}

export function packForExpedition(title: string): ExpeditionPack | null {
  const key = title.trim().toLowerCase()
  if (EXPEDITION_PACKS[key]) return EXPEDITION_PACKS[key]
  if (key.includes('ocean')) return OCEANS_PACK
  if (key.includes('antarctica')) return ANTARCTICA_PACK
  return null
}

const PACK_MATH_RUNGS = [
  'math-counting-100',
  'math-skip-counting',
  'math-place-value-tens-ones',
  'math-counting-100',
  'math-addition-within-10',
] as const

const PACK_READING_RUNGS = [
  'read-cvc-blending',
  'read-cvc-blending',
  'read-cvc-blending',
  'read-sight-vocabulary',
  'read-cvc-blending',
] as const

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/** This week's Monday on weekdays; the coming Monday on Sat/Sun. */
export function composeWeekStart(now = new Date()): string {
  const d = new Date(now)
  const day = d.getDay()
  if (day === 0) d.setDate(d.getDate() + 1)
  else if (day === 6) d.setDate(d.getDate() + 2)
  else d.setDate(d.getDate() - (day - 1))
  return d.toISOString().slice(0, 10)
}

export function weekDaysFromPack(pack: ExpeditionPack, weekStart: string): WeekArcDay[] {
  const weekdays: WeekArcDay['weekday'][] = ['mon', 'tue', 'wed', 'thu', 'fri']
  return weekdays.map((weekday, i) => {
    const lesson = pack.fallback_lessons[i]
    return {
      weekday,
      date: addDaysIso(weekStart, i),
      why: lesson?.identity.essential_question || pack.essential_questions[i] || pack.tagline,
      world_cluster: (lesson?.identity.world_cluster || 'water') as WorldCluster,
      world_taste: lesson?.identity.world_taste || pack.tagline,
      math_rung_key: PACK_MATH_RUNGS[i],
      reading_rung_key: PACK_READING_RUNGS[i],
      mix_next_grade: false,
      story_chapter: lesson?.identity.lesson_title || `Day ${i + 1}`,
      hook_seed: lesson?.fun_contract?.hook || '',
      mission_seed: lesson?.fun_contract?.story_mission || '',
      artifact_seed: lesson?.fun_contract?.artifact || '',
    }
  })
}
