# Kompleksowy Plan Wdrożenia REST API dla Aplikacji

## 1. Przegląd i Zakres
Celem planu jest zdefiniowanie spójnego podejścia do wdrożenia wszystkich punktów końcowych REST API zgodnie z dostarczoną specyfikacją. API dzieli się na następujące obszary:

- Autoryzacja i zarządzanie użytkownikami
- Sesje gości
- Serwery
- Pokoje
- Role i członkostwo
- Wiadomości i czat
- Linki zaproszeń
- Panel administratora (logi audytu)
- Tokeny głosowe
- Eksport danych i usuwanie użytkownika

Architektura oparta na Astro 5, TypeScript, React, Tailwind i Shadcn/ui. Warstwy:
- Router (Astro pages/api)
- Kontrolery (handlers)
- DTO/Command i walidacja
- Serwisy (logika biznesowa)
- Repozytoria (interakcja z Supabase/PostgreSQL)
- Middleware (auth, rate limits, error handler)

## 2. Szczegóły żądań
### 2.1 Autoryzacja & Użytkownicy
| Endpoint                              | Metoda | Body (JSON)                             | Wymagane        | Opcjonalne | 
|---------------------------------------|--------|-----------------------------------------|-----------------|------------|
| POST `/api/auth/register`             | POST   | `{ email, password }`                   | email, password | —          |
| POST `/api/auth/confirm`              | POST   | `{ token }`                             | token           | —          |
| POST `/api/auth/login`                | POST   | `{ email, password }`                   | email, password | —          |
| POST `/api/auth/logout`               | POST   | *brak*                                  | —               | —          |
| POST `/api/auth/password-reset/request` | POST | `{ email, captchaToken }`               | email, captchaToken | —       |
| POST `/api/auth/password-reset/confirm` | POST | `{ token, newPassword }`                | token, newPassword | —        |

### 2.2 Sesja gościa
- POST `/api/guest` – Body `{ serverInviteLink }` – zwraca `sessionId`, `guestNick`

### 2.3 Serwery
- GET `/api/servers/:inviteLink` – brak body
- POST `/api/servers` – brak body
- DELETE `/api/servers/:serverId` – brak body

### 2.4 Pokoje
- POST `/api/servers/:serverId/rooms` – `{ name, password? }`
- GET `/api/rooms/:inviteLink` – brak body
- POST `/api/rooms/:roomId/join` – `{ password? }`
- DELETE `/api/rooms/:roomId` – brak body
- PATCH `/api/rooms/:roomId/password` – `{ password }`

### 2.5 Role & Członkostwo
- PATCH `/api/servers/:serverId/members/:userId/role` – `{ role }`
- PATCH `/api/rooms/:roomId/members/:userId/role` – `{ role }`

### 2.6 Wiadomości & Czat
- GET `/api/rooms/:roomId/messages` – query `page`, `limit`, `since`
- POST `/api/rooms/:roomId/messages` – `{ content }`
- DELETE `/api/rooms/:roomId/messages/:messageId` – brak body

### 2.7 Linki zaproszeń
- GET `/api/invites/:link` – brak body
- POST `/api/invites/:link/revoke` – `{ expiresAt?, maxUses?, revoked }`

### 2.8 Panel Admina
- GET `/api/servers/:serverId/logs` – query `page`, `limit`

### 2.9 Token głosowy
- POST `/api/rooms/:roomId/voice-token` – `{ permissions: string[] }`

### 2.10 Eksport i usunięcie użytkownika
- GET `/api/users/:userId/export` – brak body
- DELETE `/api/users/:userId` – brak body

