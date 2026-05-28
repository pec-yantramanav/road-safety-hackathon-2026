# RoadWatch UI/UX Design System & Specifications (Premium Light Theme)

Welcome to the centralized **UI/UX Design Specifications** for the **RoadWatch Road Safety Platform**. This directory contains comprehensive visual system directives, layout blueprints, micro-interaction maps, and codebase state bindings.

These specifications are structured specifically to be consumed by **AI UI/UX Design Agents** (such as Google Stitch, Claude Design, or Aura AI Designer) and front-end developers to generate pixel-perfect, highly premium frosted light-themed applications that align seamlessly with our existing architecture.

---

## 📂 Directory Contents & Navigation

To develop or review the interface designs, follow these scoped specifications:

### 1. 🎨 [Global Design System Spec](file:///c:/Users/grand/codespace/road-safety-hackathon-2026/docs/UI_UX_Design/design_system.md)
*   **Purpose**: The central styling blueprint for all RoadWatch applications.
*   **Key Contents**:
    *   Sleek Premium Frosted Light philosophy & principles.
    *   Exact Hex & HSL palette scales (Slate Light, Frosted Glass, Indigo Prime, Ocean Teal, Forest Emerald, Amber Gold, Crimson Red).
    *   Glassmorphism card specs (backdrop filters, border colors, drop shadows, hover parameters on light canvas).
    *   Typography scale (`Outfit` for Web, `Inter` for Mobile, weights, sizes, line heights).
    *   Safe Area constraints and dynamic micro-animation curves.

### 2. 📱 [Citizen Mobile App UI/UX Spec](file:///c:/Users/grand/codespace/road-safety-hackathon-2026/docs/UI_UX_Design/citizen_app_spec.md)
*   **Service**: `citizen-app` (React Native + Expo SDK 51).
*   **Key Contents**:
    *   Style mappings to the native HSL light `Theme` variables.
    *   **Screen-by-Screen Layout Trees**:
        *   *Interactive Map Dashboard*: sticky headers, custom light-vector maps, glowing clustered pins, sliding details cards, FAB drop shadows.
        *   *File Complaint Screen*: dashed file dropzones, multi-column category grids, static address-picker geolocation preview maps, offline warning banners.
        *   *Live Ticket Tracking*: vertically stacked timelines with forest green status nodes and WS STOMP updates.
        *   *AI Chatbot Interface*: conversational scroll streams with white citizen bubbles, frosted teal AI bubbles, and stream-rendering streams.
        *   *Open Budgets Explorer*: expenditure trend charts.
    *   Exact state-to-UI bindings linking layout widgets to Zustand and TanStack Query controller hooks.

### 3. 🖥️ [Govt CRM Portal UI/UX Spec](file:///c:/Users/grand/codespace/road-safety-hackathon-2026/docs/UI_UX_Design/crm_web_spec.md)
*   **Service**: `crm-web` (React 18 + Vite).
*   **Key Contents**:
    *   Main layout frames (`DashboardLayout`) including light-slate vertical sidebars, frosted horizontal topbars, and WS alerts.
    *   **The 4 Role-Based Government Dashboards**:
        *   *Executive/Oversight Layout*: KPI metrics, light map compliance heatmaps, budget expenditure charts.
        *   *Operational Division Layout*: grid tables with selective assignments, sliding details drawers, circle status flags.
        *   *Mobile-Responsive Field Layout*: mobile-optimized light-screen task cards.
        *   *Contractor Workspace Layout*: active project milestones grid, proof-of-work uploads.
    *   **Double-Pane AI Verification Drawer (`ProofViewer`)**: Contractor proof photos vs AI confidence meters, EXIF metadata overlays, before/after compare sliders.
    *   Precise state-to-UI bindings matching grid rows, form submissions, and buttons to RTK Query endpoint states, tags (`ProvidesTags`/`InvalidatesTags`), Redux `uiSlice` alerts, and role guard (`<RoleGuard>`) policies.

---

## 🤖 Contextual Prompts for AI Design Generators

When feeding these files into an AI UI Design Agent to generate front-end code, use the following customized light-theme prompt templates:

### Prompt for Generating the React Native Citizen App Views
> "You are an elite React Native mobile developer. Develop the user interface for the RoadWatch Citizen App by reading the **Global Design System Spec** and the **Citizen Mobile App UI/UX Spec**. You must use Tailwind (via NativeWind) or React Native StyleSheet variables mapped strictly to the HSL tokens defined in `Theme` (focusing entirely on a Premium Frosted Light Theme). Build the layout screens: InteractiveMapScreen (with a custom clean light map, markers, sliding card, and FAB), FileComplaintScreen (with dashed dropzones, category grids, and address components), and TicketDetailScreen (featuring live event timelines and chat streams). Fully decouple styling from business logic by binding component actions to the provided custom controller hooks (e.g. `useNearbyTickets`, `submitComplaint`, and `useTicketWebSocket`). Emphasize frosted glassmorphism container panels, safe area offsets, soft slate shadows, and smooth cubic-bezier transitions."

### Prompt for Generating the Govt CRM Dashboard Views
> "You are an elite React Web frontend developer. Build the dashboard interfaces for the RoadWatch Govt CRM Portal by reading the **Global Design System Spec** and the **Govt CRM Portal UI/UX Spec** (focusing entirely on a Premium Frosted Light Theme). Create a highly premium, modern light-themed web layout containing a collapsible sidebar and horizontal topbar with glowing focus searches. Implement the 4 distinct dashboard layouts (Executive, Operational, Field, and Contractor) dynamically managed via Role Guards. Pay special attention to the `ProofViewer` component—designing it as a double-pane slide-out panel with contractor proof photos on the left and detailed AI confidence metrics, EXIF metadata, and before/after comparisons on the right. Write high-quality, reusable components styled with Vanilla CSS or Tailwind, fully bound to RTK Query server states, cache tag validation, and Redux global alerts."
