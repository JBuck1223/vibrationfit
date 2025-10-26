// src/lib/viva/compute-completion.ts
const CATS = [
  "forward","fun","travel","home","family","romance","health",
  "money","business","social","possessions","giving","spirituality","conclusion"
] as const;

export function computeCompletion(record: any) {
  const sources = record?.sources || {};
  const forwardIsWarmup = !!sources.forward_is_warmup;
  const included = CATS.filter(c => {
    if (c === "forward" && forwardIsWarmup) return false;
    const val = (record?.[c] ?? "").trim();
    return val.length > 0;
  });
  const denom = CATS.length - (forwardIsWarmup ? 1 : 0);
  const pct = Math.round((included.length / (denom || CATS.length)) * 100);
  return pct;
}
