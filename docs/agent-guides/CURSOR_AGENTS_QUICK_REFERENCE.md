# Cursor Background Agents - Quick Setup

## Enable Background Agents
1. Open Cursor Settings (`Cmd/Ctrl + ,`)
2. Go to "Features" → "Background Agents" 
3. Enable "Background Agents"
4. Set number of agents: **5** (recommended for VibrationFit)

## Agent Configuration

### Agent 1: Frontend Specialist
- **Role**: Frontend Development
- **Context**: `src/lib/design-system/`, `src/app/profile/`, `tailwind.config.ts`
- **Use for**: React components, UI implementation, responsive design

### Agent 2: Backend Specialist  
- **Role**: Backend Development
- **Context**: `src/lib/supabase/`, `src/app/api/`, `src/types/`
- **Use for**: API routes, database operations, authentication

### Agent 3: Design System Expert
- **Role**: Design System Maintenance
- **Context**: `src/lib/design-system/`, `src/styles/brand.css`
- **Use for**: Component library, brand consistency, design tokens

### Agent 4: Assessment Specialist
- **Role**: Assessment Flow Development  
- **Context**: `src/app/assessment/`, `src/types/assessment.ts`
- **Use for**: Assessment logic, scoring algorithms, user flows

### Agent 5: Mobile Optimization Expert
- **Role**: Mobile Development
- **Context**: `src/lib/design-system/components.tsx`, `src/app/profile/edit/page.tsx`
- **Use for**: Mobile responsiveness, touch interactions, performance

## Quick Start Commands

### Start Background Agent
```
Cmd/Ctrl + Shift + P → "Background Agent" → "Start Background Agent"
```

### Example Prompts
- **Frontend**: "Create a new profile section component using the VibrationFit design system"
- **Backend**: "Create an API endpoint for saving assessment responses"
- **Design System**: "Add a new button variant to the design system"
- **Assessment**: "Implement the scoring algorithm for assessments"
- **Mobile**: "Fix the mobile layout for the profile edit page"

## Best Practices
- Be specific about requirements
- Mention VibrationFit context
- Reference design system compliance
- Specify mobile responsiveness needs
- Provide relevant file paths
