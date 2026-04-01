

## Plan: Add visual notice on the Knockout page

Add an info banner at the top of the Bracket tab in `src/pages/KnockoutPage.tsx` informing users that predictions will be available once the official matchups are defined.

### Changes

**File: `src/pages/KnockoutPage.tsx`**
- Import the `Alert`, `AlertDescription` from `@/components/ui/alert` and `Info` icon from lucide-react
- In the bracket view (the `else` branch of `activeTab`), add an `Alert` component at the top with an informational message like: *"Os palpites da 2ª fase serão liberados assim que os confrontos oficiais forem definidos."*
- Only show the alert when there are bracket entries without real matches (i.e., still showing placeholders)

