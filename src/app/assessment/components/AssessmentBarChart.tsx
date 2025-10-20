'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip, Cell } from 'recharts'
import { AssessmentResult } from '@/types/assessment'
import { categoryMetadata } from '@/lib/assessment/questions'

interface AssessmentBarChartProps {
  assessment: AssessmentResult
}

// Green Line status colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'above':
      return '#199D67' // Primary Green - Above Green Line
    case 'transition':
      return '#FFB701' // Energy Yellow - Transition
    case 'below':
      return '#D03739' // Contrast Red - Below Green Line
    default:
      return '#666666' // Neutral gray for unknown status
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div 
        style={{ 
          background: 'transparent',
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
          outline: 'none',
          padding: '8px'
        }}
      >
        <div 
          className="bg-neutral-900/95 backdrop-blur-sm border border-neutral-600 rounded-lg p-3 shadow-xl max-w-xs"
          style={{
            background: 'rgba(23, 23, 23, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid #404040',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '300px'
          }}
        >
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-neutral-300">
            Score: {data.value}/{data.maxScore}
          </p>
          <p className="text-neutral-400">
            Percentage: {data.percentage.toFixed(1)}%
          </p>
          <p className="text-neutral-400">
            Status: <span className={`font-medium ${
              data.status === 'above' ? 'text-green-400' :
              data.status === 'transition' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {data.status === 'above' ? 'Above Green Line' :
               data.status === 'transition' ? 'Transition' :
               'Below Green Line'}
            </span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

export default function AssessmentBarChart({ assessment }: AssessmentBarChartProps) {
  // Transform assessment data for the bar chart
  const data = Object.entries(assessment.category_scores || {}).map(([category, score]) => {
    const maxScore = 35 // 7 questions * 5 max points each
    const percentage = (score / maxScore) * 100
    const status = assessment.green_line_status?.[category as keyof typeof assessment.green_line_status] || 'below'
    
    return {
      name: categoryMetadata[category as keyof typeof categoryMetadata]?.title || category,
      value: score,
      maxScore,
      percentage,
      status,
      category
    }
  }).filter(item => item.value > 0) // Only show categories with scores
   .sort((a, b) => b.percentage - a.percentage) // Sort by percentage descending

  if (data.length === 0) {
    return (
      <div className="bg-neutral-800/50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Green Line Status Distribution</h3>
        <p className="text-neutral-400">No assessment data available</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-800/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Green Line Status Distribution</h3>
      
      {/* Chart */}
      <div className="h-[28rem] bar-chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 0,
              right: 0,
              left: 40,
              bottom: 80,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
              fill="#9CA3AF"
              padding={{ left: 0, right: 0 }}
            />
            <YAxis 
              domain={[0, 35]}
              fontSize={12}
              fill="#9CA3AF"
              hide={true}
              width={0}
            />
            
            <Tooltip 
              content={<CustomTooltip />}
              wrapperStyle={{ 
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                outline: 'none'
              }}
              contentStyle={{
                background: 'transparent',
                border: 'none',
                boxShadow: 'none',
                outline: 'none'
              }}
              cursor={false}
            />
            
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
              ))}
            </Bar>
            
            {/* Green Line threshold lines - moved after Bar to appear on top */}
            <ReferenceLine 
              y={28} 
              stroke="#39FF14" 
              strokeDasharray="5 5" 
              strokeWidth={2}
            />
            <ReferenceLine 
              y={21} 
              stroke="#FF0040" 
              strokeDasharray="5 5" 
              strokeWidth={2}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="bg-neutral-900/50 rounded-lg p-3">
          <div className="text-lg font-bold text-green-400">
            {data.filter(d => d.status === 'above').length}
          </div>
          <div className="text-xs text-neutral-400">Above Green Line</div>
        </div>
        <div className="bg-neutral-900/50 rounded-lg p-3">
          <div className="text-lg font-bold text-yellow-400">
            {data.filter(d => d.status === 'transition').length}
          </div>
          <div className="text-xs text-neutral-400">Transition</div>
        </div>
        <div className="bg-neutral-900/50 rounded-lg p-3">
          <div className="text-lg font-bold text-red-400">
            {data.filter(d => d.status === 'below').length}
          </div>
          <div className="text-xs text-neutral-400">Below Green Line</div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-neutral-300">Above Green Line (≥80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span className="text-neutral-300">Transition (60-79%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span className="text-neutral-300">Below Green Line (&lt;60%)</span>
        </div>
      </div>
    </div>
  )
}
