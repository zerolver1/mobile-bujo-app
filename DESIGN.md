# React Native Bullet Journal — State-of-the-Art UI/UX Spec (Material 3 + NativeWind)

**Audience:** Engineers/LLMs implementing RN UI
**Goal:** A beautiful, fast, offline-first bullet journaling app that feels like pen-and-paper, with Material 3 components and tasteful motion.

---

## 0) Tech Stack

* Core: `react-native` (Expo recommended), `react-navigation`, `react-native-reanimated`, `react-native-gesture-handler`
* UI: `react-native-paper@^5` (Material 3), optional `nativewind` for utilities
* Sheets/Modals: `@gorhom/bottom-sheet`
* Lists: `@shopify/flash-list`
* Forms: `react-hook-form`, `zod`
* Icons: `lucide-react-native` + Material Symbols
* Drawing: `react-native-skia` (for sketch/handwriting overlays)
* Fonts: Inter (UI), optional handwriting faces (e.g., Cabin Sketch) for note bodies
* Storage: SQLite/WatermelonDB; sync via background task + conflict resolution
* i18n: `react-intl` or `i18next`

---

## 1) Bullet Journal Mental Model

**Core entities:**

* **Rapid Log** (stream of bullets: tasks • notes — events ○)
* **Daily Log** (date-based page referencing Rapid Log items)
* **Monthly Log** (calendar + task list)
* **Future Log** (year overview + months)
* **Collections** (free-form pages; linkable)
* **Keys & Migration**: `•` task, `○` event, `—` note, `*` priority, `!` inspiration, `→` migrate, `↻` schedule, `x` done, `–` canceled

**Design principles:** Focused, tactile, fast. Offline-first. Frictionless capture.

---

## 2) Design Tokens (single source of truth)

Create `src/design/tokens.json`:

```json
{
  "radius": { "sm": 8, "md": 12, "lg": 20, "xl": 28 },
  "space": [0,4,8,12,16,20,24,28,32,40,48,64],
  "elevation": { "level0": 0, "level1": 1, "level2": 3, "level3": 6 },
  "duration": { "fast": 120, "base": 200, "slow": 300 },
  "typescale": {
    "headline": { "lg": 32, "md": 28, "sm": 24 },
    "title": { "lg": 22, "md": 16 },
    "body": { "lg": 16, "md": 14, "sm": 12 },
    "label": { "md": 12 }
  },
  "opacity": { "disabled": 0.38, "overlay": 0.08 }
}
```

Theming via `makeTheme()` (see previous base spec) with brandable `primary/secondary/tertiary`.

---

## 3) Navigation & Information Architecture

* **Primary bottom tabs (4):** Rapid, Daily, Monthly, Collections
* **Overflow:** Search, Future Log, Settings via top-right menu or drawer
* **Deep links:** `app://daily/2025-08-28`, `app://collection/<id>`, `app://search?q=`

---

## 4) Core Screens & Acceptance Criteria

### 4.1 Rapid Log (Inbox)

**Purpose:** Two-tap capture with bullet type shortcuts.
**Layout:**

* Center-aligned TopAppBar: title "Rapid Log" + Search icon
* Pinned **Quick Capture** row: \[Task •] \[Note —] \[Event ○] buttons
* List (FlashList) of bullets with symbol, text, metadata (collection tags, date)
* Swipe left: complete/cancel; Swipe right: schedule/migrate
* FAB: new entry → sheet with type selector, text field, date/time, tag picker
  **Tasks:**
* Create task with `•` in ≤ 2 taps
* Convert bullet type via long-press menu
* Mark done via swipe + haptic
  **A11y:** All actions labeled; 48dp targets; VoiceOver announces symbol & status

### 4.2 Daily Log

**Purpose:** Focus view per date.
**Layout:**

