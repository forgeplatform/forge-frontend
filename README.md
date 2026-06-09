# Forail Frontend

[![CI](https://github.com/forail-platform/forail-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/forail-platform/forail-frontend/actions/workflows/ci.yml)

React UI for the Forail platform.

## Tech Stack

- React 18
- TypeScript
- Vite 6
- Tailwind CSS 3
- TanStack Query 5 (server state)
- Zustand 4 (client state)
- React Router 7
- Recharts (charts)
- XYFlow (workflow visualization)
- Monaco Editor (code editor)
- XTerm (terminal)

## Structure

```
src/
├── api/          # TanStack Query hooks (23 resources)
├── components/   # UI components (primitives + complex)
├── pages/        # 40+ pages (CRUD pattern)
├── hooks/        # Custom React hooks
├── stores/       # Zustand stores (auth, theme)
├── lib/          # Utility functions
├── locales/      # i18n (en.json)
└── test/         # Test setup
```

## Development

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Tests
npm run test

# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

## Configuration

The API URL is configured via an environment variable:

```bash
VITE_API_URL=https://forail.example.com
```

## Documentation

- [Frontend React Architecture](docs/03-frontend-react.md)

## Docker

```bash
docker build -t ghcr.io/forail-platform/forail-frontend:latest .
```

The build generates static files in `dist/` which are served via Nginx.

## Related Repositories

- [forail-backend](https://github.com/forail-platform/forail-backend) — Django API
- [forail-devops](https://github.com/forail-platform/forail-devops) — Docker Compose, Nginx, CI/CD

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE).
