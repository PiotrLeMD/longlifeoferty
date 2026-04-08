"use client";

import pptxgen from "pptxgenjs";
import { supabase } from "./supabase";
import { OPISY_MARKETINGOWE } from "./constants";

const COLORS = {
  navy: "212c52",
  red: "ff003b",
  white: "FFFFFF",
  gray: "4b5563",
  grayLight: "f5f5f5",
};

export interface PPTXClientData {
  firma: string;
  adres?: string;
  kontakt?: string;
  email?: string;
}

export interface PPTXHandlowiecData {
  imie: string;
  stanowisko?: string;
  email: string;
  telefon?: string;
}

/** Element oferty – usługa z liczbą pracowników i ceną */
export interface PPTXSelectedPackage {
  usluga: string;
  count: number; // liczba pracowników
  cena: number; // cena jedn. netto (PLN)
  wartosc: number; // wartość netto (PLN)
}

export interface OpisPrezentacji {
  nazwa: string;
  tytul_slajdu: string;
  opis_korzysci: string;
}

/** Mapuje nazwę usługi na klucz do tabeli opisy_prezentacji (nazwa_pakietu) */
function mapUslugaToKey(usluga: string): string {
  if (usluga.includes("Badania Lab")) return "Badania Laboratoryjne";
  if (usluga.includes("Zarządzanie stresem")) return "Zarządzanie stresem";
  if (usluga.includes("Roczny Program") || usluga.includes("Indywidualny Program"))
    return "Program Roczny";
  if (usluga.includes("Pakiet Webinarów") || usluga.startsWith("Webinar:"))
    return "Webinary Edukacyjne";
  const direct = [
    "USG w Firmie",
    "Kardiologia",
    "Spirometria",
    "Dermatoskopia",
    "Cukrzyca BASIC",
    "Cukrzyca PREMIUM",
    "Profilaktyka Serca",
  ];
  for (const k of direct) {
    if (usluga.includes(k)) return k;
  }
  if (usluga.includes("USG")) return "USG";
  return usluga;
}

/** Parsuje opis markdown na tytuł i listę korzyści (fallback gdy brak w DB) */
function parseOpisMarketingowy(md: string): { tytul: string; korzysci: string[] } {
  const lines = md
    .replace(/\*\*/g, "")
    .split("\n")
    .map((l: string) => l.trim())
    .filter(Boolean);
  let tytul = "";
  const korzysci: string[] = [];
  for (const line of lines) {
    if (line.startsWith("### ")) {
      tytul = line.replace(/^###\s*/, "");
    } else if (line.startsWith("* ") || line.startsWith("- ")) {
      const txt = line.replace(/^[\*\-]\s*/, "").replace(/^\*\*[^*]+\*\*:\s*/, "");
      if (txt) korzysci.push(txt);
    }
  }
  if (!tytul && lines[0]) tytul = lines[0];
  return { tytul, korzysci };
}

/** Pobiera opisy z opisy_prezentacji po nazwa_pakietu (lub nazwa dla kompatybilności) */
async function getOpisyPrezentacji(
  keys: string[]
): Promise<Map<string, OpisPrezentacji>> {
  const result = new Map<string, OpisPrezentacji>();
  const uniq = [...new Set(keys)];

  try {
    const col = "nazwa_pakietu";
    let data: { nazwa?: string; nazwa_pakietu?: string; tytul_slajdu?: string; opis_korzysci?: string }[] | null = null;
    try {
      const res = await supabase
        .from("opisy_prezentacji")
        .select("nazwa, nazwa_pakietu, tytul_slajdu, opis_korzysci")
        .in(col, uniq);
      data = res.data;
    } catch {
      const res = await supabase
        .from("opisy_prezentacji")
        .select("nazwa, tytul_slajdu, opis_korzysci")
        .in("nazwa", uniq);
      data = res.data;
    }

    if (data) {
      for (const row of data) {
        const key = (row.nazwa_pakietu ?? row.nazwa) as string;
        const korzysci = (row.opis_korzysci ?? "")
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean);
        const op: OpisPrezentacji = {
          nazwa: key,
          tytul_slajdu: (row.tytul_slajdu ?? row.nazwa ?? key) as string,
          opis_korzysci: korzysci.join("\n"),
        };
        result.set(key, op);
        if (row.nazwa) result.set(row.nazwa, op);
        if (row.nazwa_pakietu) result.set(row.nazwa_pakietu, op);
      }
    }
  } catch {
    /* tabela może nie istnieć */
  }

  for (const key of uniq) {
    if (!result.has(key)) {
      const md =
        OPISY_MARKETINGOWE[key] ??
        OPISY_MARKETINGOWE["Badania Laboratoryjne"];
      const { tytul, korzysci } = parseOpisMarketingowy(md);
      result.set(key, {
        nazwa: key,
        tytul_slajdu: tytul || key,
        opis_korzysci: korzysci.join("\n"),
      });
    }
  }
  return result;
}