* Large date header with weekday; left/right swipe to change day
* Section chips: Tasks • / Events ○ / Notes —
* Inline add row with keyboard accessory for symbols and `@tag` `#collection` `[[link]]`
* Weather/Calendar summary (optional) at top via permissions
  **Tasks:**
* Add bullets inline
* Drag to reorder within day
* Migrate incomplete with `→` to tomorrow or to Collection

### 4.3 Monthly Log

**Purpose:** Monthly calendar + task list.
**Layout:**

* M3 large top bar "August 2025" with month picker
* Left: compact calendar grid with dots by type; Right: monthly task list
* Empty state teaching migration (→) & scheduling (↻)
  **Tasks:**
* Tap day to open Daily
* Long-press day to add scheduled item
* Migrate all unfinished from month to next via bulk action (confirm sheet)

### 4.4 Future Log

**Purpose:** Year overview & scheduling.
**Layout:**

* 12-month grid cards; each shows top 3 scheduled bullets
* Add scheduled task/event directly into a month

### 4.5 Collections

**Purpose:** Free-form pages with outline & backlinks.
**Layout:**

* List of collections with search and sort
* Collection detail: title, optional cover emoji, body in rich plain text (checklists, headings, separators) + Skia sketch layer toggle
* Backlinks panel (where this collection is referenced)
  **Tasks:**
* Create/rename, merge, archive collection
* Insert `[[link]]` to other pages; auto-backlink

### 4.6 Search & Filters

* Global search by text, symbol, tag, date, collection
* Saved filters (e.g., `• AND @work AND !priority`)
* Keyboard shortcuts (external): `t` task, `n` note, `/` search

### 4.7 Settings

* Theme (system/light/dark), accent picker
* Bullet key reference sheet
* Data: export JSON/Markdown; import; backup; sync status
* Reminders: default times, smart nudges toggle

---

## 5) Component Inventory (RN Paper-based)

* **BulletRow**: symbol (•/○/—/\*/!) + text + chips (tags, collection, date) + drag handle
* **QuickCaptureBar**: 3 prominent buttons; press → haptic light
* **SymbolKeyboard**: accessory with keys `• ○ — * ! → ↻ x –`
* **MigrationSheet**: choose target (date or collection) + preview count
* **TagPicker**: typeahead with chips
* **DateTimeField**: inline slot picker
* **EmptyState**: icon/emoji + one-line guidance + primary CTA
* **Skeletons**: list shimmer; cards; calendar cells
* **Toast/Snackbar**: success/undo; auto-dismiss 3s

States for each: default, pressed, disabled, error, loading. 48dp min touch targets.

---

## 6) Motion & Haptics

* Page transition 220ms; emphasized curve (0.2,0,0,1)
* List add: fade+slide 12dp down; stagger 40ms
* Swipe actions: spring to 0.96 scale on hold; success haptic on complete
* Reduced motion mode respected (disable non-essential)

---

## 7) Offline-First & Sync

* Local DB first; queue mutations; background sync when online
* Conflict policy: last-write-wins at bullet level + merge notes by CRDT or line-wise
* Visual sync state: subtle dot in app bar (synced/queuing/error)
* Export: `.zip` with JSON + embedded asset folder; import merges by stable IDs

---

## 8) Data Model (LLM-friendly JSON)

```json
{
  "Bullet": {
    "id": "uuid",
    "type": "task|event|note",
    "status": "open|done|canceled|migrated|scheduled",
    "symbol": "•|○|—|*|!|→|↻|x|–",
    "text": "string",
    "createdAt": "ISO",
    "date": "ISO|null",
    "collectionId": "uuid|null",
    "tags": ["string"],
    "links": ["collectionId|bulletId"],
    "meta": { "priority": 0 }
  },
  "Collection": {
    "id": "uuid",
    "title": "string",
    "body": "markdown",
    "sketch": "skia-commands?",
    "createdAt": "ISO",
    "archived": false
  },
  "Settings": {
    "theme": "system|light|dark",
    "accent": "hex",
    "reminderTimes": ["09:00","18:00"],
    "language": "en"
  }
}
```

