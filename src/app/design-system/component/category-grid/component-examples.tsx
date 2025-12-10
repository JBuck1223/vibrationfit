import { CategoryGrid } from '@/lib/design-system/components'
import { VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import { useState } from 'react'

export const CategoryGridExamples = {
  selectionMode: {
    title: '1. Selection Mode (Default)',
    description: 'Used for filtering content. Shows green highlight for selected categories, no badges.',
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
            mode="selection"
            showSelectAll
            onSelectAll={handleSelectAll}
            layout="14-column"
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
  mode="selection"
  showSelectAll
  onSelectAll={handleSelectAll}
  layout="14-column"
/>`
  },

  completionMode: {
    title: '2. Completion Mode',
    description: 'Shows green checkmarks on completed sections. Perfect for tracking progress through a multi-section form.',
    component: (() => {
      const Example = () => {
        const [selected, setSelected] = useState<string[]>(['fun'])
        const completed = ['forward', 'fun', 'health', 'travel', 'love']
        const handleToggle = (key: string) => {
          setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
        }
        return (
          <CategoryGrid
            categories={VISION_CATEGORIES}
            selectedCategories={selected}
            completedCategories={completed}
            onCategoryClick={handleToggle}
            mode="completion"
            layout="14-column"
          />
        )
      }
      return <Example />
    })(),
    code: `const [selected, setSelected] = useState<string[]>(['fun'])
const completed = ['forward', 'fun', 'health', 'travel', 'love']

const handleToggle = (key: string) => {
  setSelected(prev => 
    prev.includes(key) 
      ? prev.filter(k => k !== key) 
      : [...prev, key]
  )
}

<CategoryGrid
  categories={VISION_CATEGORIES}
  selectedCategories={selected}
  completedCategories={completed}
  onCategoryClick={handleToggle}
  mode="completion"
  layout="14-column"
/>`
  },

  draftMode: {
    title: '3. Draft Mode',
    description: 'Shows yellow checkmarks on changed sections. Used for highlighting what has been refined in a draft version.',
    component: (() => {
      const Example = () => {
        const [selected, setSelected] = useState<string[]>(['travel'])
        const refined = ['travel', 'home', 'work', 'money']
        const handleToggle = (key: string) => {
          setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
        }
        return (
          <CategoryGrid
            categories={VISION_CATEGORIES}
            selectedCategories={selected}
            refinedCategories={refined}
            onCategoryClick={handleToggle}
            mode="draft"
            layout="14-column"
          />
        )
      }
      return <Example />
    })(),
    code: `const [selected, setSelected] = useState<string[]>(['travel'])
const refined = ['travel', 'home', 'work', 'money']

const handleToggle = (key: string) => {
  setSelected(prev => 
    prev.includes(key) 
      ? prev.filter(k => k !== key) 
      : [...prev, key]
  )
}

<CategoryGrid
  categories={VISION_CATEGORIES}
  selectedCategories={selected}
  refinedCategories={refined}
  onCategoryClick={handleToggle}
  mode="draft"
  layout="14-column"
/>`
  },

  twelveColumn: {
    title: '4. 12-Column Layout (No Forward/Conclusion)',
    description: 'Used in journal and vision-board where forward/conclusion categories don\'t apply. Responsive: 4 cols → 12 cols.',
    component: (() => {
      const Example = () => {
        const categoriesWithout = VISION_CATEGORIES.filter(c => c.key !== 'forward' && c.key !== 'conclusion')
        const [selected, setSelected] = useState<string[]>(['fun', 'travel', 'stuff'])
        const handleToggle = (key: string) => {
          setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
        }
        return (
          <CategoryGrid
            categories={categoriesWithout}
            selectedCategories={selected}
            onCategoryClick={handleToggle}
            mode="selection"
            layout="12-column"
          />
        )
      }
      return <Example />
    })(),
    code: `const categoriesWithout = VISION_CATEGORIES.filter(
  c => c.key !== 'forward' && c.key !== 'conclusion'
)

const [selected, setSelected] = useState<string[]>(['fun', 'travel', 'stuff'])

const handleToggle = (key: string) => {
  setSelected(prev => 
    prev.includes(key) 
      ? prev.filter(k => k !== key) 
      : [...prev, key]
  )
}

<CategoryGrid
  categories={categoriesWithout}
  selectedCategories={selected}
  onCategoryClick={handleToggle}
  mode="selection"
  layout="12-column"
/>`
  },

  withoutCard: {
    title: '5. Without Card Wrapper',
    description: 'Use withCard={false} when grid is already inside a Card or you want manual wrapper control.',
    component: (() => {
      const Example = () => {
        const [selected, setSelected] = useState<string[]>(['health', 'money'])
        const handleToggle = (key: string) => {
          setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
        }
        return (
          <CategoryGrid
            categories={VISION_CATEGORIES}
            selectedCategories={selected}
            onCategoryClick={handleToggle}
            mode="selection"
            layout="14-column"
            withCard={false}
          />
        )
      }
      return <Example />
    })(),
    code: `<CategoryGrid
  categories={VISION_CATEGORIES}
  selectedCategories={selected}
  onCategoryClick={handleToggle}
  mode="selection"
  layout="14-column"
  withCard={false}
/>`
  },

  customCategories: {
    title: '6. Custom Categories (Personal + Media)',
    description: 'Profile edit pages add "Personal" and "Media" sections to the standard vision categories. CategoryGrid accepts any category array.',
    component: (() => {
      const Example = () => {
        const [selected, setSelected] = useState<string[]>(['personal'])
        const completed = ['personal', 'fun', 'health']
        
        // Build custom profile categories: Personal + 11 vision cats + Media
        const profileCategories = [
          { key: 'personal', label: 'Personal', icon: VISION_CATEGORIES[0].icon }, // Using an icon from VISION_CATEGORIES
          ...VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13),
          { key: 'photos-notes', label: 'Media', icon: VISION_CATEGORIES[1].icon }
        ]
        
        const handleToggle = (key: string) => {
          setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
        }
        
        return (
          <CategoryGrid
            categories={profileCategories}
            selectedCategories={selected}
            completedCategories={completed}
            onCategoryClick={handleToggle}
            mode="completion"
            layout="12-column"
          />
        )
      }
      return <Example />
    })(),
    code: `import { User, Camera } from 'lucide-react'

// Build custom profile categories: Personal + 11 vision cats + Media
const profileCategories = [
  { key: 'personal', label: 'Personal', icon: User },
  ...VISION_CATEGORIES.filter(c => c.order > 0 && c.order < 13),
  { key: 'photos-notes', label: 'Media', icon: Camera }
]

<CategoryGrid
  categories={profileCategories}
  selectedCategories={selectedCategories}
  completedCategories={completedSections}
  onCategoryClick={handleSectionChange}
  mode="completion"
  layout="12-column"
/>

// Real-world usage: /profile/[id]/edit/page.tsx`
  },

  allModes: {
    title: '7. All Three Modes Side-by-Side',
    description: 'Visual comparison of selection (no badges), completion (green badges), and draft (yellow badges) modes.',
    component: (() => {
      const Example = () => {
        const [selected, setSelected] = useState<string[]>(['fun', 'health'])
        const completed = ['forward', 'fun', 'health', 'travel']
        const refined = ['home', 'work', 'money']
        const handleToggle = (key: string) => {
          setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
        }
        return (
          <div className="grid grid-cols-1 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Selection Mode</h4>
              <CategoryGrid
                categories={VISION_CATEGORIES}
                selectedCategories={selected}
                onCategoryClick={handleToggle}
                mode="selection"
                layout="14-column"
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Completion Mode</h4>
              <CategoryGrid
                categories={VISION_CATEGORIES}
                selectedCategories={selected}
                completedCategories={completed}
                onCategoryClick={handleToggle}
                mode="completion"
                layout="14-column"
              />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-400 mb-2 uppercase tracking-wider">Draft Mode</h4>
              <CategoryGrid
                categories={VISION_CATEGORIES}
                selectedCategories={selected}
                refinedCategories={refined}
                onCategoryClick={handleToggle}
                mode="draft"
                layout="14-column"
              />
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
  mode="selection"
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
/>`
  }
}

