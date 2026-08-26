'use client'

import type { LessonVisual } from '@/lib/life-explorer/types'
import { visualBody } from '@/lib/life-explorer/print/lesson-visuals'

export function LessonVisualBoard({
  visuals,
  embedded = false,
}: {
  visuals: LessonVisual[]
  embedded?: boolean
}) {
  if (!visuals.length) return null
  const papers = (
    <>
      <style>{`
        .lesson-visual-body .hint { font-size: 13px; color: #666; }
        .lesson-visual-body h2 { font-size: 14px; margin: 12px 0 6px; }
        .lesson-visual-body table.grid { width: 100%; border-collapse: collapse; }
        .lesson-visual-body table.grid th,
        .lesson-visual-body table.grid td {
          border: 1px solid #cfcfcf; padding: 8px; text-align: left;
        }
        .lesson-visual-body .cards {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin: 10px 0;
        }
        .lesson-visual-body .card {
          border: 1px dashed #bbb; padding: 18px 8px; text-align: center;
          font-size: 18px; font-weight: 600;
        }
        .lesson-visual-body .card .card-sub {
          display: block; font-size: 11px; font-weight: 400; color: #9a9a9a; margin-top: 4px;
        }
      `}</style>
      {!embedded && (
        <>
          <h3 className="text-lg font-semibold text-white mb-1">Look at this</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Today&apos;s pictures — use them on this screen or print them for the table.
          </p>
        </>
      )}
      <div className="space-y-4">
        {visuals.map((visual) => (
          <article
            key={visual.title}
            className="overflow-hidden rounded-xl bg-white text-[#1a1a1a] p-4 md:p-5"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#6b6b6b] m-0">
              {visual.title}
            </p>
            <h4 className="text-xl font-bold mt-1 mb-1">{visual.title}</h4>
            <p className="text-sm text-[#333] m-0 mb-3">{visual.kid_do}</p>
            <div
              className="lesson-visual-body"
              dangerouslySetInnerHTML={{ __html: visualBody(visual) }}
            />
          </article>
        ))}
      </div>
    </>
  )
  if (embedded) return <div>{papers}</div>
  return (
    <section className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">{papers}</section>
  )
}