---

## 9) Input & Editor Rules

* Inline markdown: `*bold*`, `_italic_`, `# Heading`, `- [ ]` task
* Shortcuts: `*` toggles priority, `!` inspiration; typing `[[` opens link picker
* Auto-parse bullets at line start: `•`, `○`, `—` map to types; show helper if typed as plain text
* Attachments: images (in Collections), small voice memos on bullets

---

## 10) Calendar & Reminders

* Optional OS calendar read-only summary on Daily/Monthly (permission gated)
* Scheduling (`↻`) sets `date` and optional time; local notification via Expo Notifications
* Smart nudge: if `•` stays open > 7 days, suggest migrate or schedule

---

## 11) Theming

* Default: calm paper-like neutrals, single accent
* Dark mode with low-elevation overlays
* Custom accent picker (validate AA contrast for primary text/buttons)
* Typography: Inter for UI; optional "handwriting" for note body (toggle)

---

## 12) Analytics (privacy-first, optional)

* `screen_view { name }`
* `bullet_create { type }`
* `bullet_complete { id }`
* `migrate_bulk { count }`
* `search { queryLength, filters }`
* Respect opt-out; store locally if disabled

---

## 13) A11y & Intl

* All controls labeled; VoiceOver reads: "Task, open, due Today, text…"
* Dynamic type to 200%; layouts reflow
* Color not the only signal; use icons and shape
* RTL support; mirror swipe actions

---

## 14) Performance Budget

* First interactive < 1s
* 60fps scrolling; avoid expensive shadows on lists
* Virtualize long lists; image caching for attachments

---

## 15) Example User Flows (for LLM)

### Flow A: Rapid capture → Daily

1. User taps **Task •** in QuickCapture → text field focused
2. Types text, hits Enter → item appears at top, success haptic
3. Swipe right → choose **Schedule Today** → item appears in Daily

**Acceptance:** ≤2 taps from home to captured; item visible in Daily in <300ms.

### Flow B: Monthly migration

1. Open **Monthly** → tap **Migrate remaining**
2. MigrationSheet lists 12 open tasks; default target = next month
3. Confirm → toast "12 tasks migrated → September"

### Flow C: Create collection and link

1. New Collection → title "Trip to Arolla"
2. In Daily, type `[[Trip to Arolla]]` → link created → backlink shows 1 ref

---

## 16) QA Checklist

* Light/Dark/High contrast pass
* Large text pass (200%)
* Offline create/edit/migrate works; conflict simulation
* Swipe actions discoverable (teaching tooltip shown once)
* Export/Import roundtrip keeps IDs and links

---

## 17) Implementation Order (LLM tasks)

1. Wire theme + tokens; bottom tabs; screens skeletons
2. Implement **BulletRow**, **QuickCaptureBar**, **SymbolKeyboard**
3. Rapid Log with create/complete/schedule; haptics; skeletons
4. Daily view with inline add, swipe, migration
5. Monthly + Future grid; scheduling
6. Collections with linking + backlinks; Skia toggle
7. Search & saved filters; Settings; Export/Import
8. Polish motion, a11y, localization, performance

---

## 18) Copy & Microcopy (examples)

* Empty Rapid: "Capture anything. Use • for tasks, ○ for events, — for notes."
* Migration tip: "Not done? Swipe → to move it forward."
* Undo toast: "Marked done — Undo"
* Error: "Couldn’t sync right now. Saved locally; I’ll retry."

---

### Notes for Implementers

* Keep all touch targets ≥48dp, spacing on 4/8 grid
* Prefer skeletons over spinners
* Ask permissions in-context (calendar, notifications)
* Respect Reduced Motion and theme settings throughout

---

## 19) Visual Direction Pack — “Moonlit Minimal” (match the reference cover)

