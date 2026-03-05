import { PARAMETRY_USLUG, KOSZT_NOCLEGU, STAWKA_KM } from "./constants";

// --- WYNIK STRAŻNIKA RENTOWNOŚCI ---
export type StatusRentownosci = "success" | "warning" | "error";

export interface WynikStraznikaRentownosci {
  status: StatusRentownosci;
  msg: string;
  marza: number;
}

/**
 * Sprawdza rentowność oferty na podstawie kosztu operacyjnego, przychodu sztywnego (lab) i ceny końcowej.
 * Zwraca status, komunikat i procent marży.
 */
export function straznikRentownosci(
  kosztOperacyjny: number,
  przychodSztywnyLab: number,
  cenaKoncowa: number
): WynikStraznikaRentownosci {
  const przychodNaOperacje = cenaKoncowa - przychodSztywnyLab;

  if (kosztOperacyjny <= 0) {
    if (przychodNaOperacje > 0) {
      return { status: "success", msg: "✅ Rentowność OK", marza: 100.0 };
    }
    return { status: "warning", msg: "⚠️ Usługa bez marży", marza: 0.0 };
  }

  if (przychodNaOperacje < kosztOperacyjny) {
    const strata = kosztOperacyjny - przychodNaOperacje;
    return {
      status: "error",
      msg: `⛔ STOP! Tracisz ${strata.toFixed(2)} PLN.`,
      marza: -100,
    };
  }

  const zysk = przychodNaOperacje - kosztOperacyjny;
  const marza = (zysk / kosztOperacyjny) * 100;

  if (marza < 20) {
    return { status: "error", msg: `⛔ ODRZUCONA (${marza.toFixed(1)}%)`, marza };
  }
  if (marza >= 20 && marza < 21) {
    return { status: "warning", msg: `⚠️ SKRAJNIE NISKA (${marza.toFixed(1)}%)`, marza };
  }
  if (marza >= 21 && marza < 50) {
    return { status: "warning", msg: `⚠️ Niska rentowność (${marza.toFixed(1)}%)`, marza };
  }

  return { status: "success", msg: `✅ Rentowność OK (${marza.toFixed(1)}%)`, marza };
}

/**
 * Generuje opis logistyczny dla oferty (liczba uczestników + szczegóły lokalizacji).
 */
export function generujLogistykeOpis(pacjenci: number, opisLok: string): string {
  return `Liczba uczestników: ${pacjenci}\nSzczegóły:\n${opisLok}`;
}

/**
 * Symuluje czas realizacji usługi dla różnych konfiguracji zespołów.
 * Zwraca string z opcjami (np. "1 Zesp. ➡ 3 dni | 2 Zesp. ➡ 2 dni").
 */
export function symulacjaCzasu(pacjenci: number, wydajnosc: number, maxZ: number): string {
  if (pacjenci === 0) return "";

  const opcje: string[] = [];
  for (let n = 1; n <= maxZ; n++) {
    const dni = Math.ceil(pacjenci / (wydajnosc * n));
    opcje.push(`<b>${n} Zesp.</b> ➡ ${dni} dni`);
  }
  return opcje.join(" | ");
}

// --- TYPY DLA DYNAMICZNEGO KALKULATORA ---
export interface Lokalizacja {
  pacjenci: number;
  km: number;
  miasto?: string;
}

/**
 * Dynamiczny kalkulator kosztów rocznego programu zdrowotnego.
 * Iteruje po akcjach i lokalizacjach, sumując koszty operacyjne, materiałowe oraz lab.
 * Zwraca krotkę: [total_ops, total_mat_std, total_koszt_lab, total_przychod_lab]
 */
export function dynamicznyKalkulatorProgramu(
  akcje: string[],
  lokalizacje: Lokalizacja[],
  labKosztOsoba: number,
  labCenaOsoba: number
): [number, number, number, number] {
  let totalOps = 0.0;
  let totalMatStd = 0.0;
  let totalPrzychodLab = 0.0;
  let totalKosztLab = 0.0;

  for (const akcja of akcje) {
    if (akcja === "Brak") continue;

    for (const lok of lokalizacje) {
      const pacjenci = lok.pacjenci;
      const km = lok.km;

      if (pacjenci === 0) continue;

      if (akcja === "Zarządzanie stresem (Bez krwi)") {
        totalMatStd += pacjenci * 100.0;
        continue;
      }

      if (akcja === "Badania Lab" || akcja === "Zarządzanie stresem (Z krwią)") {
        const nZesp = Math.ceil(pacjenci / 100);
        const dni = Math.ceil(pacjenci / (100 * nZesp));
        const kPieleg = (pacjenci / 12.5) * 80.0;
        const kDojazd = km * 2 * STAWKA_KM * nZesp;
        const kHotel = km > 150 || dni > 1 ? dni * KOSZT_NOCLEGU * nZesp : 0.0;

        totalOps += kPieleg + kDojazd + kHotel;
        totalKosztLab += pacjenci * labKosztOsoba;
        totalPrzychodLab += pacjenci * labCenaOsoba;

        if (akcja === "Zarządzanie stresem (Z krwią)") {
          totalMatStd += pacjenci * 100.0;
        }
      } else {
        const p = PARAMETRY_USLUG[akcja] ?? PARAMETRY_USLUG["Brak"];
        const nZesp = 1;
        const dni = p.wydajnosc > 0 ? Math.ceil(pacjenci / p.wydajnosc) : 0;

        if (dni > 0) {
          const isRemote = km > 150;
          const stawka = isRemote ? p.stawka_remote : p.stawka_local;
          totalOps +=
            dni * stawka * nZesp +
            km * 2 * STAWKA_KM * nZesp +
            (isRemote || dni > 1 ? dni * KOSZT_NOCLEGU * nZesp : 0.0);
          totalMatStd += pacjenci * p.koszt_mat + dni * p.koszt_mat_dzien;
        }
      }
    }
  }

  return [totalOps, totalMatStd, totalKosztLab, totalPrzychodLab];
}
