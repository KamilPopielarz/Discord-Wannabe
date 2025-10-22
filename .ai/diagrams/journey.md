# Diagram Journey - Podróż użytkownika

```mermaid
stateDiagram-v2
    [*] --> StronaGlowna
    
    state "Strona Glowna" as StronaGlowna {
        [*] --> WyborOpcji
        WyborOpcji --> DecyzjaUzytkownika
    }
    
    state DecyzjaUzytkownika <<choice>>
    DecyzjaUzytkownika --> FormularzLogowania: Ma konto
    DecyzjaUzytkownika --> FormularzRejestracji: Nowe konto
    DecyzjaUzytkownika --> SesjaGoscia: Dolacz jako gosc
    
    state "Proces Logowania" as ProcesLogowania {
        [*] --> FormularzLogowania
        FormularzLogowania --> WalidacjaLogowania
        WalidacjaLogowania --> WeryfikacjaLogowania
        
        state WeryfikacjaLogowania <<choice>>
        WeryfikacjaLogowania --> DashboardSerwerow: Dane poprawne
        WeryfikacjaLogowania --> BladLogowania: Dane niepoprawne
        WeryfikacjaLogowania --> RateLimitLogowania: Za duzo prob
        
        BladLogowania --> FormularzLogowania
        RateLimitLogowania --> FormularzLogowania: Po cooldown
        FormularzLogowania --> ResetHasla: Zapomnialem hasla
    }
    
    state "Proces Rejestracji" as ProcesRejestracji {
        [*] --> FormularzRejestracji
        FormularzRejestracji --> WalidacjaRejestracji
        WalidacjaRejestracji --> WeryfikacjaCAPTCHA
        WeryfikacjaCAPTCHA --> TworzenieKonta
        
        state TworzenieKonta <<choice>>
        TworzenieKonta --> KontoUtworzono: Sukces
        TworzenieKonta --> BladRejestracji: Uzytkownik istnieje
        
        BladRejestracji --> FormularzRejestracji
        KontoUtworzono --> FormularzLogowania: Przekierowanie
    }
    
    state "Sesja Goscia" as SesjaGoscia {
        [*] --> FormularzGoscia
        FormularzGoscia --> WalidacjaLinku
        
        state WalidacjaLinku <<choice>>
        WalidacjaLinku --> PokojeGlosowe: Link poprawny
        WalidacjaLinku --> BladLinku: Link niepoprawny
        
        BladLinku --> FormularzGoscia
        PokojeGlosowe --> MozliwoscRejestracji: W ciagu 24h
    }
    
    state "Reset Hasla" as ResetHasla {
        [*] --> FormularzResetu
        FormularzResetu --> WeryfikacjaEmail
        WeryfikacjaEmail --> WyslanieMaila
        WyslanieMaila --> OczekiwanieNaToken
        OczekiwanieNaToken --> FormularzNowegoHasla: Klikniecie linku
        FormularzNowegoHasla --> WalidacjaTokenu
        
        state WalidacjaTokenu <<choice>>
        WalidacjaTokenu --> HasloZmienione: Token wazny
        WalidacjaTokenu --> TokenWygasl: Token wygasl
        
        TokenWygasl --> FormularzResetu
        HasloZmienione --> FormularzLogowania
    }
    
    state "Dashboard Serwerow" as DashboardSerwerow {
        [*] --> ListaSerwerow
        ListaSerwerow --> TworzenieNowegSerwera
        ListaSerwerow --> DolaczanieDoSerwera
        ListaSerwerow --> ZarzadzanieSerwerami
        
        TworzenieNowegSerwera --> PokojeGlosowe
        DolaczanieDoSerwera --> PokojeGlosowe
        ZarzadzanieSerwerami --> PokojeGlosowe
    }
    
    state "Pokoje Glosowe i Czat" as PokojeGlosowe {
        [*] --> WyborPokoju
        WyborPokoju --> CzatTekstowy
        WyborPokoju --> KanalGlosowy
        
        state fork_komunikacja <<fork>>
        state join_komunikacja <<join>>
        
        CzatTekstowy --> fork_komunikacja
        KanalGlosowy --> fork_komunikacja
        
        fork_komunikacja --> WysylanieWiadomosci
        fork_komunikacja --> RozmowaGlosowa
        
        WysylanieWiadomosci --> join_komunikacja
        RozmowaGlosowa --> join_komunikacja
        
        join_komunikacja --> AktywnoscWPokoju
    }
    
    state "Mozliwosc Rejestracji" as MozliwoscRejestracji {
        [*] --> DecyzjaRejestracji
        
        state DecyzjaRejestracji <<choice>>
        DecyzjaRejestracji --> ProcesRejestracji: Chce sie zarejestrowac
        DecyzjaRejestracji --> KontynuacjaGoscia: Zostaje gosciem
        
        KontynuacjaGoscia --> PokojeGlosowe
    }
    
    DashboardSerwerow --> Wylogowanie: Przycisk wyloguj
    PokojeGlosowe --> Wylogowanie: Przycisk wyloguj
    Wylogowanie --> StronaGlowna
    
    PokojeGlosowe --> [*]: Opuszczenie aplikacji
    DashboardSerwerow --> [*]: Opuszczenie aplikacji
    
    note right of FormularzLogowania
        Walidacja email i hasla
        Rate limiting: 5 prob
        Link do resetu hasla
    end note
    
    note right of FormularzRejestracji
        Walidacja sily hasla
        CAPTCHA wymagana
        Potwierdzenie hasla
    end note
    
    note right of SesjaGoscia
        TTL 24 godziny
        Nick Guest + liczba
        Tylko sluchanie glosu
    end note
    
    note right of PokojeGlosowe
        Czat z emoji i GIF
        Voice z LiveKit
        Moderacja i role
    end note
```

