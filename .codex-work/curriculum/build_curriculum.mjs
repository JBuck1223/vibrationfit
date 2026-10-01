import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "/Users/jordanbuckingham/Desktop/vibrationfit/outputs/homeschool_music_ages_6_12";
const outputPath = `${outputDir}/Cynthia_Homeschool_Music_Curriculum_108_Lessons.xlsx`;

const levels = [
  {
    level: "Level 1 — Discover",
    promise: "I can keep a steady beat, recognize musical patterns, and play short pieces with healthy habits.",
    mastery: "Perform an 8–16 beat piece on a chosen instrument, keep a part with others, and explain one musical choice.",
    units: [
      ["Music Is Everywhere", "sound, silence, beat, and careful listening", "How do we turn everyday sound into music?", "sound detectives", "identify, sort, and recreate sounds", "home sound objects and three instrument families"],
      ["Pulse & Rhythm Builders", "steady beat, long/short sounds, and rhythm syllables", "How does a steady pulse help musicians play together?", "rhythm builders", "echo and combine four-beat patterns", "body percussion, keys, open strings, and drums"],
      ["High, Low & Melody", "pitch direction, matching tones, and short melodic shapes", "How can pitch tell a musical story?", "melody explorers", "hear, sing, and play rising and falling phrases", "keyboard groups, one string, and pitched percussion"],
      ["Instrument Families", "safe setup, tone production, and instrument care", "How does each instrument family make sound?", "instrument scientists", "compare vibration and make a clear beginning tone", "keyboard, bowed/plucked strings, and percussion"],
      ["Musical Stories", "dynamics, tempo, articulation, and form", "How do musicians communicate characters and events?", "sound storytellers", "shape a beginning, middle, and ending", "choice instruments and household sound makers"],
      ["My First Showcase", "practice habits, performance readiness, and reflection", "What helps a musician share confidently?", "young performers", "prepare, present, and reflect on a short piece", "learner-choice primary instrument plus ensemble parts"],
    ],
  },
  {
    level: "Level 2 — Build",
    promise: "I can read and create simple musical ideas, coordinate both hands or multiple techniques, and rehearse with a partner.",
    mastery: "Perform a 16–32 measure or equivalent piece with steady pulse, accurate patterns, expressive contrast, and recovery after a mistake.",
    units: [
      ["Reading Musical Maps", "staff direction, rhythmic values, measures, and symbols", "How does notation help musicians remember and share ideas?", "music-map readers", "decode and perform short written patterns", "grand staff excerpts, string fingering maps, and rhythm notation"],
      ["Technique Tool Kit", "posture, relaxed motion, coordination, and tone", "How can efficient movement improve our sound?", "technique engineers", "choose and apply a healthy movement strategy", "five-finger patterns, fingered strings, and stick/hand technique"],
      ["Chords, Drones & Harmony", "home tone, intervals, drones, and simple chords", "How do notes support one another?", "harmony builders", "add a supportive part beneath a melody", "I–V keyboard shapes, open-string drones, and percussion ostinatos"],
      ["Groove Around the World", "meter, syncopation, call-and-response, and cultural context", "How do communities use groove to connect?", "respectful groove researchers", "perform contrasting grooves and name their musical features", "keyboard bass, string riffs, and layered percussion"],
      ["Compose with Patterns", "motif, repetition, contrast, question-and-answer, and revision", "How do small patterns grow into complete music?", "pattern composers", "draft, revise, and notate an original piece", "learner-choice melody instrument with accompaniment"],
      ["Ensemble Lab", "count-ins, cues, balance, recovery, and peer feedback", "What makes a group sound like one musical team?", "ensemble collaborators", "rehearse and present independent complementary parts", "mixed keyboard, string, percussion, and voice roles"],
    ],
  },
  {
    level: "Level 3 — Create & Lead",
    promise: "I can interpret, arrange, improvise, compose, and lead music using evidence from what I hear and see.",
    mastery: "Plan and lead a polished 3–5 minute capstone containing performance, arrangement or composition, improvisation, and spoken reflection.",
    units: [
      ["Musical Architecture", "phrase, cadence, binary, ternary, rondo, and variation", "How does musical structure guide a listener?", "form architects", "analyze and perform clear structural landmarks", "scores, listening maps, and all instrument families"],
      ["Expressive Interpretation", "phrasing, balance, tone color, rubato, and style evidence", "How can two accurate performances communicate different meanings?", "thoughtful interpreters", "defend and perform expressive decisions", "learner-choice repertoire and comparison recordings"],
      ["Improvisation Pathways", "constraints, scales, rhythmic cells, dialogue, and development", "How can freedom and limits work together?", "confident improvisers", "improvise coherent phrases and respond in real time", "pentatonic keys, string tone sets, and percussion grooves"],
      ["Arrange for Our Family", "transposition, texture, voicing, accompaniment, and accessibility", "How can we reshape music for the people and instruments we have?", "practical arrangers", "create playable, balanced parts at varied challenge levels", "available household instruments and voices"],
      ["Compose with Purpose", "audience, mood, harmonic plan, notation, revision, and feedback", "How do composers turn an intention into sound?", "purposeful composers", "develop and revise an original work", "notation tools and learner-selected instrumentation"],
      ["Capstone: Lead the Music", "project planning, rehearsal leadership, recording, performance, and reflection", "How do musicians lead a project from idea to meaningful sharing?", "artist-leaders", "produce, lead, present, and evaluate a musical capstone", "learner-choice instruments, recording device, and performance space"],
    ],
  },
];

