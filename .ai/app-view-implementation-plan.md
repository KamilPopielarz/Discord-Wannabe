# Plan implementacji widoków aplikacji Discord-Wannabe

## 1. Przegląd
Celem jest implementacja pełnego zestawu widoków aplikacji (Login, Register, Guest Join, Servers Dashboard, Server Detail/Rooms, Room Join, Chat & Voice, Admin Panel) z zachowaniem wymagań z PRD, historyjek użytkownika, typów oraz integracji z istniejącymi endpointami API. Stosujemy Astro 5 (SSR/wyspy), React 19 dla komponentów dynamicznych, TypeScript 5, Tailwind 4, shadcn/ui.

## 2. Routing widoków
- `/login` – logowanie
- `/register` – rejestracja
- `/guest` – sesja gościa
- `/servers` – dashboard serwerów
- `/servers/[inviteLink]` – szczegóły serwera (lista pokoi)
- `/rooms/[inviteLink]` – dołączenie do pokoju (hasło jeśli wymagane)
- `/rooms/[inviteLink]?view=chat|voice` – czat i kanał głosowy
- `/admin` – panel admina

## 3. Struktura komponentów (wysoki poziom)
```
Layout (Astro)
└─ Header (ThemeToggle, UserMenu)
   └─ Route Outlet (Astro)
      ├─ LoginPage (React Island)
      │  └─ LoginForm, ErrorBanner, ThemeToggle
      ├─ RegisterPage (React Island)
      │  └─ RegisterForm, Captcha, ErrorBanner
      ├─ GuestJoinPage (React Island)
      │  └─ GuestJoinForm, ErrorBanner
      ├─ ServersDashboardPage (React Island)
      │  └─ ServerList, CreateServerModal, ServerCard
      ├─ ServerDetailPage (React Island)
      │  └─ RoomList, CreateRoomModal, RoomCard
      ├─ RoomJoinPage (React Island)
      │  └─ JoinRoomForm, ErrorBanner
      ├─ ChatVoicePage (React Island)
      │  ├─ MessageList, MessageInput
      │  ├─ VoiceChannel, ParticipantList, LockToggle
      │  └─ RateLimitModal
      └─ AdminPanelPage (React Island)
         ├─ LogFilter
         ├─ AdminLogTable
         └─ PaginationControls
```

## 4. Szczegóły komponentów (per widok)

### 4.1 Login
- Cel: uwierzytelnienie użytkownika.
- Komponenty: `LoginForm`, `ErrorBanner`, `ThemeToggle`.
- Zdarzenia: submit (POST `/api/auth/login`), błędy 401/429, focus management.
- Walidacja: e-mail format, hasło niepuste; disable przycisku przy braku poprawności; aria-*.
- Typy: `LoginCommand`, `LogoutCommand` (z `types.ts`).
- Propsy `LoginForm`: `{ onSubmit: (payload: LoginCommand) => void; loading: boolean; error?: string }`.
- Integracja: logowanie oparte o Supabase Auth (`supabase.auth.signInWithPassword`) z backendu; endpoint ustawia httpOnly cookie `session_id` (nasza sesja), powiązaną z kontem w tabeli `auth_sessions`. Autoryzacja w API odbywa się przez middleware z `locals.supabase` + weryfikację sesji.

### 4.2 Register
- Cel: rejestracja, wysłanie linku aktywacyjnego.
- Komponenty: `RegisterForm`, `Captcha`, `ErrorBanner`.
- Zdarzenia: submit (POST `/api/auth/register`), komunikat o wysyłce, obsługa 400/409.
- Walidacja: e-mail format, siła hasła (min długość, klasy znaków), potwierdzenie hasła, debounce CAPTCHA.
- Typy: `RegisterUserCommand`, `RegisterUserResponseDto`.
- Propsy `RegisterForm`: `{ onSubmit: (payload: RegisterUserCommand & { confirmPassword: string; captchaToken: string }) => void; loading: boolean; error?: string }`.
- Integracja: rejestracja przez Supabase Auth Admin API (`auth.admin.createUser`) z własnym mechanizmem tokenu potwierdzającego w tabeli `email_confirmations` (24h). Po potwierdzeniu (`/api/auth/confirm`) aktualizacja `email_confirm` w Supabase.