/** Generuje prezentację oferty w formacie PPTX */
export async function generatePPTX(
  selectedPackages: PPTXSelectedPackage[],
  clientName: string,
  totalPrice: number,
  handlowiec: PPTXHandlowiecData,
  logoUrl: string,
  fileName: string
): Promise<void> {
  const pres = new pptxgen();
  pres.defineLayout({ name: "A4", width: 10, height: 5.625 });
  pres.layout = "A4";

  const keys = selectedPackages.map((p) => mapUslugaToKey(p.usluga));
  const opisy = await getOpisyPrezentacji(keys);
  const today = new Date().toLocaleDateString("pl-PL");

  // S1 – Slajd tytułowy
  const slide1 = pres.addSlide();
  slide1.background = { color: COLORS.navy };

  try {
    slide1.addImage({
      path: logoUrl,
      x: 0.5,
      y: 0.4,
      w: 2.5,
      h: 1,
    });
  } catch {
    /* logo może być niedostępne */
  }

  slide1.addText("PROPOZYCJA WSPÓŁPRACY", {
    x: 0.5,
    y: 1.6,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: COLORS.white,
    align: "left",
  });

  slide1.addText(`${clientName || "Klient"}\n${today}`, {
    x: 0.5,
    y: 2.6,
    w: 5,
    h: 1,
    fontSize: 16,
    color: COLORS.white,
    align: "left",
  });

  // S2 – Slajd inwestycji (tabela)
  const slide2 = pres.addSlide();
  slide2.addText("Inwestycja", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 24,
    bold: true,
    color: COLORS.navy,
  });

  type TableRowType = Array<{ text: string; options?: Record<string, unknown> }>;
  const headerRow: TableRowType = [
    { text: "Usługa", options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white, align: "left", margin: 0.08 } },
    { text: "Liczba pracowników", options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white, align: "center", margin: 0.08 } },
    { text: "Cena jedn. netto", options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white, align: "right", margin: 0.08 } },
    { text: "Wartość netto", options: { bold: true, fill: { color: COLORS.navy }, color: COLORS.white, align: "right", margin: 0.08 } },
  ];

  const dataRows: TableRowType[] = selectedPackages.map((pkg) => {
    const countStr = pkg.count > 0 ? String(pkg.count) : "—";
    return [
      { text: pkg.usluga, options: { align: "left", margin: 0.06 } },
      { text: countStr, options: { align: "center", margin: 0.06 } },
      { text: `${pkg.cena.toFixed(2)} PLN`, options: { align: "right", margin: 0.06 } },
      { text: `${pkg.wartosc.toFixed(2)} PLN`, options: { align: "right", margin: 0.06 } },
    ];
  });

  const tableRows: TableRowType[] = [headerRow, ...dataRows];

  slide2.addTable(tableRows, {
    x: 0.5,
    y: 1,
    w: 9,
    colW: [4.5, 1.8, 1.6, 1.6],
    border: { pt: 0.5, color: "cccccc" },
    margin: 0.04,
    fontSize: 11,
  });

  slide2.addText(`SUMA OFERTY: ${totalPrice.toFixed(2)} zł netto`, {
    x: 0.5,
    y: 4.2,
    w: 9,
    h: 0.8,
    fontSize: 22,
    bold: true,
    color: COLORS.red,
    align: "right",
  });

  slide2.addShape("rect", {
    x: 0,
    y: 5.2,
    w: "100%",
    h: 0.4,
    fill: { color: COLORS.red },
  });

  // S3 i kolejne – Szczegóły usług
  for (const pkg of selectedPackages) {
    const key = mapUslugaToKey(pkg.usluga);
    const opis = opisy.get(key) ?? {
      nazwa: key,
      tytul_slajdu: pkg.usluga,
      opis_korzysci: "Szczegóły ustalane indywidualnie.",
    };

    const slide = pres.addSlide();
    slide.addText(opis.tytul_slajdu, {
      x: 0.5,
      y: 0.35,
      w: 6,
      h: 0.55,
      fontSize: 24,
      bold: true,
      color: COLORS.navy,
    });

    const bullets = opis.opis_korzysci
      .split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean);

    const bulletArr = bullets.map((b) => ({
      text: b,
      options: { bullet: true },
    }));

    if (bulletArr.length > 0) {
      slide.addText(bulletArr, {
        x: 0.5,
        y: 1.1,
        w: 5.5,
        h: 3,
        fontSize: 12,
        color: COLORS.gray,
        valign: "top",
      });
    }

    // Panel boczny informacyjny
    const panelLines = [
      "Miejsce: Biuro Klienta",
      "Czas: ok. 10 min/os",
      "Realizacja: Zespół Medyczny Long Life",
    ];
    slide.addShape("rect", {
      x: 6.3,
      y: 1,
      w: 3,
      h: 2.2,
      fill: { color: COLORS.grayLight },
      line: { color: "e5e7eb", pt: 0.5 },
    });
    slide.addText(panelLines.join("\n"), {
      x: 6.5,
      y: 1.2,
      w: 2.6,
      h: 1.8,
      fontSize: 11,
      color: COLORS.gray,
      valign: "top",
    });

    slide.addShape("rect", {
      x: 0,
      y: 5.2,
      w: "100%",
      h: 0.4,
      fill: { color: COLORS.red },
    });
  }

  // S_Last – Slajd kontaktowy
  const slideEnd = pres.addSlide();
  slideEnd.background = { color: COLORS.navy };

  try {
    slideEnd.addImage({
      path: logoUrl,
      x: 4,
      y: 0.5,
      w: 2,
      h: 0.8,
    });
  } catch {
    /* ignore */
  }

  slideEnd.addText("Dziękujemy za zaufanie", {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 0.7,
    fontSize: 28,
    bold: true,
    color: COLORS.white,
    align: "center",
  });

  slideEnd.addText("Skontaktuj się z nami", {
    x: 0.5,
    y: 2.3,
    w: 9,
    h: 0.4,
    fontSize: 14,
    color: COLORS.white,
    align: "center",
  });

  const contactLines = [
    handlowiec.imie,
    handlowiec.stanowisko,
    handlowiec.email,
    handlowiec.telefon,
    "Long Life S.A. | 00-728 Warszawa, ul. Bobrowiecka 8",
    "NIP: 9512531254 | REGON: 520678780 | KRS: 0000937259",
  ].filter(Boolean);

  slideEnd.addText(contactLines.join("\n"), {
    x: 0.5,
    y: 2.9,
    w: 9,
    h: 2,
    fontSize: 12,
    color: COLORS.white,
    align: "center",
    valign: "top",
  });

  await pres.writeFile({ fileName });
}
