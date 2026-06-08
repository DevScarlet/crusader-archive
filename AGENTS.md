# AGENTS.md

## General Principles

* Make the smallest reasonable change that solves the problem.
* Do not rewrite unrelated code, rename files, or restructure folders unless it clearly improves the requested task.
* Prefer clear, boring, maintainable code over clever code.
* Keep changes focused and easy to review.
* Do not commit changes unless explicitly asked.

## TypeScript

* Use strict TypeScript.
* Avoid `any`; prefer proper types, generics, `unknown`, or runtime validation.
* Validate external API data at the boundary before using it in the app.
* Keep OpenHammer API types separate from application/domain types.
* Prefer explicit return types for exported functions, hooks, utilities, and API mappers.

## Naming

* Use PascalCase for React components and TypeScript types/interfaces.
* Use camelCase for functions, variables, hooks, and local values.
* Use descriptive names over abbreviations.
* Avoid vague names like `data`, `item`, `thing`, or `result` unless the context is very small and obvious.

## React

* Use functional components and hooks.
* Keep components focused on one responsibility.
* Extract logic into hooks/utilities only when it improves clarity, testability, or reuse.
* Keep rendering logic readable; avoid deeply nested conditionals in JSX.
* Show useful loading, empty, and error states for user-facing data.

## API and Data Flow

* Keep API fetching, API mapping, and UI rendering separate.
* Map external OpenHammer API responses into internal domain models before rendering them.
* Do not let raw external API shapes spread throughout the app.
* Handle missing, malformed, or unexpected API data safely.

## Errors

* Never silently swallow failures.
* Provide useful user-facing error states.
* Log or expose enough information for debugging without leaking secrets.
* Avoid generic error messages when a more helpful one is possible.

## Functions

* Keep functions small, single-purpose, and easy to understand.
* Be explicit about side effects.
* Avoid hidden mutations unless there is a clear reason.
* Prefer pure functions for data transformation.

## Comments

* Comments should explain why, constraints, tradeoffs, or surprising behavior.
* Do not narrate obvious code.
* Remove outdated comments when changing code.

## Styling

* Choose one styling approach and use it consistently.
* Avoid scattered inline styles unless they are truly one-off dynamic values.
* Keep class names, component structure, and layout choices readable.
* Consider basic responsive design and accessibility when building UI.

## Accessibility

* Use semantic HTML where possible.
* Buttons should be buttons, links should be links.
* Images should have meaningful alt text when they convey information.
* Interactive elements should be keyboard-accessible.

## Imports and Project Structure

* Use aliases for shared modules where configured.
* Avoid deeply nested relative paths like `../../../`.
* Keep shared utilities, types, API clients, and components in appropriate folders.
* Do not introduce circular dependencies.

## Testing

* Test behavior and data transformations.
* Prioritize tests for API mapping, validation, utility functions, and important user flows.
* Avoid testing implementation details.
* Add or update tests when fixing bugs or changing existing behavior.

## Dependencies

* Add libraries only when they remove meaningful complexity.
* Prefer built-in browser/TypeScript/React features when reasonable.
* Do not add large dependencies for small problems.
* Explain why a new dependency is needed when adding one.

## Security

* Never hardcode secrets, API keys, tokens, or private URLs.
* Use environment variables for configuration.
* Do not expose server-only values to the client.
* Be careful when rendering external data; avoid unsafe HTML unless explicitly sanitized.

## Git and Commits

* Keep commits focused and meaningful.
* Use clear commit messages that describe the actual change.
* Do not include unrelated formatting changes in feature or bug-fix commits.
* Do not commit generated files, dependency lockfile changes, or config changes unless they are necessary for the task.
* Before committing, summarize what changed and mention any checks that were run.

## Quality Gate

Before work is considered complete:

* Lint must pass.
* Type-check must pass.
* Tests must pass if tests exist.
* The app should run without obvious console errors.
* User-facing loading, empty, and error states should be handled where relevant.