## Opis podróży użytkownika

### Główne ścieżki

#### 1. Nowy użytkownik
- **Cel**: Utworzenie konta i dostęp do pełnej funkcjonalności
- **Ścieżka**: Strona główna → Rejestracja → Walidacja → Logowanie → Dashboard
- **Kluczowe punkty**: CAPTCHA, walidacja hasła, przekierowanie po sukcesie

#### 2. Powracający użytkownik  
- **Cel**: Szybki dostęp do serwerów i pokoi
- **Ścieżka**: Strona główna → Logowanie → Dashboard → Pokoje
- **Kluczowe punkty**: Rate limiting, opcja resetu hasła

#### 3. Użytkownik-gość
- **Cel**: Szybkie dołączenie bez rejestracji
- **Ścieżka**: Link zaproszenia → Formularz gościa → Pokoje głosowe
- **Kluczowe punkty**: TTL 24h, ograniczone uprawnienia, możliwość rejestracji

#### 4. Reset hasła
- **Cel**: Odzyskanie dostępu do konta
- **Ścieżka**: Logowanie → Reset → Email → Token → Nowe hasło → Logowanie
- **Kluczowe punkty**: CAPTCHA, token 24h, unieważnienie sesji

### Punkty decyzyjne

- **Typ użytkownika**: Nowy/Powracający/Gość
- **Walidacja danych**: Poprawne/Niepoprawne
- **Stan sesji**: Aktywna/Wygasła/Brak
- **Uprawnienia**: Pełne/Ograniczone (gość)

### Stany końcowe

- **Dashboard serwerów**: Pełny dostęp do funkcjonalności
- **Pokoje głosowe**: Aktywna komunikacja
- **Wylogowanie**: Powrót do strony głównej
- **Opuszczenie**: Zakończenie sesji

### Bezpieczeństwo i UX

- **Rate limiting**: Ochrona przed atakami brute force
- **CAPTCHA**: Ochrona przed botami
- **TTL sesji**: Automatyczne wylogowanie
- **Walidacja**: Sprawdzanie danych w czasie rzeczywistym
- **Komunikaty błędów**: Jasne informacje dla użytkownika
