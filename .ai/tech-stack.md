Frontend — Astro z React dla komponentów interaktywnych:
-Astro 5: szybkie SSR/SSG i wyspy (minimum JS po stronie klienta).
-React 19: interaktywność tylko tam, gdzie to potrzebne; nowoczesny ekosystem komponentów.
-TypeScript 5: statyczne typowanie i lepsze DX/IDE.
-Tailwind 4: szybkie, spójne stylowanie i łatwy theming (light/dark).
shadcn/ui: dostępne komponenty React na bazie Radix, łatwe do modyfikowania.
Backend — Supabase jako Backend‑as‑a‑Service
-PostgreSQL: relacyjna baza z RLS do egzekwowania uprawnień (role/serwery/pokoje).
-Auth: wbudowana autentykacja (e‑mail+hasło, linki), integracje OAuth.
-Realtime/Storage: presence/aktualizacje na żywo i przechowywanie zasobów (opcjonalnie).
-Edge/Scheduled Functions: funkcje serwerowe i zadania okresowe (TTL serwerów, retencja wiadomości 1 dzień).
Voice / RTC — LiveKit Cloud (EU):
-SFU w regionie UE: niskie opóźnienia, skalowanie i QoS dla rozmów.
-Tokeny dostępu: generowane po stronie serwera z uprawnieniami publish/subscribe (np. speak‑by‑permission).
-STUN/TURN: wbudowane w LiveKit — brak potrzeby stawiać własnych serwerów.
-Telemetria: wskaźniki jakości (jitter, packet loss, bitrate) i webhooki do monitoringu.
Bezpieczeństwo:
-Argon2id: hashowanie haseł pokoi po stronie serwera z odpowiednią konfiguracją kosztów.
-Cloudflare Turnstile: CAPTCHA w wrażliwych przepływach (rejestracja, reset hasła, anty‑spam).
-Secure httpOnly cookies: sesje (np. gość 24h), SameSite, Secure, wygasanie.
-TLS/HTTPS end‑to‑end: HSTS/CSP, bezpieczna konfiguracja nagłówków.
-SSRF‑hardening dla link preview: allowlista domen, blokada prywatnych IP, timeouts i limity rozmiaru odpowiedzi.
AI — OpenRouter.ai (opcjonalne w MVP):
-Dostęp do wielu modeli (OpenAI/Anthropic/Google itd.) z jednego API.
qBudżetowanie i limity kosztów per klucz/projekt; łatwa zmiana modelu bez refaktoryzacji.
CI/CD i Hosting:
-GitHub Actions: pipeline’y lint/test/build, skan sekretów, build obrazów Docker.
-Docker: wieloetapowe buildy, małe obrazy i powtarzalne środowisko.
-DigitalOcean: uruchomienie konteneryzowane (Droplet/App Platform), zarządzanie domeną i certyfikatami TLS.
-Sekrety/konfiguracja: zmienne środowiskowe w CI/DO, rotacja kluczy, oddzielne środowiska (staging/prod).
Monitoring i logowanie (zalecane):
-Sentry (FE/BE): błędy i performance.
-LiveKit webhooks: ingest metryk QoS i alerty kosztowe/obciążeniowe.
-Logi/audyt w Supabase: przechowywanie zgodnie z retencją (np. 90 dni).
