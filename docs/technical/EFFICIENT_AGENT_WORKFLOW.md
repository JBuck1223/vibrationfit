# Efficient Agent Workflow Guide

**Last Updated:** January 18, 2025  
**Status:** Active

## 🎯 The Core Principle

**Context grows exponentially. Start fresh conversations frequently.**

## 📊 The Math: Why Long Threads Are Expensive

### Token Growth in a Conversation

```
Message 1:  ~30K tokens (20K .cursorrules + 10K code)
Message 5:  ~40K tokens (20K .cursorrules + 15K history + 5K code)
Message 10: ~55K tokens (20K .cursorrules + 30K history + 5K code)
Message 20: ~80K tokens (20K .cursorrules + 55K history + 5K code)
Message 30: ~110K tokens (20K .cursorrules + 85K history + 5K code)
```

**After 30 messages, you're paying for 110K tokens per message!**

### Cost Comparison

**Long Thread (30 messages):**
- Average: ~65K tokens per message
- Total: 30 × 65K = 1.95M tokens
- Cost: ~$19.50

**3 Fresh Threads (10 messages each):**
- Average: ~35K tokens per message
- Total: 3 × (10 × 35K) = 1.05M tokens
- Cost: ~$10.50

**Savings: 46% by starting fresh!**

## ✅ Best Practices

### 1. Start New Conversations Frequently

**When to start fresh:**
- ✅ After completing a feature/task
- ✅ After 10-15 messages
- ✅ When switching to a different part of the codebase
- ✅ When conversation history > 30K tokens (roughly 10-15 messages)
- ✅ When the agent seems "confused" or repeating itself

**How to start fresh:**
1. Click "New Chat" in Cursor
2. Or close the chat panel and open a new one
3. Reference previous work: "Continuing from previous chat, I need to..."

### 2. Use Focused, Specific Questions

**❌ Bad (expensive, vague):**
```
"Can you look at the codebase and tell me how authentication works?"
```
- Forces agent to search entire codebase
- Includes many files in context
- ~50K+ tokens

**✅ Good (efficient, specific):**
```
"How does the auth check work in src/app/api/viva/chat/route.ts around line 22?"
```
- Targets specific file/line
- Minimal context needed
- ~15K tokens

**✅ Better (even more efficient):**
```
"In src/app/api/viva/chat/route.ts line 22, why does getUser() return null?"
```
- Very specific question
- Agent can focus on exact issue
- ~12K tokens

### 3. Reference Files Explicitly

**Instead of:**
```
"Fix the button styling"
```

**Do:**
```
"In src/components/Button.tsx, make the primary variant use the green gradient from the design system"
```

**Why:** Explicit file references = less codebase searching = fewer tokens

### 4. Break Large Tasks Into Small Steps

**❌ Bad:**
```
"Build a complete user dashboard with charts, tables, and filters"
```
- Agent needs to understand entire system
- Generates lots of code
- Long conversation with many back-and-forths
- ~200K+ tokens total

**✅ Good:**
```
Thread 1: "Create the dashboard layout component in src/app/dashboard/page.tsx"
Thread 2: "Add a data table component using the design system Card"
Thread 3: "Add filtering functionality to the table"
Thread 4: "Integrate charts using the existing chart library"
```

**Why:** Each thread is focused, shorter, and more efficient

### 5. Use Code References in Your Questions

**Instead of:**
```
"Update the token tracking function"
```

**Do:**
```
"In src/lib/tokens/tracking.ts, the calculateTokenCost function needs to handle audio models. See line 70-90."
```

**Why:** Direct references = agent doesn't need to search = faster + cheaper

### 6. Summarize Before Starting New Thread

**When starting fresh, give context:**
```
"Continuing work on the token system. I just finished implementing cost tracking. 
Now I need to add validation for audio models in src/lib/tokens/tracking.ts"
```

**Why:** 
- Gives agent necessary context
- Doesn't include full conversation history
- ~2K tokens vs ~30K tokens

### 7. Close Unnecessary Files

**Before asking questions:**
- Close files you're not working on
- Only keep relevant files open
- Reduces auto-indexed context

### 8. Use Search Before Asking Agents

**Before:**
```
"Where is the user profile component?"
```

**Do:**
```
1. Use Cursor's file search (Cmd+P)
2. Or grep: "UserProfile"
3. Then ask agent: "In src/components/UserProfile.tsx, how does the tier display work?"
```

**Why:** You find it faster, then ask focused question = fewer tokens

## 🔄 Workflow Patterns

### Pattern 1: Feature Development (Recommended)

