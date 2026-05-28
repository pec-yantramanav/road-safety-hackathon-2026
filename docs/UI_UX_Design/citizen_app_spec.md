# RoadWatch Citizen App (Expo) UI/UX Design Specification (Light Theme)

This document provides a highly detailed UI/UX specification for the **RoadWatch Citizen App** (React Native + Expo SDK 51), fully adapted for our **Sleek Premium Frosted Light Theme**. Use this guide to direct front-end design agents (like Google Stitch, Claude Design, or Aura AI) to build, style, and integrate the views with our hooks-driven MVVM architecture.

---

## 1. Visual Integration Layer (`Theme` Mapping)

In the Citizen App, styling is implemented using native `StyleSheet` objects, mapped to global theme values in HSL format to achieve high-performance frosted glassmorphic layers on a light-slate canvas.

```typescript
// src/components/theme.ts
export const Theme = {
  colors: {
    background: '#F8FAFC',           // Slate Light base
    cardBg: 'rgba(255, 255, 255, 0.7)', // Frosted translucent white
    cardBorder: 'rgba(15, 23, 42, 0.08)',
    textPrimary: '#0F172A',          // Slate Dark high contrast
    textSecondary: '#475569',        // Cool slate gray for labels
    
    // High-Contrast Accessible Accents
    accentIndigo: '#4F46E5',         // Primary action tint (Indigo)
    accentTeal: '#0891B2',           // Interactive highlights (Teal)
    success: '#16A34A',              // Resolved status (Forest Green)
    warning: '#D97706',              // SLA warning (Amber Gold)
    danger: '#DC2626',               // Critical Priority / Blackspots (Crimson)
    
    // Status Bar & Overlays
    overlayBg: 'rgba(248, 250, 252, 0.85)'
  },
  typography: {
    fontFamily: 'Inter-Regular',
    fontFamilyBold: 'Inter-Bold',
    fontFamilySemi: 'Inter-SemiBold',
  },
  blur: {
    intensity: 15,                   // Expo BlurView tint intensity
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 16,
    full: 9999,
  }
};
```

---

## 2. Screen-by-Screen UI Layouts

```
   [ Landing Map Screen ]        [ File Complaint Screen ]      [ Live Tracker & Chatbot ]
+----------------------------+ +----------------------------+ +----------------------------+
| (O) RoadWatch       (Bell) | | <- File Complaint          | | <- Ticket #RW-94021        |
+----------------------------+ +----------------------------+ +----------------------------+
|                            | | [ + Add Photos Dropzone ]  | | [  Timeline Visual Grid  ] |
|   Interactive Light Map    | +----------------------------+ | - Created (Checked Green)  |
|                            | | * Category Grid            | | - Assigned (Active Indigo) |
|    [Marker]                | | [Pothole] [Lighting] [Sign]| | - Resolved                 |
|            [Marker]        | +----------------------------+ +----------------------------+
|                            | | * Location Preview (Map)   | | [ AI Chatbot Window      ] |
|  +----------------------+  | | [= Address Text Label  ]   | | AI: "I've logged it!"    |
|  | Nearby Pothole Detail|  | +----------------------------+ | Citizen: "Thanks!"         |
|  +----------------------+  | | [  Description Input   ]   | |                          |
+----------------------------+ +----------------------------+ | [Write a comment...    ]  |
| [Home]    [(+)]     [Budget| | [Submit Complaint Button]  | | [Send Button (Indigo)]     |
+----------------------------+ +----------------------------+ +----------------------------+
```

---

### Screen 2.1: Interactive Map Dashboard (`InteractiveMapScreen`)

The entry screen features a fullscreen map with frosted controls layered over a clean, high-contrast light map canvas.