const phases = [
  {name:"Explore", verb:"notice and imitate", activity:"Listen–move–echo", evidence:"Names two observations and accurately echoes one model."},
  {name:"Build", verb:"practice and connect", activity:"Micro-skill stations", evidence:"Completes the target pattern three times with relaxed technique."},
  {name:"Apply", verb:"read and perform", activity:"Decode–rehearse–play", evidence:"Performs the pattern in context while maintaining a steady pulse."},
  {name:"Create", verb:"choose and invent", activity:"Choice-based composing", evidence:"Creates an original idea that uses the unit concept intentionally."},
  {name:"Ensemble", verb:"listen and coordinate", activity:"Layered partner rehearsal", evidence:"Holds an independent part and adjusts after listening to others."},
  {name:"Mastery", verb:"prepare and demonstrate", activity:"Mini-performance and reflection", evidence:"Meets at least three rubric indicators and names a next step."},
];

const rows = [];
let globalLesson = 0;
for (let li = 0; li < levels.length; li++) {
  const L = levels[li];
  let levelLesson = 0;
  for (let ui = 0; ui < L.units.length; ui++) {
    const [unit, concepts, question, identity, unitOutcome, instruments] = L.units[ui];
    for (let pi = 0; pi < phases.length; pi++) {
      const P = phases[pi];
      globalLesson++;
      levelLesson++;
      const duration = li === 0 ? "30–40 min" : li === 1 ? "40–50 min" : "45–60 min";
      const title = `${P.name}: ${unit}`;
      const objective = `Learner will ${P.verb} ${concepts}, working as ${identity}, then show the learning through a brief musical response.`;
      const piano = li === 0
        ? `${P.name} on keyboard: use black-key groups or a five-note area to ${unitOutcome}; prioritize curved, relaxed hands.`
        : li === 1
        ? `${P.name} on piano: coordinate melody, bass, chord, or pattern roles to ${unitOutcome}; use notation when helpful.`
        : `${P.name} on piano: shape voicing, texture, or leadership choices to ${unitOutcome}; document interpretive decisions.`;
      const strings = li === 0
        ? `${P.name} on strings: use safe rest/playing position, open strings, pizzicato, or beginning bow motion to ${unitOutcome}.`
        : li === 1
        ? `${P.name} on strings: combine finger patterns, bow/pluck control, drones, or riffs to ${unitOutcome}.`
        : `${P.name} on strings: refine intonation, articulation, texture, or arrangement choices to ${unitOutcome}.`;
      const percussion = li === 0
        ? `${P.name} on percussion: use body percussion, hand drum, shaker, or barred instrument to ${unitOutcome}; stop on a shared signal.`
        : li === 1
        ? `${P.name} on percussion: layer pulse, subdivision, ostinato, fills, or pitched patterns to ${unitOutcome}.`
        : `${P.name} on percussion: design groove, timbre, transitions, or conducting cues to ${unitOutcome}.`;
      const solo = `Child chooses one primary instrument, records a before/after attempt, and uses a visual checklist. Add the optional challenge if ready.`;
      const parent = `Parent models first, then becomes coach or duet partner. Trade “leader” and “echo” roles; finish with one specific praise and one question.`;
      const family = `Assign easy, medium, and challenge parts across available instruments/voices. Rotate the conductor and end with a whole-family performance.`;
      const sequence = pi === 0
        ? `Welcome pulse (3 min); curiosity prompt (5); ${P.activity} across two instrument families (15); learner choice replay (8); exit reflection (4).`
        : pi === 1
        ? `Body warm-up (5); model one small motion (5); ${P.activity} in 3 x 5-minute rounds; combine skills (10); self-check (5).`
        : pi === 2
        ? `Echo review (5); decode a visual/listening cue (8); ${P.activity} (15); switch instrument or role (8); exit performance (5).`
        : pi === 3
        ? `Inspiration example (5); set two creative constraints (5); ${P.activity} (20); title and share (7); kind/clear feedback (5).`
        : pi === 4
        ? `Shared count-in practice (5); assign layered roles (5); ${P.activity} with stop-and-fix cycles (20); record one take (5); team reflection (5).`
        : `Choose evidence goal (5); focused rehearsal (15); ${P.activity} (10); rubric check (7); celebrate growth and set next goal (5).`;
      const supplies = `${instruments}; pencil or dry-erase board; timer; optional phone/tablet for audio recording.`;
      const extension = li === 0
        ? `Younger/novice: use icons and two-beat chunks. Older/ready: notate an eight-beat version or lead the count-in.`
        : li === 1
        ? `Support: reduce to one repeated part. Stretch: transpose, add a contrasting section, or explain the notation used.`
        : `Support: use a constrained tone set or provided form. Stretch: mentor another player, create a clean score, or produce a multitrack recording.`;
      rows.push([globalLesson, L.level, levelLesson, `Unit ${ui+1}`, unit, P.name, title, question, objective, concepts, duration, sequence, piano, strings, percussion, solo, parent, family, supplies, P.evidence, extension, li === 0 ? "Discover → Imitate → Choose" : li === 1 ? "Decode → Coordinate → Compose" : "Analyze → Create → Lead"]);
    }
  }
}

