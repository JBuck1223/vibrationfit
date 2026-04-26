import { CategoryGrid } from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { useState } from 'react'

export const CategoryGridExamples = {
  selectionMode: {
    title: '1. Selection Mode (Default)',
    description: 'Used for filtering content. Selected pills show soft green styling. No badges.',
    component: (() => {
      const Example = () => {
        const [selected, setSelected] = useState<string[]>(['fun', 'health', 'travel'])
        const handleToggle = (key: string) => {
          setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
        }
        const handleSelectAll = () => {
          setSelected(prev => prev.length === VISION_CATEGORIES.length ? [] : VISION_CATEGORIES.map(c => c.key))
        }
        return (
          <CategoryGrid
            categories={VISION_CATEGORIES}
            selectedCategories={selected}
            onCategoryClick={handleToggle}
            showSelectAll
            onSelectAll={handleSelectAll}
            pillLabel="Life Areas"
          />
        )
      }
      return <Example />
    })(),
    code: `const [selected, setSelected] = useState<string[]>(['fun', 'health', 'travel'])

const handleToggle = (key: string) => {
  setSelected(prev => 
    prev.includes(key) 
      ? prev.filter(k => k !== key) 
      : [...prev, key]
  )
}

const handleSelectAll = () => {
  setSelected(prev => 
    prev.length === VISION_CATEGORIES.length 
      ? [] 
      : VISION_CATEGORIES.map(c => c.key)
  )
}

<CategoryGrid
  categories={VISION_CATEGORIES}
  selectedCategories={selected}
  onCategoryClick={handleToggle}
  showSelectAll
  onSelectAll={handleSelectAll}
  pillLabel="Life Areas"
/>`
  },

  completionMode: {
    title: '2. Completion Mode',
    description: 'Shows green checkmark badges on completed pills. Used for progress tracking in multi-step flows.',
    component: (() => {
      const Example = () => {
        const [active, setActive] = useState('fun')
        const completed = ['forward', 'fun', 'health', 'travel', 'love']
        return (
          <CategoryGrid
            categories={VISION_CATEGORIES}
            activeCategory={active}
            completedCategories={completed}
            onCategoryClick={setActive}
            mode="completion"
            fillWidth
          />
        )
      }
      return <Example />
    })(),
    code: `const [active, setActive] = useState('fun')
const completed = ['forward', 'fun', 'health', 'travel', 'love']

<CategoryGrid
  categories={VISION_CATEGORIES}
  activeCategory={active}
  completedCategories={completed}
  onCategoryClick={setActive}
  mode="completion"
  fillWidth
/>`
  },

  draftMode: {
    title: '3. Draft Mode',
    description: 'Shows yellow checkmark badges on refined/changed pills. Used to highlight what has been modified in a draft.',
    component: (() => {
      const Example = () => {
        const [active, setActive] = useState('travel')
        const refined = ['travel', 'home', 'work', 'money']
        return (
          <CategoryGrid
            categories={VISION_CATEGORIES}
            activeCategory={active}
            refinedCategories={refined}
            onCategoryClick={setActive}
            mode="draft"
            fillWidth
          />
        )
      }
      return <Example />
    })(),
    code: `const [active, setActive] = useState('travel')
const refined = ['travel', 'home', 'work', 'money']

<CategoryGrid
  categories={VISION_CATEGORIES}
  activeCategory={active}
  refinedCategories={refined}
  onCategoryClick={setActive}
  mode="draft"
  fillWidth
/>`
  },

  recordMode: {
    title: '4. Record Mode',
    description: 'Green check for completed, amber refresh for needs-re-record. Used on audio recording pages.',
    component: (() => {
      const Example = () => {
        const [active, setActive] = useState('health')
        const completed = ['forward', 'fun', 'health']
        const refined = ['fun', 'travel', 'work']
        return (
          <CategoryGrid
            categories={VISION_CATEGORIES}
            activeCategory={active}
            completedCategories={completed}
            refinedCategories={refined}
            onCategoryClick={setActive}
            mode="record"
            fillWidth
          />
        )
      }
      return <Example />
    })(),
    code: `const [active, setActive] = useState('health')
const completed = ['forward', 'fun', 'health']
const refined = ['fun', 'travel', 'work']

<CategoryGrid
  categories={VISION_CATEGORIES}
  activeCategory={active}
  completedCategories={completed}
  refinedCategories={refined}
  onCategoryClick={setActive}
  mode="record"
  fillWidth
/>`
  },

  fillWidthComparison: {
    title: '5. fillWidth vs Compact',
    description: 'fillWidth stretches pills to fill the row on desktop. Compact (default) keeps pills at their natural width.',
    component: (() => {
      const Example = () => {
        const categoriesWithout = VISION_CATEGORIES.filter(c => c.key !== 'forward' && c.key !== 'conclusion')
        const [selected, setSelected] = useState<string[]>(['fun', 'travel', 'stuff'])
        const handleToggle = (key: string) => {
          setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
        }
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider">fillWidth (stretch)</h4>
              <CategoryGrid
                categories={categoriesWithout}
                selectedCategories={selected}
                onCategoryClick={handleToggle}
                fillWidth
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Compact (default)</h4>
              <CategoryGrid
                categories={categoriesWithout}
                selectedCategories={selected}
                onCategoryClick={handleToggle}
              />
            </div>
          </div>
        )
      }
      return <Example />
    })(),
    code: `// fillWidth - pills stretch to fill
<CategoryGrid
  categories={categoriesWithout}
  selectedCategories={selected}
  onCategoryClick={handleToggle}
  fillWidth
/>

// Compact - natural pill width
<CategoryGrid
  categories={categoriesWithout}
  selectedCategories={selected}
  onCategoryClick={handleToggle}
/>`
  },

  allModes: {
    title: '6. All Four Modes Side-by-Side',
    description: 'Visual comparison of selection (no badges), completion (green badges), draft (yellow badges), and record (green + amber).',
    component: (() => {
      const Example = () => {
        const [selected, setSelected] = useState<string[]>(['fun', 'health'])
        const completed = ['forward', 'fun', 'health', 'travel']
        const refined = ['home', 'work', 'money']
        const handleToggle = (key: string) => {
          setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
        }
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Selection Mode</h4>
              <CategoryGrid categories={VISION_CATEGORIES} selectedCategories={selected} onCategoryClick={handleToggle} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Completion Mode</h4>
              <CategoryGrid categories={VISION_CATEGORIES} selectedCategories={selected} completedCategories={completed} onCategoryClick={handleToggle} mode="completion" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Draft Mode</h4>
              <CategoryGrid categories={VISION_CATEGORIES} selectedCategories={selected} refinedCategories={refined} onCategoryClick={handleToggle} mode="draft" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Record Mode</h4>
              <CategoryGrid categories={VISION_CATEGORIES} selectedCategories={selected} completedCategories={completed} refinedCategories={refined} onCategoryClick={handleToggle} mode="record" />
            </div>
          </div>
        )
      }
      return <Example />
    })(),
    code: `// Selection Mode - No badges
<CategoryGrid
  categories={VISION_CATEGORIES}
  selectedCategories={selected}
  onCategoryClick={handleToggle}
/>

// Completion Mode - Green checkmarks
<CategoryGrid
  categories={VISION_CATEGORIES}
  selectedCategories={selected}
  completedCategories={completed}
  onCategoryClick={handleToggle}
  mode="completion"
/>

// Draft Mode - Yellow checkmarks
<CategoryGrid
  categories={VISION_CATEGORIES}
  selectedCategories={selected}
  refinedCategories={refined}
  onCategoryClick={handleToggle}
  mode="draft"
/>

// Record Mode - Green check + amber refresh
<CategoryGrid
  categories={VISION_CATEGORIES}
  selectedCategories={selected}
  completedCategories={completed}
  refinedCategories={refined}
  onCategoryClick={handleToggle}
  mode="record"
/>`
  }
}
