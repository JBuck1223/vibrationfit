# Future Versioning Features - Implementation Guide

**Date:** November 4, 2025  
**System:** VibrationFit Profile Versioning Enhancements

---

## 1. Version History Tracking (Diff/Changelog System)

### Overview
Track which fields changed between versions, creating an audit trail and change history.

### Database Schema Addition

```sql
-- New table to track field-level changes
CREATE TABLE profile_version_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  previous_version_id UUID REFERENCES user_profiles(id),
  changed_fields JSONB NOT NULL, -- Structure: { "field_name": { "old": "value", "new": "value" } }
  change_summary TEXT, -- Human-readable summary
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id) -- Could track who made changes
  
  -- Indexes for performance
  CREATE INDEX idx_profile_version_changes_profile_id ON profile_version_changes(profile_id);
  CREATE INDEX idx_profile_version_changes_previous_version ON profile_version_changes(previous_version_id);
);
```

### Database Function

```sql
-- Function to calculate diff between two versions
CREATE OR REPLACE FUNCTION calculate_version_diff(
  p_old_version_id UUID,
  p_new_version_id UUID
)
RETURNS JSONB AS $$
DECLARE
  old_profile RECORD;
  new_profile RECORD;
  diff JSONB := '{}'::JSONB;
  field_name TEXT;
BEGIN
  -- Get both versions
  SELECT * INTO old_profile FROM user_profiles WHERE id = p_old_version_id;
  SELECT * INTO new_profile FROM user_profiles WHERE id = p_new_version_id;
  
  -- Compare all fields (excluding versioning/metadata fields)
  FOR field_name IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name NOT IN ('id', 'user_id', 'version_number', 'is_draft', 'is_active', 
                            'parent_version_id', 'created_at', 'updated_at', 'ai_tags')
  LOOP
    -- Compare values (handling NULLs)
    IF (old_profile->>field_name) IS DISTINCT FROM (new_profile->>field_name) THEN
      diff := diff || jsonb_build_object(
        field_name,
        jsonb_build_object(
          'old', old_profile->>field_name,
          'new', new_profile->>field_name
        )
      );
    END IF;
  END LOOP;
  
  RETURN diff;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically log changes when committing draft
CREATE OR REPLACE FUNCTION log_version_changes()
RETURNS TRIGGER AS $$
DECLARE
  parent_version_id UUID;
  changes JSONB;
BEGIN
  -- Only log when a draft is committed (becomes active)
  IF NEW.is_active = true AND OLD.is_draft = true AND NEW.is_draft = false THEN
    parent_version_id := NEW.parent_version_id;
    
    -- Calculate diff
    SELECT calculate_version_diff(parent_version_id, NEW.id) INTO changes;
    
    -- Only insert if there are actual changes
    IF jsonb_object_keys(changes) IS NOT NULL THEN
      INSERT INTO profile_version_changes (
        profile_id,
        previous_version_id,
        changed_fields,
        change_summary
      ) VALUES (
        NEW.id,
        parent_version_id,
        changes,
        generate_change_summary(changes) -- Helper function for human-readable summary
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically log changes
CREATE TRIGGER log_profile_changes
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_version_changes();

-- Helper function to generate human-readable summaries
CREATE OR REPLACE FUNCTION generate_change_summary(p_changes JSONB)
RETURNS TEXT AS $$
DECLARE
  summary TEXT := '';
  field_name TEXT;
  field_count INTEGER;
BEGIN
  field_count := jsonb_object_keys(p_changes)::TEXT;
  
  -- Group by category
  -- Personal Info, Career, Financial, Stories, etc.
  
  RETURN summary;
END;
$$ LANGUAGE plpgsql;
```

### API Endpoint

```typescript
// GET /api/profile/[id]/changes
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  // Get all changes for this profile version
  const { data: changes, error } = await supabase
    .from('profile_version_changes')
    .select(`
      *,
      previous_version:user_profiles!previous_version_id(version_number, created_at)
    `)
    .eq('profile_id', id)
    .order('changed_at', { ascending: false })
  
  return NextResponse.json({ changes })
}
```

### UI Component

