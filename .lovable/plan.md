

## send-push-reminders: Bug Fix

### Current State
The function **already implements** the batched pattern you described:
- Line 178: `pushTasks` array collects all tasks (not awaited inline)
- Lines 285-293: Processes in batches of 50 via `Promise.allSettled`
- Lines 297-302: Deletes expired endpoints at the end

The architecture is correct. However, there is a **runtime bug** on line 253 that will crash the function:

```typescript
// Line 252-255 — `missing` is never declared
for (const [userId, subs] of subsByUser) {
  if (!extraSet.has(`${userId}:champion`)) missing.push(missingLabels.champion);
  // ...
```

The variable `missing` is used but never initialized. It needs `const missing: string[] = [];` at the start of each loop iteration.

### Plan

**File:** `supabase/functions/send-push-reminders/index.ts`

1. Add `const missing: string[] = [];` inside the `for (const [userId, subs])` loop at line 252, before the `missing.push()` calls.

That's the only change needed — the batching logic is already in place.

