# Cliste Unified Design System
> Version 1.0 · 2026-06-15
> Stack: Next.js (JSX) · Tailwind CSS v4 · lucide-react / react-icons · framer-motion
> Inspiration: Synaptix dashboard aesthetic — clean, minimal, deep-space atmosphere

---

## 1. Philosophy

**One concept, two themes, three voices.**

The unifying signature is a **purple atmosphere tint** that bleeds into both modes:
- Dark mode: deep space near-black with purple undertone (`#0B0719`)
- Light mode: barely-there lavender white (`#F7F4FF`)

Both themes share the exact same component structure, spacing, and radius. Only surface colors and accent intensities flip. A user switching modes should feel continuity, not a different app.

**Three voices** = three apps, same base, different accent colors. The accent is the only thing that "belongs" to each app.

---

## 2. Tailwind v4 Theme Tokens

Add this to your `globals.css` (or app-specific CSS entry):

```css
@import "tailwindcss";

@theme {
  /* ─── Typography ─── */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  /* ─── Border Radius ─── */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  10px;
  --radius-xl:  14px;
  --radius-2xl: 20px;

  /* ─── Dark Mode Base ─── */
  --color-bg-base:     #0B0719;   /* outermost page bg */
  --color-bg-surface:  #120D22;   /* sidebar, panels */
  --color-bg-elevated: #1A1332;   /* cards, modals */
  --color-border:      rgba(255, 255, 255, 0.07);

  --color-text-primary:   #EDE8FF;
  --color-text-secondary: #9580BE;
  --color-text-muted:     #5C4F7A;

  /* ─── Light Mode Base (override with .light or [data-theme="light"]) ─── */
  /* See Section 3 for implementation */
}
```

### Light mode override

```css
[data-theme="light"], .light {
  --color-bg-base:     #F7F4FF;
  --color-bg-surface:  #FFFFFF;
  --color-bg-elevated: #EFEBFF;
  --color-border:      rgba(0, 0, 0, 0.07);

  --color-text-primary:   #150D2E;
  --color-text-secondary: #5B4D7A;
  --color-text-muted:     #9080B0;
}
```

---

## 3. App-Specific Accent Colors

Each app injects its own accent on top of the shared base:

### App 1 — Project Maker (Catalyst)
**Accent: Violet**

```css
/* project-maker/globals.css */
:root {
  --accent-600:  #7C3AED;  /* primary buttons, active state */
  --accent-400:  #A78BFA;  /* dark mode metric numbers, sparklines */
  --accent-300:  #C4B5FD;  /* dark mode badge text */
  --accent-100:  #EDE9FF;  /* light mode badge bg, active nav bg */
  --accent-bg-active-dark: rgba(124, 58, 237, 0.18);  /* dark sidebar active item */
}
```

Tailwind usage (v4, extend via `@theme`):
```css
@theme {
  --color-accent: #7C3AED;
  --color-accent-light: #EDE9FF;
  --color-accent-dark-bg: rgba(124, 58, 237, 0.18);
}
```

### App 2 — Admin CMS (Cliste CMS)
**Accent: Blue** (aligns with existing indigo-600)

```css
:root {
  --accent-600:  #2563EB;
  --accent-400:  #60A5FA;
  --accent-300:  #93C5FD;
  --accent-100:  #EFF6FF;
  --accent-bg-active-dark: rgba(37, 99, 235, 0.18);
}
```

### App 3 — Project Management (Task by Cliste)
**Accent: Teal**

```css
:root {
  --accent-600:  #0F9172;
  --accent-400:  #34D399;
  --accent-300:  #6EE7B7;
  --accent-100:  #ECFDF5;
  --accent-bg-active-dark: rgba(15, 145, 114, 0.18);
}
```

---

## 4. Typography

**Font**: Inter (Google Fonts or `next/font/google`)

```js
// layout.js
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
```

**Type scale:**

| Role | Size | Weight | Notes |
|---|---|---|---|
| Page title | 24px | 500 | Never bold (700) — looks heavy |
| Section heading | 18–20px | 500 | |
| Card metric | 20–28px | 500 | Accent color in dark, near-black in light |
| Body | 14px | 400 | line-height 1.6 |
| Secondary / caption | 12–13px | 400 | text-secondary color |
| Section label | 10–11px | 400 | UPPERCASE, letter-spacing 0.08em |

**Rules:**
- Two weights only: `400` and `500`. Never use `600` or `700` — heavy against the purple-dark bg.
- Sentence case always. No ALL CAPS except 10–11px section labels.
- No mid-sentence bold.

---

## 5. Spacing & Layout

- **Base grid**: 4px
- **Common gaps**: 8px (inline), 12px (card grid), 16px (section), 24px (major sections)
- **Sidebar width**: 240px expanded, 64px collapsed
- **Content max-width**: none (full-width dashboard) or 1200px for focused pages
- **Page padding**: 24px (desktop), 16px (mobile)

---

## 6. Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 4px | Badges, pills, small tags |
| `radius-md` | 8px | Buttons, inputs, small cards |
| `radius-lg` | 10px | Medium cards, modals |
| `radius-xl` | 14px | Large panels, sidebar |
| `radius-2xl` | 20px | Floating containers |
| Pill | 9999px | Toggle chips, status pills |

