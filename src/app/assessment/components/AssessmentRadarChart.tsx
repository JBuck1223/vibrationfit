'use client'

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts'
import { AssessmentCategory } from '@/types/assessment'
import { categoryMetadata } from '@/lib/assessment/questions'

interface AssessmentRadarChartProps {
  selfAssessmentScores: Record<string, number>
  measuredPercentages?: Record<string, number>
}

export default function AssessmentRadarChart({ selfAssessmentScores, measuredPercentages }: AssessmentRadarChartProps) {
  const categories: AssessmentCategory[] = [
    'fun', 'travel', 'home', 'family', 'love', 'health',
    'money', 'work', 'social', 'stuff', 'giving', 'spirituality'
  ]

  const data = categories.map(cat => {
    const meta = categoryMetadata[cat]
    const selfScore = selfAssessmentScores[cat] || 0
    const measured = measuredPercentages ? Math.round((measuredPercentages[cat] || 0) / 10) : undefined

    return {
      category: meta?.title || cat,
      selfAssessment: selfScore,
      ...(measured !== undefined && { measured })
    }
  })

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke="#333" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: '#a3a3a3', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: '#666', fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Self-Assessment"
            dataKey="selfAssessment"
            stroke="#BF00FF"
            fill="#BF00FF"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          {measuredPercentages && (
            <Radar
              name="Measured Score"
              dataKey="measured"
              stroke="#39FF14"
              fill="#39FF14"
              fillOpacity={0.1}
              strokeWidth={2}
            />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#BF00FF]" />
          <span className="text-xs text-neutral-400">Self-Assessment</span>
        </div>
        {measuredPercentages && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#39FF14]" />
            <span className="text-xs text-neutral-400">Measured Score</span>
          </div>
        )}
      </div>
    </div>
  )
}
