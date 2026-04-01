

## Plan: Highlight groups with matches in the next 24 hours

Add a visual indicator to `GroupCard` components that have at least one match starting within the next 24 hours.

### Changes

**File: `src/pages/HomePage.tsx`**

1. **Add `hasUpcoming24h` prop to `GroupCard`** — a boolean indicating if any match in the group kicks off within 24 hours (and hasn't started yet).

2. **Compute the flag when rendering** — in the `matchesByGroup.entries().map(...)` loop, check if any match in the group has `kickoff_at` between `now` and `now + 24h`.

3. **Apply visual highlight in `GroupCard`** — when `hasUpcoming24h` is true:
   - Add a glowing border (`ring-1 ring-primary/50` or `border border-primary/40`)
   - Show a small badge/label like "🔴 Em 24h" / translated text next to the group name
   - Auto-expand these groups by defaulting `expanded` to `true`

4. **Sort groups** — optionally move highlighted groups to the top of the list (groups with upcoming matches first).

5. **Add translation keys** in `pt.json`, `en.json`, `es.json`, `fr.json` for the "Next 24h" label (e.g., `home.next24h`).

### Technical details

- The 24h check: `const in24h = new Date(Date.now() + 24*60*60*1000); matches.some(m => new Date(m.kickoff_at) > now && new Date(m.kickoff_at) <= in24h)`
- The highlight uses existing Tailwind classes — no new dependencies
- Groups with live matches already show in the live section; this targets upcoming-but-not-yet-started matches

