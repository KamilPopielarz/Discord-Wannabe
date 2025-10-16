# Dokument wymagań produktu (PRD) - Discord-Wannabe

## 1. Przegląd produktu

Cel: Prosty, bezpieczny komunikator dla małych grup znajomych (gry/rozmowy) w przeglądarce desktop, z priorytetem na voice i minimalny, czytelny czat. MVP obejmuje tryb gościa, pokoje dostępne wyłącznie przez niepubliczny link (z opcjonalnym hasłem), czat z emoji/GIF/link preview oraz rozmowy głosowe oparte o LiveKit (EU). Dostępność mobilna i aplikacje natywne są poza MVP.
Zakres platformy: wyłącznie desktop (przeglądarka). Brak klientów mobilnych i natywnych w MVP.
Architektura: Aplikacja web (Astro + React), backend z REST/Server Endpoints, sesje w secure httpOnly cookie, SFU (LiveKit Cloud) dla voice, STUN/TURN, TLS. Dane czatu krótkotrwałe (retencja 1 dzień), logi i audyt 90 dni. Hasła do pokoi po stronie serwera z Argon2id.
Tożsamości: Gość (24h sesja w cookie), zarejestrowany użytkownik (e‑mail+hasło, double opt‑in). Przeniesienie tożsamości sesji gościa po rejestracji w TTL.
Wyróżniki: Szybkie tworzenie prywatnych serwerów/pokoi, prostota interfejsu, speak‑by‑permission, bardzo niska bariera wejścia (link + opcjonalne hasło), bez publicznych katalogów.

## 2. Problem użytkownika

Użytkownicy (małe grupy znajomych) potrzebują łatwego i prywatnego sposobu na wspólną rozmowę podczas gier czy spotkań online bez skomplikowanej konfiguracji. Publiczne platformy są przeładowane funkcjami i zbędnymi krokami, a tworzenie i zarządzanie prywatnymi pokojami bywa uciążliwe i nieintuicyjne. Potrzebne jest rozwiązanie, które pozwala w kilka sekund uruchomić rozmowę, wysłać zaproszenie linkiem, mieć podstawowy czat i kontrolę dostępu, przy zachowaniu jakości połączeń głosowych i bezpieczeństwa.

## 3. Wymagania funkcjonalne

3.1 Rejestracja i logowanie

- Rejestracja e‑mail + hasło, double opt‑in: link ważny 24h.
- Logowanie z limitem 5 prób i krótkim cooldownem po przekroczeniu.
- Reset hasła przez link (ważny 24h) z CAPTCHA.
- Sesje: secure httpOnly cookie; gość 24h; po rejestracji zachowanie tożsamości sesji gościa.

  3.2 Tryb gościa

- Wejście bez konta z nadanym nickiem „Guest” + liczby (unikalny per serwer w danej chwili).
- Uprawnienia gościa: czat (pisanie), słuchanie voice; brak możliwości mówienia (chyba że Owner/Admin włączy speak‑by‑permission i przyzna prawo mówienia tymczasowo — poza domyślnym MVP restrykcyjnym).
- Sesja gościa nie przenosi się między urządzeniami; wygasa po 24h.

  3.3 Serwery i pokoje

- Tworzenie serwera: link zaproszeniowy niepubliczny generowany automatycznie.
- Dołączanie wyłącznie przez unikalny link; opcjonalne hasło pokoju (hash po stronie serwera Argon2id).
- Tworzenie pokoju w serwerze z opcjonalnym hasłem; współdzielenie hasła poza aplikacją.
- TTL serwera: 6h od ostatniej aktywności; przedłużany, jeśli w ostatnich 5 minutach obecna ≥1 osoba (czat lub voice).
- Owner może skasować pokój; pokoje admina/moderatora mogą być permanentne.
- Jeśli właściciel i uczestnicy opuszczą serwer, nietrwałe pokoje ulegają usunięciu.

  3.4 Role i uprawnienia

- Role: Owner (pełne), Admin (tworzenie/usuwanie pokoi, role niższe, moderacja), Moderator (usuwanie wiadomości, mute/kick), Member (czat+voice), Guest (czat bez voice; słuchanie voice).
- Moderacja: kick (poziom pokoju, Moderator+), ban (poziom serwera, Admin+), mute (poziom pokoju). Akcje czasowe lub stałe; logowanie działań przez 90 dni.

  3.5 Czat

