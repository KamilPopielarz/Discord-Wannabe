# Konfiguracja Supabase Auth i Cloudflare Turnstile

Ten dokument opisuje kroki niezbędne do skonfigurowania autentykacji Supabase i CAPTCHA Turnstile w aplikacji Discord-Wannabe.

## 1. Konfiguracja Supabase

### 1.1 Zmienne środowiskowe

Utwórz plik `.env` w głównym katalogu projektu i dodaj następujące zmienne:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Public Supabase Configuration (for client-side)
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 1.2 Konfiguracja Email Templates

W panelu Supabase przejdź do **Authentication > Email Templates** i skonfiguruj:

1. **Confirm signup** - szablon potwierdzenia rejestracji
2. **Reset password** - szablon resetu hasła

Przykładowy URL przekierowania:
- Confirm signup: `{{ .SiteURL }}/login?confirmed=true`
- Reset password: `{{ .SiteURL }}/reset-password?token={{ .TokenHash }}`

### 1.3 Konfiguracja URL Settings

W **Authentication > URL Configuration** ustaw:
- **Site URL**: `http://localhost:3000` (development) lub twoja domena produkcyjna
- **Redirect URLs**: Dodaj dozwolone URL-e przekierowań

## 2. Konfiguracja Cloudflare Turnstile

### 2.1 Utworzenie witryny Turnstile

1. Przejdź do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Wybierz **Turnstile** z menu bocznego
3. Kliknij **Add site**
4. Wprowadź domenę (lub `localhost` dla developmentu)
5. Wybierz **Managed** jako widget mode
6. Skopiuj **Site Key** i **Secret Key**

### 2.2 Zmienne środowiskowe Turnstile

Dodaj do pliku `.env`:

```env
# Cloudflare Turnstile CAPTCHA
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

## 3. Testowanie integracji

### 3.1 Uruchomienie aplikacji

```bash
npm run dev
```

### 3.2 Testowanie rejestracji

1. Przejdź do `/register`
2. Wypełnij formularz rejestracji
3. Rozwiąż CAPTCHA
4. Sprawdź email z linkiem potwierdzającym
5. Kliknij link i sprawdź czy konto zostało aktywowane

### 3.3 Testowanie logowania

1. Przejdź do `/login`
2. Zaloguj się aktywowanym kontem
3. Sprawdź czy przekierowanie działa poprawnie

### 3.4 Testowanie reset hasła

1. Przejdź do `/reset-password`
2. Wprowadź email i rozwiąż CAPTCHA
3. Sprawdź email z linkiem resetującym
4. Ustaw nowe hasło

## 4. Funkcje zaimplementowane

### 4.1 Autentykacja Supabase Auth

- ✅ Standardowe cookies z `@supabase/ssr`
- ✅ Middleware z `getUser()` 
- ✅ Potwierdzenie email (double opt-in)
- ✅ Reset hasła przez email
- ✅ Automatyczne zarządzanie sesjami

### 4.2 CAPTCHA Turnstile

- ✅ Komponent React `TurnstileCaptcha`
- ✅ Weryfikacja po stronie serwera
- ✅ Integracja w formularzach rejestracji i reset hasła
- ✅ Obsługa błędów i wygaśnięcia

### 4.3 Bezpieczeństwo

- ✅ Walidacja po stronie klienta i serwera (Zod)
- ✅ Secure httpOnly cookies
- ✅ CSRF protection przez SameSite cookies
- ✅ Rate limiting (do implementacji w Supabase RLS)

## 5. Następne kroki

### 5.1 Rate Limiting

Zaimplementuj rate limiting w Supabase przez:
- RLS policies na tabeli auth.users
- Edge Functions z Redis/Upstash
- Lub middleware z in-memory cache

### 5.2 Monitoring

Skonfiguruj monitoring dla:
- Błędów autentykacji
- Prób CAPTCHA
- Wydajności endpointów

### 5.3 Produkcja

Przed wdrożeniem na produkcję:
- Ustaw właściwe domeny w Supabase i Turnstile
- Skonfiguruj HTTPS
- Przetestuj wszystkie flow na środowisku produkcyjnym

## 6. Rozwiązywanie problemów

### 6.1 Błędy CAPTCHA

- Sprawdź czy `PUBLIC_TURNSTILE_SITE_KEY` jest poprawny
- Upewnij się że domena jest dodana w Turnstile dashboard
- Sprawdź console przeglądarki pod kątem błędów JavaScript

### 6.2 Błędy Email

- Sprawdź konfigurację SMTP w Supabase
- Sprawdź czy email templates są poprawnie skonfigurowane
- Sprawdź folder spam

### 6.3 Błędy sesji

- Sprawdź czy cookies są ustawiane (DevTools > Application > Cookies)
- Sprawdź czy middleware działa poprawnie
- Sprawdź logi serwera pod kątem błędów Supabase

## 7. Wsparcie

W przypadku problemów sprawdź:
- [Dokumentacja Supabase Auth](https://supabase.com/docs/guides/auth)
- [Dokumentacja Turnstile](https://developers.cloudflare.com/turnstile/)
- Logi aplikacji i błędy w konsoli przeglądarki
