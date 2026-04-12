

## Plan: Update RLS policy on match_predictions

### What changes

Replace the existing "users read own match predictions" SELECT policy with a new one that allows authenticated users to also read other users' predictions for matches that have started (within a 5-hour window after kickoff).

### Database migration

A single migration that:

1. Drops the old policy `"users read own match predictions"` on `match_predictions`
2. Creates the new policy `"users read predictions after kickoff"` with the exact SQL provided — allowing users to always read their own predictions, plus read all predictions for matches where `now() >= kickoff_at AND now() <= kickoff_at + interval '5 hours'`

No code changes needed — existing queries already fetch by match_id and will automatically return more rows when the policy permits.

