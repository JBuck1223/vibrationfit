'use client'

import Link from 'next/link'
import type { FacilitatorGuide as Guide } from '@/lib/life-explorer/packs/types'

export function FacilitatorGuide({ guide }: { guide: Guide }) {
  return (
    <section className="rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#00FFFF]/80">{guide.for_whom}</p>
      <h3 className="mt-2 text-xl font-semibold text-white">How this week covers the work</h3>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-300">{guide.promise}</p>
      <p className="mt-3 text-sm">
        <Link href="/homeschool/life-explorer/progress" className="text-[#39FF14] hover:underline">
          Master list
        </Link>
        <span className="text-neutral-500"> — boxes check when the day is finished. You can override.</span>
      </p>

      {guide.week_map && guide.week_map.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-2">
            This week by subject
          </p>
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-[10px] uppercase tracking-[0.16em] text-neutral-500">
                <th className="py-2 pr-3 font-medium">Subject</th>
                <th className="py-2 pr-3 font-medium">This week</th>
                <th className="py-2 font-medium">Later</th>
              </tr>
            </thead>
            <tbody>
              {guide.week_map.map((row) => (
                <tr key={row.subject} className="border-b border-[#1d1d1d] align-top">
                  <td className="py-3 pr-3 font-medium text-white">{row.subject}</td>
                  <td className="py-3 pr-3 text-neutral-200">{row.this_week}</td>
                  <td className="py-3 text-neutral-500">{row.leftover || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 overflow-x-auto">
        <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500 mb-2">Five days</p>
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead>
            <tr className="border-b border-[#2a2a2a] text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              <th className="py-2 pr-3 font-medium">Day</th>
              <th className="py-2 pr-3 font-medium">Math</th>
              <th className="py-2 pr-3 font-medium">Reading</th>
              <th className="py-2 pr-3 font-medium">Writing</th>
              <th className="py-2 pr-3 font-medium">World</th>
              <th className="py-2 font-medium">Chapter / crew</th>
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row) => (
              <tr key={row.day} className="border-b border-[#1d1d1d] align-top">
                <td className="py-3 pr-3">
                  <p className="font-medium text-white">
                    {row.day}. {row.lesson_title}
                  </p>
                  {row.boxed && <p className="mt-1 text-xs text-neutral-500">{row.boxed}</p>}
                </td>
                <td className="py-3 pr-3 text-neutral-200">{row.math || row.this_week}</td>
                <td className="py-3 pr-3 text-neutral-200">{row.reading}</td>
                <td className="py-3 pr-3 text-neutral-200">{row.writing}</td>
                <td className="py-3 pr-3 text-neutral-200">{row.world || row.extra}</td>
                <td className="py-3 text-[#00FFFF]/90">
                  {row.chapter && <p>{row.chapter}</p>}
                  {row.crew && <p className="text-xs text-neutral-400 mt-1">{row.crew}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {guide.leftovers.length > 0 && (
        <div className="mt-5 rounded-xl border border-[#2a2a2a] bg-black/30 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-500">
            Honest leftovers — not this week
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {guide.leftovers.map((item) => (
              <li key={item} className="text-sm text-neutral-400">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
