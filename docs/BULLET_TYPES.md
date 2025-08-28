# Bullet Journal Notation Reference

## Official Bullet Journal Method

This app supports the complete official Bullet Journal notation system created by Ryder Carroll.

### Core Bullets

#### Tasks
- `•` **Task** - Something you need to do
- `X` **Task Complete** - Task has been completed  
- `>` **Task Migrated** - Moved to next Monthly Log
- `<` **Task Scheduled** - Moved to Future Log
- `~` **Task Irrelevant** - No longer needed (cancelled)

#### Events  
- `O` **Event** - Scheduled occasions (appointments, meetings)

#### Notes
- `-` **Note** - Information, ideas, thoughts, observations
- `!` **Idea** - Inspiration or brilliant thought (standalone)

### Signifiers (Prefixes)

Signifiers add extra context and can be combined with any bullet:

- `*` **Priority** - Important/urgent (e.g., `* • Important task`)
- `!` **Inspiration** - Great idea to explore further

### Examples with OCR Variations

The parser recognizes common OCR misreads and variations:

```
Original → OCR Variations Supported
• Task   → • · ∙ ⋅ ‧ . Task
O Event  → O o 0 Ø Event  
- Note   → - – — − Note
X Done   → X x ✓ ✔ × Done
> Migrate → > → ➜ Migrate
< Schedule → < ← ⬅ Schedule
```

## How It Works in the App

### Detection
When you scan a page, the parser:
1. Identifies date headers (15th, March 15, etc.)
2. Recognizes bullet symbols at line start
3. Falls back to natural language if no bullets found
4. Shows "Detected: Task/Event/Note" in the UI

### Natural Language Support
If OCR doesn't capture bullets, the parser uses smart detection:
- **Tasks**: Action verbs (pick up, make, finish, call)
- **Events**: Time markers (@ 3pm, lunch @ 11:30)
- **Notes**: Descriptive text without actions

### UI Feedback
After scanning, you'll see:
- **"Detected: Task"** - What the parser identified
- **"Detected: Event (Scheduled)"** - Type and status
- **Clickable bullets** - Tap to change type if needed

### Status Tracking
The app tracks all official statuses:
- `incomplete` - Active task
- `complete` - Done (X)
- `migrated` - Moved forward (>)
- `scheduled` - Future Log (<)
- `cancelled` - Irrelevant (~)

## Tips for Best Results

### Writing for OCR
1. **Clear bullets**: Make dots and circles distinct
2. **Space after bullets**: Leave space between symbol and text
3. **Consistent symbols**: Use standard notation when possible

### Manual Corrections
After scanning, you can:
- Tap bullet buttons to change type
- Edit text content
- Add/remove entries
- All changes preserve in the review screen

## Quick Reference Card

```
TASKS          EVENTS    NOTES
• Todo         O Event   - Note
X Done                   ! Idea
> Migrated              
< Scheduled    PRIORITY
~ Cancelled    * • Important task
               * O Key event
               * - Critical note
```

## Compatibility

The parser handles:
- ✅ Standard Bullet Journal notation
- ✅ Common handwriting variations  
- ✅ OCR errors and misreads
- ✅ Natural language fallback
- ✅ Mixed notation (bullets + plain text)
- ✅ Date contexts and headers