### 4.3 Guest Join
- Cel: utworzenie 24h sesji gościa i przypisanie nicku.
- Komponenty: `GuestJoinForm`, `ErrorBanner`.
- Zdarzenia: submit (POST `/api/guest`), komunikat z `guestNick`, redirect do pokoju/serwera.
- Walidacja: format linku zaproszeniowego; aria-invalid, aria-describedby.
- Typy: `CreateGuestSessionCommand`, `GuestSessionResponseDto`.
- Propsy `GuestJoinForm`: `{ onSubmit: (inviteLink: string) => void; loading: boolean; error?: string }`.

### 4.4 Servers Dashboard
- Cel: lista i tworzenie serwerów.
- Komponenty: `ServerList`, `CreateServerModal`, `ServerCard`.
- Zdarzenia: GET serwery (o ile dostępny endpoint listy, alternatywnie SSR/edge query), POST `/api/servers`, potwierdzenie skasowania.
- Walidacja: nazwa opcjonalna; aria-live dla statusów; debounce tworzenia; kopia linku zaproszeniowego.
- Typy: `CreateServerCommand`, `CreateServerResponseDto`, `GetServerResponseDto` (dla metadanych pojedynczego serwera przez `/api/servers/:inviteLink`).
- Propsy: `ServerList({ servers })`, `CreateServerModal({ onCreate })`, `ServerCard({ server })`.

### 4.5 Server Detail (Rooms)
- Cel: przegląd i tworzenie pokoi.
- Komponenty: `RoomList`, `CreateRoomModal`, `RoomCard`.
- Zdarzenia: POST `/api/servers/:serverId/rooms`, GET `/api/servers/:inviteLink` (resolve), DELETE/patch wg uprawnień.
- Walidacja: nazwa pokoju niepusta; hasło opcjonalne z maskowaniem; limit prób 3 (komunikaty UI po 401/429 z backendu).
- Typy: `CreateRoomCommand`, `CreateRoomResponseDto`, `GetRoomResponseDto`.
- Propsy: `RoomList({ rooms })`, `CreateRoomModal({ onCreate })`, `RoomCard({ room })`.

### 4.6 Room Join
- Cel: dołączenie do pokoju (z hasłem jeśli wymagane).
- Komponenty: `JoinRoomForm`, `ErrorBanner`.
- Zdarzenia: GET `/api/rooms/:inviteLink` (requiresPassword), POST `/api/rooms/:roomId/join`.
- Walidacja: hasło wymagane, jeśli `requiresPassword === true`; aria-invalid; reCAPTCHA po wielu błędach (UI gate po 2-3 błędach).
- Typy: `GetRoomResponseDto`, `JoinRoomCommand`.
- Propsy: `{ requiresPassword: boolean; onSubmit: (payload: JoinRoomCommand) => void; loading: boolean; error?: string }`.

### 4.7 Chat & Voice Channel
- Cel: czat tekstowy i rozmowy głosowe.
- Komponenty: `MessageList`, `MessageInput`, `VoiceChannel`, `ParticipantList`, `LockToggle`, `RateLimitModal`.
- Zdarzenia: 
  - Czat: GET `/api/rooms/:roomId/messages`, POST `/api/rooms/:roomId/messages`, DELETE `/api/rooms/:roomId/messages/:messageId`.
  - Voice: POST `/api/rooms/:roomId/voice-token` → init LiveKit klienta, zarządzanie publish/subscribe, lock.
- Walidacja: limit długości wiadomości, obsługa emoji/GIF (bezpieczny rating), aria-live dla nowych wiadomości, infinite scroll, rate-limit handling (429 → modal/backoff).
- Typy: `MessageDto`, `ListMessagesResponseDto`, `SendMessageCommand`, `SendMessageResponseDto`, `GenerateVoiceTokenCommand`, `GenerateVoiceTokenResponseDto`.
- Propsy: `MessageList({ messages, onLoadMore })`, `MessageInput({ onSend, disabled })`, `VoiceChannel({ token, permissions })`.

