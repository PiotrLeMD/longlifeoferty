import { create } from "zustand";

// --- TYPY ---

/** Wpis harmonogramu kwartalnego (akcja + webinar) */
export interface HarmonogramKwartal {
  akcja: string;
  webinar: string;
}

/** Pełna struktura harmonogramu rocznego programu (z dodaj_do_koszyka) */
export interface Harmonogram {
  "Kwartał 1": HarmonogramKwartal;
  "Kwartał 2": HarmonogramKwartal;
  "Kwartał 3": HarmonogramKwartal;
  "Kwartał 4": HarmonogramKwartal;
  dietetyk: boolean;
  dni_dietetyk: number;
}

/** Element koszyka – odpowiada strukturze z dodaj_do_koszyka */
export interface CartItem {
  usluga: string;
  cenaBrutto: number;
  cenaPerCapita: number;
  cenaRynkowaOsoba: number;
  marzaProcent: string;
  logistyka: string;
  abonament: boolean;
  harmonogram: Harmonogram | null;
  /** Rodzaje badań USG (tylko dla USG w Firmie) – bez wpływu na cenę */
  usgRodzajeBadan?: string[];
  /**
   * Suma kosztów operacyjnych + materiałów + lab (jak 1. arg straznika).
   * Brak = nie przeliczamy marży po rabacie w koszyku.
   */
  kosztOperacyjny?: number;
  /** Przychód „sztywny” lab (2. arg straznika), zwykle 0 */
  przychodSztywnyLab?: number;
  /** Szczegóły składu lab (pakiet + dodatki, opisy do PDF) */
  labCartDetal?: LabCartDetal;
}

/** Opis badania/pakietu lab do ewentualnego PDF (tylko jeśli zaznaczono w kreatorze) */
export interface LabOpisDoOferty {
  nazwa: string;
  tekst: string;
}

/** Szczegóły pozycji „Badania laboratoryjne” w koszyku */
export interface LabCartDetal {
  bazowyTryb: "custom" | "pakiety";
  /** Krótka etykieta: np. „Pakiet Własny” lub nazwy pakietów */
  etykietaBazowa: string;
  nazwyPakietowBazowych: string[];
  nazwyDodatkowychBadan: string[];
  /** Tylko zaznaczone „Dołącz opis do oferty” */
  opisyDoOferty: LabOpisDoOferty[];
}

/** Dane zalogowanego handlowca */
export interface User {
  email: string;
  imie: string;
  stanowisko: string;
  telefon: string;
}

// --- STAN APLIKACJI ---

interface AppState {
  cart: CartItem[];
  user: User | null;
  /** NIP klienta (formularz główny) */
  klientNip: string;
  /** URL logo klienta (formularz główny) */
  klientLogoUrl: string;
  /** Globalny rabat (%) stosowany w podsumowaniu koszyka; 0 = brak */
  globalRabatProcent: number;

  // Akcje
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  setGlobalRabatProcent: (procent: number) => void;
  setUser: (user: User | null) => void;
  setKlientNip: (nip: string) => void;
  setKlientLogoUrl: (url: string) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  cart: [],
  user: null,
  klientNip: "",
  klientLogoUrl: "",
  globalRabatProcent: 0,

  addToCart: (item) =>
    set((state) => ({
      cart: [...state.cart, item],
    })),

  removeFromCart: (index) =>
    set((state) => ({
      cart: state.cart.filter((_, i) => i !== index),
    })),

  clearCart: () => set({ cart: [], globalRabatProcent: 0 }),

  setGlobalRabatProcent: (procent) =>
    set({
      globalRabatProcent: Number.isFinite(procent)
        ? Math.max(0, Math.min(100, procent))
        : 0,
    }),

  setUser: (user) => set({ user }),

  setKlientNip: (nip) => set({ klientNip: nip }),
  setKlientLogoUrl: (url) => set({ klientLogoUrl: url }),

  logout: () =>
    set({
      user: null,
      cart: [],
      klientNip: "",
      klientLogoUrl: "",
      globalRabatProcent: 0,
    }),
}));