```typescript
// components/VersionChangeLog.tsx
interface ChangeLogProps {
  profileId: string
}

export const VersionChangeLog: React.FC<ChangeLogProps> = ({ profileId }) => {
  const [changes, setChanges] = useState([])
  
  useEffect(() => {
    fetch(`/api/profile/${profileId}/changes`)
      .then(res => res.json())
      .then(data => setChanges(data.changes))
  }, [profileId])
  
  return (
    <Card>
      <Heading level={3}>Change History</Heading>
      <Stack gap="md">
        {changes.map((change, idx) => (
          <Card key={idx} variant="outlined">
            <Text size="sm" className="text-neutral-400 mb-2">
              Changed from Version {change.previous_version.version_number}
            </Text>
            <div className="space-y-2">
              {Object.entries(change.changed_fields).map(([field, diff]) => (
                <div key={field} className="flex gap-2">
                  <Badge variant="info">{getFieldLabel(field)}</Badge>
                  <span className="text-red-400 line-through">{diff.old || '(empty)'}</span>
                  <span>→</span>
                  <span className="text-green-400">{diff.new || '(empty)'}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </Stack>
    </Card>
  )
}
```

### Field Labels Mapping

```typescript
// lib/utils/field-labels.ts
export const FIELD_LABELS: Record<string, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  occupation: 'Occupation',
  company: 'Company',
  household_income: 'Household Income',
  career_work_story: 'Career Story',
  health_vitality_story: 'Health Story',
  // ... all fields
}
```

---

## 2. Enhanced Version Notes System

### Overview
Automatic and manual notes for versions, with smart categorization and suggestions.

### Database Schema Enhancement

```sql
-- Enhance existing version_notes field with structured data
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS version_notes_type TEXT CHECK (version_notes_type IN ('manual', 'auto', 'system')),
ADD COLUMN IF NOT EXISTS version_category TEXT; -- 'major', 'minor', 'correction', 'update'

-- New table for version note templates and suggestions
CREATE TABLE version_note_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_fields TEXT[], -- Fields that trigger this template
  template_text TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Example templates
INSERT INTO version_note_templates (trigger_fields, template_text, category) VALUES
  (ARRAY['occupation', 'company'], 'Career update', 'major'),
  (ARRAY['household_income', 'savings_retirement'], 'Financial information updated', 'major'),
  (ARRAY['city', 'state', 'country'], 'Location changed', 'major'),
  (ARRAY['health_vitality_story'], 'Health story updated', 'minor'),
  (ARRAY['first_name', 'last_name'], 'Name correction', 'correction');
```

### Database Function for Auto-Generated Notes

```sql
CREATE OR REPLACE FUNCTION generate_version_notes(
  p_changes JSONB
)
RETURNS TEXT AS $$
DECLARE
  notes TEXT := '';
  changed_fields TEXT[];
  template RECORD;
  matched_templates TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get list of changed field names
  SELECT array_agg(key) INTO changed_fields
  FROM jsonb_object_keys(p_changes) AS key;
  
  -- Find matching templates
  FOR template IN 
    SELECT * FROM version_note_templates
    WHERE is_active = true
    AND trigger_fields && changed_fields -- Array overlap operator
  LOOP
    matched_templates := array_append(matched_templates, template.template_text);
  END LOOP;
  
  -- Combine templates
  IF array_length(matched_templates, 1) > 0 THEN
    notes := array_to_string(matched_templates, ', ');
  ELSE
    notes := format('Updated %s field(s)', array_length(changed_fields, 1));
  END IF;
  
  RETURN notes;
END;
$$ LANGUAGE plpgsql;
```

### API Enhancement

```typescript
// Enhanced POST /api/profile/versions/commit
export async function PUT(request: NextRequest) {
  // ... existing commit logic ...
  
  // After committing draft, generate notes
  const changes = await calculateDiff(parentVersionId, draftId)
  const autoNotes = await supabase.rpc('generate_version_notes', {
    p_changes: changes
  })
  
  // Update version with notes
  await supabase
    .from('user_profiles')
    .update({
      version_notes: autoNotes.data || manualNotes,
      version_notes_type: manualNotes ? 'manual' : 'auto',
      version_category: determineCategory(changes)
    })
    .eq('id', draftId)
}
```

### UI Component

