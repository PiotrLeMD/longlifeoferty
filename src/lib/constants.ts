// --- BAZA WIEDZY: HANDLOWCY (Z TELEFONAMI) ---
export interface DaneHandlowca {
  imie: string;
  stanowisko: string;
  telefon: string;
}

export const DANE_HANDLOWCOW: Record<string, DaneHandlowca> = {
  "jakub.jaruga@longlife.pl": { imie: "Jakub Jaruga", stanowisko: "Dyrektor Sprzedaży", telefon: "+48 570 585 484" },
  "paulina.nytko@longlife.pl": { imie: "Paulina Nytko", stanowisko: "Health & Wellbeing Business Partner", telefon: "+48 530 232 220" },
  "katarzyna.brzostek@longlife.pl": { imie: "Katarzyna Brzostek", stanowisko: "Health & Wellbeing Business Partner", telefon: "+48 535 678 736" },
  "katarzyna.czarnowska@longlife.pl": { imie: "Katarzyna Czarnowska", stanowisko: "Członek Zarządu. Dyrektor Operacyjny", telefon: "+48 883 112 004" },
  "katarzyna.pawlowska@longlife.pl": { imie: "Katarzyna Pawłowska", stanowisko: "Customer Care", telefon: "+48 533 100 317" },
  "aleksandra.leszczynska@longlife.pl": { imie: "Aleksandra Leszczyńska", stanowisko: "Koordynator ds. Realizacji Akcji", telefon: "+48 535 743 026" },
  "piotr.leszczynski@longlife.pl": { imie: "Piotr Leszczyński", stanowisko: "Członek Zarządu. Dyrektor Medyczny", telefon: "+48 535 958 322" },
  "filip.clapka@longlife.pl": { imie: "Filip Cłapka", stanowisko: "--", telefon: "--" },
  "olga.skowronska@longlife.pl": { imie: "Olga Skowrońska", stanowisko: "--", telefon: "--" },
  "paulina.werczynska@longlife.pl": { imie: "Paulina Werczyńska", stanowisko: "Członek Zarządu.Dyrektor Marketingu", telefon: "--" },
  "lukasz.jezewski@longlife.pl": { imie: "Łukasz Jeżewski", stanowisko: "Koordynator ds. Zespołów Medycznych", telefon: "+48 883 112 000" },
};

export const LIMIT_DZIENNY: Record<string, number> = {
  "Badania Lab": 5,
  "Cukrzyca BASIC": 5,
  "Kardiologia": 3,
  "Cukrzyca PREMIUM": 2,
  "Spirometria": 2,
};

export const USLUGI_INDYWIDUALNE: string[] = [
  "USG w Firmie",
  "Dermatoskopia",
  "Zarządzanie stresem",
  "Dietetyk",
];

export const EMAIL_KOORDYNATORA = "katarzyna.czarnowska@longlife.pl,aleksandra.leszczynska@longlife.pl";

