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

  // Akcje
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  cart: [],
  user: null,

  addToCart: (item) =>
    set((state) => ({
      cart: [...state.cart, item],
    })),

  removeFromCart: (index) =>
    set((state) => ({
      cart: state.cart.filter((_, i) => i !== index),
    })),

  clearCart: () => set({ cart: [] }),

  setUser: (user) => set({ user }),

  logout: () => set({ user: null, cart: [] }),
}));
