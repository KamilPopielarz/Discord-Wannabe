# Instrukcje testowania Realtime Chat

## Przygotowanie środowiska

### 1. Uruchomienie aplikacji

```bash
# Zainstaluj zależności (jeśli jeszcze nie zostało zrobione)
npm install

# Uruchom serwer deweloperski
npm run dev
```

Aplikacja powinna być dostępna pod adresem: `http://localhost:4321`

### 2. Przygotowanie dwóch przeglądarek

**Opcja A: Różne przeglądarki**
- Użyj Chrome i Firefox (lub Chrome i Edge)
- Każda przeglądarka będzie miała osobną sesję

**Opcja B: Ta sama przeglądarka (tryb incognito)**
- Otwórz normalną kartę Chrome
- Otwórz kartę w trybie incognito (Ctrl+Shift+N)
- Każda karta będzie miała osobną sesję

## Scenariusz testowy 1: Dwóch zarejestrowanych użytkowników

### Przygotowanie

1. **Przeglądarka 1:**
   - Otwórz `http://localhost:4321/register`
   - Zarejestruj użytkownika A (np. `user1@test.com`)
   - Zaloguj się

2. **Przeglądarka 2:**
   - Otwórz `http://localhost:4321/register`
   - Zarejestruj użytkownika B (np. `user2@test.com`)
   - Zaloguj się

### Test: Tworzenie serwera i pokoju

1. **Przeglądarka 1 (użytkownik A):**
   - Przejdź do `/servers`
   - Kliknij "Stwórz nowy serwer"
   - Skopiuj link zaproszeniowy do serwera

2. **Przeglądarka 2 (użytkownik B):**
   - Wklej link zaproszeniowy w przeglądarce
   - Dołącz do serwera

3. **Przeglądarka 1 (użytkownik A):**
   - Utwórz nowy pokój (np. "Test Room")
   - Dołącz do pokoju
   - Skopiuj link zaproszeniowy do pokoju

4. **Przeglądarka 2 (użytkownik B):**
   - Wklej link zaproszeniowy do pokoju
   - Dołącz do pokoju

### Test: Wysyłanie wiadomości w czasie rzeczywistym

1. **Otwórz konsole przeglądarek (F12) w obu przeglądarkach**
   
   Sprawdź logi Realtime:
   ```
   [Realtime] Setting auth token
   [Realtime] Subscription status: SUBSCRIBED
   [Realtime] Connected to channel
   ```
   
   ✓ **PASS:** Jeśli widzisz "SUBSCRIBED" w obu przeglądarkach
   ✗ **FAIL:** Jeśli widzisz "CHANNEL_ERROR" lub "TIMED_OUT"

2. **Przeglądarka 1 (użytkownik A):**
   - Napisz wiadomość: "Test message 1"
   - Wyślij (Enter lub kliknij przycisk)

3. **Przeglądarka 2 (użytkownik B) - NATYCHMIAST:**
   
   ✓ **PASS:** Wiadomość "Test message 1" pojawia się **natychmiast** (< 1 sekundy)
   ✗ **FAIL:** Wiadomość nie pojawia się lub pojawia się dopiero po 5-30 sekundach
   
   Sprawdź konsolę:
   ```
   [Realtime] New message received: {...}
   [Polling] Received 1 messages
   ```

4. **Przeglądarka 2 (użytkownik B):**
   - Napisz odpowiedź: "Test message 2"
   - Wyślij

5. **Przeglądarka 1 (użytkownik A) - NATYCHMIAST:**
   
   ✓ **PASS:** Wiadomość "Test message 2" pojawia się natychmiast
   
6. **Test wymiana kilku wiadomości:**
   - Wyślij 5-10 wiadomości naprzemiennie z obu przeglądarek
   - Wszystkie powinny pojawiać się natychmiast u drugiego użytkownika

## Scenariusz testowy 2: Użytkownik + Gość

### Przygotowanie

1. **Przeglądarka 1:**
   - Zaloguj się jako zarejestrowany użytkownik
   - Utwórz serwer i pokój
   - Skopiuj link zaproszeniowy do pokoju

2. **Przeglądarka 2:**
   - Otwórz link zaproszeniowy jako gość (bez logowania)
   - System powinien utworzyć sesję gościa automatycznie

### Test

Powtórz kroki z Scenariusza 1 (wysyłanie wiadomości).

Wiadomości powinny pojawiać się natychmiast w obu kierunkach:
- Od użytkownika do gościa
- Od gościa do użytkownika

## Scenariusz testowy 3: Trzech użytkowników w tym samym pokoju

### Przygotowanie

- Otwórz 3 przeglądarki lub karty
- Zaloguj się na 3 różne konta
- Wszyscy dołączają do tego samego pokoju