const wb = Workbook.create();
const overview = wb.worksheets.add("Start Here");
const curriculum = wb.worksheets.add("108-Lesson Map");
const rubrics = wb.worksheets.add("Mastery Rubrics");
const modes = wb.worksheets.add("Learning Modes");
const platform = wb.worksheets.add("Platform Fields");

const navy = "#17324D", teal = "#1F7A78", gold = "#E7B24B", cream = "#FFF8E8", pale = "#EAF5F4", ink = "#22313F", gray = "#E6E9ED";
for (const s of [overview, curriculum, rubrics, modes, platform]) s.showGridLines = false;

overview.getRange("A1:H1").merge();
overview.getRange("A1").values = [["Cynthia’s Homeschool Music Journey — Sample Program"]];
overview.getRange("A2:H2").merge();
overview.getRange("A2").values = [["Ages 6–12 • 3 mastery levels • 108 lessons • piano, strings & percussion • solo, parent-child & family modes"]];
overview.getRange("A4:B10").values = [
  ["Program design", "Three 36-lesson levels; each contains six units with a repeatable six-lesson arc."],
  ["Recommended pace", "1–2 lessons weekly. Repeat, split, or extend a lesson when mastery needs more time."],
  ["Lesson length", "Level 1: 30–40 min • Level 2: 40–50 min • Level 3: 45–60 min"],
  ["Instrument path", "Every lesson offers piano, string, and percussion routes. Families may specialize or rotate."],
  ["Mastery rule", "Advance when the learner demonstrates the level outcome—not merely when all lessons are viewed."],
  ["Cynthia’s method", "The ‘Method Lens’ field is intentionally editable so Cynthia can replace sample language with her signature teaching approach."],
  ["Safety note", "Adults supervise instrument setup; protect hearing; use age-appropriate instruments and safe movement."],
];
overview.getRange("D4:H4").values = [["Level", "Learner Promise", "Mastery Demonstration", "Lessons", "Suggested Pace"]];
overview.getRange("D5:H7").values = levels.map((l,i)=>[l.level,l.promise,l.mastery,36,i===0?"18–36 weeks":i===1?"18–36 weeks":"24–36 weeks"]);
overview.getRange("D9:H9").merge(); overview.getRange("D9").values = [["Developmental Design for Ages 6–12"]];
overview.getRange("D10:H13").values = [
  ["Ages 6–7", "Imitation before explanation", "Icons, movement, two- to four-beat chunks", "Adult support recommended", "Celebrate short successful repetitions"],
  ["Ages 8–9", "Connect sound to symbol", "Four- to eight-beat patterns and choices", "Coach prompts, then independence", "Name one strength and next step"],
  ["Ages 10–12", "Explain, revise, and lead", "Notation, arranging, research, and projects", "Peer/mentor relationship", "Use evidence in reflection"],
  ["Mixed ages", "One concept, tiered parts", "Easy pulse + medium pattern + challenge lead", "Rotate roles", "Assess each learner against own part"],
];

