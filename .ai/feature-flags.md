### Feature flags — projekt i użycie

Niniejszy dokument opisuje projekt uniwersalnego, build-time-only modułu feature-flag dla aplikacji. Cel: rozdzielenie deploymentów od releasów i możliwość włączania/wyłączania funkcjonalności per-środowisko dla frontend + backend (SSR, API).

### Założenia
- Flagi są proste: boolean (true/false) per environment.  
- Środowiska: `local`, `integration`, `prod`.  
- Environment przekazywany przez zmienną: `ENV_NAME` (build/SSR).  
- Rozwiązanie działa wyłącznie w build-time (statyczna konfiguracja importowana z modułu).  
- Klucze flag są hierarchiczne (dot-notation), np. `auth.login`, `collections.mobileNavigation`.  
- Domyślna polityka: fail-closed (nieokreślone flagi -> false). Możliwość konfiguracji fallbacku lokalnie.
- Moduł zaprojektowany z myślą o łatwej rozszerzalności (dodawanie nowych flag/sekcji).

### Lokalizacja
- Moduł: `src/features` (główny plik: `src/features/index.ts`)
- Dokumentacja i plan: `.ai/feature-flags.md`

### Typy i API (propozycja)
- Typ środowiska:
  - `type EnvName = 'local' | 'integration' | 'prod'`
- Schemat flag (przykładowy):
  - `FeaturesSchema` z sekcjami `auth`, `collections`, itd., każda z opcjonalnymi booleanami i możliwością rozszerzeń.

Główne exporty modułu:
- `getEnvName(): EnvName` — odczyt `ENV_NAME` z `process.env` lub `import.meta.env`, domyślnie `prod`.
- `isFeatureEnabled(key: string, fallback = false): boolean` — sprawdza flagę po kluczu `dot.notation`. Zwraca boolean; jeśli flaga nie istnieje, zwraca `fallback` (domyślnie false).
- `getActiveFlags(): FeaturesSchema` — zwraca cały obiekt flag aktywny dla bieżącego środowiska.

### Konfiguracja przykład
Plik centralny trzyma mapę `FEATURES_BY_ENV: Record<EnvName, FeaturesSchema>` z wartościami dla `local`, `integration`, `prod`.  
Przykładowe flagi do dodać od razu:
- `auth.login`, `auth.signin`, `auth.resetPassword`  
- `collections.twoPane`, `collections.mobileNavigation`

### Przykłady użycia

- Astro page (`src/pages/login.astro`):

```astro
--- 
import { isFeatureEnabled } from '../features';
const showLogin = isFeatureEnabled('auth.login');
---
{ showLogin ? <LoginPage client:load /> : <div>Logowanie tymczasowo niedostępne</div> }
```

- API endpoint (Astro):

```ts
import { isFeatureEnabled } from 'src/features';
export const POST: APIRoute = async () => {
  if (!isFeatureEnabled('auth.login')) {
    return new Response(JSON.stringify({ error: 'Feature disabled' }), { status: 404 });
  }
  // ... dalsza logika ...
};
```

- React component:

```tsx
import { isFeatureEnabled } from 'src/features';
export const MobileNavigation = () => {
  if (!isFeatureEnabled('collections.mobileNavigation')) return null;
  return <nav>{/* ... */}</nav>;
};
```

### Dodawanie nowych flag
1. Zaktualizuj `FeaturesSchema` w `src/features/index.ts` (dodaj nową sekcję/klucz).  
2. Uzupełnij wartości w `FEATURES_BY_ENV` dla `local`, `integration`, `prod`.  
3. Użyj `isFeatureEnabled('section.key')` tam, gdzie chcesz warunkować zachowanie.

### Rozszerzalność (przyszłe kroki)
- Jeśli w przyszłości będziesz potrzebować rolloutów procentowych, per-user lub zdalnego zarządzania flagami, moduł powinien pozostać kompatybilny na poziomie API (np. zachować `isFeatureEnabled` jako punkt integracji) i dodać warstwę adaptującą (sync/async) źródło flag.
- Możliwość dodania adapterów: `StaticAdapter` (obecny), `RemoteAdapter` (future) z tą samą metodą rozstrzygającą.

### Uwagi wdrożeniowe
- Upewnij się, że `ENV_NAME` jest ustawione podczas build/SSR (np. `ENV_NAME=local npm run dev` lub konfiguracja CI).  
- Ponieważ jest to rozwiązanie build-time, zmiana `ENV_NAME` wymaga rebuildu aby nowa konfiguracja była użyta.

--- 
Plik wygenerowany na podstawie ustaleń projektowych — gotowy do wklejenia do repo. W razie potrzeby mogę od razu dodać implementację `src/features/index.ts` i poprawić przykładowe pliki w repo.


