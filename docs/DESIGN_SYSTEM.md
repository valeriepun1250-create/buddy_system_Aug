
# Design System

## UI/UX Principles
- **Professional & Functional**: Clean layouts with a focus on data density and readability.
- **Safety First**: Destructive actions (like Delete) require confirmation; mandatory safety fields are clearly validated.
- **Action Feedback**: All mutation-triggering buttons must show a loading state (spinner) and be disabled while the operation is in flight to prevent double submissions.
- **Modern Feel**: Subtle shadows, rounded corners (`radius: 0.5rem`), and PT Sans typography.

## Color Palette
- **Primary**: HSL `207 44% 49%` (Professional Blue).
- **Accent**: HSL `195 53% 79%` (Light Blue).
- **Background**: HSL `208 100% 97%` (Soft Blue Tint).
- **Status Badges**:
    - **Complete**: Green (`bg-green-500`).
    - **Follow-up**: Light Orange (`bg-orange-300`).
    - **Pending/Warning**: Yellow (`bg-yellow-400`).

## Typography
- **Primary Font**: 'PT Sans', sans-serif.
- **Headlines**: Semi-bold weight with consistent tracking.

## Core Components
- **Buttons**:
    - **Default**: Primary blue with white text.
    - **"Set Now"**: Zap icon with uppercase tracking for high visibility.
    - **Loading States**: Use the `Loader2` icon with `animate-spin` class and disable the button.
- **Alerts & Reminders**:
    - **Safety Alerts**: High-visibility yellow-themed banners (using ShadCN Alert component) for critical procedural reminders.
    - **Callback Reminders**: Use bold, larger font sizes (e.g., `text-base font-bold`) within alerts to ensure therapists and clerks do not miss critical out-of-office hour buddy notification steps.
- **Sequential Forms**: Use conditional rendering to hide advanced stages (e.g., Visit Completion) until prerequisite data (e.g., Initial Follow-up) is recorded.
- **Dialogs**: Max-width `4xl` for details, ensuring content remains readable without excessive scrolling.
- **Tabs**: Used for navigating different stages of a case (Summary, Interval Log, Risk Assessment).
- **Icons**: `lucide-react`. Specifically using `AlertTriangle` for Loss of Contact and `Zap` for time shortcuts.
