# Integration Guide

1) Copy files into your project.
2) After creating/fetching the current draft, seed the warmup:
```ts
import { ensureForwardWarmup } from "@/lib/viva/seed-forward";
await ensureForwardWarmup(supabase, draft.id);
```
3) Show the warmup first (optional UI):
```tsx
import { FORWARD_WARMUP_MD } from "@/lib/viva/forward-warmup";
import { ForwardWarmup } from "@/components/ForwardWarmup";
<ForwardWarmup markdown={FORWARD_WARMUP_MD} onContinue={() => router.push("/vision/compose")} />
```
4) To exclude warmup from completion%:
```ts
import { computeCompletion } from "@/lib/viva/compute-completion";
const percent = computeCompletion(visionRow);
```
5) Ensure your composer reflection mentions a PROFILE or ASSESSMENT detail.