- Wiadomości tekstowe, emoji, integracja GIF (GIPHY) z ratingiem G/PG‑13.
- Link preview generowane po stronie serwera z SSRF‑hardening (allowlista domen, timeout, blokada prywatnych IP).
- Usuwanie własnych wiadomości; Moderator+ może usuwać dowolne w danym pokoju.
- Brak edycji i załączników w MVP. Retencja wiadomości 1 dzień.
- Anti‑spam: rate‑limit per użytkownik/IP (progi do ustalenia) i mechanizmy backoff/blokady.

  3.6 Voice

- WebRTC + SFU (LiveKit Cloud, region UE), STUN/TURN, kodek Opus.
- Limit 10 osób w kanale voice; 1‑klik dołączania i auto‑reconnect.
- Tryb speak‑by‑permission (lock) dla Owner/Admin; mute/unmute, mute all, wybór urządzeń, wskaźniki mówienia, test „mic check”.
- Jakość: AEC/NS/AGC; telemetria QoS (jitter, packet loss, bitrate).

  3.7 Bezpieczeństwo i prywatność

- TLS/HTTPS; SRTP dla voice; szyfrowanie danych at‑rest (np. AES‑256).
- Argon2id dla haseł pokoi; przechowywanie minimalnych danych o gościach.
- Polityka prywatności; samodzielny eksport/usuwanie danych (DSR); brak E2E i nagrywania w MVP.

  3.8 UI/UX

- Tryb light/dark globalnie; domyślna kolorystyka zielona (matrix) zgodna z WCAG.
- Minimalistyczny interfejs czatu i voice; brak katalogu publicznych pokoi; dołączanie tylko linkiem.
- Panel admina: przydzielanie pokoi permanentnych; nadawanie rang/rol z przypisanymi uprawnieniami; przegląd logów działań.

  3.9 Metryki i SLO

- North Star: tygodniowe minuty voice na użytkownika.
- SLO voice: 99,5% dostępności; alerty kosztowe/obciążeniowe; logi/audyt 90 dni.
- D1/D7 retencja; konwersja guest→konto; telemetry QoS.

## 4. Granice produktu

W MVP poza zakresem: aplikacje mobilne i natywne; załączniki/edycja wiadomości; katalog publicznych serwerów/pokoi i wyszukiwarka; E2E oraz nagrywanie rozmów; rozbudowana moderacja z automatyzacją; integracje poza GIPHY; publiczne API.
Nierozstrzygnięte i do doprecyzowania: progi anti‑spam i polityka blokad; ważność i revokacja linków zaproszeń (czas, liczba użyć, unieważnianie); budżet kosztowy i plany skalowania powyżej 100 równoczesnych; SLO dla czatu (opóźnienie, dostępność) i progi alertów; zakres i retencja telemetry QoS ponad 90 dni logów; semantyka usuwania pokoju vs. całego serwera; zarządzanie allowlistą domen link preview (UI, fallbacki).
Założenia techniczne: LiveKit w EU, STUN/TURN; hasła pokoi Argon2id; sesje httpOnly; SSRF‑hardening; retencja czatu 1 dzień.

## 5. Historyjki użytkowników

US-001
Tytuł: Rejestracja z potwierdzeniem e‑mail
Opis: Jako nowy użytkownik chcę utworzyć konto przez e‑mail i hasło oraz potwierdzić je linkiem ważnym 24h, aby móc korzystać z voice i trwałych ustawień.
Kryteria akceptacji:

- Formularz rejestracji przyjmuje e‑mail i silne hasło, waliduje formaty.
- Po wysłaniu rejestracji wysyłany jest e‑mail z linkiem aktywacyjnym ważnym 24h.
- Po kliknięciu linku konto staje się aktywne; przed aktywacją nie można się zalogować.
- Błędy i stany (link wygasł, wykorzystany) są komunikowane w UI.

US-002
Tytuł: Logowanie z limitem prób
Opis: Jako użytkownik chcę logować się z limitem 5 prób i cooldownem po błędach, aby chronić konto.
Kryteria akceptacji:

- Po 5 nieudanych próbach następuje krótkotrwała blokada IP/konta (konfiguracja).
- Prawidłowe poświadczenia logują użytkownika i ustawiają secure httpOnly cookie.
- Nieprawidłowe poświadczenia nie ujawniają, czy istnieje konto.