---

## 7. Component Rules

### Sidebar

```jsx
// Dark mode
<aside className="w-60 bg-[#120D22] border-r border-white/5 h-screen flex flex-col px-2 py-3">
  {/* Logo */}
  <div className="flex items-center gap-2 px-3 mb-4">
    <div className="w-7 h-7 bg-accent rounded-[7px] flex items-center justify-content-center">
      <Icon size={14} className="text-white" />
    </div>
    <span className="text-sm font-medium text-[#EDE8FF]">App Name</span>
  </div>

  {/* Nav item — active */}
  <a className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm
                bg-[var(--accent-bg-active-dark)] text-[#A78BFA]">
    <Icon size={16} /> Dashboard
  </a>

  {/* Nav item — default */}
  <a className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-sm
                text-[#5C4F7A] hover:text-[#9580BE] hover:bg-white/5 transition-colors">
    <Icon size={16} /> Projects
  </a>
</aside>

// Light mode (same structure, different colors)
// active: bg-[#EDE9FF] text-[#6D28D9]
// default: text-[#5B4D7A] hover:bg-[#F0EBFF]
```

### Cards

```jsx
// Dark
<div className="bg-[#1A1332] border border-white/[0.06] rounded-[10px] p-4">
  <p className="text-[10px] text-[#5C4F7A] mb-1 uppercase tracking-wide">Label</p>
  <p className="text-xl font-medium text-[#A78BFA]">Value</p>
</div>

// Light
<div className="bg-white border border-black/[0.07] rounded-[10px] p-4">
  <p className="text-[10px] text-[#9080B0] mb-1 uppercase tracking-wide">Label</p>
  <p className="text-xl font-medium text-[#6D28D9]">Value</p>
</div>
```

### Buttons

```jsx
// Primary
<button className="bg-[var(--accent-600)] text-white px-4 py-2 rounded-[8px] text-sm
                   hover:opacity-90 active:scale-[0.98] transition-all">
  Primary
</button>

// Outline
<button className="bg-transparent text-[var(--accent-600)] border border-[var(--accent-600)]
                   px-4 py-2 rounded-[8px] text-sm hover:bg-[var(--accent-100)] transition-colors">
  Outline
</button>

// Ghost
<button className="bg-[var(--accent-bg-active-dark)] text-[var(--accent-600)]
                   px-4 py-2 rounded-[8px] text-sm hover:opacity-80 transition-opacity">
  Ghost
</button>

// Neutral
<button className="bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]
                   border border-[var(--color-border)] px-4 py-2 rounded-[8px] text-sm">
  Neutral
</button>

// Danger
<button className="bg-red-500/10 text-red-600 px-4 py-2 rounded-[8px] text-sm
                   hover:bg-red-500/15 transition-colors">
  Danger
</button>
```

### Badges

```jsx
// Score / status badges (Catalyst pipeline)
const badge = {
  KEJAR:   "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  TINJAU:  "bg-amber-500/10 text-amber-800 dark:text-amber-300",
  LEWATI:  "bg-red-500/10 text-red-700 dark:text-red-300",
  ACTIVE:  "bg-teal-500/10 text-teal-800 dark:text-teal-300",
  PENDING: "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]",
};

<span className={`text-[11px] font-medium px-2 py-0.5 rounded-[5px] ${badge.KEJAR}`}>
  KEJAR
</span>
```

### Inputs

```jsx
// Dark
<input
  className="w-full bg-[#120D22] border border-white/10 rounded-[8px]
             px-3 py-2 text-sm text-[#EDE8FF] placeholder-[#5C4F7A]
             focus:outline-none focus:border-[var(--accent-600)]/50
             focus:ring-1 focus:ring-[var(--accent-600)]/30 transition"
/>

// Light
<input
  className="w-full bg-white border border-black/10 rounded-[8px]
             px-3 py-2 text-sm text-[#150D2E] placeholder-[#9080B0]
             focus:outline-none focus:border-[var(--accent-600)]/50
             focus:ring-1 focus:ring-[var(--accent-600)]/20 transition"
/>
```

### Kanban Card

```jsx
<div className="bg-[#1A1332] border border-white/[0.06] rounded-[10px] p-3 cursor-grab
                hover:border-white/[0.12] transition-colors">
  <p className="text-xs text-[#5C4F7A] mb-1">CIVD · SKK Migas</p>
  <p className="text-sm text-[#EDE8FF] font-medium mb-2 line-clamp-2">
    Tender title goes here
  </p>
  <div className="flex items-center justify-between">
    <span className="text-[11px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-[4px]">
      Score 82
    </span>
    <span className="text-[11px] text-[#5C4F7A]">12 Jun</span>
  </div>
</div>
```

---

## 8. Motion (Framer Motion)

**Philosophy**: Motion serves meaning, not decoration. Use sparingly.

