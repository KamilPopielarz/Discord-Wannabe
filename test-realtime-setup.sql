-- Test Script: Weryfikacja konfiguracji Supabase Realtime
-- Wykonaj ten skrypt w SQL Editor panelu Supabase

-- ============================================
-- 1. Sprawdzenie publikacji supabase_realtime
-- ============================================
SELECT 
  'Publikacja supabase_realtime' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ PASS'
    ELSE '✗ FAIL - Publikacja nie istnieje'
  END as status
FROM pg_publication
WHERE pubname = 'supabase_realtime';

-- ============================================
-- 2. Sprawdzenie czy tabela messages jest w publikacji
-- ============================================
SELECT 
  'Tabela messages w publikacji' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ PASS'
    ELSE '✗ FAIL - Tabela messages nie jest w publikacji supabase_realtime'
  END as status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'messages';

-- ============================================
-- 3. Lista wszystkich tabel w publikacji
-- ============================================
SELECT 
  'Tabele w publikacji supabase_realtime' as info,
  tablename,
  schemaname
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ============================================
-- 4. Sprawdzenie polityk RLS dla messages
-- ============================================
SELECT 
  'Polityki RLS dla messages' as info,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual::text LIKE '%auth.uid()%' THEN '✓ Używa auth.uid()'
    WHEN qual::text LIKE '%current_setting%' THEN '✗ Używa current_setting (niekompatybilne z Realtime)'
    ELSE '? Niestandardowa polityka'
  END as auth_method,
  permissive,
  roles
FROM pg_policies
WHERE tablename = 'messages'
  AND schemaname = 'public'
ORDER BY cmd;

-- ============================================
-- 5. Sprawdzenie czy RLS jest włączony
-- ============================================
SELECT 
  'Row Level Security status' as test_name,
  CASE 
    WHEN relrowsecurity THEN '✓ RLS włączony'
    ELSE '✗ RLS wyłączony'
  END as status
FROM pg_class
WHERE relname = 'messages'
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============================================
-- 6. Szczegóły polityk dla Realtime
-- ============================================
SELECT 
  policyname as policy_name,
  cmd as operation,
  SUBSTRING(qual::text, 1, 100) as condition_preview
FROM pg_policies
WHERE tablename = 'messages'
  AND schemaname = 'public';

-- ============================================
-- 7. Sprawdzenie czy istnieje tabela sessions (dla gości)
-- ============================================
SELECT 
  'Tabela sessions' as test_name,
  CASE 
    WHEN COUNT(*) > 0 THEN '✓ PASS - Tabela sessions istnieje'
    ELSE '⚠ WARNING - Tabela sessions nie istnieje (goście mogą nie działać)'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name = 'sessions';

-- ============================================
-- DIAGNOSTIC: Jeśli coś nie działa
-- ============================================

-- Napraw brakującą publikację (jeśli test 2 failed):
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Sprawdź istniejące polityki szczegółowo:
-- SELECT * FROM pg_policies WHERE tablename = 'messages';

-- Usuń stare polityki (jeśli używają current_setting):
-- DROP POLICY IF EXISTS message_select ON messages;
-- DROP POLICY IF EXISTS message_insert ON messages;

-- Utwórz nowe polityki używające auth.uid():
-- CREATE POLICY message_select ON messages FOR SELECT TO authenticated USING (
--   EXISTS (
--     SELECT 1 FROM user_room ur
--     WHERE ur.room_id = messages.room_id
--       AND ur.user_id = auth.uid()
--   )
-- );

-- CREATE POLICY message_insert ON messages FOR INSERT TO authenticated WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM user_room ur
--     WHERE ur.room_id = messages.room_id
--       AND ur.user_id = auth.uid()
--   )
-- );

