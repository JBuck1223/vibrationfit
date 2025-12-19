# How Cursor's Context System Works

**Last Updated:** January 18, 2025  
**Status:** Active

## 🎯 The Short Answer

**Yes, Cursor includes context with EVERY message you send.** But it's smarter than you might think.

## 📊 What Gets Included Each Time

### Every Message Includes:

1. **`.cursorrules` file** ✅ ALWAYS
   - Your 596-line rules file is included in every single message
   - This is ~15,000-20,000 tokens per message
   - **This is the biggest cost driver**

2. **Conversation History** ✅ ALWAYS
   - Previous messages in the current chat
   - Grows with each exchange
   - Typically 2-10K tokens depending on conversation length

3. **Relevant Code Context** ⚠️ VARIABLE
   - Files you've opened/referenced
   - Files Cursor thinks are relevant (based on your question)
   - Codebase search results
   - Can range from 5K to 50K+ tokens depending on:
     - How many files you have open
     - How broad your question is
     - Whether Cursor auto-indexes large files

4. **System Instructions** ✅ ALWAYS
   - Cursor's built-in system prompts
   - Usually small (~1-2K tokens)

5. **Your Current Message** ✅ ALWAYS
   - The question/request you just sent
   - Usually small (100-500 tokens)

## 🔄 How It Works Per Message

```
Message 1: "How do I add a button?"
├── .cursorrules (596 lines) = ~20K tokens
├── System instructions = ~2K tokens  
├── Relevant code files = ~10K tokens
├── Your message = ~100 tokens
└── TOTAL INPUT: ~32K tokens
└── OUTPUT: ~2K tokens
└── TOTAL: ~34K tokens

Message 2: "Make it green"
├── .cursorrules (596 lines) = ~20K tokens  ← SAME, included again!
├── System instructions = ~2K tokens
├── Conversation history (Message 1 + response) = ~5K tokens
├── Relevant code files = ~8K tokens
├── Your message = ~50 tokens
└── TOTAL INPUT: ~35K tokens
└── OUTPUT: ~1K tokens
└── TOTAL: ~36K tokens

Message 3: "Add hover effect"
├── .cursorrules (596 lines) = ~20K tokens  ← STILL included!
├── System instructions = ~2K tokens
├── Conversation history (Messages 1-2 + responses) = ~10K tokens
├── Relevant code files = ~8K tokens
├── Your message = ~50 tokens
└── TOTAL INPUT: ~40K tokens
└── OUTPUT: ~1.5K tokens
└── TOTAL: ~41.5K tokens
```

## 💡 Key Insights

### 1. `.cursorrules` is ALWAYS Included
- **Every single message** includes the full `.cursorrules` file
- This is why it's such a huge cost driver
- 596 lines × ~25 tokens/line = ~15K tokens per message
- Over 100 messages = 1.5M tokens just from `.cursorrules`!

### 2. Context Grows Over Time
- Conversation history accumulates
- Each message includes all previous messages
- Long conversations can reach 50K+ tokens just from history

### 3. Code Context is Smart (But Can Be Expensive)
- Cursor tries to include only relevant files
- But "relevant" can be broad if your question is vague
- Auto-indexed files can sneak in if not excluded

### 4. Output Tokens Also Count
- Every response from the agent uses tokens
- Long explanations = more tokens
- Code generation = more tokens

## 📈 Real-World Example

**Scenario:** You have a 20-message conversation about building a feature

**Per message breakdown:**
- `.cursorrules`: 20K tokens × 20 messages = **400K tokens**
- Conversation history: Grows from 0 to ~100K tokens = **~500K tokens** (cumulative)
- Code context: ~10K tokens × 20 messages = **200K tokens**
- Your messages: ~100 tokens × 20 = **2K tokens**
- Agent responses: ~2K tokens × 20 = **40K tokens**

**Total for conversation:** ~1.14M tokens

**At typical pricing ($0.01 per 1K tokens):** ~$11.40 for one conversation!

## 🎯 Why This Matters for Your $400 Overage

If you're having many conversations like this:

- 10 conversations/month × $11.40 = **$114**
- 20 conversations/month × $11.40 = **$228**
- 35 conversations/month × $11.40 = **$399** ← This is likely you!

**The `.cursorrules` file alone:**
- 20K tokens × 100 messages = 2M tokens
- At $0.01/1K = **$20 just from `.cursorrules`**
- But if you have 20 conversations with 20 messages each = 400 messages
- 20K × 400 = 8M tokens = **$80 just from `.cursorrules`!**

## ✅ Optimization Strategies

### 1. Reduce `.cursorrules` Size (BIGGEST IMPACT)
**Current:** 596 lines = ~20K tokens per message  
**Target:** 200 lines = ~5K tokens per message  
**Savings:** 15K tokens × every message = **75% reduction**

**Example:**
- 400 messages/month × 15K saved = 6M tokens saved
- At $0.01/1K = **$60/month saved**

### 2. Use Focused Questions
**Bad:** "Explain the entire codebase"  
**Good:** "How does the token tracking work in `src/lib/tokens/tracking.ts`?"

**Why:** Focused questions = less code context needed = fewer tokens

### 3. Start New Conversations
**When:** After 10-15 messages, start fresh  
**Why:** Conversation history grows exponentially  
**Savings:** Prevents 50K+ token history from accumulating

### 4. Close Unnecessary Files
**Why:** Open files may be included in context  
**Action:** Close files you're not actively working on

### 5. Use `.cursorignore`
**Why:** Prevents large files from being auto-indexed  
**Action:** Already created! Excludes `docs/generated/`, archives, etc.

## 🔍 How to Check Your Actual Usage

Cursor doesn't show per-message token usage, but you can estimate:

1. **Count your messages** in a typical conversation
2. **Estimate context size:**
   - `.cursorrules`: 20K tokens
   - Conversation history: ~500 tokens × message number
   - Code context: ~5-20K tokens (varies)
   - Your message: ~100-500 tokens
3. **Multiply by number of conversations**

**Example calculation:**
- 30 conversations/month
- Average 15 messages per conversation
- Average 35K tokens per message
- Total: 30 × 15 × 35K = 15.75M tokens
- Cost: 15.75M × $0.01/1K = **$157.50**

## 🎯 Bottom Line

**Yes, Cursor includes significant context with every message:**
- ✅ `.cursorrules` is ALWAYS included (your 596-line file)
- ✅ Conversation history accumulates
- ✅ Relevant code is included
- ✅ Both input AND output tokens count

**Your $400 overage likely comes from:**
- Many conversations (20-40/month)
- Long conversations (15-30 messages each)
- Large `.cursorrules` file (20K tokens × every message)
- Auto-indexed large files

**Optimizing `.cursorrules` alone could save you $60-100/month!**

