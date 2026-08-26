# AGENTS.md — Rules for AI Coding Assistants

**Read this file completely before making any change to this repository.**

<!-- RULES : PERSONAL EXPENSE TRACKER -->

1. Read and understand `personal-expense-tracker-prd.md`, `personal-expense-tracker-srs.md`, and this `AGENTS.md` before making any implementation change.

2. The PRD is the source of truth for product and business requirements. The SRS is the source of truth for technology and implementation decisions. Do not contradict either document.

3. Do not invent, remove, simplify, or silently change any product requirement. If a requirement is unclear or explicitly marked TBD/Open Decision, do not guess.

4. Read and understand the existing code, folder structure, architecture, configuration, database models, API routes, frontend components, and tests before modifying anything.

5. Make only the changes required for the requested task. Do not modify unrelated files, functionality, architecture, or working features.

6. Preserve existing user changes. Never overwrite, discard, reset, or delete existing work unless explicitly required and approved.

7. Do not hardcode business data. Categories, expenses, totals, counts, dashboard statistics, summaries, dropdown options, user-created data, and business calculations must come dynamically from the database/API.

8. Initial seed categories are allowed, but after insertion they must behave as normal editable and deletable database records. Never hardcode seed categories into the frontend.

9. Use environment variables for configuration. Never hardcode database URLs, API URLs, credentials, secrets, ports, CORS origins, or environment-specific values.

10. Never read, expose, modify, print, commit, or upload `.env` or `.env.local` secret values. Use `.env.example` files for documenting required variables.

11. Do not add, remove, replace, or upgrade dependencies unless required by the PRD/SRS or the requested task.

12. Do not replace the approved technology stack. The project must use Next.js App Router, TypeScript, Framer Motion, FastAPI, Python, Pydantic, SQLAlchemy, Alembic, PostgreSQL, Supabase PostgreSQL in production, Vercel, Render, and Dockerfiles as specified by the SRS.

13. Keep the required architecture: `Next.js → FastAPI → SQLAlchemy → PostgreSQL`. The frontend must never connect directly to PostgreSQL or Supabase.

14. Frontend HTTP calls must go through the single API service layer (`lib/api/`). Components must not contain scattered direct `fetch` calls.

15. Keep frontend presentation separate from data-fetching logic. Use component-level state/hooks for the MVP; do not introduce a global state library unless explicitly required.

16. Backend routers must remain focused on HTTP/API concerns. Business logic such as totals, filtering, and category-in-use checks belongs in the service layer.

17. Use Pydantic for authoritative backend validation. Frontend validation may mirror backend rules for user experience but must never replace backend validation.

18. Follow the SRS validation rules exactly: expense amount must be greater than zero and support two decimal places; category name must be 1–100 characters and case-insensitively unique; date must be valid; note is optional with the SRS-defined limit of 500 characters.

19. Preserve the required API contract for `/api/categories`, `/api/expenses`, `/api/dashboard`, `/api/contact`, and `/health`. Do not silently rename endpoints, methods, fields, or response structures.

20. Use PostgreSQL as the authoritative data store. Do not use frontend constants, JSON files, localStorage, or other temporary storage as the source of truth for business data.

21. All database schema changes must use Alembic migrations. Never use `Base.metadata.create_all()` as the production schema-management mechanism and never perform manual production DDL when a migration is required.

22. Never perform destructive database operations, drop tables, truncate data, reset production data, or delete existing user records without explicit approval.

23. Respect the database relationship: one Category can have many Expenses, and every Expense must reference an existing Category.

24. For the current SRS interim decision, deleting a category with linked expenses must be blocked with `409 Conflict` and the linked expense count. Do not invent a different behavior unless the product decision changes.

25. Handle errors with clear user-facing messages and appropriate HTTP status codes. Never expose stack traces, credentials, database passwords, SQL internals, or other sensitive implementation details.

26. Keep CORS environment-driven and restricted to configured origins. Never solve a production network problem by blindly enabling unrestricted CORS.

27. Keep authentication, login/register, AI features, payment gateways, notifications, real-time features, advanced analytics, advanced budgeting, multi-user functionality, microservices, and unnecessary third-party integrations out of the MVP unless the requirements are explicitly changed.

28. Do not implement future enhancements such as income tracking, budgets, savings goals, advanced reports, PDF/Excel export, recurring expenses, AI insights, notifications, or mobile applications unless explicitly requested as a new scope.

29. Keep the UI simple, dynamic, responsive, maintainable, reliable, and user-friendly as required by the PRD.