#### 1. Visual Hierarchy & Elements Tree
*   **Sticky Header Panel (Frosted glass backdrop, height: `64px` + Safe Area Inset)**:
    *   *Left*: Title "RoadWatch" (`fontFamilyBold`, `fontSize: 20px`, `--text-primary`: `#0F172A`).
    *   *Right*: Horizontal Stack:
        *   **Offline Queue Sync Badge**: Renders *only* if `queueLength > 0` (Zustand `useSyncQueueStore`). Circle container, gold border, displaying queue number. Tapping triggers `triggerManualSync`.
        *   **Notification Bell**: Icon with a crimson absolute-positioned dot if unread tickets have status changes.
*   **Map Canvas (`InteractiveMap`)**:
    *   Full screen height (`100%`). Custom clean map JSON styling applied to render highways in bright white, primary streets in light grey, water bodies in soft pale blue `#E2E8F0`, and terrain in off-white `#F8FAFC`.
    *   **Custom Map Pins**:
        *   *Standard Markers*: $10px$ circular color markers matching their priority (Teal for Normal, Amber Gold for High, Crimson Red with a slow scale pulse ring for `BLACKSPOT`).
        *   *Clustered Pins*: Large white circular container (`borderWidth: 2`, `borderColor: '#4F46E5'`) enclosing the marker quantity in Indigo text.
*   **Floating Action Button (FAB)**:
    *   Positioned `bottom: 96px`, `right: 24px`. Large circular button (`56px x 56px`), background color `accentIndigo`, drop shadow: `shadowColor: '#0F172A'`, `shadowOffset: { width: 0, height: 4 }`, `shadowOpacity: 0.15`, `shadowRadius: 8`.
    *   Displays a clean Lucide `Plus` icon in White. On press, triggers scale transition to `0.92` and navigates to the File Complaint view.
*   **Sliding Detail Card (Frosted Glass Card overlay, positioned at bottom)**:
    *   Appears when a marker is clicked. Slides up `180px` from the bottom edge.
    *   Layout: Left side shows a cropped thumbnail image of the road issue. Right side shows category (`Pothole`), dynamic address, contribution count (`14 citizens supported`), and an Indigo "Contribute" button.

#### 2. Key Micro-Animations & Interactions
*   **Marker Click Transition**: The map smoothly auto-centers to the marker coordinate (`duration: 300ms`). The sliding bottom detail card scales up from `opacity: 0` and `translateY: 50` to `opacity: 1` and `translateY: 0`.
*   **Sync Banner Animation**: When the network shifts back online and offline synchronization starts, the sync badge shifts from glowing gold to pulsing forest green, followed by a checkmark rotation before fading out (`duration: 400ms`).

---

### Screen 2.2: File Complaint Screen (`FileComplaintScreen`)

A scrollable form interface ensuring high-speed data capture by users who may be standing alongside unsafe roads.

#### 1. Visual Hierarchy & Elements Tree
*   **Sticky Top Navigation Bar**:
    *   *Left*: Back Arrow icon. Navigates back with confirmation dialog if form state is dirty.
    *   *Center*: Screen Title "File Grievance" (`fontFamilySemi`, `fontSize: 18px`).