// --- OPISY MARKETINGOWE ---
export const OPISY_MARKETINGOWE: Record<string, string> = {
  "Badania Laboratoryjne": "### Mobilny Punkt Pobrań\nWygodny dostęp do diagnostyki laboratoryjnej bez konieczności dojazdów pracowników do placówek.\n* **Organizacja:** Sprawny proces rejestracji i pobrania krwi w siedzibie firmy.\n* **Wyniki:** Udostępniane online bezpośrednio pracownikowi (pełna poufność).\n* **Raportowanie:** Możliwość przygotowania anonimowego raportu zbiorczego dla pracodawcy (analiza trendów zdrowotnych).",
  "Cukrzyca BASIC": "### Profilaktyka Cukrzycy (Pakiet BASIC)\nSzybki screening w kierunku zaburzeń glikemii i ryzyka cukrzycy typu 2.\n* **Badanie:** Oznaczenie poziomu HbA1c z kropli krwi z palca – wynik dostępny natychmiast.\n* **Ocena ryzyka:** Wywiad medyczny i analiza ryzyka wystąpienia cukrzycy (wg walidowanego narzędzia).\n* **Zalecenia:** Pracownik otrzymuje kod QR ze spersonalizowanymi zaleceniami.",
  "Cukrzyca PREMIUM": "### Profilaktyka Cukrzycy (Pakiet PREMIUM)\nRozszerzona diagnostyka metaboliczna pozwalająca wykryć ukryte zagrożenia.\n* **Zakres BASIC + Analiza Składu Ciała:** Profesjonalne badanie na urządzeniu klasy medycznej (InBody).\n* **Co badamy?** Identyfikacja ryzyka metabolicznego (np. nagromadzenie tłuszczu trzewnego).\n* **Efekt:** Pełny obraz kondycji metabolicznej i konkretne wskazówki dietetyczne.",
  "Profilaktyka Serca": "### Ryzyko Sercowo-Naczyniowe\nKompleksowa ocena układu krążenia w celu zapobiegania zawałom i udarom.\n* **Badania:** Pełny lipidogram z kropli krwi z palca oraz pomiar ciśnienia tętniczego.\n* **Ocena ryzyka:** Wywiad zdrowotny i ocena ryzyka w perspektywie 10 lat.\n* **Zalecenia:** Raport i indywidualne wskazówki dotyczące diety i stylu życia.",
  "Spirometria": "### Spirometria – Zdrowe Płuca\nBadanie przesiewowe układu oddechowego, kluczowe w profilaktyce środowiskowej.\n* **Cel:** Wczesna identyfikacja schorzeń takich jak astma oskrzelowa lub POChP.\n* **Przebieg:** Badanie prowadzone przez uprawnionego medyka (najwyższe standardy higieniczne).\n* **Wynik:** Natychmiastowa informacja o wydolności płuc i zalecenia.",
  "USG": "### Mobilny Gabinet USG\nProfilaktyczne badania ultrasonograficzne na miejscu u pracodawcy.\n* **Przebieg:** Badanie trwa średnio ok. 15 minut na osobę. Wczesne wykrywanie zmian.\n* **Wynik:** Pracownik otrzymuje opis pisemny od razu po badaniu wraz z ewentualnym skierowaniem.",
  "Dermatoskopia": "### Dermatoskopia – Profilaktyka Czerniaka\nKonsultacja dermatologiczna z oceną znamion i zmian skórnych.\n* **Cel:** Wczesna identyfikacja zmian wymagających obserwacji.\n* **Specjalista:** Badanie prowadzone przez lekarza przy użyciu dermatoskopu.\n* **Zalecenia:** Informacja: kontrola, dalsza diagnostyka lub ochrona przeciwsłoneczna.",
  "Zarządzanie stresem": "### Strategia Psychologiczna i Zarządzanie Stresem\nDiagnostyka i edukacja w zakresie radzenia sobie z obciążeniem psychicznym.\n* **Diagnoza:** Weryfikacja indywidualnych strategii radzenia sobie ze stresem poprzez dedykowane narzędzia i testy psychologiczne.\n* **Edukacja:** Interwencja prowadzona przez psychologa, uświadamiająca mechanizmy stresu i dostarczająca narzędzi do budowania odporności psychicznej (rezyliencji).",
  "Zarządzanie stresem (Bez krwi)": "### Strategia Psychologiczna i Zarządzanie Stresem\nDiagnostyka i edukacja w zakresie radzenia sobie z obciążeniem psychicznym.\n* **Diagnoza:** Weryfikacja indywidualnych strategii radzenia sobie ze stresem poprzez dedykowane narzędzia i testy psychologiczne.\n* **Edukacja:** Interwencja prowadzona przez psychologa, uświadamiająca mechanizmy stresu i dostarczająca narzędzi do budowania odporności psychicznej.",
  "Zarządzanie stresem (Z krwią)": "### Strategia Psychologiczna i Zarządzanie Stresem (Rozszerzona)\nKompleksowa diagnostyka obejmująca testy oraz dedykowane badania laboratoryjne.\n* **Diagnoza i Badania:** Testy psychologiczne połączone z badaniem krwi oceniającym podłoże organiczne reakcji stresowych.\n* **Edukacja:** Interwencja psychologa oraz lekarza omawiająca wyniki i fizjologiczny wpływ stresu na organizm.",
  "Webinary Edukacyjne": "### Akademia Zdrowia – Edukacja Medyczna\nCykl interaktywnych spotkań z lekarzami i ekspertami medycyny stylu życia.\n* **Cel:** Budowanie świadomości zdrowotnej i zmiana nawyków pracowników.\n* **Forma:** Spotkania online z rozbudowaną sesją Q&A.\n* **Efekt:** Wyposażenie zespołu w rzetelną, medyczną wiedzę z zakresu żywienia, snu i aktywności.",
  "Program Roczny": "### Indywidualny Roczny Program Zdrowotny\nKompleksowa opieka zdrowotna rozłożona na 4 kwartały, zapewniająca ciągłość profilaktyki.\n* **Strategia:** Zamiast jednorazowej akcji, budujemy kulturę zdrowia w organizacji.\n* **Wygoda:** Stała miesięczna opłata i zaplanowany z góry harmonogram działań.\n* **Kompleksowość:** Połączenie badań fizykalnych, diagnostyki i edukacji (webinary).",
};

export const WEBINARY_TEMATY: string[] = [
  "1. Zasady zdrowego żywienia w medycynie stylu życia",
  "2. Aktywność fizyczna jako fundament prewencji chorób",
  "3. Funkcjonowanie w społeczeństwie oraz zarządzanie stresem",
  "4. Sen, regeneracja i uzależnienia w życiu codziennym",
  "5. Temat klienta – webinar na życzenie",
];

// --- PARAMETRY USŁUG ---
export interface ParametryUslugi {
  wydajnosc: number;
  koszt_mat: number;
  koszt_mat_dzien: number;
  stawka_local: number;
  stawka_remote: number;
}

export const PARAMETRY_USLUG: Record<string, ParametryUslugi> = {
  "Brak": { wydajnosc: 9999, koszt_mat: 0, koszt_mat_dzien: 0, stawka_local: 0, stawka_remote: 0 },
  "Spirometria": { wydajnosc: 40, koszt_mat: 5, koszt_mat_dzien: 0, stawka_local: 1000, stawka_remote: 1200 },
  "USG": { wydajnosc: 30, koszt_mat: 0, koszt_mat_dzien: 200, stawka_local: 5000, stawka_remote: 5500 },
  "Dermatoskopia": { wydajnosc: 45, koszt_mat: 0, koszt_mat_dzien: 0, stawka_local: 4500, stawka_remote: 5500 },
  "Cukrzyca BASIC": { wydajnosc: 50, koszt_mat: 40, koszt_mat_dzien: 0, stawka_local: 640, stawka_remote: 1000 },
  "Cukrzyca PREMIUM": { wydajnosc: 50, koszt_mat: 40, koszt_mat_dzien: 320, stawka_local: 640, stawka_remote: 1000 },
  "Kardiologia": { wydajnosc: 50, koszt_mat: 30, koszt_mat_dzien: 0, stawka_local: 640, stawka_remote: 1000 },
  "Profilaktyka Serca": { wydajnosc: 50, koszt_mat: 30, koszt_mat_dzien: 0, stawka_local: 640, stawka_remote: 1000 },
};

// --- STAŁE KOSZTOWE ---
export const KOSZT_NOCLEGU = 400.0;
export const STAWKA_KM = 1.0;