## 3. Wykorzystywane Typy (DTO & Command)
Lista wszystkich modeli z `src/types.ts`:
- RegisterUserCommand, RegisterUserResponseDto
- ConfirmEmailCommand
- LoginCommand, LogoutCommand
- PasswordResetRequestCommand, PasswordResetConfirmCommand
- CreateGuestSessionCommand, GuestSessionResponseDto
- CreateServerCommand, CreateServerResponseDto, GetServerResponseDto, DeleteServerCommand
- CreateRoomCommand, CreateRoomResponseDto, GetRoomResponseDto, JoinRoomCommand, DeleteRoomCommand, UpdateRoomPasswordCommand
- UpdateServerMemberRoleCommand, UpdateRoomMemberRoleCommand
- MessageDto, ListMessagesResponseDto, SendMessageCommand, SendMessageResponseDto, DeleteMessageCommand
- GetInvitationResponseDto, RevokeInvitationCommand
- AuditLogDto, ListAuditLogsResponseDto
- GenerateVoiceTokenCommand, GenerateVoiceTokenResponseDto
- DataExportResponseDto, DeleteUserCommand

## 4. Przepływ Danych i Warstwa Serwisowa
1. Router (Astro API) odbiera żądanie.
2. Middleware: uwierzytelnienie (HTTP-only cookie / JWT), rate limiting.
3. Walidacja body/query (Zod lub class-validator w serwisach DTO).
4. Kontroler wywołuje odpowiedni serwis:
   - `AuthService`, `ServerService`, `RoomService`, `MessageService`, `InviteService`, `AdminService`, `VoiceService`, `UserService`.
5. Serwis wykonuje logikę biznesową:
   - generowanie tokenów, hash hasła (bcrypt), sprawdzanie uprawnień, wywołania do Supabase klienta z `src/db/supabase.client.ts` lub `queryBuilder`.
6. Repozytorium (bezpośrednie zapytania SQL lub Supabase API) zapisuje/odczytuje dane.
7. Rezultat mapowany na DTO i zwracany do kontrolera.
8. Kontroler zwraca odpowiedź HTTP z prawidłowym kodem statusu.

## 5. Względy Bezpieczeństwa
- Hashowanie haseł (bcrypt + salt).
- HttpOnly, Secure cookie dla sesji.
- Weryfikacja tokenów (email/hasła) z TTL i flagą `used`.
- RLS (Row Level Security) i polityki w Supabase dla `rooms`, `messages`, `audit_logs`.
- Ograniczanie dostępu rolami (Owner/Admin/Moderator).
- Ochrona przed brute-force: limity prób (captcha dla resetu, `room_password_attempts`).
- Sanitacja treści wiadomości (XSS).
- Walidacja inputów (Zod/schema-first).

## 6. Obsługa Błędów
- Dedykowany middleware globalny (catch-all).
- Mapowanie błędów:
  - ValidationError → 400
  - AuthenticationError → 401
  - AuthorizationError, RoleError → 401/403
  - NotFoundError → 404
  - ConflictError (email exists) → 409
  - RateLimitError → 429
  - TokenExpiredError → 400
  - Silne błędy serwera → 500
- Logi błędów do konsoli + opcjonalnie do `audit_logs` dla operacji administracyjnych.

## 7. Rozważania Wydajnościowe
- Paginacja i `since` dla wiadomości.
- Indeksy na kolumnach: `invite_link`, `room_id`, `created_at`.
- Partitioning tabel (już zaimplementowane).
- Connection pooling i caching (Redis) dla frequently read data (serwer meta, pokoje).
- Batch inserts / bulk deletes gdzie możliwe.

## 8. Kroki Implementacji
1. Utworzyć plik routingu dla każdej grupy w `src/pages/api/...`.
2. Zdefiniować DTO/Command i schematy walidacji (Zod) w `src/types.ts` i `src/lib/validators`.
3. Stworzyć strukturę services: `src/lib/services/*.ts` z metodami CRUD i logiką.
4. Skonfigurować Supabase klient (`src/db/supabase.client.ts`).
5. Implementować kontrolery (handlers) odwołujące się do serwisów.
6. Dodać middleware: auth, rate-limit, error-handler w `src/middleware/index.ts`.
7. Dodać dokumentację (OpenAPI swagger) i przykłady.
8. Przegląd i code-review.


---
*Dokument zapisano w `.ai/view-implementation-plan.md`*