const headers = ["Program Lesson", "Level", "Level Lesson", "Unit #", "Unit Theme", "Learning Arc", "Lesson Title", "Essential Question", "Learning Objective", "Core Concepts", "Duration", "Suggested Lesson Flow", "Piano Path", "Strings Path", "Percussion Path", "Solo Child Mode", "Child + Parent Mode", "Family Mode", "Supplies", "Mastery Evidence", "Age/Challenge Adaptation", "Method Lens"];
curriculum.getRangeByIndexes(0,0,1,headers.length).values = [headers];
curriculum.getRangeByIndexes(1,0,rows.length,headers.length).values = rows;
curriculum.tables.add(`A1:V${rows.length+1}`, true, "CurriculumTable").style = "TableStyleMedium2";
curriculum.freezePanes.freezeRows(1); curriculum.freezePanes.freezeColumns(7);

rubrics.getRange("A1:G1").merge(); rubrics.getRange("A1").values = [["Mastery Rubrics — Use at Lessons 36, 72, and 108"]];
rubrics.getRange("A3:G3").values = [["Dimension", "1 — Beginning", "2 — Developing", "3 — Secure", "4 — Extending", "Evidence to Save", "Applies At"]];
rubrics.getRange("A4:G10").values = [
  ["Pulse & Rhythm", "Needs continuous model", "Keeps short sections", "Maintains part independently", "Uses variation while preserving groove", "Audio/video clip", "All levels"],
  ["Pitch & Accuracy", "Finds some targets", "Corrects with prompts", "Plays intended patterns accurately", "Adjusts intonation/voicing independently", "Performance excerpt", "All levels"],
  ["Technique & Tone", "Needs setup support", "Uses healthy habits inconsistently", "Uses efficient motion and clear tone", "Adapts technique to expressive purpose", "Teacher/parent observation", "All levels"],
  ["Expression", "Uses one sound quality", "Shows contrast when prompted", "Shapes dynamics, articulation, or phrasing", "Defends nuanced interpretive choices", "Marked plan + recording", "Levels 2–3"],
  ["Creativity", "Copies a model", "Changes one element", "Creates a coherent original idea", "Develops, revises, and notates ideas", "Draft and final version", "All levels"],
  ["Ensemble Skills", "Loses part without leader", "Coordinates with reminders", "Listens, enters, balances, and recovers", "Leads rehearsal and supports others", "Group recording", "All levels"],
  ["Reflection & Ownership", "Names like/dislike", "Names a strength", "Uses evidence to set a next goal", "Plans practice and mentors others", "Learner reflection", "All levels"],
];
rubrics.getRange("A12:G12").merge(); rubrics.getRange("A12").values = [["Suggested advancement: mostly 3s in the level’s priority dimensions, no safety/technique concern, and a completed mastery demonstration. Scores guide teaching; they are not grades."]];
rubrics.getRange("A14:E14").values = [["Checkpoint", "Priority Dimensions", "Required Artifact", "Learner Prompt", "Adult Prompt"]];
rubrics.getRange("A15:E17").values = [
  ["Level 1 / Lesson 36", "Pulse, technique, creativity, ensemble", "8–16 beat performance + reflection", "What can you do now that felt hard before?", "Where did independence emerge?"],
  ["Level 2 / Lesson 72", "Accuracy, expression, creativity, ensemble", "16–32 measure/equivalent performance", "What did you revise, and why?", "What evidence shows readiness for less coaching?"],
  ["Level 3 / Lesson 108", "All seven dimensions", "3–5 minute led capstone + portfolio", "How does this project show your musical voice?", "How did the learner plan, adapt, and lead?"],
];

