/**
 * Bezpieczne mapowanie pól z bazy Supabase (różna wielkość liter: snake_case, CamelCase, PascalCase).
 */
export function normalizePackageFields(pkg: any) {
  const nazwa =
    pkg?.nazwa || pkg?.Nazwa || pkg?.nazwa_pakietu || pkg?.Nazwa_pakietu || "";
  const cena = Number(
    pkg?.cena ?? pkg?.Cena ?? pkg?.cena_detaliczna ?? 0
  );
  const koszt = Number(
    pkg?.koszt ?? pkg?.Koszt ?? pkg?.cena_hurtowa ?? 0
  );
  const skladniki =
    pkg?.skladniki || pkg?.Skladniki || pkg?.składniki || "Brak opisu";
  const cenaRynkowa = Number(
    pkg?.cena_rynkowa ?? pkg?.Cena_rynkowa ?? pkg?.cenaRynkowa ?? pkg?.cena ?? 0
  );
  return { nazwa, cena, koszt, skladniki, cenaRynkowa };
}
