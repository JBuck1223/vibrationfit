# VIVA Tool Architecture V2 - Strategic Redesign

**Last Updated:** November 16, 2024

## The Vision Shift

### ❌ Old Paradigm: VIVA as Chatbot
```
User: "Hi VIVA, how are you?"
VIVA: "I'm wonderful! How can I help you today?"
User: "Tell me about my health vision"
VIVA: *pulls up context, generates response*
User: "What about my career?"
VIVA: *more conversation...*
```

**Problems:**
- Expensive (2,300 tokens per message)
- Slow (multiple DB queries)
- Vague intent (what does the user actually want?)
- Context overload (loads everything "just in case")

---

### ✅ New Paradigm: VIVA as Tool Suite
```
User clicks: "VIVA, Analyze My Progress"
→ /api/viva/analyze-progress
→ Returns structured data + insights
→ 500 tokens, 2 seconds

User clicks: "VIVA, Suggest Next Steps for Health"
→ /api/viva/suggest-next-steps
→ Returns 3 actionable recommendations
→ 300 tokens, 1 second

User clicks: "VIVA, Generate Daily Reflection Questions"
→ /api/viva/daily-reflection
→ Returns 5 personalized questions
→ 200 tokens, 1 second
```

**Benefits:**
- ✅ Clear intent (user chooses specific tool)
- ✅ Minimal context (only load what's needed for that tool)
- ✅ Fast & cheap (focused, efficient)
- ✅ Actionable (returns structured data, not prose)
- ✅ Composable (tools can be combined)

---

## VIVA Tool Categories

### 🎯 Vision Tools (Already Exist!)

These are the MODELS to follow:

| Tool | Endpoint | Purpose | Input | Output |
|------|----------|---------|-------|--------|
| **Category Summary** | `/viva/category-summary` | Summarize user input for one category | Transcript + Category | Structured summary |
| **Master Vision** | `/viva/master-vision` | Assemble complete vision | All summaries | Full vision document |
| **Prompt Suggestions** | `/viva/prompt-suggestions` | Generate prompts | Category | 3 personalized prompts |
| **Refine Category** | `/viva/refine-category` | Improve existing section | Category + Feedback | Refined text |
| **Flip Frequency** | `/viva/flip-frequency` | Transform negative → positive | Text | Reframed text |
| **Ideal State** | `/viva/ideal-state` | Visualize future state | Category | Vision narrative |
| **Blueprint** | `/viva/blueprint` | Create action plan | Category + Vision | Step-by-step plan |
| **Merge Clarity** | `/viva/merge-clarity` | Combine user + AI content | Two texts | Merged output |
| **Final Assembly** | `/viva/final-assembly` | Polish complete vision | Draft vision | Finalized vision |

**Pattern:** Specific input → Focused processing → Structured output

---

### 🧰 New Tool Ideas (Extend VIVA)

#### 📊 Analysis Tools
```
GET /api/viva/tools/progress-snapshot
→ Returns: Current completion %, areas above/below Green Line, momentum score

GET /api/viva/tools/vision-health-check
→ Returns: Vision completeness, staleness, alignment with actions

POST /api/viva/tools/compare-visions
→ Input: Two vision IDs
→ Returns: What changed, growth areas, regression areas
```

#### 🎯 Action Tools
```
POST /api/viva/tools/next-steps
→ Input: Category (optional)
→ Returns: 3-5 actionable next steps based on vision + current state

POST /api/viva/tools/daily-focus
→ Input: Date, energy level
→ Returns: Top 3 priorities for today aligned with vision

POST /api/viva/tools/weekly-plan
→ Input: Week
→ Returns: Weekly plan with vision-aligned goals
```

#### 💡 Insight Tools
```
POST /api/viva/tools/pattern-detection
→ Input: Journal entries (last 30 days)
→ Returns: Recurring themes, emotional patterns, blind spots

POST /api/viva/tools/gap-analysis
→ Input: Vision + Current state
→ Returns: Where you are vs. where you want to be

POST /api/viva/tools/cross-category-insights
→ Input: All categories
→ Returns: How categories influence each other (e.g., health → energy → work)
```

#### 🗣️ Communication Tools
```
POST /api/viva/tools/explain-to-partner
→ Input: Vision section
→ Returns: Plain-language explanation for sharing with others

POST /api/viva/tools/journal-prompt
→ Input: Category + Mood
→ Returns: Personalized journal prompt

POST /api/viva/tools/affirmation-generator
→ Input: Category + Challenge
→ Returns: 3 personalized affirmations
```

#### 🔄 Transformation Tools
```
POST /api/viva/tools/reframe-challenge
→ Input: Problem statement
→ Returns: Opportunity-focused reframe

POST /api/viva/tools/elevate-language
→ Input: Draft text
→ Returns: Vibrational-language version

POST /api/viva/tools/simplify-vision
→ Input: Verbose vision
→ Returns: Concise, actionable version
```

---

## Tool Architecture Pattern

### Standard Tool Structure

```typescript
// /src/app/api/viva/tools/[tool-name]/route.ts

export async function POST(request: NextRequest) {
  // 1. Auth
  const { user } = await authenticate()
  
  // 2. Parse input
  const { specific, required, inputs } = await request.json()
  
  // 3. Load ONLY needed context (context-aware!)
  const context = await loadMinimalContext(user.id, toolName)
  
  // 4. Validate tokens
  const estimatedTokens = estimateForTool(toolName, inputs)
  await validateTokenBalance(user.id, estimatedTokens)
  
  // 5. Call AI with focused prompt
  const result = await openai.chat.completions.create({
    model: getToolModel(toolName),
    messages: [
      { role: 'system', content: getToolSystemPrompt(toolName) },
      { role: 'user', content: buildToolPrompt(inputs, context) }
    ]
  })
  
  // 6. Track usage
  await trackTokenUsage({ tool: toolName, ... })
  
  // 7. Return structured data
  return NextResponse.json({
    tool: toolName,
    result: parseToolOutput(result),
    metadata: { tokens_used, cost, processing_time }
  })
}
```

---

## UI/UX Design

### Tool Palette Pattern

Instead of a chat interface, users get a **tool palette**:

```typescript
// /src/components/viva/VivaToolPalette.tsx

const VIVA_TOOLS = [
  {
    id: 'progress-snapshot',
    name: 'Progress Snapshot',
    icon: '📊',
    category: 'analysis',
    description: 'See where you stand across all categories',
    estimatedTokens: 300,
    estimatedCost: 0.003,
  },
  {
    id: 'next-steps',
    name: 'Suggest Next Steps',
    icon: '🎯',
    category: 'action',
    description: 'Get 3-5 actionable steps for your vision',
    estimatedTokens: 400,
    estimatedCost: 0.004,
  },
  {
    id: 'journal-prompt',
    name: 'Daily Journal Prompt',
    icon: '📝',
    category: 'reflection',
    description: 'Get a personalized journaling question',
    estimatedTokens: 200,
    estimatedCost: 0.002,
  },
  // ... more tools
]

export function VivaToolPalette() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {VIVA_TOOLS.map(tool => (
        <ToolCard
          key={tool.id}
          tool={tool}
          onClick={() => invokeTool(tool.id)}
        />
      ))}
    </div>
  )
}
```

### Tool Card Design

```tsx
<Card variant="elevated" className="hover:border-primary-500 cursor-pointer">
  <div className="flex items-center gap-4 mb-3">
    <span className="text-4xl">{tool.icon}</span>
    <div>
      <h3 className="text-lg font-semibold">{tool.name}</h3>
      <Badge variant="secondary">{tool.category}</Badge>
    </div>
  </div>
  
  <p className="text-sm text-neutral-300 mb-4">{tool.description}</p>
  
  <div className="flex justify-between items-center text-xs text-neutral-400">
    <span>~{tool.estimatedTokens} tokens</span>
    <span>${tool.estimatedCost.toFixed(3)}</span>
  </div>
  
  <Button variant="primary" className="w-full mt-4">
    Use This Tool
  </Button>
</Card>
```

---

## Page Structure

### New `/viva` Page

```
/viva
├── Hero: "VIVA's AI Tools - Your Personal Growth Toolkit"
├── Tool Categories:
│   ├── 📊 Analysis Tools (Progress, Health Check, Compare)
│   ├── 🎯 Action Tools (Next Steps, Daily Focus, Weekly Plan)
│   ├── 💡 Insight Tools (Patterns, Gaps, Cross-Category)
│   ├── 🗣️ Communication Tools (Explain, Journal, Affirmations)
│   └── 🔄 Transformation Tools (Reframe, Elevate, Simplify)
└── Tool History (Recently Used Tools)
```

### Tool Invocation Modal

```tsx
<Modal>
  <ModalHeader>
    <span className="text-3xl">{tool.icon}</span>
    <h2>{tool.name}</h2>
  </ModalHeader>
  
  <ModalBody>
    {/* Dynamic inputs based on tool */}
    {tool.id === 'next-steps' && (
      <Select label="Category (Optional)">
        <option value="">All Categories</option>
        <option value="health">Health</option>
        <option value="career">Career</option>
        {/* ... */}
      </Select>
    )}
    
    {tool.id === 'journal-prompt' && (
      <>
        <Select label="Category">...</Select>
        <Select label="Current Mood">
          <option value="energized">Energized</option>
          <option value="reflective">Reflective</option>
          <option value="challenged">Challenged</option>
        </Select>
      </>
    )}
  </ModalBody>
  
  <ModalFooter>
    <div className="text-sm text-neutral-400">
      Estimated: {tool.estimatedTokens} tokens (${tool.estimatedCost})
    </div>
    <Button onClick={handleInvoke}>Generate</Button>
  </ModalFooter>
</Modal>
```

### Result Display

```tsx
<Card variant="elevated" className="mt-6">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <span className="text-3xl">{tool.icon}</span>
      <div>
        <h3 className="font-semibold">{tool.name}</h3>
        <span className="text-xs text-neutral-400">
          Generated {formatTimeAgo(result.created_at)}
        </span>
      </div>
    </div>
    
    <Badge variant="success">
      {result.tokens_used} tokens • ${result.cost.toFixed(4)}
    </Badge>
  </div>
  
  {/* Tool-specific result rendering */}
  {renderToolResult(tool.id, result.data)}
  
  <div className="flex gap-2 mt-4">
    <Button variant="ghost" onClick={handleSave}>Save</Button>
    <Button variant="ghost" onClick={handleCopy}>Copy</Button>
    <Button variant="ghost" onClick={handleRegenerate}>Regenerate</Button>
  </div>
</Card>
```

---

## Migration Strategy

### Phase 1: Create Tool Infrastructure ✅

1. ✅ Add tool registry (`/src/lib/viva/tool-registry.ts`)
2. ✅ Create tool template (`/src/lib/viva/tool-template.ts`)
3. ✅ Build tool palette UI (`/src/components/viva/VivaToolPalette.tsx`)

### Phase 2: Migrate Existing Tools

Convert chat-based features to explicit tools:

| Current | New Tool |
|---------|----------|
| "Tell me my progress" | `Progress Snapshot` tool |
| "What should I focus on?" | `Daily Focus` tool |
| "Help me with my health vision" | `Health Vision Assistant` tool |
| "Give me a journal prompt" | `Journal Prompt` tool |

### Phase 3: Deprecate General Chat

1. Move `/viva` from chat interface to tool palette
2. Add banner: "VIVA is now tool-based! Choose what you need:"
3. Keep chat as "VIVA Conversation" tool (for those who want it)
4. Track usage: see which tools are most used

### Phase 4: Expand Tool Suite

Based on usage data, create new tools:
- Most-requested features from old chat logs
- Patterns in user questions
- Gaps in current functionality

---

## Context-Aware Loading Per Tool

Each tool specifies its context needs:

```typescript
// /src/lib/viva/tool-registry.ts

export const TOOL_CONTEXT_REQUIREMENTS = {
  'progress-snapshot': {
    profile: 'minimal',  // Just name
    vision: 'full',      // Need all sections
    assessment: 'full',  // Need scores
    journeyState: true   // Need counts
  },
  
  'journal-prompt': {
    profile: 'minimal',
    vision: 'section',   // Only requested category
    assessment: 'none',
    journeyState: false
  },
  
  'next-steps': {
    profile: 'full',
    vision: 'section',   // Only requested category
    assessment: 'none',
    journeyState: false
  },
  
  'affirmation-generator': {
    profile: 'minimal',
    vision: 'section',
    assessment: 'none',
    journeyState: false
  }
}
```

**Result:** Every tool loads ONLY what it needs!

---

## Token Efficiency Comparison

### Old: Chat-Based VIVA (10 interactions)

```
User: "Hi" → 2,300 tokens
User: "Show my progress" → 2,300 tokens
User: "Give me next steps" → 2,300 tokens
User: "Journal prompt?" → 2,300 tokens
User: "Health tips" → 2,300 tokens
...

Total: 23,000 tokens
Cost: $0.23
```

### New: Tool-Based VIVA (10 tool uses)

```
Progress Snapshot → 300 tokens
Next Steps (Health) → 400 tokens
Journal Prompt → 200 tokens
Affirmation Generator → 150 tokens
Gap Analysis → 500 tokens
Daily Focus → 250 tokens
Weekly Plan → 600 tokens
Compare Visions → 400 tokens
Pattern Detection → 500 tokens
Cross-Category Insights → 450 tokens

Total: 3,750 tokens
Cost: $0.04
Savings: 83%
```

**AND:** Each tool is faster, more focused, and returns structured data!

---

## Admin Dashboard: Tool Analytics

Track tool usage to understand user needs:

```sql
-- Most-used tools
SELECT 
  metadata->>'tool' as tool_name,
  COUNT(*) as uses,
  AVG(tokens_used) as avg_tokens,
  SUM(actual_cost_cents) / 100.0 as total_cost
FROM token_usage
WHERE action_type = 'viva_tool'
GROUP BY metadata->>'tool'
ORDER BY uses DESC;

-- Tool efficiency
SELECT 
  metadata->>'tool' as tool_name,
  AVG(tokens_used) as avg_tokens,
  AVG((metadata->>'processing_time_ms')::int) as avg_time_ms
FROM token_usage
WHERE action_type = 'viva_tool'
GROUP BY metadata->>'tool';
```

---

## Example Tool: "Next Steps"

```typescript
// /src/app/api/viva/tools/next-steps/route.ts

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { category } = await request.json()
  
  // Load minimal context
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_name')
    .eq('user_id', user.id)
    .single()
  
  // Load ONLY requested category vision
  const { data: vision } = await supabase
    .from('vision_versions')
    .select(category ? `${category}` : '*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()
  
  // Build focused prompt
  const prompt = `
User: ${profile.first_name}
Category: ${category || 'All'}
Vision: ${category ? vision[category] : 'See all sections'}

Generate 3-5 specific, actionable next steps to move closer to this vision.

Format:
1. [Action] - [Why it matters]
2. [Action] - [Why it matters]
...
  `.trim()
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are VIVA, generating actionable next steps.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 500
  })
  
  const steps = parseNextSteps(completion.choices[0].message.content)
  
  await trackTokenUsage({
    user_id: user.id,
    action_type: 'viva_tool',
    model_used: 'gpt-4o',
    tokens_used: completion.usage.total_tokens,
    input_tokens: completion.usage.prompt_tokens,
    output_tokens: completion.usage.completion_tokens,
    metadata: {
      tool: 'next-steps',
      category,
      steps_generated: steps.length
    }
  })
  
  return NextResponse.json({
    tool: 'next-steps',
    result: steps,
    metadata: {
      tokens_used: completion.usage.total_tokens,
      cost: calculateCost(completion.usage),
      processing_time_ms: Date.now() - startTime
    }
  })
}

function parseNextSteps(text: string): Array<{ action: string; why: string }> {
  // Parse numbered list into structured data
  const lines = text.split('\n').filter(l => l.match(/^\d+\./))
  return lines.map(line => {
    const match = line.match(/^\d+\.\s*(.+?)\s*-\s*(.+)$/)
    return {
      action: match?.[1] || line,
      why: match?.[2] || ''
    }
  })
}
```

---

## Summary

### Strategic Shift

| Aspect | Old (Chatbot) | New (Tool Suite) |
|--------|--------------|------------------|
| **Interface** | Chat messages | Tool palette |
| **Intent** | Vague ("help me") | Explicit (choose tool) |
| **Context** | Load everything | Load per-tool needs |
| **Output** | Conversational | Structured data |
| **Cost** | ~2,300 tokens/interaction | ~200-500 tokens/tool |
| **Speed** | 3-5 seconds | 1-2 seconds |
| **UX** | Back-and-forth | One-click results |

### Benefits

1. ✅ **83% cheaper** - Minimal context per tool
2. ✅ **5x faster** - No conversation overhead
3. ✅ **Clear purpose** - Users know what each tool does
4. ✅ **Composable** - Tools can be chained
5. ✅ **Scalable** - Easy to add new tools
6. ✅ **Measurable** - Track which tools users love
7. ✅ **Maintainable** - Each tool is isolated

### Next Steps

1. **Design tool palette UI** (what tools should exist?)
2. **Prioritize first 5-10 tools** (based on current chat usage)
3. **Build tool infrastructure** (registry, template, context loader)
4. **Migrate existing features** (turn chat patterns into tools)
5. **Launch & measure** (see which tools are used most)
6. **Expand suite** (add new tools based on demand)

---

**This is a game-changer!** VIVA becomes a Swiss Army knife instead of a general assistant. 🚀

