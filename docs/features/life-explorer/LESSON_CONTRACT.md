# LESSON GENERATION CONTRACT

Generate one complete daily lesson that a parent can teach without additional planning.

VIVA authors the lesson from the Life I Choose, the world in play, current ladder rungs, and what was already taught. Reading and math practice is usually authored **inside** the expedition on the current rung. Materials may be generated layered books (story / sounded-out / sentence structure), household stuff, library books, or a page from someone else’s program — whatever is the honest tool for today.

## Required Lesson Fields

### Lesson Identity

- Expedition
- Why this matters (one or two sentences from the Life I Choose — not a life-category label)
- Lesson title
- Expedition stop or lesson number
- Recommended age/grade
- Estimated total time
- Essential question
- World Map cluster / taste this day honestly hits (omit if none belongs)

Life Category may still be stored for legacy rows. It is **not** how the day is introduced.

### Parent Prep

- Exact preparation time
- Complete materials checklist
- Books and exact reading selection when known
- Links to videos, podcasts, websites, or virtual experiences
- Anything that must be opened, printed, chilled, frozen, cut, or assembled beforehand
- Cleanup expectations
- Safety notes

### Learning Objectives

Include concise objectives across the subjects genuinely represented in the lesson.

Possible areas:

- Reading
- Writing
- Mathematics
- Science
- Social studies/geography
- Art
- Communication
- Social-emotional learning
- Practical life skills

Do not force every subject into every lesson.

### Teacher Script

Provide suggested words for:

- Opening the lesson from the Life I Choose (why this matters today)
- Introducing the mystery or question
- Transitioning between activities
- Explaining the core concept
- Closing the lesson

Scripts should sound natural, warm, concise, and non-religious unless the parent explicitly requests otherwise.

### Wonder Wall

Include:

- One prompt for “What I Know”
- One or more prompts for “What I Wonder”
- Guidance for adding discoveries to “What I Learned”
- Likely follow-up questions the child may ask

### Core Resource

Use one primary book, video, podcast, experiment, or real-world experience as the centerpiece.

For linked digital resources, save:

- Title
- URL
- Resource type
- Runtime when available
- Why it was selected
- What question it helps answer
- Suggested pause points or discussion moments when useful

**Never invent a title, page number, runtime, review score, or URL.** If unknown, omit the field or set `needs_parent_link: true`. Prefer household materials and VF-original activities.

### Hands-On Experience

When appropriate, include one meaningful activity such as:

- Experiment
- STEM build
- Map activity
- Art creation
- Pretend play
- Cooking
- Sorting or classification
- Field observation
- Presentation

For experiments, include:

- Learning goal
- Materials
- Parent setup
- Exact procedure
- Prediction prompt
- Observation questions
- Expected result
- Simple scientific explanation
- Troubleshooting
- Cleanup
- Safety
- Extension
- Documentation prompt

### Foundational Skills

Practice **one** current rung per lesson — rotate math, reading, and writing across days — dressed in this expedition's story world, ending with the rung's 60-second mastery check. Do not bolt all three ladders into every day.

Do not climb until the rung is `secure`. In semester 2, weave the next grade's rung only if this grade is already secure in that domain. If the rung is wobbly, write a *new* unique practice — never a cloned worksheet from yesterday.

When the math rung is facts work, the facts-to-10 game (5 minutes) *is* the practice — not an extra block.

Do not create a weak thematic connection simply to claim integration. A publisher book may be today’s tool; it is not required to be the year’s program.

### Child Output

Specify one observable product or demonstration:

- Drawing
- Written sentence
- Journal response
- Labeled diagram
- Model
- Oral explanation
- Experiment record
- Presentation
- Photograph of a build

### Reflection

Ask no more than three strong closing questions:

- What surprised you?
- What did you discover?
- What do you wonder now?

### Parent Observation

Ask the parent to record only information that will meaningfully shape future learning:

- What created excitement?
- What caused frustration?
- What skill appeared easy or difficult?
- What new question emerged?
- Should the topic continue, deepen, or change?
- Did this rung click enough to try in a new situation?

## Lesson Length Rule

Do not add activities merely to make the lesson appear comprehensive.

Identify:

- Core lesson
- Optional extension
- Good stopping point

The parent must be able to stop after the core lesson without feeling that the day was incomplete.

## Uniqueness Rule

Do not reuse yesterday’s hook, story mission, embodiment, or artifact. Each day is a new chapter.

---

## The Fun Contract (required)

Every lesson must satisfy all six beats (`payload.fun_contract`):

1. **Hook (2 min)** — surprising question, mini-mystery, or physical challenge. Never "today we will learn about…".
2. **Story mission** — the lesson is a chapter in the expedition's story; the child is the explorer.
3. **Embodiment** — at least one activity where the child moves, builds, tastes, digs, pours, or acts something out.
4. **Artifact** — the lesson ends with something the child would proudly show someone (doubles as portfolio evidence).
5. **Choice point** — at least one genuine fork the child decides.
6. **Celebration close** — present-tense wins, one-word essence, one new Wonder for tomorrow. When a choice point or a felt win happens, *name* the Compass truth in kid language ("You got to choose." / "That felt good — we're on the path." / "You can do more than last time."). Naming happens at existing beats — never a seventh beat.

Mood check: if the lesson could appear in a public-school packet, it fails validation and the pack fallback lesson ships instead (`lessonContractViolations` in `src/lib/life-explorer/generate.ts`).

## Facilitation Guarantees (required)

- `low_battery_mode` — a complete 15-minute version (hook + one core activity + log title). Sick days still count and still log.
- `sibling_tag_along` — one-line preschool adaptation per core activity.
- `parent_answer_key` — expected answers, kid-language answers to likely "why?" questions, and the unknown-question script. Ask VIVA / Another way is the live second explanation; this card stays for offline.
- `resource_queue` — all media in play order; the parent never hunts mid-lesson.
- `block_minutes` — per-block minutes; total core ≤ 90 min for K–2; extensions marked optional.
- Materials must be pantry-grade unless they appeared on the Weekly Materials Forecast ≥ 3 days earlier.

## Retention (required)

- `flashback` — the Expedition Flashback: 2-minute spaced retrieval from the Learned column (1d/3d/7d/30d schedule, computed in `src/lib/life-explorer/flashback.ts`, results recorded at check-in).

## Standards Tags (required)

- `standards_tags` — state benchmark families genuinely touched (e.g. `SC.1.L`, `MA.1.NSO`, `ELA.1.F`). Feeds the Florida ledger weather automatically. Not a boxed publisher’s list.

## Foundational Ladders

The foundational skills block practices the child's **current rung** on the expedition-independent math, reading, and writing ladders (`src/lib/life-explorer/ladders.ts`), each tagged with a **grade** and Florida benchmark codes as metadata. Expeditions supply context and joy; the ladders supply sequence; semester rules supply whether next-grade mix is earned. One rung per lesson, rotating domains.

## Life Learning Focus

The week has one Life Learning focus (time, money, or a Compass slice — `src/lib/life-explorer/life-learning.ts`). The lesson may dress it in the expedition world when it fits naturally; the weekly packet carries its story page and cut cards regardless. Check-in can mark Life Learning rungs secure the same way ladder rungs are marked.

## Year Map Steer

Untouched grade-level Big Ideas (`src/lib/life-explorer/year-map.ts`) arrive as soft steers beside the coverage steer. Weave one in only if today's topic honestly allows — never as a worksheet bolt-on. If the active wonder cannot take the idea, a Life Learning story page or a storybook carries it that week instead.
