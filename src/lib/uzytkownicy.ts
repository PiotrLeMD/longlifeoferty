import { supabase } from "@/src/lib/supabase";
import { DANE_HANDLOWCOW, type DaneHandlowca } from "@/src/lib/constants";

export type ProfilUzytkownika = DaneHandlowca;

/** Profil po zalogowaniu (e-mail musi być na liście w Supabase lub w constants). */
export async function pobierzProfilUzytkownika(
  email: string
): Promise<ProfilUzytkownika | null> {
  const { data, error } = await supabase
    .from("uzytkownicy")
    .select("imie, stanowisko, telefon")
    .eq("email", email)
    .eq("aktywny", true)
    .maybeSingle();

  if (!error && data) {
    return {
      imie: String(data.imie ?? ""),
      stanowisko: String(data.stanowisko ?? ""),
      telefon: String(data.telefon ?? ""),
    };
  }

  return DANE_HANDLOWCOW[email] ?? null;
}
