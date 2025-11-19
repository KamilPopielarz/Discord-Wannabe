# Instrukcje weryfikacji konfiguracji Supabase Realtime

## Cel
Zweryfikować, czy Supabase Realtime jest poprawnie skonfigurowany dla tabeli `messages`, aby wiadomości pojawiały się natychmiast u wszystkich użytkowników w pokoju.

## Kroki weryfikacji w panelu Supabase

### 1. Sprawdzenie czy Realtime jest włączony

1. Zaloguj się do panelu Supabase: https://supabase.com/dashboard
2. Wybierz swój projekt
3. Przejdź do **Database** → **Replication**
4. Upewnij się, że publikacja `supabase_realtime` istnieje i jest aktywna

### 2. Weryfikacja czy tabela `messages` jest w publikacji

Wykonaj poniższe zapytanie SQL w **SQL Editor**:

```sql
-- Sprawdź czy tabela messages jest w publikacji supabase_realtime
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'messages';
```

**Oczekiwany wynik:**
- Powinien zwrócić 1 wiersz z `tablename = 'messages'` i `pubname = 'supabase_realtime'`
- Jeśli nie zwraca żadnych wyników, wykonaj migrację ręcznie (patrz sekcja "Rozwiązywanie problemów")

### 3. Weryfikacja polityk RLS dla Realtime

Wykonaj poniższe zapytanie SQL:

```sql
-- Sprawdź polityki RLS dla tabeli messages
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'messages'
  AND schemaname = 'public';
```

**Oczekiwane polityki:**
- `message_select` - dla SELECT, używa `auth.uid()`
- `message_insert` - dla INSERT, używa `auth.uid()`

**WAŻNE:** Polityki muszą używać `auth.uid()` zamiast `current_setting('app.user_id')`, ponieważ Realtime nie wspiera `current_setting`.

### 4. Testowanie w konsoli przeglądarki

Po wdrożeniu zmian, otwórz aplikację i sprawdź konsolę przeglądarki (F12):

```
[Realtime] Setting auth token
[Realtime] Subscription status: SUBSCRIBED
[Realtime] Connected to channel
```

Jeśli widzisz błędy:
- `CHANNEL_ERROR` - problem z konfiguracją Realtime lub RLS
- `TIMED_OUT` - problem z połączeniem sieciowym
- Brak tokenu - endpoint `/api/auth/token` nie działa

## Rozwiązywanie problemów

### Problem: Tabela `messages` nie jest w publikacji

**Rozwiązanie:** Wykonaj poniższe SQL:

```sql
-- Dodaj tabelę messages do publikacji supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Problem: Polityki RLS używają `current_setting` zamiast `auth.uid()`

**Rozwiązanie:** Uruchom migrację:

```bash
# Z katalogu głównego projektu
supabase db push
```

Lub wykonaj ręcznie SQL z pliku `supabase/migrations/20251021140000_fix_messages_rls_for_realtime.sql`

### Problem: Realtime jest wyłączony

1. W panelu Supabase przejdź do **Settings** → **API**
2. Sprawdź sekcję **Realtime**
3. Upewnij się, że Realtime API jest włączony
4. Sprawdź czy URL Realtime jest poprawny (powinien być typu `wss://...`)

### Problem: Migracja nie została zastosowana

Uruchom wszystkie migracje:

```bash
# Lokalnie (jeśli używasz local Supabase)
supabase db reset

# Lub na produkcji
supabase db push
```

## Weryfikacja końcowa

Po wykonaniu wszystkich kroków, przetestuj działanie:

1. Otwórz aplikację w dwóch przeglądarkach (np. Chrome i Firefox)
2. Zaloguj się na różne konta
3. Dołącz do tego samego pokoju
4. Wyślij wiadomość z pierwszej przeglądarki
5. Wiadomość powinna pojawić się **natychmiast** (< 1 sekunda) na drugiej przeglądarce

## Dodatkowe narzędzia diagnostyczne

### Monitorowanie połączeń Realtime

W panelu Supabase:
1. Przejdź do **Database** → **Replication**
2. Sprawdź liczbę aktywnych połączeń
3. Powinieneś zobaczyć aktywne subskrypcje dla pokoi

### Logi Realtime

W konsoli przeglądarki możesz włączyć szczegółowe logi:

```javascript
// W konsoli przeglądarki
localStorage.setItem('supabase.debug', 'true');
location.reload();
```

## Status weryfikacji

- [ ] Realtime jest włączony w projekcie Supabase
- [ ] Tabela `messages` jest w publikacji `supabase_realtime`
- [ ] Polityki RLS używają `auth.uid()`
- [ ] Endpoint `/api/auth/token` zwraca token
- [ ] Endpoint `/api/me` zwraca dane użytkownika
- [ ] W konsoli przeglądarki widać `SUBSCRIBED`
- [ ] Wiadomości pojawiają się natychmiast w dwóch przeglądarkach

## Wsparcie

Jeśli po wykonaniu wszystkich kroków Realtime nadal nie działa:
1. Sprawdź logi w konsoli przeglądarki (F12)
2. Sprawdź logi Supabase w panelu
3. Upewnij się, że firewall/proxy nie blokuje połączeń WebSocket
4. Zweryfikuj, czy zmienne środowiskowe Supabase są poprawnie ustawione w `.env`

