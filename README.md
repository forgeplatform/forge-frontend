# Forge Frontend

React UI za Forge platformu.

## Tehnologije

- React 18
- TypeScript
- Vite 6
- Tailwind CSS 3
- TanStack Query 5 (server state)
- Zustand 4 (client state)
- React Router 7
- Recharts (grafikoni)
- XYFlow (workflow vizualizacija)
- Monaco Editor (code editor)
- XTerm (terminal)

## Struktura

```
src/
├── api/          # TanStack Query hookovi (23 resursa)
├── components/   # UI komponente (primitivi + slozene)
├── pages/        # 40+ stranica (CRUD pattern)
├── hooks/        # Custom React hookovi
├── stores/       # Zustand stores (auth, theme)
├── lib/          # Utility funkcije
├── locales/      # i18n (en.json)
└── test/         # Test setup
```

## Development

```bash
# Instalacija zavisnosti
npm install

# Development server
npm run dev

# Build za produkciju
npm run build

# Testovi
npm run test

# Type checking
npx tsc --noEmit

# Lint
npm run lint
```

## Konfiguracija

API URL se podesava kroz environment varijablu:

```bash
VITE_API_URL=https://forge.example.com
```

## Dokumentacija

- [Frontend React Architecture](docs/03-frontend-react.md)

## Docker

```bash
docker build -t krlex/forge-frontend:latest .
```

Build generise staticke fajlove u `dist/` koji se serviraju preko Nginx-a.

## Povezani repozitorijumi

- [forge-backend](https://github.com/forgeplatform/forge-backend) — Django API
- [forge-deploy](https://github.com/forgeplatform/forge-deploy) — Docker Compose, Nginx, CI/CD
