# Architecture

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 18, TypeScript.
- **Styling**: Tailwind CSS, ShadCN UI components.
- **Backend & Database**: Firebase (Authentication & Firestore).
- **AI Integration**: Genkit (Pre-configured for future generative features).
- **Date Handling**: `date-fns` for time calculations and formatting.

## Folder Structure
- `src/app`: Next.js routes and page layouts.
- `src/components`:
    - `auth`: Login and registration forms.
    - `dashboard`: Case lists, detailed dialogs, and specialized forms.
    - `ui`: Reusable ShadCN components.
    - `providers`: Global React context (AppProvider).
- `src/firebase`: Client-side initialization, hooks (`useUser`, `useCollection`), and error handling.
- `src/lib`: Shared utilities, types, and mock data.
- `docs`: Project blueprints (`backend.json`) and the Memory Bank.

## Data Models (Schema)
### UserProfile
- `uid`: Unique Firebase Auth ID.
- `name`: Full Name (used as the primary Document ID).
- `role`: "Case Therapist", "Clerk", or "Admin".
- `approved`: Boolean (enforced by middleware-like logic in AppProvider).

### Case
- `caseType`: "COT" or "CGAT".
- `status`: "To be completed by clerk", "To be follow up by clerk/buddy OT", or "Complete".
- `riskFactorChecklist`: Nested object tracking human and environmental risks.
- `cgatIntervals`: (CGAT only) Array tracking arrival and departure for multiple nursing homes.
- **Timestamps**: `createdAt`, `expectedArrivalTime`, `actualArrivalTime`, `caseClosingTime`.