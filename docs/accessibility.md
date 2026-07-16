# Accessibility

## Keyboard Behavior

- Full keyboard navigation through all interactive elements
- Tab order follows visual layout
- Skip link available at top of page
- Palace cells are focusable buttons with `aria-pressed` state
- Navigation tabs use `role="tab"` with `aria-selected`
- Intake wizard steps use `role="tab"` with `aria-selected`
- Mobile dialog traps focus and handles Escape key
- All buttons have meaningful accessible names
- Form inputs have associated labels

## Screen-Reader Behavior

- Semantic heading hierarchy (h1 → h6)
- Landmarks: `<nav>`, `<main>`, `<aside>`, dialog
- `aria-live="polite"` region announces palace selection changes
- `aria-live` announcements for view transitions
- `aria-label` on navigation, atlas, inspector, timeline
- `role="status"` on status strip
- `aria-atomic="true"` on live regions
- `aria-modal="true"` on mobile dialog
- `aria-invalid` on form fields with errors
- Error messages use `role="alert"`
- Palace cells include localized name, Hanzi, and relation state in aria-label

## Focus Management

- Visible focus states (2px gold outline, 2px offset)
- Focus restored when mobile dialog closes
- Focus moved to close button when dialog opens
- No focus trap in normal navigation
- Skip link focusable and visible when focused

## Zoom

- Application functional at 200% zoom
- Responsive layouts adapt to zoomed viewport
- No horizontal overflow at 200% zoom
- Text remains readable
- Touch targets remain clickable
- Status strip wraps without overflow at 200%

## Touch Targets

- Minimum 44px × 44px for all interactive elements
- Radio labels sized for touch
- Location result items sized for touch
- Navigation buttons sized for touch
- Dialog close button sized for touch

## Reduced Motion

Under `prefers-reduced-motion: reduce`:

- All CSS animations reduced to 0.01ms duration
- All CSS transitions reduced to 0.01ms duration
- Mineral backdrop animation paused
- Palace relation lines render immediately (no drawing animation)
- Bento spotlight and border glow hidden
- Bento particles hidden
- Loading spinner retains slow animation for progress indication
- Full functionality preserved — only motion is removed

## Colour-Independent Communication

- Status never communicated through colour alone
- Text labels accompany all status indicators
- Icons accompany status colours (✓, ◐, ⚠)
- Truth badges include text labels
- Palace states include text labels (Selected, Harmony, Opposition)
- Relation text summary visible below atlas for accessibility and print
- Source status visible as text in status strip

## Print Accessibility

- Navigation hidden (not needed in print)
- Interactive controls hidden
- White/light backgrounds for readability
- Hanzi text preserved (not converted to images)
- Status information preserved
- Truth-class labels preserved
- Logical reading order maintained

## Known Limitations

- Palace atlas 4×4 grid may be difficult to navigate with a screen reader without additional landmark structure
- Mobile palace navigator could benefit from additional keyboard shortcuts
- No ARIA grid pattern implemented for the palace layout
- Form error summary not implemented (individual field errors only)
- No high-contrast mode beyond what the OS provides
- No screen reader testing has been conducted yet
- SVG relation lines have no accessible description (hidden with `aria-hidden="true"`)
- Relation text summary compensates for SVG accessibility gap