### 4.8 Admin Panel
- Cel: przegląd i filtrowanie logów moderacji.
- Komponenty: `AdminLogTable`, `LogFilter`, `PaginationControls`.
- Zdarzenia: GET `/api/servers/:serverId/logs` z paginacją; sortowanie po kolumnach (aria-sort).
- Walidacja: guard ról (Admin+), CSRF dla akcji masowych (jeśli zostaną dodane).
- Typy: `AuditLogDto`, `ListAuditLogsResponseDto`.
- Propsy: `AdminLogTable({ logs })`, `LogFilter({ onChange })`, `PaginationControls({ page, onPageChange })`.

## 5. Typy (DTO i ViewModel)
- DTO z `src/types.ts` używane bez zmian.
- Nowe ViewModel-e (przykłady):
  - `AuthViewModel`: `{ email: string; password: string; loading: boolean; error?: string }`
  - `GuestJoinViewModel`: `{ inviteLink: string; loading: boolean; error?: string; guestNick?: string }`
  - `ServersViewModel`: `{ servers: Array<{ serverId: string; inviteLink: string; name?: string; ttlExpiresAt: string }>; loading: boolean; error?: string }`
  - `RoomsViewModel`: `{ rooms: Array<{ roomId: string; inviteLink: string; requiresPassword: boolean }>; loading: boolean; error?: string }`
  - `ChatViewModel`: `{ messages: MessageDto[]; nextPage?: string; sending: boolean; error?: string }`
  - `VoiceViewModel`: `{ connected: boolean; token?: string; permissions?: string[]; error?: string }`
  - `AdminLogsViewModel`: `{ logs: AuditLogDto[]; nextPage?: string; loading: boolean; error?: string }`

## 6. Zarządzanie stanem i hooki
- Per-widokowe custom hooki enkapsulujące logikę API i walidację:
  - `useLogin`, `useRegister`, `useGuestJoin`, `useServers`, `useServerRooms`, `useRoomJoin`, `useChat`, `useVoice`, `useAdminLogs`.
- Zasady:
  - early returns i obsługa błędów na początku funkcji.
  - debounce tam, gdzie potrzebne (Captcha, tworzenie serwera/pokoju).
  - aria-live dla statusów operacji.
  - brak przechowywania w JS sesji/cookie (httpOnly zarządzane przez backend).

