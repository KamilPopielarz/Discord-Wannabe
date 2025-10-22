# Specyfikacja modułu autentykacji

Dokument zawiera szczegółowy opis architektury interfejsu użytkownika, logiki backendowej oraz systemu autentykacji opartego na Supabase w kontekście aplikacji Astro + React.

---

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1 Strony Astro (SSR/SSG)
- `src/pages/login.astro`  
  • Strona logowania z formularzem klienta React `LoginForm.tsx`.  
  • Przekazanie CSRF token i endpointów akcji (login/logout).

- `src/pages/register.astro`  
  • Strona rejestracji z formularzem `RegisterForm.tsx`.  
  • Zawiera pole e-mail, hasło, potwierdzenie hasła oraz CAPTCHA Turnstile.

- `src/pages/reset-password.astro`  
  • Formularz inicjowania resetu (`ForgotPasswordForm.tsx`).  
  • Pole e-mail + CAPTCHA Turnstile; wywołuje `/api/auth/forgot-password`.

- `src/pages/reset-password/[token].astro`  
  • Strona ustawienia nowego hasła (`ResetPasswordForm.tsx`).  
  • Pobiera `token` z URL; formularz hasła + potwierdzenie; wywołuje `/api/auth/reset-password`.

- `src/layouts/Layout.astro`  
  • Wrapping globalny dla trybu auth i non-auth.  
  • W top bar: przycisk logowania/rejestracji lub avatar + wyloguj.

### 1.2 Komponenty React (Client-side)
- `LoginForm.tsx`  
  • Pola: e-mail, hasło; walidacja formatu na żywo; komunikaty błędów.  
  • Akcja: POST `/api/auth/login`; obsługa statusów 200, 401, 429.

- `RegisterForm.tsx`  
  • Pola: e-mail, hasło, potwierdzenie hasła; siła hasła (min. 8 znaków, wielkie litery, liczby).  
  • Komponent Turnstile CAPTCHA; walidacja tokenu.  
  • Akcja: POST `/api/auth/register`; obsługa statusów 201, 400, 409.

- `ForgotPasswordForm.tsx`  
  • Pole e-mail + CAPTCHA; walidacja formatu e-mail.  
  • Akcja: POST `/api/auth/forgot-password`; komunikat o wysłaniu linku.

- `ResetPasswordForm.tsx`  
  • Pola: nowe hasło, potwierdzenie; walidacja zgodności.  
  • Akcja: POST `/api/auth/reset-password?token={token}`; obsługa wygaśnięcia/linku użytego.

### 1.3 Walidacja i komunikaty błędów
- Klient i serwer: wykorzystanie biblioteki Zod dla walidacji schematów i mapowania błędów.  
- Serwer: JSON odpowiedź z kodem błędu i wiadomością.  
- Komunikaty: inline pod polami i banner ogólny.

### 1.4 Scenariusze użytkownika
1. Rejestracja sukces: przekierowanie do potwierdzenia e-mail; UI informuje o wysłaniu linku.
2. Próba ponownej rejestracji tym samym e-mailem: komunikat konfliktu (409).
3. Logowanie nieudane: komunikat ogólny "Nieprawidłowe dane."; po 5 nieudanych próbach 429 + cooldown.
4. Reset hasła: poprawne wysłanie maila; kliknięcie linku otwiera formularz ustawienia hasła; przy błędnym/wygaśniętym tokenie komunikat o wygaśnięciu.

---

## 2. LOGIKA BACKENDOWA

### 2.1 Modele i tabele (Supabase)
- `auth.users` (wbudowana Supabase) z polami: `id`, `email`, `confirmed_at`, `created_at`.
- Tabela `password_reset_requests` (edge function lub custom schema)  
  • `token` UUID, `user_id`, `expires_at`, `used_at`.

### 2.2 Endpointy API (Astro Server Endpoints)
- POST `/src/pages/api/auth/register.ts`  
  • Walidacja payloadu; CAPTCHA Turnstile weryfikacja; wywołanie `supabase.auth.signUp`; wysłanie e-maila z linkiem aktywacyjnym ważnym 24h (double opt-in); zablokowanie logowania przed potwierdzeniem.

- POST `/src/pages/api/auth/login.ts`  
  • `supabase.auth.signInWithPassword`; limit prób logowania do 5; zwrot 429 + cooldown po przekroczeniu limitu; ustawienie secure httpOnly cookie.

- POST `/src/pages/api/auth/logout.ts`  
  • `supabase.auth.signOut`; usunięcie cookie.

- POST `/src/pages/api/auth/forgot-password.ts`  
  • Walidacja e-mail; CAPTCHA weryfikacja; `supabase.auth.resetPasswordForEmail` lub custom token generacja; wysłanie maila z linkiem.

- POST `/src/pages/api/auth/reset-password.ts`  
  • Odczyt `token` query; walidacja hasła; `supabase.auth.updateUser({ password })`; oznaczenie tokenu jako użyte; unieważnienie wszystkich istniejących sesji i tokenów użytkownika po zmianie hasła.

### 2.3 Walidacja i obsługa wyjątków
- Input schemas Zod/ajv w każdym endpointzie.  
- Early return na błędne dane; obsługa błędów z Supabase (mapowanie na 400, 401, 429, 500).
- Logowanie incydentów (Sentry, Supabase logs).

### 2.4 Aktualizacja renderowania Astro
- Konfiguracja `@astrojs-ssr-adapter` w `astro.config.mjs` dla obsługi env zmiennych TURNSTILE_SITE_KEY.
- Wstrzyknięcie CSRF token w meta tagach i do komponentów React.

---

## 3. SYSTEM AUTENTYKACJI

### 3.1 Supabase Auth + Astro
- `src/db/supabase.client.ts`  
  • Instancja Supabase Client z `supabaseUrl` i `supabaseKey` z env.

- Middleware `src/middleware/index.ts`  
  • Parsowanie httpOnly cookie; `getUser` z Supabase; wzbogacenie request context o `user`.

- Layout: w `Layout.astro` sprawdzanie `Astro.locals.user` dla wyrenderowania UI auth vs non-auth.

### 3.2 Sesje i bezpieczeństwo
- Sesje w secure, SameSite=strict httpOnly cookie.  
- TTL gościa 24h, TTL konta zależny od sesji Supabase (domyślnie 1 dzień).
- Migracja tożsamości sesji gościa po rejestracji, zachowanie uprawnień i historii.
- Odświeżanie tokenów przez Supabase autoRefresh.

### 3.3 Wylogowanie i ochrona endpointów
- Dekorator/auth guard w Edge Functions lub middleware dla prywatnych stron.
- Redirection do `/login` w trybie non-auth.

---

*Specyfikacja przygotowana na podstawie wymagań PRD (US-003, US-21) i tech-stack.
*Kończy moduł autentykacji dla MVP aplikacji Discord-Wannabe.
