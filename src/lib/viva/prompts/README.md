# VIVA Prompts

This folder contains **all AI prompts** used by VIVA (Vibrational Intelligence Virtual Assistant).

## 📁 Structure

```
/prompts/
├── README.md                        (this file)
├── index.ts                         (exports all prompts)
├── flip-frequency-prompt.ts         (Contrast → Clarity transformation)
├── merge-clarity-prompt.ts          (Combines two clarity texts)
├── master-vision-prompts.ts         (Master vision assembly - 5+ prompts)
├── vision-composer-prompt.ts        (Vision paragraph composer)
├── conversation-prompts.ts          (Conversation generation)
├── category-summary-prompt.ts       (Per-category summaries)
└── shared/                          (Shared prompt fragments)
    ├── viva-persona.ts              (VIVA personality/voice)
    ├── vibrational-grammar.ts       (Grammar rules for all prompts)
    └── output-format-rules.ts       (JSON/text format rules)
```

## 🎯 Purpose

**Single Source of Truth**: All VIVA prompts are defined here and imported by API routes and library functions.

## ✅ Best Practices

1. **Constants**: Export prompts as named constants (e.g., `FLIP_FREQUENCY_SYSTEM_PROMPT`)
2. **Builders**: Export prompt builder functions for dynamic prompts
3. **Documentation**: Add JSDoc comments explaining prompt purpose
4. **Versioning**: Use constants for easy A/B testing (e.g., `V1`, `V2`)
5. **Shared Fragments**: Extract common patterns to `/shared/` folder

## 📝 Adding New Prompts

1. Create new file: `my-feature-prompt.ts`
2. Export prompt constant and builder function
3. Add export to `index.ts`
4. Import in your API route or library function
5. Update this README

## 🔗 Usage

```typescript
// In API route or library function
import { FLIP_FREQUENCY_SYSTEM_PROMPT } from '@/lib/viva/prompts'
// or
import { buildMasterVisionPrompt } from '@/lib/viva/prompts'
```

## 📚 Related Documentation

- `VIVA_FILE_STRUCTURE_AUDIT.md` - Full audit and migration plan
- `LIFE_VISION_NEW_SYSTEM_EXPERT_GUIDE.md` - Life vision system guide