*   **Scroll Container (Margin-horizontal: `16px`, spacing: `20px` between elements)**:
    *   **1. Media Upload Dropzone**:
        *   Large rectangle container (`height: 140px`), styled with dashed border (`borderStyle: 'dashed'`, `borderColor: 'rgba(15,23,42,0.15)'`), frosted glass background `cardBg`.
        *   Center: Large camera icon in Ocean Teal + helper text: "Upload Photo of Road Issue".
        *   *Horizontal Photo Preview Stream*: Once photos are added, they are rendered in a horizontal stack (`width: 80px`, `height: 80px`, `borderRadius: 8px`). Each thumbnail features an absolute-positioned top-right Crimson Close button (`24px x 24px`) to delete.
    *   **2. Category Selection Grid**:
        *   Horizontal layout label: "Issue Category" (`fontFamilySemi`, `fontSize: 14px`).
        *   2-row grid featuring 5 selection buttons: Pothole, Street Light, Broken Signage, Road Quality, Other.
        *   *Style*: Each button is a compact square card (`48%` width to fit two-column flow), styled with a solid white base and `rgba(15,23,42,0.08)` border.
        *   *Active state*: If selected, the card gains a solid Indigo border (`borderWidth: 2`), background shifts to light Indigo tint `rgba(79, 70, 229, 0.08)`, and the category icon changes color to Indigo.
    *   **3. Description Input Field**:
        *   Text area box (`height: 100px`), background `rgba(255,255,255,1)`, bordered (`borderColor: '#E2E8F0'`), placeholder: "Add descriptions or context to help authorities locate the issue...".
        *   Right-aligned char counter in bottom right corner: `0 / 250`.
    *   **4. Geolocation Picker (`GeoPicker`)**:
        *   Visual frame (`height: 150px`, `borderRadius: 12px`, `overflow: 'hidden'`). Shows a static mini-map centered at the user's GPS coordinates.
        *   Center features an immutable glowing blue map pin representing the locked coordinate.
        *   Address Bar: Translucent white bar aligned to the bottom of the map frame showing reverse-geocoded address string (Text color: `--text-primary`: `#0F172A`, `fontSize: 12px`).
    *   **5. Anonymous Submission Switch**:
        *   Horizontal stack wrapping a switch component: "Submit Anonymously" + info tooltip.
        *   Toggle switch styled in Indigo.
*   **Action Footer**:
    *   Primary action button "Submit Complaint" (`height: 52px`, `borderRadius: 12px`, background: `accentIndigo`).
    *   If offline, a warning banner appears directly above the button: "⚠️ Offline Mode: Complaint will be stored locally and sync automatically when internet returns." (Banner uses glowing Amber Gold backdrop, text color: dark brown).

#### 2. Key Micro-Animations & Interactions
*   **Category Button Click**: Rapid scale down-up animation (`scale: 0.95` -> `1.0`) with a brief haptic click feedback to confirm user touch.
*   **Photo Deletion**: When close button is clicked, the preview thumbnail shrinks to scale `0` using a spring animation (`damping: 15`) and disappears.

---

### Screen 2.3: Live Ticket & Chatbot Window (`TicketDetailScreen` + `AIHelpChatbot`)

A split screen layout. The upper half tracks ticket progress using a visual timeline; the lower half contains a real-time conversational chat system.

#### 1. Visual Hierarchy & Elements Tree
*   **Top Half: Event Timeline Component (`EventTimeline`)**:
    *   Vertical status trail mapping the ticket lifecycle steps:
        1.  *Complaint Registered*
        2.  *Officer Assigned* (displays officer name, title, and division department)
        3.  *Work in Progress* (displays contractor name, timeline duration, and estimated completion SLA)
        4.  *Resolved & Closed* (displays before/after photo slider on success)
    *   *Timeline Styling*: Circular progress nodes.
        *   *Completed Node*: Forest green circle enclosing a white checkmark, with a solid forest green vertical line connecting to the next node.
        *   *Active Node*: Indigo circle with an outer pulse ring, connecting to subsequent nodes using a dashed grey line.
        *   *Future Node*: Semi-transparent grey circle, grey dashed connector.
*   **Lower Half: AI Help Chatbot Panel (`ChatWindow`)**:
    *   Uses a split-screen container overlay (`height: 60%` of screen).
    *   **Chat Window Stream Container**:
        *   Scrollable viewport containing citizen and AI dialog bubbles.
        *   *Citizen bubble*: Aligned to right. Styled in solid Indigo background (`#4F46E5`), text color white.
        *   *AI Chatbot bubble*: Aligned to left. Frosted glass panel, bordered in Teal (`borderColor: 'rgba(8, 145, 178, 0.15)'`), text color `#0F172A`.
        *   *AI Message Content*: Supports inline markdown rendering. Bold tags (`**`) render in high-contrast slate. Paragraph headings render with custom margins. Coordinates, phone numbers, or dates appear as clickable buttons.
    *   **Chat Input Bar (Sticky to bottom above tab bar)**:
        *   Horizontal container (`height: 48px`, background `rgba(255,255,255,0.8)`, blur applied).
        *   *Left*: Multi-line text input field, placeholder "Reply or ask AI helper...".
        *   *Right*: Circular Send button styled in Indigo.
        *   *Dynamic Indicator*: Displays three blinking dots inside a pulsing frosted bubble wrapper when AI is generating responses.

