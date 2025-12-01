# Discord-Wannabe

**Discord-Wannabe** to prosta, bezpieczna aplikacja do komunikacji tekstowej dla grup znajomych. Umożliwia szybkie tworzenie prywatnych serwerów i pokoi. Zabezpieczanie pokoi hasłem. Aplikacja skupia się na minimalizmie i nowoczesnym interfejsie użytkownika, wykorzystując najnowsze technologie webowe.

## Stos Technologiczny

- **Astro 5** - Szybki SSR/SSG i architektura wyspowa ("Islands Architecture").
- **React 19** - Interaktywne komponenty interfejsu użytkownika.
- **TypeScript 5** - Pełne statyczne typowanie dla bezpieczeństwa kodu.
- **Tailwind CSS 4** - Nowoczesny silnik stylów.
- **Shadcn/ui** - Komponenty UI oparte na Radix UI i Tailwind.
- **Supabase** - Backend jako usługa: baza danych PostgreSQL, Uwierzytelnianie, Realtime.
- **Cloudflare Turnstile** - Ochrona przed botami (CAPTCHA). //jeszcze nie zaimplementowane.

## Funkcjonalności

### Uwierzytelnianie i Użytkownicy
- **Rejestracja i Logowanie:** Pełna obsługa kont użytkowników przez Supabase Auth.
- **Resetowanie hasła:** Bezpieczny proces odzyskiwania dostępu do konta (email flow).
- **Weryfikacja Email:** Potwierdzanie tożsamości użytkownika.


### Serwery i Pokoje
- **Tworzenie Serwerów:** Użytkownicy mogą zakładać własne, prywatne serwery.
- **Zarządzanie Pokojami:** Tworzenie tematycznych kanałów wewnątrz serwerów.
- **Ochrona Hasłem:** Możliwość zabezpieczenia wejścia do konkretnych pokoi hasłem (haszowanie Argon2id).


### Komunikacja
- **Czat Real-time:** Wiadomości pojawiają się natychmiastowo u wszystkich uczestników (Supabase Realtime).
- **Wskaźnik Pisania:** Wizualna informacja o tym, że ktoś właśnie tworzy wiadomość.
- **Lista Użytkowników:** Podgląd aktywnych członków pokoju.
- **Nowoczesny UI:** Ciemny motyw z efektami "glitch" i płynnymi animacjami.
- **YouTube i emoji:** Możliwość wysłania filmów, które zostaną wyświetlone w podglądzie, oraz emoji.

### Administracja i Ustawienia
- **Panel Użytkownika:** Zarządzanie profilem, możliwośc ustawienia nicku, avataru oraz zmiana hasła



## Uruchomienie Projektu

### Wymagania Wstępne

- Node.js v22.14.0 (zalecane użycie `nvm` i pliku `.nvmrc`)
- npm (dołączony do Node.js)

### Konfiguracja Środowiska

Utwórz plik `.env` w głównym katalogu projektu, kopiując szablon lub wprowadzając własne klucze:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=twoj_url_projektu_supabase
PUBLIC_SUPABASE_ANON_KEY=twoj_klucz_anonimowy
SUPABASE_SERVICE_ROLE_KEY=twoj_klucz_serwisowy

# Cloudflare Turnstile Configuration
TURNSTILE_SITE_KEY=twoj_klucz_strony_turnstile
TURNSTILE_SECRET_KEY=twoj_klucz_sekretny_turnstile
```

### Instalacja i Uruchomienie

1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/KamilPopielarz/Discord-Wannabe.git
   cd discord-wannabe
   ```

2. Zainstaluj zależności:
   ```bash
   npm ci
   ```

3. Uruchom serwer deweloperski:
   ```bash
   npm run dev
   ```

Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

### Aplikacja w środowisku produkcyjnym
1. Apklikacja hostowana jest na Cloudflare Pages.
2. Aplikacja jest dostępna pod adresem `https://discord-wannabe.pages.dev`.

## Dostępne Skrypty

| Polecenie | Opis |
| --- | --- |
| `npm run dev` | Uruchamia lokalny serwer deweloperski |
| `npm run build` | Buduje aplikację do wersji produkcyjnej |
| `npm run preview` | Uruchamia podgląd zbudowanej wersji produkcyjnej |
| `npm run lint` | Sprawdza kod pod kątem błędów (ESLint) |
| `npm run format` | Formatuje kod zgodnie ze standardami (Prettier) |
| `npm test` | Uruchamia testy jednostkowe (Vitest) |
| `npm run test:e2e` | Uruchamia testy E2E (Playwright) |

## Status Projektu

Projekt jest w fazie aktywnego rozwoju (MVP). Główne funkcjonalności tekstowe i zarządzanie serwerami są gotowe. Prace nad rozszerzeniem możliwości komunikacyjnych trwają.

## Licencja

Ten projekt jest udostępniany na licencji **MIT**. Zobacz plik [LICENSE](LICENSE) po więcej szczegółów.