US-003
Tytuł: Reset hasła z CAPTCHA
Opis: Jako użytkownik chcę zresetować hasło przez link ważny 24h i CAPTCHA, aby bezpiecznie odzyskać dostęp.
Kryteria akceptacji:

- Formularz resetu wymaga e‑maila i zaliczenia CAPTCHA.
- E‑mail zawiera jednorazowy link ważny 24h.
- Po ustawieniu nowego hasła stare sesje są unieważnione.

US-004
Tytuł: Wejście jako gość
Opis: Jako gość chcę dołączyć bez zakładania konta, z automatycznie nadanym nickiem „Guest”+liczby, aby szybko dołączyć do rozmowy.
Kryteria akceptacji:

- Po wejściu nadawany jest unikalny nick w obrębie serwera.
- Tworzona jest sesja w secure httpOnly cookie na 24h (bez roamingu).
- Po rejestracji w 24h zachowuję tożsamość i historię uprawnień.

US-005
Tytuł: Utworzenie serwera i linku zaproszeniowego
Opis: Jako zalogowany chcę utworzyć serwer i otrzymać niepubliczny link, aby zaprosić znajomych.
Kryteria akceptacji:

- Utworzenie serwera generuje unikalny niepubliczny link.
- Serwer ma początkowy TTL 6h od aktywności; przedłużany obecnością ≥1 osoby w 5 min.
- Owner może skasować serwer lub pokój (zgodnie z ustalonym zakresem uprawnień).

US-006
Tytuł: Tworzenie pokoju z hasłem
Opis: Jako Owner/Admin chcę utworzyć pokój z opcjonalnym hasłem, aby ograniczyć dostęp.
Kryteria akceptacji:

- Hasło jest hashowane Argon2id i weryfikowane po stronie serwera.
- Próby wejścia do pokoju ograniczone do 3; przekroczenie skutkuje czasową blokadą IP/konta.
- Właściciel może zresetować hasło pokoju.

US-007
Tytuł: Dołączanie do serwera/pokoju przez link
Opis: Jako zaproszony chcę dołączyć wyłącznie przez link i (opcjonalnie) hasło, aby zachować prywatność pokojów.
Kryteria akceptacji:

- Link prowadzi do ekranu dołączenia; jeśli pokój wymaga hasła, jest ono wymagane.
- Brak publicznego katalogu/wyszukiwarki; nie da się znaleźć pokoi bez linku.
- Błędne/wygaśnięte linki zwracają czytelny komunikat i bezpieczny fallback.

US-008
Tytuł: Czat z emoji, GIF i link preview
Opis: Jako uczestnik chcę pisać wiadomości z emoji i GIF, a linki mieć w podglądzie, aby komunikacja była bogatsza.
Kryteria akceptacji:

- Wysyłanie/wyświetlanie tekstu i emoji; integracja GIPHY z ratingiem G/PG‑13.
- Link preview serwerowe z allowlistą, timeoutem i blokadą prywatnych IP.
- Usuwanie własnych wiadomości; Moderator+ może usuwać dowolne w pokoju.
- Retencja wiadomości 1 dzień; brak edycji i załączników.

US-009
Tytuł: Ochrona anty‑spam
Opis: Jako operator chcę ograniczać spam przez rate‑limit i blokady, aby chronić jakość rozmów.
Kryteria akceptacji:

- Konfigurowalne progi wiadomości/min per użytkownik i per IP.
- Backoff i czasowe blokady; logowanie incydentów przez 90 dni.
- Bezpieczna obsługa błędów i komunikaty dla użytkownika.

US-010
Tytuł: Dołączanie do voice 1‑klik
Opis: Jako uczestnik chcę dołączyć do kanału voice jednym kliknięciem, aby szybko rozpocząć rozmowę.
Kryteria akceptacji:

- Autowykrywanie urządzeń wejścia/wyjścia z możliwością wyboru.
- Auto‑reconnect po utracie połączenia; wskaźniki mówienia.
- Limit 10 osób/kanał; informacja o przekroczeniu limitu.

US-011
Tytuł: Speak‑by‑permission (lock)
Opis: Jako Owner/Admin chcę zablokować możliwość mówienia i udzielać głosu wybranym, aby ograniczyć chaos.
Kryteria akceptacji:

- Przełącznik lock na poziomie pokoju; nadawanie czasowych praw do mówienia.
- Mute all i per‑user mute; Moderator+ może wyciszać.
- Stan lock komunikowany w UI; działania logowane.

