# VibrationFit AI Agent System

## Overview
This document outlines how to effectively use the specialized AI agents for VibrationFit development. Each agent is designed to handle specific aspects of your codebase.

## Available Agents

### 🎨 Frontend Specialist
**Best for:** React components, UI implementation, responsive design
**Use when:**
- Building new pages or components
- Implementing design system components
- Fixing mobile responsiveness issues
- Creating forms and user interfaces

**Example prompts:**
- "Create a new profile section component using the design system"
- "Fix the mobile layout for the assessment page"
- "Implement a responsive card component"

### 🔧 Backend Specialist  
**Best for:** Supabase, APIs, database, server logic
**Use when:**
- Creating new API endpoints
- Database schema changes
- Authentication flows
- Data processing logic

**Example prompts:**
- "Create an API endpoint for saving assessment responses"
- "Design a database schema for user progress tracking"
- "Implement user authentication flow"

### 🎯 Design System Expert
**Best for:** Component library, brand consistency, design tokens
**Use when:**
- Adding new components to the design system
- Ensuring brand consistency
- Updating design tokens
- Component documentation

**Example prompts:**
- "Add a new button variant to the design system"
- "Update the color tokens for the brand"
- "Create documentation for the Card component"

### 📊 Assessment Specialist
**Best for:** Assessment flow, scoring, user journey
**Use when:**
- Working on assessment logic
- Implementing scoring algorithms
- Optimizing user flows
- Assessment data models

**Example prompts:**
- "Implement the assessment scoring algorithm"
- "Optimize the assessment completion flow"
- "Create progress tracking for assessments"

### 🔌 Integration Specialist
**Best for:** Third-party services, payments, webhooks
**Use when:**
- Stripe payment integration
- Email service setup
- Webhook handling
- External API integrations

**Example prompts:**
- "Implement Stripe subscription handling"
- "Set up email notifications for profile updates"
- "Create webhook handlers for payment events"

### 📱 Mobile Optimization Expert
**Best for:** Mobile-first design, responsive layouts, touch interactions
**Use when:**
- Mobile responsiveness issues
- Touch-friendly interfaces
- Mobile performance optimization
- Cross-device compatibility

**Example prompts:**
- "Optimize the profile edit page for mobile"
- "Improve touch interactions on the assessment"
- "Fix mobile navigation issues"

## Workflow Examples

### Feature Development Workflow
1. **Start with Frontend Specialist** - Define the UI/UX requirements
2. **Move to Backend Specialist** - Implement data models and APIs
3. **Use Design System Expert** - Ensure component consistency
4. **Finish with Mobile Expert** - Optimize for mobile devices

### Bug Fixing Workflow
1. **Identify the issue** with the appropriate specialist
2. **Root cause analysis** with backend/frontend specialist
3. **Implement fix** with the relevant specialist
4. **Test and validate** with mobile expert if needed

### Design System Updates
1. **Design System Expert** - Plan the changes
2. **Frontend Specialist** - Implement the components
3. **Mobile Expert** - Ensure responsive behavior

## Best Practices

### 1. Agent Selection
- Choose the most relevant agent for your task
- Don't hesitate to switch agents if the task scope changes
- Use multiple agents for complex features

### 2. Context Provision
- Always provide relevant file paths
- Include specific requirements and constraints
- Mention any design system compliance needs

### 3. Iterative Development
- Start with one agent, then refine with others
- Use agents to review and improve existing code
- Leverage agents for testing and validation

### 4. Documentation
- Ask agents to document their changes
- Request code comments for complex logic
- Get explanations for design decisions

## Common Use Cases

### Adding a New Feature
```
1. Frontend Specialist: "Create a new feature component"
2. Backend Specialist: "Implement the API endpoints"
3. Design System Expert: "Ensure design system compliance"
4. Mobile Expert: "Optimize for mobile devices"
```

### Fixing a Bug
```
1. Identify the bug with the relevant specialist
2. Get root cause analysis
3. Implement the fix
4. Test with mobile expert if UI-related
```

### Performance Optimization
```
1. Backend Specialist: "Optimize database queries"
2. Frontend Specialist: "Improve component performance"
3. Mobile Expert: "Optimize mobile performance"
```

## Agent Communication

### Effective Prompts
- Be specific about requirements
- Include relevant file paths
- Mention design system compliance
- Specify mobile responsiveness needs

### Context Sharing
- Share relevant code snippets
- Include error messages
- Provide user feedback
- Mention browser/device specifics

## Getting Started

1. **Choose your agent** based on the task
2. **Provide context** about what you're working on
3. **Be specific** about requirements and constraints
4. **Iterate** with the agent to refine the solution
5. **Switch agents** if the task scope changes

## Example Session

**User:** "I need to add a new section to the profile edit page"

**Frontend Specialist:** "I'll help you add a new profile section. Let me examine the current structure and create a new section component using the design system."

**User:** "The section should handle user preferences and use the existing form patterns"

**Frontend Specialist:** "Perfect! I'll create a UserPreferencesSection component that follows the existing pattern and integrates with the design system."

---

Remember: Each agent is specialized and will provide the most effective help when used for their specific expertise areas. Don't hesitate to use multiple agents for complex features!
