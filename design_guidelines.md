# Design Guidelines: Smart Energy Management Platform

## Design Approach: Enterprise Dashboard System
**Selected Framework**: Custom system inspired by **Linear** (clean data hierarchy) + **Vercel Dashboard** (professional aesthetics) + **Material Design** (comprehensive component patterns)

**Rationale**: This is a data-intensive, utility-focused platform requiring clarity, efficiency, and professional credibility. The design prioritizes information hierarchy, real-time data visibility, and role-based experiences.

---

## Core Design Principles
1. **Clarity First**: Every metric, status, and action must be immediately comprehensible
2. **Data Density with Breathing Room**: Dense information presented with strategic whitespace
3. **Status-Driven Design**: Visual feedback for all system states (active, idle, disconnected, low balance)
4. **Role Distinction**: Subtle but clear UI differences between admin and student experiences

---

## Color Palette

### Dark Mode (Primary)
- **Background Base**: 222 15% 8%
- **Surface Elevated**: 222 15% 11%
- **Border Subtle**: 222 10% 20%
- **Text Primary**: 0 0% 95%
- **Text Secondary**: 0 0% 65%

### Brand & Status Colors
- **Primary Brand** (Energy/Power): 142 76% 45% (vibrant green for energy theme)
- **Success/Active**: 142 71% 45%
- **Warning/Low Balance**: 38 92% 50%
- **Critical/Disconnected**: 0 84% 60%
- **Info/Neutral**: 217 91% 60%

### Light Mode
- **Background**: 0 0% 98%
- **Surface**: 0 0% 100%
- **Border**: 220 13% 91%
- **Text Primary**: 222 47% 11%
- **Text Secondary**: 215 14% 34%

---

## Typography
**Primary Font**: Inter (via Google Fonts CDN)
**Monospace Font**: JetBrains Mono (for numeric data, kWh values)

### Scale
- **Hero/Dashboard Header**: text-4xl font-bold (36px)
- **Section Titles**: text-2xl font-semibold (24px)
- **Card Headers**: text-lg font-semibold (18px)
- **Body Text**: text-sm (14px)
- **Captions/Labels**: text-xs (12px)
- **Numeric Data**: text-base font-mono font-medium (16px monospace)

---

## Layout System
**Spacing Primitives**: Use Tailwind units of **2, 4, 8, 12, 16, 24** (e.g., p-4, gap-8, mt-12)

### Dashboard Structure
- **Sidebar Navigation**: Fixed width 16rem (w-64), collapsible on mobile
- **Main Content Area**: max-w-7xl with px-8 py-6
- **Card Grid**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6
- **Stat Cards**: Compact 2x2 or 3x3 grids above main content
- **Charts**: Full-width or 2-column depending on complexity

---

## Component Library

### Navigation
- **Top Bar**: Sticky header with user profile, notifications bell, theme toggle, role badge
- **Sidebar**: Icon + label navigation, active state with left border accent (4px primary color)
- **Breadcrumbs**: Small text with chevron separators for deep navigation

### Data Display
- **Stat Cards**: Bordered cards with icon, label, large numeric value, trend indicator (↑ ↓)
- **Real-time Indicators**: Pulsing dot (green for active, red for disconnected, amber for warning)
- **Charts**: Use Recharts with consistent color mapping (primary for usage, warning for quota limit)
- **Tables**: Zebra striping (subtle), sortable headers, row hover states, sticky headers for long lists
- **Progress Bars**: Linear with percentage label, color-coded (green < 70%, amber 70-90%, red > 90%)

### Forms & Inputs
- **Input Fields**: Bordered with focus ring (2px primary color), label above field
- **Select Dropdowns**: Chevron icon, popover menu with search for long lists
- **Action Buttons**: Primary (filled primary color), Secondary (outline), Destructive (red fill)
- **Toggle Switches**: For enable/disable actions (connect/disconnect lines)

### Feedback Elements
- **Alerts/Toasts**: Top-right corner, auto-dismiss in 5s, status-colored left border
- **Status Badges**: Rounded-full px-3 py-1 with icon, color-coded (Active, Idle, Disconnected, Low Balance)
- **Loading States**: Skeleton screens for cards, spinner for actions, shimmer effect for tables
- **Empty States**: Centered icon + message + action button

### Modals & Overlays
- **Confirmation Dialogs**: Centered, max-w-md, backdrop blur
- **Detail Panels**: Slide-in from right (w-96) for line/block details
- **Quick Actions Menu**: Dropdown from action button (3-dot menu icon)

---

## Role-Specific Design

### Admin Dashboard
- **Color Accent**: Subtle blue tint (217 91% 60%) for admin-only sections
- **Layout**: Multi-column grid showing all blocks, expandable rows for lines
- **Actions**: Prominent control buttons (disconnect, set quota, generate report)
- **Analytics**: Multiple chart types (line charts for trends, bar charts for comparisons)

### Student Dashboard
- **Color Accent**: Primary green for personal usage metrics
- **Layout**: Single-column focus on individual data, simplified navigation
- **Emphasis**: Large quota remaining display, next exhaustion date prediction
- **Actions**: Top-up button (prominent, primary color), chat with AI assistant

---

## Animations & Interactions
**Philosophy**: Minimal, purposeful motion

- **Real-time Updates**: Subtle pulse animation on new data (200ms fade-in)
- **Chart Transitions**: Smooth line/bar animations on data change (300ms ease-in-out)
- **Loading**: Gentle skeleton shimmer, no spinners unless immediate action
- **Status Changes**: Color transition over 200ms when status updates
- **Avoid**: Unnecessary page transitions, distracting hover effects

---

## Images
**Hero Image**: None - this is a utility dashboard, not a marketing site
**Profile Images**: User avatars (circular, 40px) in top bar
**Empty State Illustrations**: Simple line-art SVG illustrations for "No data yet" states
**Icons**: Heroicons (outline for inactive, solid for active states)

---

## Accessibility & Dark Mode
- **Primary Mode**: Dark (energy/tech theme)
- **High Contrast**: Ensure 4.5:1 ratio for all text
- **Focus Indicators**: 2px visible focus rings on all interactive elements
- **Keyboard Navigation**: Full support with visible focus states
- **Screen Reader**: Proper ARIA labels for charts, status indicators, and real-time updates

---

## Responsive Behavior
- **Mobile (< 768px)**: Single column, bottom nav bar, collapsible sidebar
- **Tablet (768-1024px)**: 2-column grids, persistent sidebar
- **Desktop (> 1024px)**: 3-column grids, full sidebar, multi-panel views