## 7. Integracja API
- Autentykacja: `/api/auth/*` (login/logout/register/confirm/password-reset/*) – endpointy delegują do Supabase Auth przez `locals.supabase` (bezpośrednie wywołania `supabase.auth.*` w serwisie) i ustawiają httpOnly cookie `session_id` dla spójności z sesją gościa.
- Gość: `/api/guest`.
- Serwery: `GET /api/servers/:inviteLink`, `POST /api/servers`, `DELETE /api/servers/:serverId`.
- Pokoje: `POST /api/servers/:serverId/rooms`, `GET /api/rooms/:inviteLink`, `POST /api/rooms/:roomId/join`, `DELETE /api/rooms/:roomId`, `PATCH /api/rooms/:roomId/password`.
- Wiadomości: `GET/POST/DELETE /api/rooms/:roomId/messages`.
- Zaproszenia: `GET/POST /api/invites/:link` (resolve, revoke/update).
- Admin: `GET /api/servers/:serverId/logs`.
- Voice: `POST /api/rooms/:roomId/voice-token`.
- Każdy hook mapuje statusy 400/401/404/409/429 → ujednolicone komunikaty.

## 8. Interakcje użytkownika (kluczowe)
- Formularze (login/register/guest/join room/create server/create room): walidacja inline, disabled submit, focus management po błędach.
- Listy (serwery/pokoje/wiadomości/logi): lazy load, infinite scroll/paginacja.
- Czat: wysyłanie, kasowanie własnych wiadomości, Moderator+ kasuje dowolne.
- Voice: dołącz/opuść, mute/unmute, lock toggle (Owner/Admin), wskaźniki mówienia.

## 9. Warunki i walidacja (frontend)
- E-mail/hasło (format/siła), potwierdzenie hasła.
- Link zaproszenia: format (regex), niepusty.
- Hasło pokoju: wymagane, gdy `requiresPassword`.
- Rate-limit: 429 → modal/backoff i blokada akcji na czas.
- A11Y: aria-invalid, aria-describedby, aria-live, aria-sort.

## 10. Obsługa błędów
- Mapowanie statusów HTTP do komunikatów użytkownika.
- Network error → komunikat i retry/backoff.
- Focus na pierwszym błędnym polu po walidacji.
- Globalny `ErrorBanner` + per-field komunikaty.

## 11. Kroki implementacji (end-to-end)
1. Routing Astro: utworzyć pliki stron dla wszystkich ścieżek i wpiąć wspólny `Layout.astro`.
2. Komponenty UI (shadcn/ui + Tailwind): utworzyć bazowe komponenty (`ErrorBanner`, `ThemeToggle`, `Button`, `Input`).
3. Auth: zaimplementować `LoginForm`, `RegisterForm` z hookami `useLogin`, `useRegister` i integracją z Supabase Auth przez nasze endpointy (`/api/auth/*`), korzystając z `locals.supabase`; potwierdzanie e‑mail przez `/api/auth/confirm`.
4. Guest: `GuestJoinForm` + `useGuestJoin` → `/api/guest`.
5. Servers: `ServerList`, `ServerCard`, `CreateServerModal` + `useServers` z POST/GET.
6. Server Detail: `RoomList`, `RoomCard`, `CreateRoomModal` + `useServerRooms`.
7. Room Join: `JoinRoomForm` + `useRoomJoin` (GET requiresPassword, POST join).
8. Chat: `MessageList`, `MessageInput` + `useChat` (paginacja, wysyłka, kasowanie, 429 handling).
9. Voice: `VoiceChannel`, `ParticipantList`, `LockToggle` + `useVoice` (token, LiveKit init, permissions, UI lock).
10. Admin: `AdminLogTable`, `LogFilter`, `PaginationControls` + `useAdminLogs`.
11. A11Y i i18n/PL: aria-* atrybuty, aria-live, aria-sort; komunikaty błędów.
12. Testy: unit (hooki/komponenty), e2e (scenariusze login→chat/voice, role/lock, rate-limit), kontraktowe dla API typów.
13. Twardnienie bezpieczeństwa UI: CSRF integracja (nagłówki), brak wyświetlania danych wrażliwych, SSRF-hardening link preview po stronie serwera (UI komunikaty fallback).
14. Optymalizacje: code-splitting per widok, memoizacja list, wirtualizacja wiadomości.

## 12. Supabase Auth — logowanie i autoryzacja
- Klient Supabase: inicjalizowany w `middleware`, przekazywany przez `context.locals.supabase` do wszystkich endpointów (zgodnie z zasadami).
- Logowanie: `supabase.auth.signInWithPassword` (z backendu) → po sukcesie utworzenie pozycji w `auth_sessions` i ustawienie httpOnly cookie `session_id` (spójne z sesją gościa).
- Rejestracja: `supabase.auth.admin.createUser` (email niepotwierdzony), generacja tokenu w `email_confirmations` (24h), endpoint `/api/auth/confirm` potwierdza e‑mail (`auth.admin.updateUserById`).
- Wylogowanie: usunięcie rekordu `auth_sessions` odpowiadającego `session_id` (cookie czyszczone po stronie klienta przez endpoint).
- Autoryzacja API: middleware dla `/api/*` weryfikuje `session_id` lub `guest_session_id` i dołącza `locals.userId`/`locals.sessionId`. Endpointy egzekwują role/uprawnienia przez RLS i sprawdzenia w bazie (np. członkostwo w serwerze/pokoju).
- Frontend: nie zarządza tokenami; działa na httpOnly cookie i odpowiedziach endpointów; dostęp do roli/uprawnień przez dedykowane endpointy/metadane.