```js
// Sidebar slide (collapse/expand)
const sidebarVariants = {
  expanded: { width: 240, transition: { type: "spring", stiffness: 300, damping: 30 } },
  collapsed: { width: 64, transition: { type: "spring", stiffness: 300, damping: 30 } },
};

// Dropdown / popover appear
const dropdownVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.12 } },
};

// Modal
const modalVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.15 } },
};

// Page transition (subtle)
const pageVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// Micro-interaction on button/card hover
// Use Tailwind: hover:scale-[1.01] active:scale-[0.98] transition-transform
```

---

## 9. Icon Library

Use **lucide-react** as primary. React-icons as fallback for missing icons.

```jsx
import { LayoutDashboard, Briefcase, Users, Settings, Bell, Search } from "lucide-react";

// Consistent sizing
// Sidebar nav: size={16}
// Button inline: size={14}
// Header / standalone: size={20}
// Empty state: size={40} with text-muted color
```

---

## 10. Dark/Light Mode Toggle

Implement via `data-theme` attribute on `<html>`:

```js
// lib/theme.js
export function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

export function getTheme() {
  return localStorage.getItem("theme") ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
}
```

```jsx
// In _app.jsx or layout.jsx, on mount:
useEffect(() => {
  document.documentElement.setAttribute("data-theme", getTheme());
}, []);
```

---

## 11. ⚠️ Rules for AI Code Generation (MUST FOLLOW)

When using this doc as a prompt for AI (Cursor, Claude, Copilot, etc.), include this section:

```
DESIGN SYSTEM RULES — follow exactly, no exceptions:

COLORS:
- Dark bg: #0B0719 (page), #120D22 (sidebar/panel), #1A1332 (cards/elevated)
- Light bg: #F7F4FF (page), #FFFFFF (sidebar/panel), #EFEBFF (cards/elevated)
- Dark text: primary #EDE8FF, secondary #9580BE, muted #5C4F7A
- Light text: primary #150D2E, secondary #5B4D7A, muted #9080B0
- Accent (Project Maker): #7C3AED (primary), #EDE9FF (light bg), rgba(124,58,237,0.18) (dark active bg)
- Accent (Admin CMS): #2563EB (primary), #EFF6FF (light bg), rgba(37,99,235,0.18) (dark active bg)
- Accent (Project Mgmt): #0F9172 (primary), #ECFDF5 (light bg), rgba(15,145,114,0.18) (dark active bg)

NEVER USE:
- Font weight 600 or 700
- border-radius above 20px (except pill = 9999px)
- Gradients (no gradient-to-*, bg-gradient-*)
- Drop shadows (no shadow-*, box-shadow) — borders only
- Colored backgrounds on page-level containers (sidebar/card bg only)
- Hardcoded Tailwind gray-* colors — use the token values above instead

ALWAYS USE:
- Inter font
- Font weights: 400 (body) and 500 (headings/metric) only
- Border: border-white/[0.07] (dark) or border-black/[0.07] (light)
- Transition on interactive elements: transition-colors or transition-all duration-150
- active:scale-[0.98] on clickable buttons/cards
- lucide-react for icons, size prop: 14px (inline), 16px (sidebar), 20px (header)
- Sentence case for all labels and headings

SIDEBAR ACTIVE STATE:
- Dark: bg = rgba(accent, 0.18), text = accent-400
- Light: bg = accent-100, text = accent-600

BADGE PATTERN:
- bg = rgba(accent, 0.10), text = accent-700 (light) / accent-300 (dark)
- border-radius: 5px
- font-size: 11px, font-weight: 500
```

---

## 12. File Structure Reference

```
src/
├── app/
│   └── globals.css          ← base tokens (Section 2)
├── apps/
│   ├── project-maker/
│   │   └── globals.css      ← violet accent override
│   ├── admin-cms/
│   │   └── globals.css      ← blue accent override
│   └── project-mgmt/
│       └── globals.css      ← teal accent override
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx      ← shared, reads --accent-* vars
│   │   ├── Topbar.jsx
│   │   └── AppSwitcher.jsx
│   └── ui/
│       ├── Button.jsx       ← variant: primary|outline|ghost|neutral|danger
│       ├── Badge.jsx        ← variant: kejar|tinjau|lewati|active|info|neutral
│       ├── Card.jsx         ← variant: metric|list|kanban
│       ├── Input.jsx
│       └── Modal.jsx
└── lib/
    └── theme.js             ← setTheme(), getTheme()
```

---

## 13. AppSwitcher Token Map

For the shared `AppSwitcher` component:

```js
export const CLISTE_APPS = [
  {
    id: "project-maker",
    name: "Project Maker",
    icon: "Bolt",           // lucide-react
    accent: "#7C3AED",
    url: "/",               // or subdomain
    roles: ["admin", "manager", "user"],
  },
  {
    id: "admin-cms",
    name: "Admin CMS",
    icon: "LayoutGrid",
    accent: "#2563EB",
    url: "/cms",
    roles: ["admin", "content_writer", "marcom"],
  },
  {
    id: "project-mgmt",
    name: "Project Management",
    icon: "ClipboardList",
    accent: "#0F9172",
    url: "/pm",
    roles: ["admin", "engineer", "pm"],
  },
];
```
