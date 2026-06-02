-- Użytkownicy generatora ofert (logowanie e-mail + wspólne hasło aplikacji)
-- Dodanie osoby: INSERT poniżej lub w Supabase → Table Editor → uzytkownicy

CREATE TABLE IF NOT EXISTS uzytkownicy (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  imie text NOT NULL,
  stanowisko text NOT NULL DEFAULT '',
  telefon text NOT NULL DEFAULT '',
  aktywny boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS uzytkownicy_email_idx ON uzytkownicy (lower(email));

ALTER TABLE uzytkownicy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_active_uzytkownicy" ON uzytkownicy;
CREATE POLICY "anon_read_active_uzytkownicy"
  ON uzytkownicy
  FOR SELECT
  TO anon
  USING (aktywny = true);

-- Kopia listy z constants.ts (można później edytować tylko w bazie)
INSERT INTO uzytkownicy (email, imie, stanowisko, telefon) VALUES
  ('jakub.jaruga@longlife.pl', 'Jakub Jaruga', 'Dyrektor Sprzedaży', '+48 570 585 484'),
  ('paulina.nytko@longlife.pl', 'Paulina Nytko', 'Health & Wellbeing Business Partner', '+48 530 232 220'),
  ('katarzyna.brzostek@longlife.pl', 'Katarzyna Brzostek', 'Health & Wellbeing Business Partner', '+48 535 678 736'),
  ('katarzyna.czarnowska@longlife.pl', 'Katarzyna Czarnowska', 'Członek Zarządu. Dyrektor Operacyjny', '+48 883 112 004'),
  ('katarzyna.pawlowska@longlife.pl', 'Katarzyna Pawłowska', 'Customer Care', '+48 533 100 317'),
  ('aleksandra.leszczynska@longlife.pl', 'Aleksandra Leszczyńska', 'Koordynator ds. Realizacji Akcji', '+48 535 743 026'),
  ('aleksandra.grabowska@longlife.pl', 'Aleksandra Grabowska', 'Business Development Manager', '--'),
  ('piotr.leszczynski@longlife.pl', 'Piotr Leszczyński', 'Członek Zarządu. Dyrektor Medyczny', '+48 535 958 322'),
  ('filip.clapka@longlife.pl', 'Filip Cłapka', '--', '--'),
  ('olga.skowronska@longlife.pl', 'Olga Skowrońska', '--', '--'),
  ('paulina.werczynska@longlife.pl', 'Paulina Werczyńska', 'Członek Zarządu.Dyrektor Marketingu', '--'),
  ('lukasz.jezewski@longlife.pl', 'Łukasz Jeżewski', 'Koordynator ds. Zespołów Medycznych', '+48 883 112 000')
ON CONFLICT (email) DO NOTHING;

-- Nowy użytkownik (podmień wartości i uruchom w SQL Editor):
-- INSERT INTO uzytkownicy (email, imie, stanowisko, telefon)
-- VALUES ('jan.kowalski@longlife.pl', 'Jan Kowalski', 'Health & Wellbeing Business Partner', '+48 500 000 000')
-- ON CONFLICT (email) DO UPDATE SET
--   imie = EXCLUDED.imie,
--   stanowisko = EXCLUDED.stanowisko,
--   telefon = EXCLUDED.telefon,
--   aktywny = true;