modes.getRange("A1:F1").merge(); modes.getRange("A1").values = [["Learning Mode Guide"]];
modes.getRange("A3:F3").values = [["Mode", "Adult Role", "Best Routine", "Avoid", "Evidence", "Platform Behavior"]];
modes.getRange("A4:F6").values = [
  ["Solo Child", "Set up, then step back", "Watch/model → try → record → self-check", "Correcting every attempt", "Before/after clips and learner checklist", "Show one primary path plus optional instrument tabs"],
  ["Child + Parent", "Model, coach, duet, then transfer ownership", "I do → we do → you do → we play", "Parent taking the child’s part", "Role-swap performance and two-way reflection", "Display paired roles and coaching prompts"],
  ["Family", "Facilitate tiered roles and rotate leadership", "Assign parts → layer → rehearse → rotate → perform", "Giving every player equal difficulty", "Ensemble recording and role reflection", "Display easy/medium/challenge cards for each part"],
];
modes.getRange("A8:F8").merge(); modes.getRange("A8").values = [["Universal lesson experience: Welcome & move → Hear/model → Instrument pathway → Create/choose → Share/record → Reflect/next step"]];

platform.getRange("A1:F1").merge(); platform.getRange("A1").values = [["Suggested Platform Content Model"]];
platform.getRange("A3:F3").values = [["Field", "Type", "Required?", "Example / Rule", "Learner-Facing?", "Notes"]];
platform.getRange("A4:F22").values = [
  ["program_id", "ID", "Yes", "cynthia-music-foundations", "No", "Stable across versions"],
  ["level", "Enum", "Yes", "1, 2, or 3", "Yes", "Unlock by mastery or adult override"],
  ["lesson_number", "Integer", "Yes", "1–108", "Yes", "Also store level_lesson 1–36"],
  ["unit", "Text", "Yes", "Pulse & Rhythm Builders", "Yes", "Six lessons per unit in this sample"],
  ["learning_arc", "Enum", "Yes", "Explore/Build/Apply/Create/Ensemble/Mastery", "Yes", "Supports consistent UI"],
  ["essential_question", "Text", "Yes", "One curiosity-driving question", "Yes", "Use before and after lesson"],
  ["objective", "Text", "Yes", "Observable learner action", "Yes", "Avoid vague ‘understands’ language"],
  ["duration_minutes", "Integer", "Yes", "35", "Yes", "Allow adjustable session split"],
  ["mode", "Enum", "Yes", "solo/parent_child/family", "Yes", "Selected at program or lesson level"],
  ["instrument_path", "Multi-select", "Yes", "piano/strings/percussion", "Yes", "Learner may choose one or rotate"],
  ["activity_steps", "Rich text", "Yes", "Timed sequence", "Yes", "One action per card"],
  ["media", "Asset list", "Optional", "Demo, slow demo, audio-only", "Yes", "Captions and transcripts"],
  ["supplies", "List", "Yes", "Instrument + household alternatives", "Yes", "Show before lesson starts"],
  ["mastery_evidence", "Text", "Yes", "Observable success indicator", "Yes", "Connect to rubric dimension"],
  ["submission", "Asset", "Optional", "Audio/video/photo/text", "Yes", "Family controls privacy"],
  ["reflection_prompt", "Text", "Yes", "Strength + next step", "Yes", "Child-friendly response options"],
  ["adult_coaching_note", "Text", "Optional", "Prompt, wait, then model", "Adult only", "Hide in solo child view if desired"],
  ["accessibility", "Tags", "Yes", "visual/audio/motor alternatives", "Yes", "Offer equivalent ways to demonstrate"],
  ["method_lens", "Text", "Yes", "Cynthia’s signature language", "Yes", "Editable curriculum differentiator"],
];