**Mood:** calm, analog, piano, moon phases. Very light paper background with soft grain; charcoal typography; minimal accents; circular motifs.

### 19.1 Palette (AA-ready, grayscale-first)

* `bg.paper` **#F4F2EF** (off‑white, warm)
* `bg.canvas` **#FAF9F7** (lighter, for surfaces)
* `ink.primary` **#1E1E1E** (charcoal)
* `ink.secondary` **#555654** (graphite)
* `ink.muted` **#8E8F8D** (stone)
* `stroke.subtle` **#D8D6D2** (hairline dividers)
* `accent` **#2B2D2F** (same family; keep monochrome). Optional subtle gold **#C9B27C** for highlights only.

> App remains mostly monochrome; use accent sparingly for focus rings, selection chips, and active tab indicators.

### 19.2 Typography

* Display/Headlines: **Playfair Display** (or EB Garamond) — Small caps / letter‑spaced for headers (similar to album text).
* Body/Controls: **Inter**.
* Suggested scale overrides:

  * `displayLarge` 44 / 1.18 lh / letterSpacing `0.5px`
  * `headlineMedium` 26 / 1.24
  * `titleMedium` 16 / 1.3 / weight 600 (Inter)

### 19.3 Surfaces & Shadows

* Prefer **borders** over elevation. Cards are flat with `stroke.subtle` 1px and 12 radius.
* Use **paper grain** overlay at 3–6% opacity (see 19.6) rather than drop shadows.

### 19.4 Iconography

* Thin-stroke icons (Lucide) at 1.5–2px; circular motifs (dots/outlined circles) to echo moon phases.
* Selected state: outline → filled dot (like waxing → full).

### 19.5 Motion

* Slow, graceful transitions (220ms). Stagger 30–40ms.
* Use **opacity + slight scale** for entrances; no elastic overshoot.
* Haptics: light impact only.

### 19.6 Paper Texture / Grain (Paper‑like style)

To evoke the **paper-like** look (as in the provided cover), layer a subtle off-white background with fine grain and occasional soft speckles. This creates a tactile analog feel.

**Implementation notes:**

