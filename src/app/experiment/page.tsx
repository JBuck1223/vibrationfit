'use client'

import React, { useState } from 'react'
import { 
  Sparkles, 
  Zap, 
  Lightbulb, 
  Beaker, 
  Rocket,
  Target,
  Palette,
  Layers,
  Eye,
  Code,
  Wand2
} from 'lucide-react'
import { 
  PageLayout, 
  Card, 
  Button, 
  Badge, 
  Spinner,
  Input,
  Textarea,
  Icon
} from '@/lib/design-system'

export default function ExperimentPage() {
  const [activeExperiment, setActiveExperiment] = useState<string | null>(null)
  const [experimentData, setExperimentData] = useState<any>({})

  const experiments = [
    {
      id: 'single-select-cards',
      title: 'Single-Select Card Interface',
      description: 'Test a radio-button style card selection system',
      icon: Target,
      color: '#199D67',
      status: 'ready'
    },
    {
      id: 'sidebar-removal',
      title: 'Sidebar-Free Layout',
      description: 'Experiment with full-width layouts without sidebars',
      icon: Layers,
      color: '#14B8A6',
      status: 'ready'
    },
    {
      id: 'ai-refinement',
      title: 'AI-Powered Refinement',
      description: 'Test advanced AI refinement features',
      icon: Wand2,
      color: '#8B5CF6',
      status: 'ready'
    },
    {
      id: 'visual-feedback',
      title: 'Enhanced Visual Feedback',
      description: 'Experiment with better user feedback systems',
      icon: Eye,
      color: '#FFB701',
      status: 'ready'
    },
    {
      id: 'component-library',
      title: 'Component Library',
      description: 'Test new component designs and patterns',
      icon: Palette,
      color: '#D03739',
      status: 'ready'
    },
    {
      id: 'performance-test',
      title: 'Performance Testing',
      description: 'Test performance optimizations',
      icon: Zap,
      color: '#199D67',
      status: 'ready'
    }
  ]

  const ExperimentCard = ({ experiment, onClick }: { 
    experiment: any, 
    onClick: () => void 
  }) => {
    const IconComponent = experiment.icon
    return (
      <Card 
        variant="outlined" 
        hover 
        className="cursor-pointer transition-all duration-300 hover:shadow-lg"
        onClick={onClick}
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${experiment.color}20` }}
            >
              <IconComponent 
                className="w-6 h-6" 
                style={{ color: experiment.color }}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {experiment.title}
              </h3>
              <p className="text-sm text-neutral-400">
                {experiment.description}
              </p>
            </div>
            <Badge 
              variant={experiment.status === 'ready' ? 'success' : 'warning'}
              className="text-xs"
            >
              {experiment.status}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Beaker className="w-4 h-4" />
              <span>Experimental</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <Rocket className="w-4 h-4" />
              Launch
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  const SingleSelectExperiment = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Single-Select Card Interface</h2>
        <p className="text-neutral-400">Testing radio-button style card selection</p>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Select One Category</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
          {['Health', 'Money', 'Family', 'Fun', 'Travel', 'Home', 'Business', 'Social', 'Romance', 'Possessions', 'Giving', 'Spirituality'].map((category, index) => (
            <Card 
              key={category}
              variant="outlined" 
              hover 
              className={`cursor-pointer aspect-square transition-all duration-300 ${
                experimentData.selectedCategory === category 
                  ? 'border border-primary-500 bg-primary-500/10' 
                  : ''
              }`}
              onClick={() => setExperimentData({ ...experimentData, selectedCategory: category })}
            >
              <div className="flex flex-col items-center gap-2 p-2 justify-center h-full">
                <div className={`w-6 h-6 rounded-full ${
                  experimentData.selectedCategory === category 
                    ? 'bg-primary-500' 
                    : 'bg-neutral-600'
                }`} />
                <span className="text-xs font-medium text-center leading-tight text-neutral-300">
                  {category}
                </span>
              </div>
            </Card>
          ))}
        </div>
        
        {experimentData.selectedCategory && (
          <div className="mt-6 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
            <p className="text-primary-300 text-sm">
              Selected: <strong>{experimentData.selectedCategory}</strong>
            </p>
          </div>
        )}
      </Card>
    </div>
  )

  const SidebarFreeExperiment = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Sidebar-Free Layout</h2>
        <p className="text-neutral-400">Testing full-width layouts without sidebars</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Content Area 1</h3>
          <p className="text-neutral-300 mb-4">
            This is a full-width content area without any sidebar constraints. 
            The layout flows naturally across the entire viewport.
          </p>
          <Button variant="primary" className="w-full">
            Action Button
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Content Area 2</h3>
          <p className="text-neutral-300 mb-4">
            Another content area that demonstrates the flexibility of 
            sidebar-free layouts for better content presentation.
          </p>
          <Button variant="secondary" className="w-full">
            Secondary Action
          </Button>
        </Card>
      </div>
    </div>
  )

  const renderExperiment = () => {
    switch (activeExperiment) {
      case 'single-select-cards':
        return <SingleSelectExperiment />
      case 'sidebar-removal':
        return <SidebarFreeExperiment />
      default:
        return (
          <div className="text-center py-16">
            <Lightbulb className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Select an Experiment</h3>
            <p className="text-neutral-400">Choose an experiment from the grid above to get started</p>
          </div>
        )
    }
  }

  return (
    <PageLayout>
      <div className="py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Beaker className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Experiment Lab</h1>
            <Badge variant="premium" className="flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              Beta
            </Badge>
          </div>
          <p className="text-neutral-400 text-lg">
            Test new features and UI patterns before they go live
          </p>
        </div>

        {/* Experiment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {experiments.map((experiment) => (
            <ExperimentCard 
              key={experiment.id}
              experiment={experiment}
              onClick={() => setActiveExperiment(experiment.id)}
            />
          ))}
        </div>

        {/* Active Experiment */}
        <Card className="p-8">
          {renderExperiment()}
        </Card>

        {/* Navigation */}
        {activeExperiment && (
          <div className="mt-6 text-center">
            <Button
              onClick={() => setActiveExperiment(null)}
              variant="outline"
              className="flex items-center gap-2 mx-auto"
            >
              <Layers className="w-4 h-4" />
              Back to Experiments
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
