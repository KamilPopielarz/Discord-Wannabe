# Diagram Auth - Przepływ autentykacji

```mermaid
sequenceDiagram
    autonumber
    participant Browser as Przegladarka
    participant Middleware as Middleware
    participant API as Astro API
    participant Auth as Supabase Auth
    
    Note over Browser,Auth: Proces logowania
    
    Browser->>API: POST /api/auth/login
    Note right of Browser: {email, password}
    
    API->>API: Walidacja Zod Schema
    
    alt Walidacja nieudana
        API-->>Browser: 400 Blad walidacji
    else Walidacja udana
        API->>Auth: signInWithPassword
        
        alt Nieprawidlowe dane
            Auth-->>API: Blad autentykacji
            API-->>Browser: 401 Nieprawidlowe dane
        else Dane poprawne
            Auth->>API: Token JWT + User ID
            API->>API: Utworzenie sesji w bazie
            API->>Browser: Set httpOnly Cookie
            API-->>Browser: 200 Login successful
            Browser->>Browser: Przekierowanie do /servers
        end
    end
    
    Note over Browser,Auth: Weryfikacja sesji przy zadaniu
    
    Browser->>Middleware: Zadanie chronionej strony
    Middleware->>Middleware: Sprawdzenie cookie session_id
    
    alt Brak cookie
        Middleware-->>Browser: Przekierowanie do /login
    else Cookie istnieje
        Middleware->>Auth: Weryfikacja sesji w bazie
        
        alt Sesja wygasla
            Middleware->>Auth: Usuniecie sesji
            Middleware->>Browser: Usuniecie cookie
            Middleware-->>Browser: Przekierowanie do /login
        else Sesja aktywna
            Middleware->>Middleware: Ustawienie Astro.locals.user
            Middleware-->>Browser: Dostep do chronionej strony
        end
    end
    
    Note over Browser,Auth: Proces rejestracji
    
    Browser->>API: POST /api/auth/register
    Note right of Browser: {email, password, username, captchaToken}
    
    API->>API: Walidacja danych + CAPTCHA
    
    alt Uzytkownik juz istnieje
        API-->>Browser: 409 Konflikt
    else Dane poprawne
        API->>Auth: signUp nowego uzytkownika
        Auth->>API: Utworzenie konta
        API-->>Browser: 201 Rejestracja udana
        Browser->>Browser: Przekierowanie do /login
    end
    
    Note over Browser,Auth: Reset hasla
    
    Browser->>API: POST /api/auth/forgot-password
    Note right of Browser: {email, captchaToken}
    
    API->>Auth: resetPasswordForEmail
    Auth->>Auth: Wyslanie maila z tokenem
    API-->>Browser: 200 Mail wyslany
    
    Browser->>API: POST /api/auth/reset-password
    Note right of Browser: {token, newPassword}
    
    API->>Auth: updateUser password
    API->>Auth: Uniewaznienie wszystkich sesji
    API-->>Browser: 200 Haslo zmienione
    
    Note over Browser,Auth: Wylogowanie
    
    Browser->>API: POST /api/auth/logout
    API->>Auth: signOut
    API->>Browser: Usuniecie cookie
    API-->>Browser: 204 Wylogowano
```

## Opis przepływu autentykacji

### Logowanie
1. Użytkownik wysyła dane logowania do API
2. API waliduje dane używając Zod Schema
3. Supabase Auth weryfikuje poświadczenia
4. Przy sukcesie tworzona jest sesja i ustawiane httpOnly cookie
5. Użytkownik przekierowywany do dashboard serwerów

### Weryfikacja sesji
1. Middleware sprawdza cookie przy każdym żądaniu
2. Weryfikuje sesję w bazie danych
3. Przy wygaśnięciu usuwa sesję i przekierowuje do logowania
4. Przy aktywnej sesji ustawia dane użytkownika w Astro.locals

### Rejestracja
1. Walidacja danych i CAPTCHA
2. Sprawdzenie czy użytkownik już istnieje
3. Utworzenie konta przez Supabase Auth
4. Przekierowanie do strony logowania

### Reset hasła
1. Żądanie resetu z CAPTCHA
2. Wysłanie maila z tokenem przez Supabase
3. Ustawienie nowego hasła z tokenem
4. Unieważnienie wszystkich istniejących sesji

### Bezpieczeństwo
- Rate limiting dla prób logowania (5 prób)
- Secure httpOnly cookies z SameSite=strict
- CAPTCHA dla rejestracji i resetu hasła
- TTL sesji: 24h dla gości, 1 dzień dla użytkowników