```typescript
// components/VersionNotesEditor.tsx
export const VersionNotesEditor: React.FC<{
  versionId: string
  currentNotes?: string
  onChange: (notes: string) => void
}> = ({ versionId, currentNotes, onChange }) => {
  const [notes, setNotes] = useState(currentNotes || '')
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  // Fetch auto-generated suggestions
  useEffect(() => {
    fetch(`/api/profile/${versionId}/note-suggestions`)
      .then(res => res.json())
      .then(data => setSuggestions(data.suggestions))
  }, [versionId])
  
  return (
    <Card>
      <Heading level={4}>Version Notes</Heading>
      <Textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value)
          onChange(e.target.value)
        }}
        placeholder="What changed in this version?"
        rows={3}
      />
      
      {suggestions.length > 0 && (
        <div className="mt-2">
          <Text size="sm" className="text-neutral-400 mb-2">Suggestions:</Text>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNotes(prev => prev ? `${prev}, ${suggestion}` : suggestion)
                }}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
```

### Enhanced VersionCard

```typescript
// Enhanced VersionCard with notes display
<VersionCard
  version={version}
  actions={actions}
>
  {version.version_notes && (
    <div className="mt-2 pt-2 border-t border-neutral-700">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-neutral-400" />
        <Text size="xs" className="text-neutral-400">
          {version.version_notes_type === 'auto' ? 'Auto-generated' : 'Manual'}
        </Text>
        {version.version_category && (
          <Badge variant={getCategoryVariant(version.version_category)} size="sm">
            {version.version_category}
          </Badge>
        )}
      </div>
      <Text size="sm" className="text-neutral-300">
        {version.version_notes}
      </Text>
    </div>
  )}
</VersionCard>
```

---

## 3. Version Comparison UI (Side-by-Side)

### Overview
Visual comparison tool to see differences between any two versions side-by-side.

### API Endpoint

```typescript
// GET /api/profile/compare?version1=uuid&version2=uuid
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const version1Id = searchParams.get('version1')
  const version2Id = searchParams.get('version2')
  
  if (!version1Id || !version2Id) {
    return NextResponse.json({ error: 'Both version IDs required' }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  // Get both versions
  const [v1, v2] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', version1Id).single(),
    supabase.from('user_profiles').select('*').eq('id', version2Id).single()
  ])
  
  // Calculate diff
  const { data: diff } = await supabase.rpc('calculate_version_diff', {
    p_old_version_id: version1Id,
    p_new_version_id: version2Id
  })
  
  // Group changes by category
  const categorized = categorizeChanges(diff, v1.data, v2.data)
  
  return NextResponse.json({
    version1: v1.data,
    version2: v2.data,
    diff: diff.data,
    categorized,
    summary: {
      totalChanges: Object.keys(diff.data).length,
      categories: Object.keys(categorized)
    }
  })
}

// Helper function to categorize changes
function categorizeChanges(diff: any, v1: any, v2: any) {
  const categories = {
    personal: [],
    career: [],
    financial: [],
    health: [],
    location: [],
    relationships: [],
    stories: [],
    other: []
  }
  
  const categoryMap = {
    personal: ['first_name', 'last_name', 'date_of_birth', 'gender', 'ethnicity'],
    career: ['occupation', 'company', 'employment_type', 'career_work_story'],
    financial: ['household_income', 'savings_retirement', 'assets_equity', 'money_wealth_story'],
    health: ['height', 'weight', 'exercise_frequency', 'health_vitality_story'],
    location: ['city', 'state', 'country', 'living_situation'],
    relationships: ['relationship_status', 'partner_name', 'has_children', 'romance_partnership_story'],
    stories: ['*_story'] // All story fields
  }
  
  // Categorize each changed field
  Object.entries(diff).forEach(([field, change]) => {
    // Find category
    const category = Object.entries(categoryMap).find(([cat, fields]) =>
      fields.includes(field) || fields.includes('*_story') && field.endsWith('_story')
    )?.[0] || 'other'
    
    categories[category].push({ field, change })
  })
  
  return categories
}
```

### UI Component

