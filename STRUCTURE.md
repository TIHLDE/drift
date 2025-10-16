# 📁 Mappestruktur for Drift Nettside

Dette prosjektet følger en monorepo-struktur med klart skille mellom frontend og backend.

## Hovedstruktur

```
drift/
├── frontend/          # Vue.js frontend applikasjon
├── backend/           # Node.js/Express backend API
├── shared/            # Delt kode mellom frontend og backend
├── .git/              # Git repository
├── .gitignore
└── README.md
```

---

## Frontend (Vue.js + TypeScript + Vite)

```
frontend/
├── src/
│   ├── components/      # Gjenbrukbare Vue-komponenter
│   │   └── Button.vue, Header.vue, etc.
│   ├── views/           # Side-komponenter (hele sider)
│   │   └── Home.vue, About.vue, etc.
│   ├── composables/     # Vue 3 Composition API funktioner
│   │   └── useAuth.ts, useCounter.ts, etc.
│   ├── stores/          # State management (Pinia)
│   │   └── userStore.ts, counterStore.ts, etc.
│   ├── services/        # API-kall til backend
│   │   └── api.ts, authService.ts, etc.
│   ├── types/           # TypeScript type definitions
│   │   └── user.ts, api.ts, etc.
│   ├── utils/           # Hjelpefunksjoner
│   │   └── formatDate.ts, validators.ts, etc.
│   ├── assets/          # Statiske filer
│   │   ├── images/      # Bilder, logoer
│   │   └── styles/      # Globale CSS/SCSS filer
│   ├── App.vue          # Hovedkomponent
│   ├── main.ts          # Entry point
│   └── style.css        # Global styling
├── public/              # Statiske filer som serveres direkte
│   └── favicon.ico
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Frontend Mapper - Detaljer

- **components/**: Små, gjenbrukbare UI-komponenter (buttons, cards, forms)
- **views/**: Hele sider som brukes med Vue Router
- **composables/**: Logikk som kan gjenbrukes på tvers av komponenter
- **stores/**: Global state management med Pinia
- **services/**: HTTP-forespørsler og API-integrasjon
- **types/**: TypeScript interfaces og types
- **utils/**: Hjelpefunksjoner (formatering, validering, etc.)
- **assets/**: Bilder, ikoner, fonts, styles

---

## Backend (Node.js + Express + TypeScript)

```
backend/
├── src/
│   ├── routes/          # API routes/endpoints
│   │   └── userRoutes.ts, counterRoutes.ts, etc.
│   ├── controllers/     # Request handlers
│   │   └── userController.ts, counterController.ts, etc.
│   ├── models/          # Database modeller (MongoDB/Prisma)
│   │   └── User.ts, Counter.ts, etc.
│   ├── services/        # Business logic
│   │   └── userService.ts, authService.ts, etc.
│   ├── middleware/      # Express middleware
│   │   └── auth.ts, errorHandler.ts, logger.ts, etc.
│   ├── config/          # Konfigurasjon
│   │   └── database.ts, environment.ts, etc.
│   ├── utils/           # Hjelpefunksjoner
│   │   └── validation.ts, tokenGenerator.ts, etc.
│   └── server.ts        # Entry point for backend
├── tests/               # Test filer
│   └── user.test.ts, counter.test.ts, etc.
├── package.json
├── tsconfig.json
└── .env                 # Miljøvariabler (ikke commit til git!)
```

### Backend Mapper - Detaljer

- **routes/**: Definerer API endpoints (GET /api/users, POST /api/login, etc.)
- **controllers/**: Håndterer requests og responses
- **models/**: Database schema og modeller
- **services/**: Business logic og kompleks funksjonalitet
- **middleware/**: Autentisering, logging, error handling
- **config/**: Database tilkobling, environment variabler
- **utils/**: Hjelpefunksjoner for backend
- **tests/**: Unit og integration tests

---

## Shared (Delt kode)

```
shared/
├── types/               # Delte TypeScript types
│   └── api.ts, common.ts, etc.
└── constants/           # Delte konstanter
    └── errorCodes.ts, statusCodes.ts, etc.
```

### Shared Mapper - Detaljer

- **types/**: TypeScript interfaces som brukes både i frontend og backend
- **constants/**: Verdier som er like i hele applikasjonen (error codes, status codes)