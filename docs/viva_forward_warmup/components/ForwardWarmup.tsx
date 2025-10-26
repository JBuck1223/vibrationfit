// components/ForwardWarmup.tsx
import React from "react";
import ReactMarkdown from "react-markdown";

export function ForwardWarmup({
  markdown,
  onContinue
}: {
  markdown: string;
  onContinue: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto space-y-4 p-4">
      <ReactMarkdown className="prose">{markdown}</ReactMarkdown>
      <div className="flex gap-3">
        <button
          className="px-4 py-2 rounded bg-black text-white"
          onClick={onContinue}
        >
          I read it aloud — continue
        </button>
      </div>
      <p className="text-sm opacity-75">
        Forward is mostly a warmup to get the juices flowing. We will craft the
        other categories right after this.
      </p>
    </div>
  );
}
