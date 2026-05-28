# Nexus CRM 🌌

A premium, high-fidelity universal mobile CRM designed for managing key pipeline accounts, deal valuations, and automated relationship follow-ups. Built on **React Native** and **Expo (SDK 56)**, featuring a glassmorphic dark-mode design, smooth visual SVG charting, and an action-oriented client outreach engine.

---

## 🌟 Key Features

### 1. Command Dashboard & Pipeline Trend Analytics
*   **Dynamic Visual Charts**: Real-time sales pipeline bezier curve growth trend and deal stage allocation bar segments rendered via high-end linear gradients and SVG markers.
*   **VVIP Deal Room**: Highlights high-value active prospects (deals over $50k) automatically in a dedicated glassmorphic cockpit.
*   **Operational Metrics**: Real-time closed won revenue tracking, conversion win-rates, active deal volume metrics, and pipeline ratios.

### 2. Operational Follow-Up Radar 📡
*   **Automated Target Tracking**: Active accounts that require outreach are automatically captured based on a `nextFollowUp` parameter.
*   **Status Badging**: Clean, color-coded glows indicating relationship health:
    *   `⚠️ Overdue Follow-up` (Crimson Alert)
    *   `📅 Follow-up Today` (Amber Highlight)
    *   `🕒 Scheduled: MM/DD` (Teal Indicator)
*   **One-Tap Done**: Satisfying quick actions directly on the Dashboard that simulate calls or emails, automatically write a CRM audit trail entry, and reschedule the next check-in +7 days out, instantly sliding the client off the radar.

### 3. Comprehensive Lead Lifecycle
*   **Add & Edit Wizards**: Interactive forms with advanced controls for deal valuations, acquisition sources, initial stages, and follow-up deadlines.
*   **Audited Interaction Trail**: Log custom call, email, or meeting events to a historical audit timeline. Rescheduling follow-ups or modifying pipeline values automatically commits structured event cards to the audit trail.

---

## 🏗️ Navigation Architecture

The app is built utilizing a production-grade **Stack-over-Tabs** Expo Router file system structure:
*   **`/`**: Dashboard (tab screen) located at `src/app/(tabs)/index.tsx`.
*   **`/leads`**: Accounts Directory (tab screen) located at `src/app/(tabs)/leads.tsx`.
*   **`/tasks`**: Operational Planner (tab screen) located at `src/app/(tabs)/tasks.tsx`.
*   **`/lead/add`**: Add Lead Form (stacked modal overlay) located at `src/app/lead/add.tsx`.
*   **`/lead/[id]`**: Interactive Prospect Profiles (stacked details view) located at `src/app/lead/[id].tsx`.
*   **`/lead/edit/[id]`**: Modifier wizard located at `src/app/lead/edit/[id].tsx`.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the App
Start the Metro bundler and compile native client assets:

*   **Android (Emulator or USB Debugging)**:
    ```bash
    npm run android
    ```
*   **iOS (Simulator)**:
    ```bash
    npm run ios
    ```
*   **Web Console**:
    ```bash
    npm run web
    ```

### 3. Build & Type Verification
To perform complete static type checking:
```bash
npx tsc --noEmit
```

---

## 🛠️ Technology Stack
*   **Framework**: Expo SDK 56 & React Native
*   **Routing**: File-based routing via `expo-router` with experimental Native Platform Tab Bars (`expo-router/unstable-native-tabs`).
*   **Graphics**: Native SVG parsing via `react-native-svg`.
*   **Styling**: Glassmorphism, tailored curated gradients, and harmony-color design system defined in `src/constants/theme.ts`.
