import React, { useState } from "react";

const CATS = [
  "forward","fun","travel","home","family","romance","health",
  "money","business","social","possessions","giving","spirituality","conclusion"
] as const;

type Inputs = { wants: string[]; not_wants: string[]; vent: string };

export default function CategoryComposer({ userId }: { userId: string }) {
  const [category, setCategory] = useState<typeof CATS[number]>("forward");
  const [inputs, setInputs] = useState<Inputs>({ wants: [], not_wants: [], vent: "" });
  const [reflection, setReflection] = useState("");
  const [paragraph, setParagraph] = useState("");
  const [clarifier, setClarifier] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  function setField(field: keyof Inputs, value: string) {
    if (field === "vent") return setInputs(p => ({ ...p, vent: value }));
    const list = value.split(",").map(s => s.trim()).filter(Boolean);
    setInputs(p => ({ ...p, [field]: list } as Inputs));
  }

  async function generate() {
    setLoading(true);
    setReflection(""); setParagraph(""); setClarifier("");
    try {
      const res = await fetch("/api/coach/vision/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, category, inputs })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReflection(data.reflection);
      setParagraph(data.paragraph);
      setClarifier(data.clarifier);
      setProgress(data.vision?.completion_percent ?? null);
    } catch (e:any) {
      alert(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto grid gap-4 p-4">
      <h2 className="text-xl font-semibold">Life Vision — Compose a Category</h2>

      <select
        className="border rounded p-2"
        value={category}
        onChange={e => setCategory(e.target.value as any)}
      >
        {CATS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <textarea className="border rounded p-2" rows={3}
        placeholder="What you want (comma‑separated)"
        onChange={e => setField("wants", e.target.value)} />

      <textarea className="border rounded p-2" rows={3}
        placeholder="What you want less of (comma‑separated)"
        onChange={e => setField("not_wants", e.target.value)} />

      <textarea className="border rounded p-2" rows={4}
        placeholder="Venting space (optional)"
        onChange={e => setField("vent", e.target.value)} />

      <button onClick={generate} disabled={loading}
        className="px-4 py-2 rounded bg-black text-white disabled:opacity-50">
        {loading ? "Composing..." : "Generate Vision Paragraph"}
      </button>

      {reflection && (
        <div className="rounded border p-3 bg-gray-50">
          <div className="text-sm opacity-75 mb-1">{reflection}</div>
          <p className="whitespace-pre-wrap">{paragraph}</p>
          <div className="text-sm opacity-75 mt-2">{clarifier}</div>
        </div>
      )}

      {progress !== null && (
        <div className="text-sm opacity-75">Completion: {progress}%</div>
      )}
    </div>
  );
}
