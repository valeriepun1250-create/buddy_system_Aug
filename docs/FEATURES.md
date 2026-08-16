
# Features

## Implemented Features

### 1. Authentication & Onboarding
- **Role-Based Access**: Specialized views for Clerks and Case Therapists.
- **Profile Completion**: Users must provide a phone number and role after sign-up.
- **Admin Approval Gate**: New accounts remain in an "Awaiting Approval" state until an administrator verifies them.

### 2. Case Management
- **COT Home Visits**: Single-patient safety tracking with district and phone records.
- **CGAT Team Visits**: Multi-location tracking (Old Age Homes) with a dedicated **Interval Log**.
- **Case Copying**: Quickly open a new case using data from a previous visit.
- **Risk Assessment**: Mandatory checklist covering unstable mental states, violence history, and environmental hazards.

### 3. Safety Protocols
- **Phase 1: Initial Follow-up**: 
    - COT: Clerk-only authority to record therapist departure and initial safety check-in.
    - CGAT: Both Clerk and therapists can record arrival, facilitating team-based tracking.
    - **Sequential Visibility**: The Visit Completion phase is hidden until Phase 1 is submitted.
    - **Validation**: Prevents submission if safety statuses are not appropriately recorded.
    - **Safety Callback Reminder**: Prominent highlighted alert during initial follow-up to ensure buddies are notified for late visits extending past office hours.
- **Phase 2: Visit Completion**: 
    - Editable by both **Clerks** and the **Buddy Therapist**.
    - Tracks "Last OAH Finish" or "Home visit finish time".
    - Automatically syncs the first/last times from safety records into the CGAT Interval Log.
- **Submission Guard**: Disables buttons and shows loading states during submission to prevent duplicate records.
- **"Set Now" Functionality**: Quick time entry with the current system time via a "Zap" icon button.
- **Mutual Exclusivity**: Ensures safety signals (like "Loss of Contact") clear conflicting status checkboxes automatically.

### 4. Dashboard & UI
- **Filtering**: Tabs for My Cases, All Cases, COT, and CGAT.
- **Pagination**: Display 15 cases per page with navigation controls for managing growing case histories.
- **Summary View**: 
    - "Clean" summary that hides empty fields while showing vital info like Patient/OAH contact, district, and therapist contact.
    - **Standardized Date Format**: Creation dates are displayed in `dd/MM/yyyy` across all views.
    - **Safety Entry Labelling**: Combined descriptive labels for failures to call back (e.g., "Case OT did not call back, Buddy OT contact on") to streamline the summary report.
    - **Timestamp Visibility**: Explicitly displays **"Home visit finish time"**, **"Expected Arrival Time"**, and **"Actual Arrival (Out of Office Hour)"** when recorded.
- **Status Badges**: Visual cues (e.g., Light Orange for Follow-up, Green for Complete).

### 5. Backend & Data
- **Optimistic UI**: Firestore mutations are initiated without blocking the main UI thread, ensuring a snappy user experience.
- **Global Error Handling**: Centralized listener for Firestore permission and network errors using a specialized `FirestorePermissionError` context.

## WIP Features
- Refinement of "Admin" role management interface.

## Planned Features
- Genkit-powered summaries of risk factors.
- Push notifications for missed 15-minute callback windows.