function styleTitle(sheet, range) {
  sheet.getRange(range).format = {fill:navy,font:{bold:true,color:"#FFFFFF",size:18},verticalAlignment:"center",wrapText:true};
  sheet.getRange(range).format.rowHeight = 34;
}
styleTitle(overview,"A1:H1"); styleTitle(rubrics,"A1:G1"); styleTitle(modes,"A1:F1"); styleTitle(platform,"A1:F1");
overview.getRange("A2:H2").format = {fill:teal,font:{color:"#FFFFFF",italic:true,size:11},wrapText:true};
for (const [sheet, ranges] of [[overview,["D4:H4","D9:H9"]],[rubrics,["A3:G3","A14:E14"]],[modes,["A3:F3"]],[platform,["A3:F3"]]]) {
  for (const r of ranges) sheet.getRange(r).format = {fill:teal,font:{bold:true,color:"#FFFFFF"},wrapText:true,verticalAlignment:"center"};
}
overview.getRange("A4:A10").format = {fill:cream,font:{bold:true,color:navy},wrapText:true};
overview.getRange("B4:B10").format = {fill:"#FFFDF7",font:{color:ink},wrapText:true};
overview.getRange("D5:H7").format = {fill:pale,font:{color:ink},wrapText:true,verticalAlignment:"top"};
overview.getRange("D10:H13").format = {fill:"#F7F9FA",font:{color:ink},wrapText:true,verticalAlignment:"top"};
overview.getRange("D5:D7").format.font = {bold:true,color:navy};
curriculum.getRange(`A1:V1`).format = {fill:navy,font:{bold:true,color:"#FFFFFF"},wrapText:true,verticalAlignment:"center"};
curriculum.getRange(`A2:V${rows.length+1}`).format = {font:{color:ink,size:9},wrapText:true,verticalAlignment:"top"};
curriculum.getRange(`A2:G${rows.length+1}`).format.fill = "#F7FAFC";
curriculum.getRange(`H2:V${rows.length+1}`).format.fill = "#FFFDF8";
curriculum.getRange(`A2:A${rows.length+1}`).format.font = {bold:true,color:teal};
for (let r=2; r<=rows.length+1; r++) if ((r-1)%6===0) curriculum.getRange(`A${r}:V${r}`).format.borders = {top:{style:"medium",color:gold}};
for (const s of [rubrics,modes,platform]) s.getUsedRange().format.wrapText = true;
rubrics.getRange("A4:G10").format = {fill:"#FFFDF8",font:{color:ink},wrapText:true,verticalAlignment:"top"};
rubrics.getRange("A12:G12").format = {fill:cream,font:{bold:true,color:navy},wrapText:true};
rubrics.getRange("A15:E17").format = {fill:pale,font:{color:ink},wrapText:true,verticalAlignment:"top"};
modes.getRange("A4:F6").format = {fill:pale,font:{color:ink},wrapText:true,verticalAlignment:"top"};
modes.getRange("A8:F8").format = {fill:cream,font:{bold:true,color:navy},wrapText:true};
platform.getRange("A4:F22").format = {fill:"#FFFDF8",font:{color:ink},wrapText:true,verticalAlignment:"top"};