* Use `bg.paper` (#F4F2EF) as base fill.
* Overlay a seamless **grain texture** PNG at low opacity (3–6%).
* Add a secondary optional overlay of faint speckle/noise for variety.
* Avoid pure white; stick to warm neutrals with slight imperfections.
* Use vector hairline borders in `stroke.subtle` to mimic ink lines.

```tsx
// src/ui/Grain.tsx (extended)
import React from "react";
import { Image, StyleSheet } from "react-native";

export default function Grain() {
  return (
    <>
      <Image
        accessibilityIgnoresInvertColors
        pointerEvents="none"
        source={require("../../assets/grain.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="repeat"
      />
      <Image
        accessibilityIgnoresInvertColors
        pointerEvents="none"
        source={require("../../assets/speckle.png")}
        style={StyleSheet.absoluteFillObject}
        resizeMode="repeat"
      />
    </>
  );
}
```

> `grain.png` = subtle paper grain, `speckle.png` = faint dots. Both semi‑transparent. Together they emulate textured paper.
> Add a subtle grain overlay to root screens.

```tsx
// src/ui/Grain.tsx
import React from "react";
import { Image, StyleSheet } from "react-native";

export default function Grain() {
  return (
    <Image
      accessibilityIgnoresInvertColors
      pointerEvents="none"
      source={require("../../assets/grain.png")}
      style={StyleSheet.absoluteFillObject}
      resizeMode="repeat"
    />
  );
}
```

> Use any small seamless noise/grain PNG (\~512×512). Place `<Grain />` once per screen (top-level `View`). Opacity baked into the asset.

### 19.7 Theme wiring (MD3, monochrome)

```ts
// src/design/theme.moon.ts
import { MD3LightTheme, MD3DarkTheme, configureFonts } from "react-native-paper";
import { Platform } from "react-native";
import { makeTheme as baseMake } from "./theme"; // reuse font config util if you have one

const serif = Platform.select({ ios: "PlayfairDisplay-Regular", android: "PlayfairDisplay-Regular" });

export const makeMoonTheme = () => {
  const { light, dark } = baseMake();
  return {
    light: {
      ...light,
      colors: {
        ...light.colors,
        background: "#F4F2EF",
        surface: "#FAF9F7",
        primary: "#2B2D2F",
        secondary: "#555654",
        outline: "#D8D6D2",
        error: "#B3261E"
      },
      fonts: configureFonts({
        config: {
          ...light.fonts,
          displayLarge: { fontFamily: serif!, fontSize: 44, lineHeight: 52, letterSpacing: 0.5 },
          headlineMedium: { fontFamily: serif!, fontSize: 26, lineHeight: 32, letterSpacing: 0.25 }
        }
      })
    },
    dark: {
      ...dark,
      colors: {
        ...dark.colors,
        background: "#0F1011",
        surface: "#141517",
        primary: "#DADADA",
        secondary: "#A9AAA8",
        outline: "#2A2B2D",
        error: "#F2B8B5"
      }
    }
  };
};
```

### 19.8 Component styling notes

* **TopAppBar:** center title in serif, letter-spaced; actions right. No shadow; 1px bottom divider `stroke.subtle`.
* **Buttons:** default = `outlined` monochrome; `filled` used sparingly. Text in Inter 600. Radius 12.
* **Chips:** pill with hairline border; selected = filled ink on paper with dot icon.
* **Cards:** border only; internal spacing 16; use Grain background underneath.

### 19.9 Lunar Loader (optional, album-inspired)

```tsx
// src/ui/LunarLoader.tsx
import React from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

export default function LunarLoader({ size = 48 }: { size?: number }) {
  const rot = useSharedValue(0);
  React.useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 2000, easing: Easing.inOut(Easing.quad) }), -1);
  }, []);
  const s = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const dot = size * 0.12;
  const r = size * 0.42;
  const positions = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <Animated.View style={[{ width: size, height: size }, s]} accessibilityLabel="Loading" accessibilityRole="progressbar">
      {positions.map((a, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: size / 2 + r * Math.cos(a) - dot / 2,
            top: size / 2 + r * Math.sin(a) - dot / 2,
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            borderWidth: 1,
            borderColor: "#8E8F8D",
            backgroundColor: i % 3 === 0 ? "#1E1E1E" : "transparent"
          }}
        />
      ))}
    </Animated.View>
  );
}
```

Use on loading screens or empty states instead of a spinner.

### 19.10 Example screen skeleton with grain + serif header

```tsx
// src/screens/Rapid.tsx (excerpt)
import Grain from "../ui/Grain";
import { Appbar, Text } from "react-native-paper";

export default function Rapid() {
  return (
    <View style={{ flex: 1, backgroundColor: "#F4F2EF" }}>
      <Grain />
      <Appbar.Header mode="center-aligned" elevated={false} style={{ borderBottomWidth: 1, borderColor: "#D8D6D2" }}>
        <Appbar.Content titleStyle={{ letterSpacing: 0.5 }} title="REFLECTIONS" />
        <Appbar.Action icon="magnify" onPress={() => {}} />
      </Appbar.Header>
      {/* ...content */}
    </View>
  );
}
```

### 19.11 Microcopy tone

* Calm, reflective, single-sentence prompts.
* Examples: "Capture a thought." "Plan tomorrow with intention." "What mattered today?"

### 19.12 QA for theme

* Check AA contrast on bg.paper vs ink.primary, ink.secondary.
* Ensure grain asset respects Dark Mode (swap to darker, lower‑contrast grain in dark theme).
* Verify borders render crisply on non-integer DPR (use hairline widths where supported).
