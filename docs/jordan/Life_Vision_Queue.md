Rebuild life-vision/new/assembly to be a queue system that individually builds each life category.

Structure the queue like: /life-vision/[id]/audio/queue

Use this table to collect individual outputs for later assembly:

create table public.life_vision_category_state (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  category character varying(50) not null,
  transcript text null,
  ideal_state text null,
  blueprint_data jsonb null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  ideal_state_prompts jsonb null default '[]'::jsonb,
  master_vision_raw text null,
  clarity_keys jsonb null default '[]'::jsonb,
  contrast_flips jsonb null default '[]'::jsonb,
  category_vision_text text null,
  constraint life_vision_category_state_pkey primary key (id),
  constraint life_vision_category_state_user_id_category_key unique (user_id, category),
  constraint life_vision_category_state_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint life_vision_category_state_category_check check (
    (
      (category)::text = any (
        (
          array[
            'fun'::character varying,
            'health'::character varying,
            'travel'::character varying,
            'love'::character varying,
            'family'::character varying,
            'social'::character varying,
            'home'::character varying,
            'work'::character varying,
            'money'::character varying,
            'stuff'::character varying,
            'giving'::character varying,
            'spirituality'::character varying,
            '_master'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_lv_category_state_blueprint on public.life_vision_category_state using gin (blueprint_data) TABLESPACE pg_default;

create index IF not exists idx_lv_category_state_created on public.life_vision_category_state using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_lv_category_state_user_category on public.life_vision_category_state using btree (user_id, category) TABLESPACE pg_default;

create index IF not exists idx_lv_category_state_prompts on public.life_vision_category_state using gin (ideal_state_prompts) TABLESPACE pg_default;

create index IF not exists idx_lv_category_state_clarity_keys on public.life_vision_category_state using gin (clarity_keys) TABLESPACE pg_default;

create index IF not exists idx_lv_category_state_contrast_flips on public.life_vision_category_state using gin (contrast_flips) TABLESPACE pg_default;

create trigger update_lv_category_state_updated_at BEFORE
update on life_vision_category_state for EACH row
execute FUNCTION update_updated_at_column ();

Edit Prompt Structure:


TASK
Write the Life I Choose™ vision text for the single category: {CATEGORY_LABEL}.
Return ONLY the finished category text (no headings, no JSON, no meta).

PERSPECTIVE
- Preferred perspective: {PERSPECTIVE}
- If inputs mix “I/we”, choose the dominant voice and stay consistent.

CATEGORY MICRO-TUNING (internal guidance, do not mention explicitly)
{CATEGORY_MICRO_TUNING_BLOCK}

PRIMARY CREATIVE INPUTS (highest authority)

USER IMAGINATION (preserve wording and emotional intent):
{IDEAL_STATE_TEXT}

CLARITY KEYS (truth anchors — use as directional constraints, not prose)
These represent what must feel true in this life area.
Do not quote or list them. Let them shape tone and scenes.
{CLARITY_KEYS_ARRAY}

CONTRAST FLIPS (alignment targets — replace old patterns silently)
These represent what the user has chosen instead of previous contrast.
Do not reference the contrast. Only embody the flipped state.
{CONTRAST_FLIPS_ARRAY}

SCENES / SENSORY NOTES (expand into lived moments):
{SCENES_TEXT}

BLUEPRINT (invisible completeness cues only; do not reference):
{BLUEPRINT_TEXT}


FINAL SILENT CHECKS
- Present tense, ideal state.
- No gratitude wallpaper.
- No repetitive paragraph openings.
- No explicit contrast language.
- Preserve richness; do not compress.
- Scenes must *demonstrate* clarity keys, not explain them.
- Output should feel freeing, powerful, and emotionally good to read or hear.

Use the individual category micro-tuning

Category Micro-Tuning Layer (Silent Guidance)

This layer is internal only.
It is not shown to the user and is never referenced explicitly in output.

Its purpose is to quietly steer tone, word choice, pacing, and scene selection so each section feels good to read or listen to.

⸻

Universal Frame (Applies to All Categories)

The basis of life is freedom.
The purpose of life is joy.
The result of life is expansion.

Each section should feel emotionally uplifting, easeful, and empowering.

Emotional relief and alignment are the success metrics — not eloquence, length, or explanation.

Language should create:
	•	Ease
	•	Capability
	•	Self-trust
	•	Openness

Avoid:
	•	Obligation
	•	Pressure
	•	Performance
	•	Self-improvement tone

⸻

Category-Specific Emotional Targets

Inject only the relevant category guidance silently into the task prompt.

⸻

Love

Primary emotional target:
Freedom to be fully myself — emotionally, creatively, sexually, and spiritually.

Tone calibration:
	•	Mutual allowance
	•	Encouragement over expectation
	•	Desire without dependency
	•	Passion without pressure

Avoid:
	•	Validation seeking
	•	Completion narratives
	•	Sacrifice framing

Internal guide:
This relationship expands who I am. I do not shrink, perform, or manage myself here.

⸻

Money

Primary emotional target:
Freedom of choice.

Tone calibration:
	•	Ease
	•	Spaciousness
	•	Calm confidence
	•	Optionality

Avoid:
	•	Hustle language
	•	Proving worth
	•	Money as identity or safety replacement

Internal guide:
Money removes friction from life and amplifies fun, presence, and generosity.

⸻

Work

Primary emotional target:
Creative freedom and feeling seen and valued.

Tone calibration:
	•	Self-directed flow
	•	Appreciation without dependence
	•	Impact without urgency
	•	Choice over obligation

Avoid:
	•	Grind culture
	•	“Hard but worth it” framing
	•	External validation loops

Internal guide:
I choose how I create, when I create, and what matters — and my work responds accordingly.

⸻

Health

Primary emotional target:
Freedom of movement, energy, and enjoyment.

Tone calibration:
	•	Capability
	•	Pride without comparison
	•	Vitality as play
	•	Strength as enjoyment

Avoid:
	•	Fixing the body
	•	Discipline as control
	•	Fear-based motivation

Internal guide:
My body supports my joy. Health expands what I am available for in life.

⸻

Family

Primary emotional target:
Emotional freedom and mutual allowance.

Tone calibration:
	•	Leadership through alignment
	•	Joyful presence
	•	Trust in individuality

Avoid:
	•	Responsibility for others’ emotions
	•	Perfectionism
	•	Martyrdom

Internal guide:
I am free to enjoy my family without carrying emotional weight that is not mine.

⸻

Fun

Primary emotional target:
Permission.

Tone calibration:
	•	Lightness
	•	Spontaneity
	•	Play without justification

Avoid:
	•	Earned joy
	•	Scheduled happiness
	•	Productivity framing

Internal guide:
Fun is allowed. Joy does not need to be justified.

⸻

Travel

Primary emotional target:
Expansion through experience.

Tone calibration:
	•	Curiosity
	•	Wonder
	•	Flow

Avoid:
	•	Escapism
	•	Over-planning
	•	Status travel

Internal guide:
The world opens me, and I move through it freely.

⸻

Home

Primary emotional target:
Safety and ease.

Tone calibration:
	•	Exhale
	•	Comfort
	•	Flow

Avoid:
	•	Impressing others
	•	Maintenance stress
	•	Perfection pressure

Internal guide:
My home supports me. It does not demand from me.

⸻

Social

Primary emotional target:
Freedom to be authentic.

Tone calibration:
	•	Mutual enthusiasm
	•	Ease of connection
	•	Emotional reciprocity

Avoid:
	•	Obligation
	•	Over-giving
	•	Managing dynamics

Internal guide:
I am wanted for who I am, not for what I provide.

⸻

Giving

Primary emotional target:
Overflow.

Tone calibration:
	•	Joyful generosity
	•	Choice
	•	Appreciation

Avoid:
	•	Duty
	•	Guilt
	•	Saving others

Internal guide:
I give because I want to, not because I should.

⸻

Spirituality

Primary emotional target:
Freedom of alignment.

Tone calibration:
	•	Soft knowing
	•	Trust
	•	Presence

Avoid:
	•	Seeking
	•	Hierarchies
	•	Spiritual effort

Internal guide:
Alignment is natural. I return to it easily.

⸻

Stuff

Primary emotional target:
Ease and enjoyment.

Tone calibration:
	•	Utility with delight
	•	Playfulness
	•	Simplicity

Avoid:
	•	Accumulation
	•	Status signaling
	•	Attachment

Internal guide:
Things support my life. They do not define it.

⸻

Implementation Note

At runtime:
	•	Select category
	•	Append the matching micro-tuning block to the task prompt
	•	Do not surface this guidance in output

After all outputs land in life_vision_category_state, we run the life-vision/new/assembly process, but just to combine forward, the 12 categories, and conclusion into a new vision_versions row with is_active=TRUE and is_draft=FALSE:

create table public.vision_versions (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  title text not null,
  forward text null,
  fun text null,
  travel text null,
  home text null,
  family text null,
  love text null,
  health text null,
  money text null,
  work text null,
  social text null,
  stuff text null,
  giving text null,
  spirituality text null,
  conclusion text null,
  has_audio boolean null default false,
  audio_url text null,
  audio_duration text null,
  voice_type text null,
  background_music text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  last_audio_generated_at timestamp with time zone null,
  is_draft boolean null default false,
  is_active boolean null default false,
  activation_message text null,
  richness_metadata jsonb null,
  perspective text null default 'singular'::text,
  refined_categories jsonb null default '[]'::jsonb,
  parent_id uuid null,
  household_id uuid null,
  constraint vision_versions_pkey primary key (id),
  constraint vision_versions_household_id_fkey foreign KEY (household_id) references households (id) on delete CASCADE,
  constraint vision_versions_parent_id_fkey foreign KEY (parent_id) references vision_versions (id) on delete set null,
  constraint vision_versions_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint vision_versions_perspective_check check (
    (
      perspective = any (array['singular'::text, 'plural'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_vision_versions_is_active on public.vision_versions using btree (user_id, is_active) TABLESPACE pg_default;

create index IF not exists idx_vision_versions_is_draft on public.vision_versions using btree (user_id, is_draft) TABLESPACE pg_default;

create index IF not exists idx_vision_versions_perspective on public.vision_versions using btree (perspective) TABLESPACE pg_default;

create index IF not exists idx_vision_versions_refined_categories on public.vision_versions using gin (refined_categories) TABLESPACE pg_default;

create index IF not exists idx_vision_versions_richness_metadata on public.vision_versions using gin (richness_metadata) TABLESPACE pg_default;

create index IF not exists idx_vision_versions_parent_id on public.vision_versions using btree (parent_id) TABLESPACE pg_default;

create index IF not exists idx_vision_versions_parent_draft_lookup on public.vision_versions using btree (parent_id, is_draft) TABLESPACE pg_default
where
  (is_draft = true);

create index IF not exists idx_vision_versions_household_id on public.vision_versions using btree (household_id) TABLESPACE pg_default;

create trigger on_vision_created
after INSERT on vision_versions for EACH row
execute FUNCTION initialize_vision_progress ();

create trigger trigger_track_category_refinement BEFORE
update on vision_versions for EACH row
execute FUNCTION track_category_refinement ();

create trigger update_vision_versions_updated_at BEFORE
update on vision_versions for EACH row
execute FUNCTION update_updated_at_column ();