```
Thread 1: Planning (5-8 messages)
├── "I need to build X feature"
├── "What files should I modify?"
├── "Show me the existing pattern for Y"
└── "Got it, starting implementation"

Thread 2: Implementation (8-12 messages)
├── "Create the component structure"
├── "Add the API endpoint"
├── "Wire up the database"
└── "Test and fix issues"

Thread 3: Polish (5-8 messages)
├── "Add error handling"
├── "Improve styling"
└── "Add loading states"
```

**Total:** 3 focused threads vs 1 long thread = **40-50% token savings**

### Pattern 2: Debugging

```
Thread 1: Identify Issue (5-8 messages)
├── "Error occurs in X file at line Y"
├── "What could cause this?"
└── "Found the issue: Z"

Thread 2: Fix (3-5 messages)
├── "Fix the issue in X file"
└── "Verify the fix works"
```

**Why:** Separate investigation from fixing = clearer context

### Pattern 3: Learning/Understanding

```
Thread 1: High-level overview (5-8 messages)
├── "How does the token system work?"
├── "What are the main components?"
└── "Got the big picture"

Thread 2: Deep dive on specific part (5-8 messages)
├── "How does calculateTokenCost work in detail?"
└── "What edge cases does it handle?"
```

**Why:** Start broad, then go deep in separate thread = better focus

## 📋 Decision Tree: New Thread vs Continue?

```
Is the current thread > 15 messages?
├── YES → Start new thread
└── NO → Continue

Are you switching to a different feature/area?
├── YES → Start new thread
└── NO → Continue

Is conversation history > 30K tokens?
├── YES → Start new thread
└── NO → Continue

Is the agent confused/repeating?
├── YES → Start new thread with summary
└── NO → Continue
```

## 🎯 Quick Reference: Token-Efficient Questions

### ✅ DO

- "In [file] line [X], why does [Y] happen?"
- "Update [specific function] to [specific change]"
- "Following the pattern in [file], create [new thing]"
- "Fix the bug at [file]:[line] where [specific issue]"
- "Add [feature] to [specific component] using [existing pattern]"

### ❌ DON'T

- "Explain the entire codebase"
- "How does everything work?"
- "Build a complete feature" (break it down)
- "Fix all the bugs" (be specific)
- "Make it better" (specify what "better" means)

## 💡 Pro Tips

### 1. Use Thread Titles
When starting new threads, give them descriptive titles:
- "Token System: Cost Calculation"
- "Dashboard: Chart Integration"
- "Auth: Session Management"

**Why:** Helps you find context later without including full history

### 2. Copy Key Context
When starting fresh, copy relevant code snippets or error messages:
```
"Error: Cannot read property 'tokens' of undefined
In src/lib/tokens/tracking.ts:45
Here's the relevant code:
[code snippet]"
```

**Why:** Gives agent exact context without full file

### 3. Reference Previous Work
```
"Continuing from 'Token System: Cost Calculation' thread.
I implemented calculateTokenCost. Now I need to add validation."
```

**Why:** Links threads without including full history

### 4. Use Codebase Search First
Before asking agents:
1. Search for similar patterns
2. Find relevant files
3. Then ask focused question

**Example:**
```
1. Search: "gradient button"
2. Find: src/lib/design-system/components.tsx
3. Ask: "In components.tsx, how do I use GradientButton with custom colors?"
```

## 📊 Expected Savings

### Current Workflow (Long Threads)
- Average thread: 25 messages
- Average tokens per message: 60K
- 20 threads/month
- **Total: 30M tokens = ~$300**

### Optimized Workflow (Frequent Fresh Threads)
- Average thread: 10 messages
- Average tokens per message: 35K
- 30 threads/month (more focused)
- **Total: 10.5M tokens = ~$105**

**Savings: $195/month (65% reduction)**

## 🚀 Action Plan for Your Long Threads

### Immediate Actions

1. **Archive current long threads**
   - Start fresh for new work
   - Reference old threads if needed: "From previous thread about X..."

2. **Set a message limit**
   - Start new thread after 10-12 messages
   - Or when switching topics

3. **Use focused questions**
   - Reference specific files/lines
   - Break large tasks into steps

4. **Close unnecessary files**
   - Only keep relevant files open
   - Reduces auto-indexed context

### This Week

- Start new threads for each new feature/task
- Keep threads under 15 messages
- Use explicit file references
- Break large tasks into smaller threads

### This Month

- Monitor your Cursor usage
- Track token efficiency (shorter threads = better)
- Refine your workflow based on what works

## 🎯 Bottom Line

**The most efficient way to work with agents:**

1. ✅ **Start fresh frequently** (every 10-15 messages)
2. ✅ **Use focused, specific questions** (reference files/lines)
3. ✅ **Break large tasks into small threads**
4. ✅ **Close unnecessary files**
5. ✅ **Use search before asking agents**

**Your long threads are costing you 2-3x more than they need to. Start fresh conversations more often!**

