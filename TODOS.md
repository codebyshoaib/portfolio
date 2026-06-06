# TODOS

## Testing

### Backfill Vitest coverage across the codebase
- **What:** Extend the Vitest + React Testing Library setup (introduced with the Cal.com
  booking feature) to cover the FloatingDock's existing logic and other currently-untested
  components.
- **Why:** The repo has zero automated tests today (TypeScript + Biome only). The booking
  PR stands up the test framework, so the marginal cost of broadening coverage drops sharply
  once it's in place.
- **Pros:** Regression safety on always-on UI (the dock), confidence for future refactors,
  compounding value as more of the app gets covered.
- **Cons:** Time investment; not all components carry equal risk, so prioritize high-traffic /
  always-on ones first.
- **Context:** Start with `FloatingDockClient.tsx` (cap logic, Sign-Out injection, mobile vs
  desktop slices) and the section components that fetch from Sanity. Use the patterns
  established by the booking feature's tests.
- **Depends on / blocked by:** The Cal.com booking PR landing the Vitest + RTL setup first.
- **Priority:** P3 (follow-up)