### Test

1. Użytkownik A wysyła wiadomość
   - ✓ Użytkownik B widzi natychmiast
   - ✓ Użytkownik C widzi natychmiast

2. Użytkownik B wysyła wiadomość
   - ✓ Użytkownik A widzi natychmiast
   - ✓ Użytkownik C widzi natychmiast

## Diagnostyka problemów

### Problem: Wiadomości pojawiają się dopiero po 5 sekundach

**Możliwe przyczyny:**
1. Realtime nie działa - działa tylko fallback polling (5s)
2. Brak tokenu uwierzytelniającego

**Sprawdzenie w konsoli:**
```
✗ [Realtime] Failed to fetch auth token, status: 404
✗ [Realtime] No access token available
✗ [Realtime] Subscription status: CHANNEL_ERROR
```

**Rozwiązanie:**
- Sprawdź czy endpoint `/api/auth/token` działa (odwiedź `http://localhost:4321/api/auth/token`)
- Sprawdź konfigurację Realtime w Supabase (patrz `REALTIME_VERIFICATION.md`)

### Problem: Wiadomości nie pojawiają się wcale

**Możliwe przyczyny:**
1. Użytkownik nie jest w tym samym pokoju
2. Problem z połączeniem do bazy danych
3. RLS blokuje dostęp

**Sprawdzenie:**
- Upewnij się, że oba konta są w tym samym pokoju (ten sam `roomId`)
- Sprawdź konsolę przeglądarki dla błędów
- Sprawdź polityki RLS (patrz `test-realtime-setup.sql`)

### Problem: Realtime działa tylko w jednym kierunku

**Możliwe przyczyny:**
1. Jedna z przeglądarek nie ma subskrypcji Realtime
2. Problem z tokenem w jednej z sesji

**Sprawdzenie:**
- Sprawdź konsolę obu przeglądarek
- Upewnij się, że obie mają "SUBSCRIBED"

### Problem: Wiadomości się dublują

**Możliwe przyczyny:**
1. Duplikaty w logice `loadNewMessages`
2. Problem z `lastMessageIdRef`

**To jest normalne** - kod ma mechanizm deduplikacji w linii 184-189 `useChat.ts`

## Metryki sukcesu

✅ **Implementacja działa poprawnie gdy:**

1. Oba użytkowników widzą "SUBSCRIBED" w konsoli
2. Wiadomości pojawiają się w < 1 sekundy
3. Brak błędów w konsoli
4. Działa dla użytkowników i gości
5. Działa dla 3+ użytkowników w tym samym pokoju
6. Fallback polling działa gdy Realtime jest wyłączony

## Checklist testowy

- [ ] Scenariusz 1: Dwóch użytkowników - wiadomości w czasie rzeczywistym
- [ ] Scenariusz 2: Użytkownik + Gość - wiadomości w czasie rzeczywistym
- [ ] Scenariusz 3: Trzech użytkowników - wszyscy widzą wszystkie wiadomości
- [ ] Konsola pokazuje "SUBSCRIBED" dla wszystkich użytkowników
- [ ] Endpoint `/api/auth/token` zwraca token
- [ ] Endpoint `/api/me` zwraca dane użytkownika
- [ ] Fallback polling działa (odłącz internet na 10s, podłącz - wiadomości się zsynchronizują)
- [ ] Brak błędów w konsoli przeglądarki
- [ ] Wiadomości nie dublują się

## Raportowanie wyników

Po wykonaniu testów, zgłoś wyniki:

**Format raportu:**
```
Scenariusz 1: [PASS/FAIL]
Scenariusz 2: [PASS/FAIL]
Scenariusz 3: [PASS/FAIL]
Realtime status: [SUBSCRIBED/CHANNEL_ERROR/TIMED_OUT]
Opóźnienie wiadomości: [< 1s / 5s / 30s / nie działa]
Błędy w konsoli: [tak/nie] - [treść błędu jeśli są]
```

## Następne kroki jeśli testy przeszły

Jeśli wszystkie testy przeszły pomyślnie:

1. ✅ Implementacja jest kompletna
2. 🚀 Możesz wdrożyć aplikację na produkcję
3. 📊 Monitoruj logi Realtime w panelu Supabase
4. 🔧 Rozważ optymalizacje dla większej liczby użytkowników

## Następne kroki jeśli testy nie przeszły

1. Sprawdź `REALTIME_VERIFICATION.md` - weryfikacja konfiguracji Supabase
2. Uruchom `test-realtime-setup.sql` w SQL Editor
3. Sprawdź logi w konsoli przeglądarki (F12)
4. Sprawdź logi serwera (terminal gdzie działa `npm run dev`)
5. Zgłoś problem z dokładnymi logami błędów

