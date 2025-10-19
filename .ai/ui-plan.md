# Architektura UI dla Discord-Wannabe

## 1. Przegląd struktury UI

Struktura interfejsu składa się z pięciu głównych ścieżek:
- `/login` (Logowanie)
- `/register` (Rejestracja)
- `/guest` (Tryb gościa)
- `/servers` (Dashboard serwerów)
- `/admin` (Panel admina)

Dodatkowo dynamiczne trasy:
- `/servers/[inviteLink]` – widok pokoi na serwerze
- `/rooms/[inviteLink]` – widok czatu i głosu w pokoju

Każdy widok korzysta ze wspólnych komponentów:
- Globalny układ (`Layout.astro`) zarządza nawigacją, motywem (light/dark) i guardami autoryzacji.
- `AuthContext` (oparty na Supabase Auth) kontroluje dostęp, redirect 401, toasty błędów.
- `ErrorBanner` centralnie wyświetla błędy serwera i rate-limit (429).
- `ThemeToggle` obsługuje tryb light/dark z WCAG.

## 2. Lista widoków

### 2.1 Login
- Ścieżka: `/login`
- Cel: uwierzytelnienie użytkownika
- Informacje: pola e-mail i hasło, komunikaty o błędach (401 z ograniczeniem prób)
- Komponenty: `LoginForm`, `ErrorBanner`, `ThemeToggle`
- UX/A11Y/Sec:
  - Walidacja w locie, aria-labels, focus management
  - CSRF tokeny, early-return na niepowodzenie

### 2.2 Register
- Ścieżka: `/register`
- Cel: rejestracja i wysłanie linku aktywacyjnego
- Informacje: e-mail, hasło, potwierdzenie hasła, CAPTCHA, status wysyłki linku
- Komponenty: `RegisterForm`, `Captcha`, `ErrorBanner`
- UX/A11Y/Sec:
  - Siła hasła, aria-describedby, debounce CAPTCHA
  - Komunikaty o linku aktywacyjnym, limit czasowy tokenu

### 2.3 Guest Join
- Ścieżka: `/guest`
- Cel: utworzenie 24h sesji gościa
- Informacje: pole linku zaproszenia, nadany nick („Guest1234”)
- Komponenty: `GuestJoinForm`, `ErrorBanner`
- UX/A11Y/Sec:
  - Walidacja formatu linku, aria-invalid
  - Ochrona przed CSRF, instrukcje polityki prywatności

### 2.4 Servers Dashboard
- Ścieżka: `/servers`
- Cel: lista i tworzenie serwerów
- Informacje: `serverId`, `inviteLink`, TTL, nazwa
- Komponenty: `ServerList`, `CreateServerModal`, `ServerCard`
- UX/A11Y/Sec:
  - aria-live dla statusów operacji
  - debounce tworzenia, potwierdzenie zapisu linku

### 2.5 Server Detail (Rooms)
- Ścieżka: `/servers/[inviteLink]`
- Cel: przegląd i tworzenie pokoi na serwerze
- Informacje: `roomId`, `inviteLink`, wymóg hasła, TTL pokoju
- Komponenty: `RoomList`, `CreateRoomModal`, `RoomCard`
- UX/A11Y/Sec:
  - Maskowanie inputu hasła, limit prób 3
  - aria-describedby błędów hasła

### 2.6 Room Join
- Ścieżka: `/rooms/[inviteLink]`
- Cel: dołączenie do pokoju (z hasłem jeśli wymagane)
- Informacje: czy wymaga hasła, komunikaty o błędnych próbach
- Komponenty: `JoinRoomForm`, `ErrorBanner`
- UX/A11Y/Sec:
  - reCAPTCHA przy wielu błędach, aria-invalid
  - SSRF-hardening link preview (dotyczy czatu)

### 2.7 Chat & Voice Channel
- Ścieżka: `/rooms/[inviteLink]?view=chat` lub `?view=voice`
- Cel: komunikacja tekstowa i głosowa
- Informacje:
  - Wiadomości: autor, treść, czas
  - Uczestnicy: lista z mute/unmute, wskaźniki mówienia
  - Status lock (speak-by-permission)
- Komponenty: `MessageList`, `MessageInput`, `VoiceChannel`, `ParticipantList`, `LockToggle`
- UX/A11Y/Sec:
  - aria-live dla nowych wiadomości
  - infinite scroll, rate-limit handling (429 modal)
  - uprawnienia WebRTC prompt, TLS/SRTP

### 2.8 Admin Panel
- Ścieżka: `/admin`
- Cel: przegląd i filtrowanie logów moderacji
- Informacje: `timestamp`, `user`, `action`, `target`, powód
- Komponenty: `AdminLogTable`, `LogFilter`, `PaginationControls`
- UX/A11Y/Sec:
  - role-based guard, aria-sortable columns
  - paginacja/infinite scroll dla wydajności
  - CSRF w akcjach masowych

## 3. Mapa podróży użytkownika

```sequence
Guest->GuestJoinForm: Wprowadza link zaproszenia
GuestJoinForm->GuestJoinForm: Walidacja i POST /api/guest
GuestJoinForm-->RoomJoin: Redirect do /rooms/[inviteLink]
User->LoginForm: Wprowadza dane i POST /api/auth/login
LoginForm-->Servers: Redirect do /servers
Servers->CreateServerModal: Użytkownik klika "Utwórz serwer"
CreateServerModal->Servers: POST /api/servers, reload list
Servers->ServerDetail: Kliknięcie serwera przenosi do /servers/[inviteLink]
ServerDetail->CreateRoomModal: Tworzy pokój POST /api/servers/:id/rooms
ServerDetail->RoomJoin: Kliknięcie pokoju przenosi do /rooms/[inviteLink]
RoomJoin->RoomJoin: Joina pokój POST /api/rooms/:inviteLink/join
RoomJoin-->ChatView: Redirect z view=chat
ChatView->VoiceChannel: Przełączenie widoku na voice
Admin->AdminLogTable: Przegląda logi GET /api/servers/:id/logs
``` 

## 4. Układ i struktura nawigacji

- **Navbar (górna belka):** Logo, przyciski auth (Login/Register lub Logout), `ThemeToggle`.
- **Sidebar:** 
  - Na `/servers` i `/admin`: lista serwerów lub link do panelu admina.
  - W widoku pokoju: zakładki Chat/Voice.
- **Breadcrumb:** w widokach dynamicznych służy do nawigacji wstecz.
- **Guards:** `AuthContext` blokuje dostęp i wykonuje redirecty 401.

## 5. Kluczowe komponenty

- `AuthContextProvider` – implementuje Supabase Auth, zarządza sesjami i redirectami.
- `ErrorBanner` – globalne powiadomienia o błędach API.
- `useApi` – hook z obsługą loading, error, retry.
- Formularze: `LoginForm`, `RegisterForm`, `GuestJoinForm`, `JoinRoomForm`, `CreateServerModal`, `CreateRoomModal`.
- Komunikacja: `MessageList` (React Query + Supabase), `MessageInput`, `VoiceChannel` (LiveKit), `ParticipantList`, `LockToggle`.
- Admin: `AdminLogTable`, `LogFilter`, `PaginationControls`.
- `ThemeToggle` – obsługa light/dark z WCAG.