#### 2. Key Micro-Animations & Interactions
*   **Live Stream Rendering**: As characters stream from the SSE endpoint (`useChatSessionController`), the chat scroll container auto-scrolls down dynamically to keep the newest words in focus. New bubbles slide up into position from the bottom with a 150ms fade-in transition.
*   **Status Update Websocket Hook**: When a STOMP websocket event triggers a status update (e.g. status changes to `RESOLVED`), the active timeline node dynamically morphs into the completed Forest Green Checkmark state, and the previous grey dashed line transitions into a solid green connector.

---

### Screen 2.4: Open Budgets Explorer (`BudgetExplorerScreen`)

Displays road-work schemes and public expenditure maps, validating government transparency directly on citizens' devices.

#### 1. Visual Hierarchy & Elements Tree
*   **Header**:
    *   Title "Open Budgets" (`fontSize: 24px`, `fontFamilyBold`, text color `#0F172A`).
    *   Global Stat Panel: Renders two cards: "Division Road Budget Allocated" ($₹34\text{ Cr}$) and "Spent / Utilized" ($₹21\text{ Cr}$), styled as Frosted Glass Cards with high-contrast slate values and subtle drop shadows.
*   **Budget Scheme List**:
    *   Vertical grid of ongoing budget schemes (e.g. "NH-48 Pothole Mitigation Scheme").
    *   *Scheme Card Structure*:
        *   Header with scheme title + active duration tag.
        *   Interactive Progress Bar: Dual-colored bar showing progress. Left filled portion (Indigo) shows spent funds; right unfilled portion (light grey `#E2E8F0`) shows remaining buffer.
        *   *Detailed Breakdown Row*: Displays Contractor name, target deliverables (e.g. "45 km repaired"), and compliance rating.
*   **Expenditure Visualizer**:
    *   Uses high-fidelity charts with high-contrast bars (Teal and Indigo) to showcase expenditure-over-time trends.

---

## 3. Zustand & TanStack State-UI Mappings

| UI Widget Element | Controller Hook API Parameter | Bound State Layer | UI Visual State & Action |
| :--- | :--- | :--- | :--- |
| **Offline Sync Badge** | `queueLength`, `isSyncing` | Zustand (`useSyncQueueStore`) | If `queueLength > 0`, display badge in Sticky Header. If `isSyncing` is `true`, trigger rotating pulse loops on the icon. |
| **Nearby Map Markers**| `useNearbyTickets(coords, radius)` | TanStack Query (`['tickets', 'nearby']`) | Display skeleton loading overlays over list view if `isLoading`. If queries return list, render coordinates as map pins. |
| **Submit Complaint Button**| `submitComplaint(payload)` | TanStack Mutation | While mutation `isPending`, change button state to disabled, render circular spinner. If mutation fails with `OFFLINE_QUEUE_TRIGGERED`, display success modal: "Saved locally for auto-sync". |
| **Live Event Timeline**| `useTicketWebSocket(ticketId)` | TanStack Query (`['tickets', ticketId]`) | Listen to WebSocket events. Automatically overwrite client cache parameters and trigger line animation transition when new status codes are pushed from the STOMP broker. |
| **AI Stream Bubbles**| `useChatSessionController()` | SSE Stream State | While streaming, render message tokens sequentially. Display typing bubbles when the stream buffer is active. |
