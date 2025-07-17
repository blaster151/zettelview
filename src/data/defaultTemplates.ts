import { NoteTemplate } from '../types/templates';

export const defaultTemplates: NoteTemplate[] = [
  {
    id: 'meeting-notes',
    name: 'Meeting Notes',
    description: 'Template for capturing meeting discussions, decisions, and action items',
    category: 'meeting',
    content: `# Meeting: {{title}}

## 📅 Meeting Details
- **Date:** {{date}}
- **Time:** {{time}}
- **Participants:** {{participants}}
- **Location:** {{location}}

## 📋 Agenda
1. 
2. 
3. 

## 💬 Discussion Points
### Topic 1
- 

### Topic 2
- 

## ✅ Decisions Made
- 

## 📝 Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| | | | |

## 🔗 Related Notes
- 

## 📌 Next Steps
- 

---
*Created with ZettelView Meeting Notes Template*`,
    tags: ['meeting', 'notes', 'template'],
    metadata: {
      created: new Date(),
      lastUsed: new Date(),
      usageCount: 0,
      isDefault: true
    }
  },
  {
    id: 'project-plan',
    name: 'Project Plan',
    description: 'Template for project planning, goals, and milestones',
    category: 'project',
    content: `# Project: {{title}}

## 🎯 Project Overview
**Description:** {{description}}

**Goals:**
- 
- 
- 

## 📊 Project Details
- **Start Date:** {{startDate}}
- **Target End Date:** {{endDate}}
- **Status:** {{status}}
- **Priority:** {{priority}}

## 🏗️ Project Structure
### Phase 1: Planning
- [ ] Define requirements
- [ ] Create timeline
- [ ] Assign resources

### Phase 2: Development
- [ ] 
- [ ] 
- [ ] 

### Phase 3: Testing
- [ ] 
- [ ] 
- [ ] 

### Phase 4: Launch
- [ ] 
- [ ] 
- [ ] 

## 📋 Tasks
| Task | Assignee | Due Date | Status | Priority |
|------|----------|----------|--------|----------|
| | | | | |

## 🎯 Milestones
- [ ] **Milestone 1:** {{date}}
- [ ] **Milestone 2:** {{date}}
- [ ] **Milestone 3:** {{date}}

## 📚 Resources
- 
- 
- 

## 🔗 Related Notes
- 

---
*Created with ZettelView Project Plan Template*`,
    tags: ['project', 'planning', 'template'],
    metadata: {
      created: new Date(),
      lastUsed: new Date(),
      usageCount: 0,
      isDefault: true
    }
  },
  {
    id: 'research-notes',
    name: 'Research Notes',
    description: 'Template for research, study notes, and learning',
    category: 'research',
    content: `# Research: {{title}}

## 📚 Research Topic
**Subject:** {{subject}}
**Source:** {{source}}
**Date:** {{date}}

## 🎯 Research Questions
1. 
2. 
3. 

## 📖 Key Findings
### Finding 1
- 
- 

### Finding 2
- 
- 

### Finding 3
- 
- 

## 💡 Insights
- 
- 
- 

## 📝 Important Quotes
> 

## 🔍 Questions for Further Research
- 
- 
- 

## 📚 References
- 
- 
- 

## 🔗 Related Notes
- 

## 📌 Next Steps
- 
- 

---
*Created with ZettelView Research Notes Template*`,
    tags: ['research', 'study', 'learning', 'template'],
    metadata: {
      created: new Date(),
      lastUsed: new Date(),
      usageCount: 0,
      isDefault: true
    }
  },
  {
    id: 'daily-journal',
    name: 'Daily Journal',
    description: 'Template for daily reflection and journaling',
    category: 'personal',
    content: `# Daily Journal: {{date}}

## 🌅 Morning Reflection
**Mood:** {{mood}}
**Energy Level:** {{energyLevel}}

**Gratitude:**
- 
- 
- 

**Today's Focus:**
- 

## 📋 Today's Goals
- [ ] 
- [ ] 
- [ ] 

## 📝 Notes & Thoughts
### 
- 

### 
- 

## 🎯 Accomplishments
- 
- 
- 

## 🤔 Challenges & Lessons
- 
- 

## 🌙 Evening Reflection
**How did today go?**
- 

**What could I have done better?**
- 

**Tomorrow's priority:**
- 

## 🔗 Related Notes
- 

---
*Created with ZettelView Daily Journal Template*`,
    tags: ['journal', 'daily', 'reflection', 'template'],
    metadata: {
      created: new Date(),
      lastUsed: new Date(),
      usageCount: 0,
      isDefault: true
    }
  },
  {
    id: 'book-notes',
    name: 'Book Notes',
    description: 'Template for book summaries and reading notes',
    category: 'research',
    content: `# Book Notes: {{title}}

## 📖 Book Information
**Author:** {{author}}
**Genre:** {{genre}}
**Pages:** {{pages}}
**Rating:** {{rating}}/5
**Date Read:** {{dateRead}}

## 📝 Summary
{{summary}}

## 💡 Key Ideas
### Idea 1
- 
- 

### Idea 2
- 
- 

### Idea 3
- 
- 

## 🎯 Main Takeaways
1. 
2. 
3. 

## 📚 Favorite Quotes
> 

> 

> 

## 🤔 Questions & Thoughts
- 
- 
- 

## 🔗 Connections to Other Ideas
- 
- 

## 📌 Action Items
- 
- 

## 🔗 Related Notes
- 

---
*Created with ZettelView Book Notes Template*`,
    tags: ['book', 'reading', 'notes', 'template'],
    metadata: {
      created: new Date(),
      lastUsed: new Date(),
      usageCount: 0,
      isDefault: true
    }
  },
  {
    id: 'blank-note',
    name: 'Blank Note',
    description: 'Simple blank note template for free-form writing',
    category: 'general',
    content: `# {{title}}

## 
- 

## 
- 

## 
- 

---
*Created with ZettelView*`,
    tags: ['blank', 'template'],
    metadata: {
      created: new Date(),
      lastUsed: new Date(),
      usageCount: 0,
      isDefault: true
    }
  }
]; 