overview.getRange("A1:H13").format.borders = {outside:{style:"thin",color:gray},insideHorizontal:{style:"thin",color:gray}};
rubrics.getRange("A3:G10").format.borders = {outside:{style:"thin",color:gray},insideHorizontal:{style:"thin",color:gray}};
modes.getRange("A3:F6").format.borders = {outside:{style:"thin",color:gray},insideHorizontal:{style:"thin",color:gray}};
platform.getRange("A3:F22").format.borders = {outside:{style:"thin",color:gray},insideHorizontal:{style:"thin",color:gray}};

overview.getRange("A1:H13").format.autofitRows(); rubrics.getUsedRange().format.autofitRows(); modes.getUsedRange().format.autofitRows(); platform.getUsedRange().format.autofitRows();
for (const [sheet, widths] of [
  [overview,[18,58,3,20,38,44,12,20]],
  [curriculum,[10,22,10,9,24,12,26,30,42,28,11,48,44,44,44,40,42,42,36,36,38,28]],
  [rubrics,[22,30,30,32,34,24,16]],
  [modes,[20,34,42,32,36,38]],
  [platform,[24,16,12,42,18,42]],
]) widths.forEach((w,i)=>sheet.getRangeByIndexes(0,i,Math.max(1,sheet.getUsedRange().rowCount),1).format.columnWidth=w);
curriculum.getRange("1:1").format.rowHeight = 42;
curriculum.getRange(`2:${rows.length+1}`).format.rowHeight = 88;
overview.freezePanes.freezeRows(2); rubrics.freezePanes.freezeRows(3); modes.freezePanes.freezeRows(3); platform.freezePanes.freezeRows(3);

await fs.mkdir(outputDir,{recursive:true});
const out = await SpreadsheetFile.exportXlsx(wb);
await out.save(outputPath);

const checks = {};
checks.map = (await wb.inspect({kind:"table",range:"108-Lesson Map!A1:G12",include:"values,formulas",tableMaxRows:12,tableMaxCols:7,maxChars:5000})).ndjson;
checks.rubric = (await wb.inspect({kind:"table",range:"Mastery Rubrics!A1:G17",include:"values,formulas",tableMaxRows:17,tableMaxCols:7,maxChars:5000})).ndjson;
checks.errors = (await wb.inspect({kind:"match",searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",options:{useRegex:true,maxResults:100},summary:"final formula error scan"})).ndjson;
await fs.writeFile(`${outputDir}/verification.txt`,JSON.stringify({lessonCount:rows.length,levelCounts:levels.map(l=>[l.level,rows.filter(r=>r[1]===l.level).length]),checks},null,2));

for (const [sheetName,range,file] of [
  ["Start Here","A1:H13","preview_start.png"],
  ["108-Lesson Map","A1:V14","preview_map.png"],
  ["Mastery Rubrics","A1:G17","preview_rubrics.png"],
  ["Learning Modes","A1:F8","preview_modes.png"],
  ["Platform Fields","A1:F22","preview_platform.png"],
]) {
  const image = await wb.render({sheetName,range,scale:1,format:"png"});
  await fs.writeFile(`${outputDir}/${file}`,new Uint8Array(await image.arrayBuffer()));
}

console.log(JSON.stringify({outputPath,lessonCount:rows.length,levelCounts:levels.map(l=>rows.filter(r=>r[1]===l.level).length)}));
