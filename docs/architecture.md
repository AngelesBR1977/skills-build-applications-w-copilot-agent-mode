# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep page rendering and interaction in the React/Vite frontend, with API requests going through the shared client and relative `/api` paths. Each data view should expose accessible loading, empty, and error states.
- Logic tier decision: Keep HTTP validation and response handling in Express routes, and keep reusable business rules in backend services. Validate request shape, ID format, and referenced-record existence; return deliberate 4xx responses for invalid or unknown resources rather than leaking cast or validation errors as 500s.
- Data tier decision: Use Mongoose models for persisted fields, references, and required-field validation. Keep representative seed data deterministic and idempotent.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`; validate that both referenced records exist; persist the corresponding user/team references, submitted activity details, server-computed points, and occurrence time.
- Team management approach: Require a non-empty name and retain the submitted name and mascot. Store members as user references and expose them when listing or creating teams.
- Leaderboard approach: Aggregate persisted activity points by team, order totals from highest to lowest, and assign ranks starting at 1.
- Workout suggestions approach: Find the user by email, use their fitness goal and recent activity pattern to choose a relevant first suggestion, and include a reason that explains the match. Return a deliberate 4xx response if no user matches.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — 4 of 5 tests failed in the baseline run. Failures indicate missing required-field validation for User, Team, Activity, and Workout models; the idempotent seed test passed.
- API command: `npm run test:api --prefix octofit-tracker/backend` — 4 of 4 tests failed in the baseline run. Invalid activity/team requests returned 501 instead of 400, the leaderboard returned no entries, and a workout suggestion lacked the expected explanatory reason.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — 15 of 15 tests failed in the baseline run. Failures cover API-backed content and suggestion requests, plus loading, empty, and accessible error states across the four views.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — passed in the recorded run. A failure indicates a backend TypeScript type-check error.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — passed in the recorded run. A failure indicates a frontend TypeScript or Vite production-build error.

The test failures above are baseline contract gaps, not passing acceptance criteria. Rerun the affected tests after implementation; all contract tests and both builds should pass before considering the work complete.
