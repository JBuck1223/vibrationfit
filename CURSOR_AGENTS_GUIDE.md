# Cursor Background Agents Setup for VibrationFit

## Overview
This guide explains how to set up and use Cursor's Background Agents specifically for your VibrationFit project. Since you're on the Ultra plan ($200), you have access to Background Agents.

## Setting Up Background Agents

### 1. Enable Background Agents
1. Open Cursor Settings (`Cmd/Ctrl + ,`)
2. Go to "Features" → "Background Agents"
3. Enable "Background Agents"
4. Set the number of agents (recommended: 3-5 for your project)

### 2. Configure Agent Roles
In Cursor, you can assign specific roles to your Background Agents. Here are the recommended configurations:

#### Agent 1: Frontend Specialist
- **Role**: Frontend Development
- **Focus**: React, Next.js, TypeScript, Tailwind CSS
- **Context Files**: 
  - `src/lib/design-system/components.tsx`
  - `src/app/profile/edit/page.tsx`
  - `src/app/profile/page.tsx`
  - `tailwind.config.ts`

#### Agent 2: Backend Specialist  
- **Role**: Backend Development
- **Focus**: Supabase, API routes, Database
- **Context Files**:
  - `src/lib/supabase/`
  - `src/app/api/`
  - `src/types/`
  - `supabase/migrations/`

#### Agent 3: Design System Expert
- **Role**: Design System Maintenance
- **Focus**: Component library, Brand consistency
- **Context Files**:
  - `src/lib/design-system/`
  - `src/styles/brand.css`
  - `docs/DESIGN_SYSTEM_GUIDE.md`

#### Agent 4: Assessment Specialist
- **Role**: Assessment Flow Development
- **Focus**: Assessment logic, Scoring algorithms
- **Context Files**:
  - `src/app/assessment/`
  - `src/types/assessment.ts`
  - `guides/ASSESSMENT_*.md`

#### Agent 5: Mobile Optimization Expert
- **Role**: Mobile Development
- **Focus**: Responsive design, Mobile UX
- **Context Files**:
  - `src/lib/design-system/components.tsx`
  - `src/app/profile/edit/page.tsx`
  - `src/components/`

## How to Use Background Agents

### 1. Starting a Background Agent
1. Open the Command Palette (`Cmd/Ctrl + Shift + P`)
2. Type "Background Agent" and select "Start Background Agent"
3. Choose the agent role you want to work with
4. The agent will start analyzing your codebase

### 2. Working with Agents
- **Ask Questions**: Agents can answer questions about your codebase
- **Code Review**: Agents can review code and suggest improvements
- **Implementation**: Agents can help implement features
- **Debugging**: Agents can help debug issues
- **Documentation**: Agents can help with documentation

### 3. Agent Communication
- Use natural language to communicate with agents
- Be specific about what you want to accomplish
- Provide context about the current task
- Ask for explanations of complex code

## Best Practices for VibrationFit

### 1. Agent Selection
- **Frontend tasks**: Use Frontend Specialist
- **API/Database tasks**: Use Backend Specialist  
- **Component updates**: Use Design System Expert
- **Assessment features**: Use Assessment Specialist
- **Mobile issues**: Use Mobile Optimization Expert

### 2. Context Provision
- Always mention you're working on VibrationFit
- Reference specific files when asking questions
- Mention design system compliance requirements
- Specify mobile responsiveness needs

### 3. Task Examples

#### Frontend Development
```
"Help me create a new profile section component that follows the VibrationFit design system and is mobile-responsive"
```

#### Backend Development
```
"Create an API endpoint for saving assessment responses that integrates with our Supabase database"
```

#### Design System Updates
```
"Add a new button variant to the design system that follows our brand guidelines"
```

#### Assessment Features
```
"Implement the scoring algorithm for the assessment flow using our existing data models"
```

#### Mobile Optimization
```
"Fix the mobile layout for the profile edit page to ensure it works well on all screen sizes"
```

## Agent Workflows

### Feature Development Workflow
1. **Start with Frontend Agent** - Define UI requirements
2. **Move to Backend Agent** - Implement data models and APIs
3. **Use Design System Agent** - Ensure component consistency
4. **Finish with Mobile Agent** - Optimize for mobile

### Bug Fixing Workflow
1. **Identify the issue** with the appropriate specialist
2. **Get root cause analysis** from the relevant agent
3. **Implement the fix** with agent guidance
4. **Test and validate** with mobile agent if UI-related

### Code Review Workflow
1. **Ask for code review** from the relevant specialist
2. **Get suggestions** for improvements
3. **Implement changes** based on recommendations
4. **Verify compliance** with design system agent

## Tips for Effective Agent Use

### 1. Be Specific
- Don't just say "fix this" - explain what's wrong
- Provide specific requirements and constraints
- Mention any design system compliance needs

### 2. Provide Context
- Share relevant code snippets
- Include error messages
- Mention browser/device specifics
- Reference related files

### 3. Iterate
- Start with one agent, then refine with others
- Use agents to review and improve existing code
- Leverage agents for testing and validation

### 4. Document Changes
- Ask agents to document their changes
- Request code comments for complex logic
- Get explanations for design decisions

## Common Use Cases

### Adding New Features
1. **Frontend Agent**: "Create a new feature component"
2. **Backend Agent**: "Implement the API endpoints"
3. **Design System Agent**: "Ensure design system compliance"
4. **Mobile Agent**: "Optimize for mobile devices"

### Fixing Bugs
1. **Identify the bug** with the relevant specialist
2. **Get root cause analysis**
3. **Implement the fix**
4. **Test with mobile agent** if UI-related

### Performance Optimization
1. **Backend Agent**: "Optimize database queries"
2. **Frontend Agent**: "Improve component performance"
3. **Mobile Agent**: "Optimize mobile performance"

## Getting Started

1. **Enable Background Agents** in Cursor settings
2. **Configure agent roles** based on your needs
3. **Start with one agent** for a specific task
4. **Provide clear context** about what you're working on
5. **Iterate and refine** with additional agents as needed

## Example Session

**You**: "I need to add a new section to the profile edit page"

**Frontend Agent**: "I'll help you add a new profile section. Let me examine the current structure and create a new section component using the VibrationFit design system."

**You**: "The section should handle user preferences and use the existing form patterns"

**Frontend Agent**: "Perfect! I'll create a UserPreferencesSection component that follows the existing pattern and integrates with the design system."

---

Remember: Background Agents work best when you provide clear context and specific requirements. They can significantly accelerate your development process by handling routine tasks and providing expert guidance in their specialized areas.
