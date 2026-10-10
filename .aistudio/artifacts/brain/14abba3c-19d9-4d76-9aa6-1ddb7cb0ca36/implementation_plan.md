# ProjectPulse: Multi-Platform Project & Step Execution Dashboard

A structured development tracker and focus companion for developers building across Android, Web, and Hybrid platforms. It organizes multi-project workflows into sequential development steps, granular to-do/done checklists per step, visual SVG progress rings, and gentle focus check-ins to prevent context switching and mid-stream distractions.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during clarification and anchor this implementation:

- **Dashboard Organization**: Multi-project overview with instant platform filters (`All`, `Android`, `Web`, `Hybrid / Both`) plus active project detail view.
- **Distraction Defense & Focus**: Circular SVG progress rings showing completion per step and overall project, accompanied by a proactive "Active Focus" drawer and gentle notification check-ins ("Still focused on this step?").
- **Workflow Starters**: Built-in, high-value workflow templates for:
  - **Android App**: *Setup & Gradle, Jetpack Compose UI, Data Layer / Room / Retrofit, Testing & Permissions, Play Store Release & Proguard*.
  - **Web App**: *Project Scaffolding & Tailwind, Core UI & Responsive Layout, State & Backend APIs, SEO & Performance, CI/CD & Production Deployment*.
  - **Hybrid / Cross-Platform (Android + Web)**: *Shared Business Logic, Web PWA Build, Android Shell / Capacitor / Native Bridges, Cross-Device QA, Dual Release Pipeline*.

---

### 1. Overview & Core Concept

- **What It Does**: Enables developers to manage concurrent Android and Web applications without losing track of current milestones. Each project contains high-level sequential steps (e.g. *Database Setup*, *Authentication*, *UI Polish*), where each step maintains its own checklist of granular sub-tasks ("To Do", "In Progress", "Done").
- **Target Persona**: Multi-app developers, solo indie hackers, and mobile/web engineers who juggle multiple repositories and frequently derail onto new ideas before completing the current step.
- **Key Value Proposition**: Eliminates the "what was I doing again?" paralysis with single-click step progress, active focus pinning, and clear visual separation between completed, current, and pending steps.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Multi-Project Grid & Filtering**: View all ongoing projects at a glance. Filter by platform (`Android`, `Web`, `Both / Hybrid`) or search by name. Each card displays platform badges, active milestone step, and an SVG circular progress ring.
2. **Deep-Dive Step Roadmap**: Selecting a project opens its step pipeline. Steps are organized into *Done*, *In Progress (Active)*, and *Pending*.
3. **Checklist & Sub-task Manager**: Expanding any step displays its granular to-do items. Users can add sub-tasks, toggle completion with immediate status recalculation, add notes/code snippets, and advance the step to 100%.
4. **Anti-Distraction Focus Mode & Check-in**:
   - A sticky header banner highlights the currently pinned active step across any project.
   - An optional periodic check-in timer (e.g., 20m / 30m / 45m) softly pulses a friendly prompt: *"You've been working on [Step Name]. Still on track, or ready to mark items done?"*
   - Includes quick scratchpad for "Distraction Parking Lot" (jot down spontaneous ideas to revisit later instead of abandoning the current task).
5. **Template Starter**: 1-click project creation pre-populated with standard Android, Web, or Hybrid workflows, or a custom blank canvas.

#### Visual Identity & Theme
- **Theme & Atmosphere**: High-contrast, clean developer utility in dark slate (`#0B0F17`) with crisp neutral borders (`#1E293B`) and vibrant platform accents:
  - Android: Crisp Emerald (`#10B981`)
  - Web: Electric Cyan (`#06B6D4`)
  - Hybrid: Violet / Indigo (`#8B5CF6`)
