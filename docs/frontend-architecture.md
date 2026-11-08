# Frontend architecture

The frontend is a feature-oriented React application. The application root composes providers and layout; it does not implement learning workflows. `App.tsx` is 14 lines, down from the original file of more than 3,200 lines.

```text
web/src/
  app/
    App.tsx                    Provider composition
    AppRoutes.tsx              Lazy-loaded route composition
    GlobalOverlays.tsx         Auth, search, session, and toast composition
    layout/                    Sidebar, top bar, workspace layout
    styles/                    Ordered stylesheets grouped by responsibility
  entities/
    curriculum/                Question/course/topic types and stateless presentation
    identity/                  User type
    learning/                  Attempt, progress, and feedback types
  features/
    workspace/                 Workspace data provider, bootstrap API and response model
    auth/                      Authentication dialog and API
    library/                   Library page, reusable cards, pure filtering
    practice/                  Question page, state hook, answer/feedback views, editor,
                               typed API, draft adapter, reflection calculation
    sessions/                  Session setup/recap, pure selection rules, persistence
    courses/                   Course page, lesson hook and API
    paths/                     Learning path pages and cards
    progress/                  Learning history page
    settings/                  Preferences page and API
    search/                    Global question search
    overview/                  Workspace overview and illustration
  shared/
    api/client.ts              HTTP transport and ApiError
    storage/browser.ts         Failure-tolerant browser storage adapter
    state/OverlayProvider.tsx  Dialog selection, toast state, keyboard shortcuts
    ui/                        Small reusable visual components
    lib/                       Presentation utilities
```

## Dependency direction

`app → features → entities/shared`. Entities may use shared utilities and other entity types. Shared code does not import features, entities, or the application. Features never import the application root. Feature-to-feature imports are explicit where a workflow needs another feature's contract, such as practice recording a session result or settings signing out through the authentication API.

The architecture test checks those rules and rejects runtime import cycles. There are no barrel files that export the entire application.

## State ownership

- `WorkspaceProvider` owns the authenticated viewer and the server's bootstrap response. A revision guard prevents a slower, earlier refresh from overwriting newer data.
- `OverlayProvider` owns global dialog selection, toast display, and keyboard shortcuts. It does not own fetched learning data.
- Feature hooks own workflow state. `useQuestionWorkspace` manages loading, submission, reflection, bookmarking, drafts, and question navigation. `QuestionPage`, `AnswerEditor`, and `QuestionFeedback` render the corresponding parts. `useCourse` owns course fetching and completion, cancelling obsolete requests on route changes. A `lesson` query parameter selects a stable lesson ID, so refresh, browser history, and copied links retain the selected lesson. The course route without that parameter shows prerequisites, outcomes, stages, completion, and a link to the first unfinished lesson.
- Presentation-only entity components receive explicit props; they do not read workspace state.

## Network and persistence boundaries

Only `shared/api/client.ts` calls `fetch`. Feature `api.ts` modules own endpoint paths, methods, request bodies, and response types. Views and hooks call those typed operations. `ApiError` preserves the server status and user-facing message; cancellation remains an AbortError.

Only `shared/storage/browser.ts` accesses browser storage. Practice and sessions own validation and their existing storage keys. Invalid saved data falls back safely. Browser storage being blocked does not prevent practice. Existing drafts, notes, test-editor content, and session results retain their original keys.

No shared types import page components. Course and lesson types belong to the curriculum model, not to the Courses page.

## Working on the app

| Change                                | Start here                                                     |
| ------------------------------------- | -------------------------------------------------------------- |
| Add a route                           | `app/AppRoutes.tsx`                                            |
| Change navigation                     | `app/layout/Sidebar.tsx` and `Topbar.tsx`                      |
| Change filtering                      | `features/library/model.ts`                                    |
| Change session selection              | `features/sessions/model.ts`                                   |
| Change submission/reflection behavior | `features/practice/useQuestionWorkspace.ts`                    |
| Change answer or feedback rendering   | `features/practice/AnswerEditor.tsx` or `QuestionFeedback.tsx` |
| Change endpoints                      | The relevant feature's `api.ts`                                |
| Change draft persistence              | `features/practice/storage.ts`                                 |
| Change global dialogs or shortcuts    | `shared/state/OverlayProvider.tsx`                             |
| Change course completion              | `features/courses/useCourse.ts`                                |

Keep pure selection/scoring logic outside components so it can be tested without rendering React or starting the API. Keep route-specific effects inside the owning feature. Styles remain global to preserve the current appearance, but the entry stylesheet explicitly orders the responsibility-based files so the existing cascade is retained.

## Verification

```sh
npm --prefix web test
npm --prefix web run build
```

The tests use Node's built-in test runner and TypeScript stripping on Node 22. They cover behavior and architectural boundaries without adding a frontend test framework. The production build type-checks every module. Browser verification covers routes, filtering, choice grading, written reflection, course navigation, and session completion.