US-012
Tytuł: Panel admina — role i pokoje permanentne
Opis: Jako Admin chcę nadawać role i tworzyć pokoje permanentne, aby utrzymać porządek i dostępność.
Kryteria akceptacji:

- Nadawanie ról: Admin, Moderator, Member, Guest; zakresy uprawnień wymuszane.
- Tworzenie i oznaczanie pokoi jako permanentne (wyłączone z TTL).
- Przegląd logów działań moderacyjnych do 90 dni.

US-013
Tytuł: Moderacja — kick/ban/mute
Opis: Jako Moderator/Admin chcę usuwać, wyciszać i banować, aby utrzymać jakość rozmów.
Kryteria akceptacji:

- Kick na poziomie pokoju (Moderator+), ban na poziomie serwera (Admin+), mute na poziomie pokoju.
- Akcje czasowe i stałe; widoczne powody; rejestrowanie w logach.

US-014
Tytuł: Dark i light mode
Opis: Jako użytkownik chcę przełączać motyw light/dark z zieloną kolorystyką, aby dopasować UI do preferencji.
Kryteria akceptacji:

- Globalny przełącznik motywu; zapamiętanie preferencji w przeglądarce.
- Kontrast i dostępność zgodnie z WCAG.

US-015
Tytuł: Zarządzanie linkami zaproszeń
Opis: Jako Owner/Admin chcę kontrolować ważność, liczbę użyć i odwołanie linków, aby zwiększyć bezpieczeństwo.
Kryteria akceptacji:

- Konfiguracja TTL linku, limit użyć, możliwość unieważnienia.
- Bezpieczna obsługa błędów i komunikaty w UI.

US-016
Tytuł: Eksport i usuwanie danych (DSR)
Opis: Jako użytkownik chcę samodzielnie pobrać i usunąć swoje dane, aby spełnić wymagania prywatności.
Kryteria akceptacji:

- Eksport danych w ustrukturyzowanym formacie; potwierdzenia operacji.
- Usunięcie danych powoduje anonimizację historii zgodnie z retencją.

US-017
Tytuł: Bezpieczny dostęp do pokojów (hasła)
Opis: Jako użytkownik chcę, aby dostęp do pokoi chronionych hasłem był bezpieczny i odporny na ataki siłowe.
Kryteria akceptacji:

- Hashowanie Argon2id; weryfikacja serwerowa; brak wycieków czasu odpowiedzi.
- 3 próby na wejście; blokada IP/konta po przekroczeniu; reset hasła przez Ownera.

US-018
Tytuł: Link preview — allowlista
Opis: Jako użytkownik chcę mieć bezpieczne podglądy linków tylko z zaufanych domen.
Kryteria akceptacji:

- SSRF‑hardening: allowlista domen, timeout, blokada prywatnych IP.
- Konfigurowalna allowlista w panelu admina lub pliku konfiguracyjnym.

US-019
Tytuł: Telemetria jakości voice i SLO
Opis: Jako operator chcę monitorować jitter, packet loss, bitrate, aby utrzymać SLO 99,5%.
Kryteria akceptacji:

- Zbieranie i wizualizacja metryk QoS; alerty kosztowe/obciążeniowe.
- Raporty z logów/audytu przez 90 dni.

US-020
Tytuł: Automatyczne czyszczenie wiadomości (retencja 1 dzień)
Opis: Jako operator chcę, aby wiadomości czatu automatycznie wygasały po 24h.
Kryteria akceptacji:

- Zadanie okresowe usuwa wiadomości >24h; nie usuwa logów moderacji.
- UI komunikuje politykę retencji.

## 6. Metryki sukcesu

- North Star: tygodniowe minuty voice na użytkownika.
- Retencja: D1, D7; WAU/DAU; liczba aktywnych pokoi/serwerów.
- Konwersja: odsetek gości, którzy rejestrują konto w ciągu 24h.
- Jakość voice: jitter, packet loss, czas do dołączenia, odsetek udanych połączeń, współczynnik reconnect.
- Moderacja/bezpieczeństwo: zdarzenia/1k wiadomości, skuteczność rate‑limitów, czas reakcji moderatorów.
- Operacyjne: SLO voice 99,5%; alerty kosztowe; testy obciążeniowe osiągają założoną równoczesność ~100 użytkowników.
