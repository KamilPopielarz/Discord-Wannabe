# Plan implementacji widoku Guest Join

## 1. Przegląd
Widok `/guest` umożliwia gościowi szybkie dołączenie do serwera za pomocą unikalnego linku, tworząc 24-godzinną sesję guest (secure httpOnly cookie) oraz nadawając automatycznie wygenerowany nick.

## 2. Routing widoku
Ścieżka: `/guest`  
Implementacja jako strona Astro z React Island (`GuestJoinPage.astro`).

## 3. Struktura komponentów
```
GuestJoinPage  
├─ ThemeToggle  
├─ ErrorBanner (pokazywany, gdy error)  
└─ GuestJoinForm  
```

## 4. Szczegóły komponentów

### GuestJoinPage
- Opis: wrapper strony, ładuje ThemeToggle i GuestJoinForm.
- Zawiera stan ViewModel kontrolowany przez hook `useGuestJoin`.
- Przekazuje `loading`, `error`, `guestNick`, `onSubmit` do GuestJoinForm i ErrorBanner.

### GuestJoinForm
- Opis: formularz z polem `inviteLink` i przyciskiem submit.
- Główne elementy:
  - `<label htmlFor="inviteLink">Link zaproszenia</label>`
  - `<input id="inviteLink" aria-invalid error? aria-describedby="inviteLink-error" />`
  - `<button type="submit" disabled={loading || !isValid}>Dołącz</button>`
- Obsługiwane interakcje:
  - onChange → aktualizacja `inviteLink` i inline-walidacja.
  - onSubmit → wywołuje `join(link)`.
- Walidacja:
  - niepusty.
  - regex `^[A-Za-z0-9_-]{8,}$` (długość ≥8, alfanumeryczne + `-_`).
  - disable przycisku gdy niepoprawne.
- Typy:
  - Props: `{ loading: boolean; error?: string; onSubmit: (link: string) => void }`

### ErrorBanner
- Opis: pokazuje komunikat błędu na czerwonym tle.
- Props: `{ message: string }`
- Element: `<div role="alert">{message}</div>`

### ThemeToggle
- Opis: globalny komponent z przełącznikiem motywu (dark/light).
- Brak props.

## 5. Typy
- `CreateGuestSessionCommand { serverInviteLink: string }` (z `types.ts`)
- `GuestSessionResponseDto { sessionId: string; guestNick: string }` (z `types.ts`)
- `GuestJoinViewModel`:
  ```ts
  interface GuestJoinViewModel {
    inviteLink: string;
    loading: boolean;
    error?: string;
    guestNick?: string;
  }
  ```

## 6. Zarządzanie stanem
- Custom hook `useGuestJoin()`:
  - State: `{ inviteLink, loading, error, guestNick }`
  - Funkcja `join(link: string)`:  
    • walidacja klient-side,  
    • fetch POST `/api/guest`,  
    • set guestNick lub error,  
    • przy sukcesie redirect do `/rooms/[inviteLink]?view=chat`.
- Hook zwraca props dla komponentów.

## 7. Integracja API
- Endpoint: POST `/api/guest`
- Request: `CreateGuestSessionCommand`
- Response: `GuestSessionResponseDto`
- Implementacja fetch:
  ```ts
  const res = await fetch('/api/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serverInviteLink: link })
  });
  if (!res.ok) throw mapError(res.status);
  const { guestNick } = await res.json();
  ```
- Po sukcesie: serwer ustawia cookie, client odczytuje `guestNick`.

## 8. Interakcje użytkownika
1. Użytkownik wpisuje link zaproszenia.
2. Inline walidacja formatu (po każdej zmianie).
3. Klik Submit lub Enter → przycisk zmienia się w spinner.
4. Błąd → ErrorBanner, focus na polu.
5. Sukces → komunikat powitalny, redirect do czatu pokoju.

## 9. Warunki i walidacja
- Klient: niepusty, regex minimalny format.
- Serwer: pełna weryfikacja linku, rate-limit.
- UI: disable przycisku, aria-invalid.

## 10. Obsługa błędów
- 400 → „Nieprawidłowy link zaproszenia.”
- 401/404 → „Link wygasł lub nie istnieje.”
- 429 → „Zbyt wiele prób, spróbuj później.”
- NetworkError → „Błąd sieci, sprawdź połączenie.”
- Wszystkie błędy przez ErrorBanner role="alert".

## 11. Kroki implementacji
1. Stworzyć plik `src/pages/guest.astro` z React Island `GuestJoinPage`.
2. Wygenerować komponenty `GuestJoinForm.tsx` i `ErrorBanner.tsx` w `src/components/onboarding`.
3. Zaimportować i skonfigurować hook `useGuestJoin` w `src/lib/hooks`.
4. Zaimplementować walidację regex i disabled button.
5. Dodać aria-attributes i focus management.
6. Napisać stylowanie Tailwind zgodne z theme.
7. Przetestować ścieżkę `/guest` manualnie i automatycznie (unit + e2e).
8. Zintegrować ThemeToggle dla spójności UI.
