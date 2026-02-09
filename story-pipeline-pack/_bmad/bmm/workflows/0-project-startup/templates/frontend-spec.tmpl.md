<!-- ANTI-HALLUCINATION: Every section MUST have an explicit source.
     Valid sources: user input, previous artifact, codebase scan.
     If source = "Claude hypothesis" -> ASK before writing. -->

# Frontend Specification: {project_name}

## UI Framework & Tools

- **Framework:** {FROM_ARTIFACT: docs/architecture.md Tech Stack -> Frontend}
- **Meta-framework:** {FROM_ARTIFACT: docs/architecture.md OR ASK_USER: e.g. Next.js, Nuxt, SvelteKit, Vite SPA}
- **Styling:** {FROM_ARTIFACT: docs/architecture.md OR ASK_USER: e.g. Tailwind CSS, CSS Modules}
- **Component Library:** {ASK_USER: e.g. shadcn/ui, Radix, Headless UI, custom}
- **Icons:** {ASK_USER: e.g. Lucide, Heroicons, custom SVG}
- **Forms:** {GENERATE_AND_VALIDATE: based on stack, e.g. React Hook Form}
- **Routing:** {GENERATE_AND_VALIDATE: based on meta-framework, e.g. React Router, file-based}

## Layout

### Overall Structure
```
┌─────────────────────────────────────┐
│              Header                 │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │      Main Content        │
│          │                          │
│          │                          │
├──────────┴──────────────────────────┤
│              Footer                 │
└─────────────────────────────────────┘
```

### Breakpoints
- **Mobile:** {GENERATE_AND_VALIDATE: breakpoint based on framework/stack, e.g. < 640px}
- **Tablet:** {GENERATE_AND_VALIDATE: breakpoint based on framework/stack, e.g. 640px - 1024px}
- **Desktop:** {GENERATE_AND_VALIDATE: breakpoint based on framework/stack, e.g. > 1024px}

### Navigation Pattern
- {GENERATE_AND_VALIDATE: navigation pattern derived from PRD User Flows}

## Pages / Views

### Page: {FROM_ARTIFACT: docs/prd.md User Flows -> identified page}
- **Route:** `{GENERATE_AND_VALIDATE: path derived from User Flow}`
- **Description:** {FROM_ARTIFACT: docs/prd.md FR -> what this page shows}
- **Main components:**
  - {GENERATE_AND_VALIDATE: Component derived from FR}: {GENERATE_AND_VALIDATE: role}
  - {GENERATE_AND_VALIDATE: Component derived from FR}: {GENERATE_AND_VALIDATE: role}
- **Data requirements:** {FROM_ARTIFACT: docs/architecture.md Data Models -> required entities}
- **User actions:** {FROM_ARTIFACT: docs/prd.md FR -> user actions}
- **FR Reference:** FR-{FROM_ARTIFACT: docs/prd.md corresponding FR-ID}

### Page: {FROM_ARTIFACT: docs/prd.md User Flows -> identified page}
- **Route:** `{GENERATE_AND_VALIDATE: path derived from User Flow}`
- **Description:** {FROM_ARTIFACT: docs/prd.md FR -> what this page shows}
- **Main components:**
  - {GENERATE_AND_VALIDATE: Component derived from FR}: {GENERATE_AND_VALIDATE: role}
  - {GENERATE_AND_VALIDATE: Component derived from FR}: {GENERATE_AND_VALIDATE: role}
- **Data requirements:** {FROM_ARTIFACT: docs/architecture.md Data Models -> required entities}
- **User actions:** {FROM_ARTIFACT: docs/prd.md FR -> user actions}
- **FR Reference:** FR-{FROM_ARTIFACT: docs/prd.md corresponding FR-ID}

## Component Hierarchy

```
App
├── Providers (Theme, Auth, QueryClient)
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── UserMenu
│   ├── Sidebar (if applicable)
│   │   └── NavLinks
│   └── MainContent
│       └── <Outlet /> (router)
├── Pages
│   ├── {Page1}
│   │   ├── {Component1}
│   │   └── {Component2}
│   └── {Page2}
│       ├── {Component3}
│       └── {Component4}
└── Shared
    ├── Button
    ├── Input
    ├── Modal
    ├── Toast
    └── Loading
```

## State Management

### Approach
- **Client state:** {FROM_ARTIFACT: docs/architecture.md State Management OR GENERATE_AND_VALIDATE: based on stack}
- **Server state:** {GENERATE_AND_VALIDATE: based on chosen stack, e.g. TanStack Query, SWR}
- **Form state:** {GENERATE_AND_VALIDATE: based on chosen stack, e.g. React Hook Form}
- **URL state:** {GENERATE_AND_VALIDATE: based on chosen routing, e.g. search params}

### Store Structure (if applicable)
```
{
  auth: { user, token, isAuthenticated },
  ui: { theme, sidebarOpen, activeModal },
  // Server state managed by TanStack Query / SWR
}
```

### Data Flow Pattern
1. {e.g. Component calls custom hook}
2. {e.g. Hook uses useQuery for fetch}
3. {e.g. Data cached automatically}
4. {e.g. Mutations invalidate cache}

## Responsive Strategy

### Mobile-First
- {Mobile-first or desktop-first approach}
- {How layouts change per breakpoint}

### Touch Targets
- Minimum {e.g. 44x44px} for touch targets
- {Supported gestures: swipe, long press, etc.}

### Progressive Enhancement
- {What works without JS}
- {What requires JS}

## Design Tokens (if applicable)

### Colors
- **Primary:** {color}
- **Secondary:** {color}
- **Background:** {color}
- **Text:** {color}
- **Error:** {color}
- **Success:** {color}

### Typography
- **Font family:** {font}
- **Headings:** {sizes}
- **Body:** {size}

### Spacing Scale
- {e.g. 4px base, scale: 4, 8, 12, 16, 24, 32, 48, 64}

## Accessibility

- **Target:** {e.g. WCAG 2.1 AA}
- **Keyboard navigation:** {yes/no, pattern}
- **Screen reader:** {aria labels, semantic HTML}
- **Color contrast:** {minimum ratio}

---

_Generated by project-startup pipeline - Step 4: Frontend Spec_