- **Typography**: Clean display font (`Plus Jakarta Sans` / `DM Sans`) paired with tabular monospace numerals (`font-mono tabular-nums`) for timers, task counts, and completion percentages.
- **Zero-Pill Discipline**: Unboxed metadata with clean typographic separators (`Android · 6/9 Steps · 67% Complete`). Interactive filter tabs styled as segmented controls.
- **Visual Feedback**: Animated SVG progress rings with smooth stroke offsets, smooth task item check transitions, and non-intrusive sound-optional check-in notifications.

---

### 3. Key Product Decisions & Trade-Offs

- **State Persistence (Client-Side LocalStorage + Export/Import JSON)**:
  - *Chosen Approach*: Instant local storage persistence with automatic autosave, plus JSON backup export and import.
  - *Why*: Fast, zero-friction setup without requiring account signups or network latency, ensuring developer data is immediately preserved across sessions.
- **Progress Calculation Strategy**:
  - *Chosen Approach*: Dual-layer metric. Step progress is calculated from completed subtasks ($Completed / Total$). Project overall progress is calculated from weighted step completion.
  - *Why*: Reflects real work done rather than superficial step toggling.
- **Distraction Parking Lot**:
  - *Chosen Approach*: Dedicated slide-over / bottom drawer to park random thoughts or rabbit holes with a single keyboard shortcut (`Cmd/Ctrl + K` or quick button).
  - *Why*: Research shows developers switch tasks when they get an impulse thought; providing a low-friction parking spot protects focus.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation & Top Bar                        │
│   [ProjectPulse Wordmark]  [Filter: All/Android/Web/Both]  [+ New App]  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
┌───────────────────────────────────────────────────────────────────────┐
│                      State Store & LocalStorage                       │
│  • Projects, Steps, Checklist Tasks, Focus Timers, Idea Parking Lot   │
│  • JSON Export & Import Engine                                        │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                       ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│     Multi-Project Overview    │       │    Active Focus & Timer Bar   │
│ • Platform Filter Bar         │       │ • Current Project & Step Pinned│
│ • SVG Circular Progress Rings │       │ • Configurable Check-in Timer │
│ • Quick Status Summary        │       │ • "Idea Parking Lot" Drawer   │
└───────────────┬───────────────┘       └───────────────┬───────────────┘
                │                                       │
                ▼                                       ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     Project Step & Roadmap Workspace                  │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────┐ │
│  │ Done Steps (Green)   │  │ In Progress Step     │  │ Pending Steps│ │
│  │ • Summary & Checklists│  │ • Granular To-Dos    │  │ • Up Next    │ │
│  │ • History & Timestamp │  │ • Sub-task Input/Add │  │ • Re-order   │ │
│  └──────────────────────┘  └──────────────────────┘  └──────────────┘ │
└───────────────────────────────────────────────────────────────────────┘
```

#### Core Data Entities
```typescript
type Platform = 'android' | 'web' | 'both';
type StepStatus = 'pending' | 'in_progress' | 'done';

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

interface ProjectStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  checklist: ChecklistItem[];
  order: number;
}

interface Project {
  id: string;
  name: string;
  platform: Platform;
  description: string;
  steps: ProjectStep[];
  activeStepId?: string;
  updatedAt: string;
}

interface DistractionNote {
  id: string;
  text: string;
  createdAt: string;
  projectId?: string;
}
```

---

### 5. Verification & Implementation Roadmap

1. **State Store & Preset Templates**: Configure complete initial data models and starter templates for Android, Web, and Hybrid architectures.
2. **Dashboard & Platform Filter Controls**: Build project grid with responsive layout, platform indicators, SVG circular progress rings, and search.
3. **Step Pipeline & Interactive Checklist**: Implement step accordion/pipeline with sub-task creation, inline editing, check/uncheck toggles, notes, and auto-progress computation.
4. **Active Focus Bar & Check-In Notifications**: Implement pinned current step header, countdown/interval timer, and Distraction Parking Lot drawer.
5. **Data Portability & Quick Actions**: JSON import/export, project cloning, template instantiation, and responsive testing.
