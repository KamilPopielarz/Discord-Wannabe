# Instrukcje Testowania Czatu w Czasie Rzeczywistym

## Przygotowanie do testów

### Wymagania
- Dwie różne przeglądarki (np. Chrome i Firefox) lub dwa okna incognito
- Uruchomiony serwer deweloperski (`npm run dev`)
- Dostęp do dwóch różnych adresów email do rejestracji

### Krok 1: Uruchomienie aplikacji
```bash
npm run dev
```
Aplikacja powinna być dostępna pod adresem `http://localhost:4321`

## Scenariusz testowy: Czat między dwoma użytkownikami

### Krok 2: Rejestracja pierwszego użytkownika
1. Otwórz pierwszą przeglądarkę i przejdź do `http://localhost:4321/register`
2. Zarejestruj się jako pierwszy użytkownik:
   - Email: `user1@example.com`
   - Password: `password123`
   - Username: `TestUser1`
3. Po rejestracji przejdź do `/login` i zaloguj się

### Krok 3: Utworzenie serwera i pokoju
1. Po zalogowaniu przejdź do dashboard serwerów
2. Kliknij "Stwórz nowy serwer"
3. Skopiuj link zaproszenia do serwera
4. Wejdź do serwera i utwórz pokój:
   - Nazwa: "Test Chat Room"
   - Bez hasła
5. Skopiuj link zaproszenia do pokoju
6. Wejdź do pokoju - powinieneś zobaczyć:
   - ✅ Siebie w liście użytkowników po prawej stronie
   - ✅ Pusty czat z komunikatem "KANAŁ JEST PUSTY"

### Krok 4: Dołączenie drugiego użytkownika
1. Otwórz drugą przeglądarkę (lub okno incognito)
2. Przejdź do `http://localhost:4321/register`
3. Zarejestruj się jako drugi użytkownik:
   - Email: `user2@example.com`
   - Password: `password123`
   - Username: `TestUser2`
4. Po rejestracji zaloguj się
5. Wklej link zaproszenia do pokoju w pasek adresu
6. Powinieneś zostać automatycznie dodany do serwera i pokoju
7. Sprawdź czy widzisz:
   - ✅ Siebie i pierwszego użytkownika w liście użytkowników
   - ✅ Ten sam pusty czat

### Krok 5: Test czatu w czasie rzeczywistym
1. **Na pierwszym koncie** napisz wiadomość: "Cześć z konta 1!"
2. **Na drugim koncie** sprawdź czy:
   - ✅ Wiadomość pojawiła się automatycznie (w ciągu 2-3 sekund)
   - ✅ Pokazuje się nazwa autora "TestUser1"
   - ✅ Wyświetla się czas wysłania
   - ✅ Słyszysz dźwięk powiadomienia (jeśli włączone)
   - ✅ Widzisz powiadomienie przeglądarki (jeśli okno nie jest aktywne)

3. **Na drugim koncie** odpowiedz: "Cześć z konta 2!"
4. **Na pierwszym koncie** sprawdź czy wiadomość pojawiła się automatycznie

### Krok 6: Test wskaźnika pisania
1. **Na pierwszym koncie** zacznij pisać wiadomość (ale nie wysyłaj)
2. **Na drugim koncie** sprawdź czy:
   - ✅ Pojawia się wskaźnik "TestUser1 pisze..." pod czatem
   - ✅ Wskaźnik znika po kilku sekundach braku aktywności

### Krok 7: Test powiadomień
1. **Na drugim koncie** zminimalizuj okno lub przełącz na inną kartę
2. **Na pierwszym koncie** wyślij wiadomość
3. **Na drugim koncie** sprawdź czy:
   - ✅ Tytuł karty pokazuje liczbę nieprzeczytanych wiadomości: "(1) Discord Wannabe"
   - ✅ Pojawia się powiadomienie przeglądarki
   - ✅ Słyszysz dźwięk powiadomienia
4. **Na drugim koncie** wróć do okna czatu
5. Sprawdź czy:
   - ✅ Licznik nieprzeczytanych znika z tytułu
   - ✅ Wiadomość jest widoczna w czacie

### Krok 8: Test ustawień dźwięku
1. **Na dowolnym koncie** kliknij przycisk "DŹWIĘKI" w nagłówku
2. Sprawdź czy przycisk zmienia kolor (zielony = włączone, szary = wyłączone)
3. Kliknij "TEST" aby przetestować dźwięk
4. Wyłącz dźwięki i sprawdź czy nowe wiadomości nie odtwarzają dźwięku

### Krok 9: Test adaptacyjnego odświeżania
1. **Na obu kontach** zostaw okna aktywne
2. Wyślij kilka wiadomości - powinny pojawiać się szybko (co 2 sekundy)
3. **Na jednym koncie** zminimalizuj okno
4. Wyślij wiadomość z drugiego konta
5. Sprawdź czy wiadomość nadal się pojawia (ale może trochę wolniej - co 5-10 sekund)

## Oczekiwane rezultaty

### ✅ Funkcjonalności które powinny działać:
1. **Automatyczne dołączanie** - drugi użytkownik automatycznie dołącza do serwera i pokoju przez link
2. **Czat w czasie rzeczywistym** - wiadomości pojawiają się automatycznie co 2-3 sekundy
3. **Lista użytkowników** - obaj użytkownicy widoczni po prawej stronie
4. **Wskaźnik pisania** - pokazuje kto aktualnie pisze
5. **Powiadomienia** - dźwiękowe i wizualne dla nowych wiadomości
6. **Adaptacyjne odświeżanie** - szybsze gdy okno aktywne, wolniejsze gdy nieaktywne
7. **Ustawienia dźwięku** - możliwość włączania/wyłączania i testowania

### 🔧 Możliwe problemy i rozwiązania:
- **Wiadomości nie pojawiają się automatycznie**: Sprawdź konsolę przeglądarki pod kątem błędów API
- **Brak dźwięków**: Kliknij gdzieś na stronie aby zainicjować AudioContext
- **Brak powiadomień**: Sprawdź czy przeglądarka ma pozwolenie na powiadomienia
- **Użytkownicy nie widoczni**: Sprawdź czy endpoint `/api/rooms/[roomId]/users` działa

## Dodatkowe testy

### Test wydajności:
1. Wyślij 20-30 wiadomości szybko po sobie
2. Sprawdź czy wszystkie się pojawiają
3. Sprawdź czy nie ma duplikatów

### Test długich wiadomości:
1. Wyślij bardzo długą wiadomość (500+ znaków)
2. Sprawdź czy się wyświetla poprawnie
3. Sprawdź czy nie łamie layoutu

### Test emoji:
1. Użyj selektora emoji w polu wiadomości
2. Wyślij wiadomość z emoji
3. Sprawdź czy emoji wyświetlają się poprawnie

## Podsumowanie
Po pomyślnym przejściu wszystkich testów powinieneś mieć w pełni funkcjonalny czat w czasie rzeczywistym z automatycznym odświeżaniem, powiadomieniami i wszystkimi zaimplementowanymi funkcjami.
