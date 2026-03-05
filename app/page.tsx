"use client";

import { useState } from "react";
import {
  ClipboardList,
  Calendar,
  Target,
  CalendarDays,
  FlaskConical,
  Brain,
  Video,
  LogOut,
  Trash2,
  Stethoscope,
} from "lucide-react";
import { useStore } from "@/src/store/useStore";
import { DANE_HANDLOWCOW } from "@/src/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SummaryView from "@/src/components/views/SummaryView";
import CalendarView from "@/src/components/views/CalendarView";
import BudgetView from "@/src/components/views/BudgetView";
import YearlyProgramView from "@/src/components/views/YearlyProgramView";
import LabView from "@/src/components/views/LabView";
import StressView from "@/src/components/views/StressView";
import WebinarsView from "@/src/components/views/WebinarsView";
import StandardServiceView from "@/src/components/views/StandardServiceView";

const PASSWORD = "LongLife2024!";

type ViewId =
  | "summary"
  | "calendar"
  | "budget"
  | "yearly"
  | "lab"
  | "stress"
  | "webinars"
  | "cukrzyca-basic"
  | "cukrzyca-premium"
  | "kardiologia"
  | "spirometria"
  | "usg"
  | "dermatoskopia";

interface MenuItem {
  id: ViewId;
  label: string;
  icon: React.ReactNode;
  serviceName?: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: "summary", label: "Zestawienie Oferty", icon: <ClipboardList className="size-4" /> },
  { id: "calendar", label: "Kalendarz i Rezerwacje", icon: <Calendar className="size-4" /> },
  { id: "budget", label: "Dopasowanie do budżetu", icon: <Target className="size-4" /> },
  { id: "yearly", label: "Program Roczny (Abonament)", icon: <CalendarDays className="size-4" /> },
  { id: "lab", label: "Badania Laboratoryjne (Pakiet)", icon: <FlaskConical className="size-4" /> },
  { id: "stress", label: "Zarządzanie stresem", icon: <Brain className="size-4" /> },
  { id: "webinars", label: "Webinary i edukacja", icon: <Video className="size-4" /> },
  { id: "cukrzyca-basic", label: "Cukrzyca BASIC", icon: <Stethoscope className="size-4" />, serviceName: "Cukrzyca BASIC" },
  { id: "cukrzyca-premium", label: "Cukrzyca PREMIUM", icon: <Stethoscope className="size-4" />, serviceName: "Cukrzyca PREMIUM" },
  { id: "kardiologia", label: "Kardiologia", icon: <Stethoscope className="size-4" />, serviceName: "Kardiologia" },
  { id: "spirometria", label: "Spirometria", icon: <Stethoscope className="size-4" />, serviceName: "Spirometria" },
  { id: "usg", label: "USG w Firmie", icon: <Stethoscope className="size-4" />, serviceName: "USG w Firmie" },
  { id: "dermatoskopia", label: "Dermatoskopia", icon: <Stethoscope className="size-4" />, serviceName: "Dermatoskopia" },
];

function LoginScreen({
  onLogin,
  error,
}: {
  onLogin: (email: string, password: string) => void;
  error: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg transition-all duration-200">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Zaloguj się do systemu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Twój E-mail firmowy</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="np. jan@longlife.pl"
                className="transition-all duration-200"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Hasło dostępu</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="transition-all duration-200"
                required
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                ⛔ Błędny email lub hasło. Spróbuj ponownie.
              </p>
            )}
            <Button type="submit" size="lg" className="mt-2 w-full transition-all duration-200">
              Wejdź do generatora
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Sidebar({
  user,
  cartCount,
  currentView,
  onViewChange,
  onClearCart,
  onLogout,
}: {
  user: { imie: string; email: string };
  cartCount: number;
  currentView: ViewId;
  onViewChange: (id: ViewId) => void;
  onClearCart: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="flex w-64 min-w-64 flex-col border-r border-sidebar-border bg-[#212c52] text-white">
      <div className="border-b border-white/20 p-4">
        <p className="text-xs font-medium text-white/70">Zalogowano jako</p>
        <p className="break-words font-medium">{user.imie}</p>
        <p className="break-all text-sm text-white/80">{user.email}</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-white/70">
          Menu
        </p>
        <ul className="min-w-0 space-y-1">
          {MENU_ITEMS.map((item) => {
            const isSummary = item.id === "summary";
            const label = isSummary && cartCount > 0 ? `${item.label} (${cartCount})` : item.label;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onViewChange(item.id)}
                  className="force-wrap h-auto min-h-0 w-full min-w-0 justify-start gap-2 rounded-md px-3 py-2.5 text-left text-white transition-all duration-200 hover:bg-white/10 hover:text-white"
                >
                  {item.icon}
                  <span className="min-w-0 flex-1 text-left">{label}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="space-y-1 border-t border-white/20 p-3">
        <Button
          variant="ghost"
          onClick={onClearCart}
          className="force-wrap h-auto min-h-0 w-full min-w-0 justify-start gap-2 rounded-md px-3 py-2.5 text-white transition-all duration-200 hover:bg-white/10"
        >
          <Trash2 className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 text-left">Wyczyść koszyk</span>
        </Button>
        <Button
          variant="ghost"
          onClick={onLogout}
          className="force-wrap h-auto min-h-0 w-full min-w-0 justify-start gap-2 rounded-md px-3 py-2.5 text-white transition-all duration-200 hover:bg-red-500/20 hover:text-white"
        >
          <LogOut className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 text-left">Wyloguj</span>
        </Button>
      </div>
    </aside>
  );
}

function MainContent({ viewId }: { viewId: ViewId }) {
  const item = MENU_ITEMS.find((m) => m.id === viewId);
  const serviceName = item?.serviceName;

  if (viewId === "summary") return <SummaryView />;
  if (viewId === "calendar") return <CalendarView />;
  if (viewId === "budget") return <BudgetView />;
  if (viewId === "yearly") return <YearlyProgramView />;
  if (viewId === "lab") return <LabView />;
  if (viewId === "stress") return <StressView />;
  if (viewId === "webinars") return <WebinarsView />;
  if (serviceName) return <StandardServiceView serviceName={serviceName} />;

  return <SummaryView />;
}

export default function Home() {
  const { user, cart, setUser, clearCart, logout } = useStore();
  const [currentView, setCurrentView] = useState<ViewId>("summary");
  const [loginError, setLoginError] = useState(false);

  const handleLogin = (email: string, password: string) => {
    if (password !== PASSWORD) {
      setLoginError(true);
      return;
    }
    setLoginError(false);
    const emailLower = email.trim().toLowerCase();
    const handlowiec = DANE_HANDLOWCOW[emailLower] ?? {
      imie: "Nieznany Handlowiec",
      stanowisko: "Manager ds. Klientów",
      telefon: "",
    };
    setUser({
      email: emailLower,
      imie: handlowiec.imie,
      stanowisko: handlowiec.stanowisko,
      telefon: handlowiec.telefon,
    });
  };

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        user={{ imie: user.imie, email: user.email }}
        cartCount={cart.length}
        currentView={currentView}
        onViewChange={setCurrentView}
        onClearCart={clearCart}
        onLogout={logout}
      />
      <main className="flex-1 overflow-auto bg-background p-8">
        <div className="mx-auto max-w-4xl rounded-xl border border-border bg-card p-8 shadow-sm transition-all duration-200">
          <MainContent viewId={currentView} />
        </div>
      </main>
    </div>
  );
}
