'use client'

import React, { useState } from 'react'
import { SaveButton } from '@/lib/design-system/components'

export function SaveButtonExamples() {
  const [hasChanges1, setHasChanges1] = useState(false)
  const [hasChanges2, setHasChanges2] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = (setChanges: React.Dispatch<React.SetStateAction<boolean>>) => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      setChanges(false)
    }, 1500)
  }

  return (
    <div className="space-y-12">
      {/* Saved State */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Saved State (No Changes)</h3>
        <p className="text-neutral-300 mb-6">
          When there are no unsaved changes, the button displays a "Saved" state with light green
          transparent background and green text. Hover effect is disabled.
        </p>
        <SaveButton
          onClick={() => alert('Already saved!')}
          hasUnsavedChanges={false}
        />
      </div>

      {/* Save State */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Save State (Has Changes)</h3>
        <p className="text-neutral-300 mb-6">
          When there are unsaved changes, the button displays a "Save" state with solid green
          background and black text. Hover changes to light green transparent with green text.
        </p>
        <SaveButton
          onClick={() => alert('Saving...')}
          hasUnsavedChanges={true}
        />
      </div>

      {/* Interactive Demo */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Interactive Demo</h3>
        <p className="text-neutral-300 mb-6">
          Make a change to see the button state update. Click "Save" to persist changes.
        </p>
        
        <div className="bg-neutral-800 p-6 rounded-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Example Text Field
            </label>
            <input
              type="text"
              placeholder="Type something to trigger unsaved changes..."
              onChange={(e) => setHasChanges1(e.target.value.length > 0)}
              className="w-full px-6 py-3 rounded-xl bg-neutral-700 border-2 border-neutral-600 focus:border-primary-500 focus:outline-none text-white"
            />
          </div>
          
          <div className="flex justify-end">
            <SaveButton
              onClick={() => handleSave(setHasChanges1)}
              hasUnsavedChanges={hasChanges1}
              isSaving={isSaving}
            />
          </div>
        </div>
      </div>

      {/* Disabled State */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Disabled State</h3>
        <p className="text-neutral-300 mb-6">
          The button can be disabled to prevent user interaction.
        </p>
        <div className="flex gap-4">
          <SaveButton
            onClick={() => {}}
            hasUnsavedChanges={false}
            disabled
          />
          <SaveButton
            onClick={() => {}}
            hasUnsavedChanges={true}
            disabled
          />
        </div>
      </div>

      {/* Usage Example */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Usage Example</h3>
        <pre className="bg-neutral-900 p-6 rounded-xl overflow-x-auto">
          <code className="text-sm text-primary-500">{`import { SaveButton } from '@/lib/design-system/components'

function MyForm() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSave = async () => {
    setIsSaving(true)
    await saveData()
    setIsSaving(false)
    setHasUnsavedChanges(false)
  }
  
  return (
    <div>
      <input onChange={() => setHasUnsavedChanges(true)} />
      <SaveButton
        onClick={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
      />
    </div>
  )
}`}</code>
        </pre>
      </div>

      {/* Design Tokens */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Design Tokens Used</h3>
        <p className="text-neutral-300 mb-4">
          ✅ <strong>This component uses actual design tokens</strong> - no hard-coded values!
        </p>
        <div className="bg-neutral-800 p-6 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-neutral-300">Primary Green:</span>
            <code className="text-primary-500">tokens.colors.primary[500]</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-300">Black Text:</span>
            <code className="text-white">tokens.colors.neutral[0]</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-300">Border Radius:</span>
            <code className="text-neutral-400">tokens.borderRadius.full</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-300">Transition Duration:</span>
            <code className="text-neutral-400">tokens.durations[300]</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-neutral-300">Transition Easing:</span>
            <code className="text-neutral-400">tokens.easings['in-out']</code>
          </div>
          <div className="pt-3 border-t border-neutral-700">
            <p className="text-sm text-neutral-400">
              Light green backgrounds (10% and 20% opacity) are calculated from the primary green token.
            </p>
          </div>
        </div>
      </div>

      {/* Props */}
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Props</h3>
        <div className="bg-neutral-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-900">
              <tr>
                <th className="text-left px-6 py-3 text-neutral-200 font-semibold">Prop</th>
                <th className="text-left px-6 py-3 text-neutral-200 font-semibold">Type</th>
                <th className="text-left px-6 py-3 text-neutral-200 font-semibold">Default</th>
                <th className="text-left px-6 py-3 text-neutral-200 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              <tr>
                <td className="px-6 py-3 text-primary-500 font-mono text-sm">hasUnsavedChanges</td>
                <td className="px-6 py-3 text-neutral-300">boolean</td>
                <td className="px-6 py-3 text-neutral-400">false</td>
                <td className="px-6 py-3 text-neutral-300">Controls whether button shows "Saved" or "Save" state</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-primary-500 font-mono text-sm">isSaving</td>
                <td className="px-6 py-3 text-neutral-300">boolean</td>
                <td className="px-6 py-3 text-neutral-400">false</td>
                <td className="px-6 py-3 text-neutral-300">Shows "Saving..." text and disables button</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-primary-500 font-mono text-sm">onClick</td>
                <td className="px-6 py-3 text-neutral-300">function</td>
                <td className="px-6 py-3 text-neutral-400">-</td>
                <td className="px-6 py-3 text-neutral-300">Click handler function</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-primary-500 font-mono text-sm">disabled</td>
                <td className="px-6 py-3 text-neutral-300">boolean</td>
                <td className="px-6 py-3 text-neutral-400">false</td>
                <td className="px-6 py-3 text-neutral-300">Disables the button</td>
              </tr>
              <tr>
                <td className="px-6 py-3 text-primary-500 font-mono text-sm">className</td>
                <td className="px-6 py-3 text-neutral-300">string</td>
                <td className="px-6 py-3 text-neutral-400">''</td>
                <td className="px-6 py-3 text-neutral-300">Additional CSS classes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

