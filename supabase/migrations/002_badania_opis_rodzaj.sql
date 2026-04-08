-- Opcjonalne pola dla rekordów badań laboratoryjnych (Supabase → tabela badania)
-- Uruchom w SQL Editor, jeśli tabela już istnieje.

ALTER TABLE IF EXISTS badania ADD COLUMN IF NOT EXISTS opis text;
ALTER TABLE IF EXISTS badania ADD COLUMN IF NOT EXISTS rodzaj text DEFAULT 'pakiet';

COMMENT ON COLUMN badania.opis IS 'Wskazania / po co się bada – do podglądu handlowca i oferty (PDF)';
COMMENT ON COLUMN badania.rodzaj IS 'pakiet = gotowy pakiet (kafelek); badanie = badanie pojedyncze (dodatki)';
