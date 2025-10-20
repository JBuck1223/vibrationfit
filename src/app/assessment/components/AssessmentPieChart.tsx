'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { AssessmentResult } from '@/types/assessment'
import { categoryMetadata } from '@/lib/assessment/questions'

interface AssessmentPieChartProps {
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

const RADIAN = Math.PI / 180

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-3 shadow-lg max-w-xs transform -translate-x-1/2 -translate-y-1/2">
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
    )
  }
  return null
}

export default function AssessmentPieChart({ assessment }: AssessmentPieChartProps) {
  // Transform assessment data for the pie chart
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

  if (data.length === 0) {
    return (
      <div className="bg-neutral-800/50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Category Distribution</h3>
        <p className="text-neutral-400">No assessment data available</p>
      </div>
    )
  }

  return (
    <div className="bg-neutral-800/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Green Line Status Distribution</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip />}
              allowEscapeViewBox={{ x: false, y: false }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
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
    </div>
  )
}
