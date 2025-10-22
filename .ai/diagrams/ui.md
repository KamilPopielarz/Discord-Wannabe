# Diagram UI - Architektura komponentów autentykacji

```mermaid
flowchart TD
    subgraph LayoutAstro ["Layout Astro"]
        A[Layout.astro]
        A --> B[ThemeToggle]
        A --> C[Nawigacja Auth/Non-Auth]
    end
    
    subgraph StronyAstro ["Strony Astro SSR"]
        D[login.astro]
        E[register.astro]
        F[guest.astro]
        G[servers.astro]
    end
    
    subgraph KomponentyReact ["Komponenty React Islands"]
        H[LoginPage]
        I[RegisterPage]
        J[GuestJoinPage]
        K[ServersDashboardPage]
    end
    
    subgraph FormularzeReact ["Formularze React"]
        L[LoginForm]
        M[RegisterForm]
        N[GuestJoinForm]
    end
    
    subgraph HookiStanu ["Hooki Stanu"]
        O[useLogin]
        P[useRegister]
        Q[useGuest]
    end
    
    subgraph KomponentyUI ["Komponenty UI"]
        R[ErrorBanner]
        S[LoadingSpinner]
        T[Button]
        U[Input]
        V[Card]
    end
    
    subgraph SerwisyBackend ["Serwisy Backend"]
        W[AuthService]
        X[Middleware]
        Y[API Endpoints]
    end
    
    subgraph BazaDanych ["Baza Danych"]
        Z[Supabase Auth]
        AA[Sesje Cookie]
    end
    
    A --> D
    A --> E
    A --> F
    A --> G
    
    D --> H
    E --> I
    F --> J
    G --> K
    
    H --> L
    I --> M
    J --> N
    
    L --> O
    M --> P
    N --> Q
    
    L --> R
    L --> S
    L --> T
    L --> U
    L --> V
    
    M --> R
    M --> S
    M --> T
    M --> U
    M --> V
    
    N --> R
    N --> S
    N --> T
    N --> U
    N --> V
    
    O --> Y
    P --> Y
    Q --> Y
    
    Y --> W
    Y --> X
    
    W --> Z
    X --> AA
    
    classDef astroPage fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    classDef reactComponent fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef hook fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef ui fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef backend fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    classDef database fill:#f1f8e9,stroke:#689f38,stroke-width:2px
    
    class A,D,E,F,G astroPage
    class H,I,J,K,L,M,N reactComponent
    class O,P,Q hook
    class B,R,S,T,U,V ui
    class W,X,Y backend
    class Z,AA database
```

## Opis architektury UI

### Warstwa Astro (SSR/SSG)
- **Layout.astro**: Globalny wrapper z nawigacją i ThemeToggle
- **Strony Astro**: Renderowanie po stronie serwera z React Islands

### Warstwa React (Client-side)
- **Komponenty stron**: LoginPage, RegisterPage, GuestJoinPage
- **Formularze**: Dedykowane komponenty z walidacją
- **Hooki**: Zarządzanie stanem i komunikacja z API

### Warstwa UI
- **Komponenty shadcn/ui**: Button, Input, Card, Label
- **Komponenty pomocnicze**: ErrorBanner, LoadingSpinner, ThemeToggle

### Przepływ danych
1. Strony Astro renderują React Islands
2. Komponenty React używają hooków do zarządzania stanem
3. Hooki komunikują się z API endpoints
4. Middleware obsługuje sesje i przekazuje dane do Layout
5. Layout renderuje odpowiedni UI na podstawie stanu autentykacji
