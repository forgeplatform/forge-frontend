# Contributing to Forge Frontend

Thanks for your interest in contributing!

The full contributing guide — git workflow, commit conventions, coding standards, PR process — lives in the [forge-deploy repository](https://github.com/forgeplatform/forge-devops/blob/main/docs/10-contributing-guide.md). Please read it before submitting a pull request.

## Quick start

```bash
git clone https://github.com/forgeplatform/forge-frontend.git
cd forge-frontend
npm install
npm run dev
```

See [README.md](./README.md) for full development setup.

## Frontend-specific guidelines

- **TypeScript** — strict mode is on. Avoid `any`; prefer narrowing or explicit types.
- **Tests** — Vitest + React Testing Library. Run `npm test` before pushing. New components and features need test coverage.
- **Styles** — follow the existing design tokens; do not introduce new color/spacing scales.
- **Accessibility** — semantic HTML, keyboard navigation, ARIA roles where appropriate.
- **State management** — keep server state in Tanstack Query, local UI state in component state. Avoid global stores unless truly cross-cutting.

## Reporting bugs

Open an issue with reproduction steps, expected vs. actual behavior, and your environment (browser, Forge version, deployment method).

For security vulnerabilities, see [SECURITY.md](./SECURITY.md) — please do **not** open a public issue.