30. The application must provide the required pages: Dashboard, Add Expense, Edit Expense, Expense History, and Category Management.

31. The Add/Edit Expense category dropdown must load categories dynamically from the backend. Creating a category must make it available without any source-code change.

32. Implement the required user flows exactly: add expense, edit expense, delete expense with confirmation, create/edit/delete category, filtering by category/date/date range, and automatic dashboard updates.

33. Filtering must support category, exact date, date range, and combined filters as defined by the SRS.

34. Dashboard totals and summaries must be computed from live database data. Do not calculate or display fixed totals, counts, or summaries from hardcoded values.

35. Use SQL aggregation for dashboard totals, counts, and category summaries where specified by the SRS. Do not unnecessarily load all expense records into application memory for aggregation.

36. Use the database indexes specified by the SRS for category and date filtering and category lookup.

37. Use Framer Motion only for meaningful entrance, transition, and feedback animations. Animations must remain lightweight and must respect reduced-motion preferences.

38. Any optional 3D element must never block core functionality, must remain lightweight, and must have an appropriate mobile fallback. Do not add 3D if it creates unnecessary complexity.

39. Do not use inline styling. Follow the existing project styling system and structure.

40. Keep the application responsive across mobile, tablet, laptop, desktop, and large desktop sizes.

41. Provide appropriate loading, empty, success, and error states for user-facing operations.

42. Do not over-engineer the MVP. Prefer the simplest implementation that satisfies the PRD and SRS.

43. Do not add unnecessary abstractions, caching systems, state-management libraries, services, infrastructure, or third-party integrations.

44. Before making significant changes, check the current Git working tree and understand existing changes. Do not use destructive Git commands to clean the repository.

45. Do not commit, push, force-push, rewrite Git history, or push directly to `main` unless explicitly requested. Never force-push without explicit approval.

46. After making changes, run the relevant tests, build, lint, type checks, migration checks, or validation checks required for the affected area.

47. Never disable, delete, weaken, or bypass a failing test merely to make the test suite pass. Fix the underlying problem or report it clearly.

48. Verify the complete data path when debugging: frontend UI → API service → FastAPI → validation → service layer → SQLAlchemy → PostgreSQL.

49. When debugging deployment or network issues, verify the actual failing layer before changing code. Check frontend API URL, CORS, Render health, backend logs, API response, database connection, and environment configuration as applicable.

50. Docker is for deployment/containerization readiness. The project must still support the normal local development workflow without Docker as required by the SRS.

51. Backend and frontend Dockerfiles must build successfully. Do not introduce Docker Compose as a required part of the MVP.

52. Production deployment must follow the SRS architecture: Vercel frontend → Render FastAPI backend → Supabase PostgreSQL.

53. Render must use environment-driven configuration and the platform-provided port. The backend health endpoint must be available at `/health`.

54. Vercel must use the configured `NEXT_PUBLIC_API_BASE_URL` to communicate with the Render backend. Never hardcode the production backend URL inside application code.

55. Before declaring deployment successful, verify the live application functionally. A successful build or deployment status alone is not sufficient.

56. Production verification must include the full path `Vercel → Render → Supabase` and must verify real CRUD operations, filtering, dashboard updates, validation, error handling, and the `/health` endpoint.

57. Test the primary user flows after implementation: create category, create expense, view expense, edit expense, delete expense, filter by category, filter by date, filter by date range, combine filters, and verify dashboard updates.

58. Backend tests must cover CRUD, filtering, dashboard behavior, validation, and error handling. Frontend tests must cover components, forms, validation, API integration, loading states, and error states. E2E tests must cover the complete primary flows.

59. Do not declare a feature complete merely because code was generated. A feature is complete only after implementation, relevant testing, and verification.

60. Do not claim that an API, database, deployment, or feature is working unless it has actually been verified.

61. When reporting completed work, clearly state:
    - Requirement addressed
    - Files changed
    - Changes made
    - Tests/checks executed
    - Verification performed
    - Remaining issues, if any

62. If blocked by missing information, environment access, failing infrastructure, or an unresolved product decision, stop at the appropriate point and report the exact blocker instead of guessing.

63. Maintain requirements traceability. Every P0 functional requirement from the PRD/SRS must have a corresponding implementation and test/verification path.

64. Before final completion, verify that there is no hardcoded business data, no exposed secrets, no unintended file changes, no broken existing functionality, and no unmapped P0 requirement.

65. The final implementation must satisfy the PRD acceptance criteria and the SRS implementation and production-verification requirements before the project is considered complete.