```typescript
// components/VersionComparison.tsx
interface ComparisonProps {
  version1Id: string
  version2Id: string
  onClose: () => void
}

export const VersionComparison: React.FC<ComparisonProps> = ({
  version1Id,
  version2Id,
  onClose
}) => {
  const [comparison, setComparison] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    fetch(`/api/profile/compare?version1=${version1Id}&version2=${version2Id}`)
      .then(res => res.json())
      .then(data => {
        setComparison(data)
        setIsLoading(false)
      })
  }, [version1Id, version2Id])
  
  if (isLoading) return <Spinner />
  if (!comparison) return null
  
  const categories = ['all', ...Object.keys(comparison.categorized)]
  const changesToShow = selectedCategory === 'all'
    ? Object.entries(comparison.diff)
    : comparison.categorized[selectedCategory] || []
  
  return (
    <Card className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Heading level={2}>Compare Versions</Heading>
        <Button variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Version Headers */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card variant="outlined">
          <Badge variant="info">Version {comparison.version1.version_number}</Badge>
          <Text size="sm" className="text-neutral-400">
            {new Date(comparison.version1.created_at).toLocaleDateString()}
          </Text>
        </Card>
        <Card variant="outlined">
          <Badge variant={comparison.version2.is_active ? 'success' : 'info'}>
            Version {comparison.version2.version_number}
          </Badge>
          <Text size="sm" className="text-neutral-400">
            {new Date(comparison.version2.created_at).toLocaleDateString()}
          </Text>
        </Card>
      </div>
      
      {/* Summary */}
      <Card className="mb-6 p-4 bg-primary-500/10">
        <div className="flex items-center gap-4">
          <div>
            <Text size="lg" className="font-bold text-white">
              {comparison.summary.totalChanges} Changes
            </Text>
            <Text size="sm" className="text-neutral-400">
              Across {comparison.summary.categories.length} categories
            </Text>
          </div>
        </div>
      </Card>
      
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? 'All Changes' : capitalize(cat)}
          </Button>
        ))}
      </div>
      
      {/* Comparison Table */}
      <div className="space-y-4">
        {changesToShow.map(([field, change]: [string, any]) => (
          <Card key={field} variant="outlined" className="p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Old Value */}
              <div>
                <Text size="xs" className="text-neutral-500 mb-1">
                  {getFieldLabel(field)}
                </Text>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <Text className="text-red-300 line-through">
                    {change.old || <span className="text-neutral-500 italic">(empty)</span>}
                  </Text>
                </div>
              </div>
              
              {/* New Value */}
              <div>
                <Text size="xs" className="text-neutral-500 mb-1">
                  {getFieldLabel(field)}
                </Text>
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <Text className="text-green-300">
                    {change.new || <span className="text-neutral-500 italic">(empty)</span>}
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {changesToShow.length === 0 && (
        <div className="text-center py-12">
          <Text className="text-neutral-400">
            No changes in {selectedCategory === 'all' ? 'these versions' : selectedCategory}
          </Text>
        </div>
      )}
    </Card>
  )
}
```

### Integration into VersionCard

```typescript
// Enhanced VersionCard with compare action
<VersionCard
  version={version}
  actions={
    <>
      <Button onClick={() => router.push(`/profile/${version.id}`)}>
        View
      </Button>
      <Button
        variant="secondary"
        onClick={() => setComparison({ version1: activeProfile.id, version2: version.id })}
      >
        Compare
      </Button>
      <Button variant="danger" onClick={() => handleDeleteClick(version)}>
        Delete
      </Button>
    </>
  }
/>
```

### Comparison Modal Page

```typescript
// app/profile/compare/page.tsx
export default function ComparePage() {
  const searchParams = useSearchParams()
  const version1 = searchParams.get('v1')
  const version2 = searchParams.get('v2')
  
  if (!version1 || !version2) {
    return <div>Both versions required</div>
  }
  
  return (
    <PageLayout>
      <VersionComparison
        version1Id={version1}
        version2Id={version2}
        onClose={() => router.push('/profile')}
      />
    </PageLayout>
  )
}
```

---

## Implementation Priority

### Phase 1: Version Notes Enhancement (Easiest)
- Add UI for manual notes
- Display notes in VersionCard
- **Effort:** Low (1-2 days)

### Phase 2: Version History Tracking (Medium)
- Create `profile_version_changes` table
- Implement diff calculation function
- Add trigger for automatic logging
- **Effort:** Medium (3-5 days)

### Phase 3: Version Comparison UI (Most Complex)
- Build comparison API endpoint
- Create comparison component
- Add category filtering
- Integrate into version management UI
- **Effort:** High (5-7 days)

---

## Benefits

1. **Version History Tracking:**
   - Complete audit trail
   - Understand what changed and when
   - Debugging user issues
   - Analytics on what users update most

2. **Enhanced Version Notes:**
   - Better context for each version
   - Automatic suggestions reduce friction
   - Helps users remember why they made changes

3. **Version Comparison:**
   - Visual diff makes changes obvious
   - Helps users understand impact of updates
   - Useful for reviewing before committing drafts
   - Educational - shows how profile evolved

---

**Note:** All features work with existing versioning system without breaking changes. They're additive enhancements that improve the user experience around version management.

