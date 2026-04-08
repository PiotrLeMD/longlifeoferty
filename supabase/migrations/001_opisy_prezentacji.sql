-- Tabela opisy_prezentacji – treści slajdów dla generatora oferty PPTX
-- Klucz dopasowania: nazwa_pakietu (lub nazwa dla kompatybilności)
-- Uruchom w Supabase SQL Editor

CREATE TABLE IF NOT EXISTS opisy_prezentacji (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nazwa text NOT NULL UNIQUE,
  nazwa_pakietu text,
  tytul_slajdu text NOT NULL,
  opis_korzysci text NOT NULL
);

-- Przykładowe dane (możesz dostosować)
INSERT INTO opisy_prezentacji (nazwa, nazwa_pakietu, tytul_slajdu, opis_korzysci) VALUES
  ('Badania Laboratoryjne', 'Badania Laboratoryjne', 'Mobilny Punkt Pobrań', 'Wygodny dostęp do diagnostyki bez dojazdów pracowników
Sprawny proces rejestracji i pobrania krwi w siedzibie firmy
Wyniki udostępniane online bezpośrednio pracownikowi
Anonimowy raport zbiorczy dla pracodawcy'),
  ('Zarządzanie stresem', 'Zarządzanie stresem', 'Strategia Psychologiczna i Zarządzanie Stresem', 'Diagnostyka strategii radzenia sobie ze stresem
Dedykowane narzędzia i testy psychologiczne
Interwencja psychologa – budowanie odporności
Świadomość mechanizmów stresu'),
  ('Program Roczny', 'Program Roczny', 'Indywidualny Roczny Program Zdrowotny', 'Ciągłość profilaktyki przez cały rok
Stała miesięczna opłata, planowany harmonogram
Połączenie badań, diagnostyki i edukacji
Kultura zdrowia w organizacji'),
  ('Cukrzyca BASIC', 'Cukrzyca BASIC', 'Profilaktyka Cukrzycy (Pakiet BASIC)', 'Screening HbA1c z kropli krwi – wynik od razu
Wywiad medyczny i ocena ryzyka
Spersonalizowane zalecenia w formie kodu QR'),
  ('Cukrzyca PREMIUM', 'Cukrzyca PREMIUM', 'Profilaktyka Cukrzycy (Pakiet PREMIUM)', 'Zakres BASIC + Analiza Składu Ciała (InBody)
Identyfikacja ryzyka metabolicznego
Pełny obraz kondycji metabolicznej'),
  ('Profilaktyka Serca', 'Profilaktyka Serca', 'Ryzyko Sercowo-Naczyniowe', 'Pełny lipidogram i pomiar ciśnienia
Ocena ryzyka w perspektywie 10 lat
Indywidualne wskazówki dietetyczne'),
  ('Spirometria', 'Spirometria', 'Spirometria – Zdrowe Płuca', 'Wczesna identyfikacja astmy i POChP
Badanie przez uprawnionego medyka
Natychmiastowa informacja o wydolności płuc'),
  ('USG', 'USG', 'Mobilny Gabinet USG', 'Profilaktyczne USG na miejscu
Ok. 15 minut na osobę
Opis pisemny od razu po badaniu'),
  ('USG w Firmie', 'USG w Firmie', 'Mobilny Gabinet USG', 'Profilaktyczne USG na miejscu u pracodawcy
Ok. 15 minut na osobę
Opis pisemny od razu po badaniu'),
  ('Dermatoskopia', 'Dermatoskopia', 'Dermatoskopia – Profilaktyka Czerniaka', 'Ocena znamion i zmian skórnych
Badanie przez lekarza z dermatoskopem
Wczesna identyfikacja zmian wymagających obserwacji'),
  ('Kardiologia', 'Kardiologia', 'Profilaktyka Serca i Kardiologia', 'Kompleksowa ocena układu krążenia
Profilaktyka zawałów i udarów
Indywidualne zalecenia zdrowotne'),
  ('Webinary Edukacyjne', 'Webinary Edukacyjne', 'Akademia Zdrowia – Edukacja Medyczna', 'Interaktywne spotkania z ekspertami
Budowanie świadomości zdrowotnej
Rzetelna wiedza z zakresu żywienia i stylu życia')
ON CONFLICT (nazwa) DO NOTHING;
