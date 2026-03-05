"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Mail,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  addDays,
  eachDayOfInterval,
  format,
  parseISO,
  isBefore,
} from "date-fns";
import { pl } from "date-fns/locale";
import {
  LIMIT_DZIENNY,
  USLUGI_INDYWIDUALNE,
  EMAIL_KOORDYNATORA,
} from "@/src/lib/constants";
import { useStore } from "@/src/store/useStore";
import { supabase } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Reservation {
  data_akcji: string;
  usluga: string;
  liczba_zespolow: number;
  klient?: string;
  lokalizacja?: string;
}

const DATE_SELECTION_TYPES = [
  "Pojedynczy dzień",
  "Zakres dat (od - do)",
  "Wiele pojedynczych dat",
] as const;

export default function CalendarView() {
  const { user } = useStore();
  const [reservationsDb, setReservationsDb] = useState<any[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [dateSelectionType, setDateSelectionType] =
    useState<(typeof DATE_SELECTION_TYPES)[number]>("Pojedynczy dzień");

  // Dla "Pojedynczy dzień"
  const [singleDate, setSingleDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Dla "Zakres dat"
  const [rangeStart, setRangeStart] = useState(format(new Date(), "yyyy-MM-dd"));
  const [rangeEnd, setRangeEnd] = useState(
    format(addDays(new Date(), 1), "yyyy-MM-dd")
  );

  // Dla "Wiele dat"
  const [multiDateInput, setMultiDateInput] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [multiDates, setMultiDates] = useState<string[]>([]);

  // Zapisywanie w toku
  const [reservSaving, setReservSaving] = useState(false);

  // Zakładki
  const [activeTab, setActiveTab] = useState<
    "Szybka Rezerwacja" | "Zapytanie Indywidualne"
  >("Szybka Rezerwacja");

  const fetchReservations = async () => {
    try {
      const { data } = await supabase.from("zajetosc_terminow").select("*");
      console.log("Otrzymane dane z bazy:", data);
      if (data) setReservationsDb(data);
    } catch {
      setReservationsDb([]);
    } finally {
      setReservationsLoading(false);
    }
  };

  useEffect(() => {
    setReservationsLoading(true);
    fetchReservations();
  }, []);

  // Form Szybka Rezerwacja
  const [reservUsluga, setReservUsluga] = useState<string>(
    Object.keys(LIMIT_DZIENNY)[0] ?? ""
  );
  const [reservTeams, setReservTeams] = useState(1);
  const [reservKlient, setReservKlient] = useState("");
  const [reservLokalizacja, setReservLokalizacja] = useState("");
  const [reservError, setReservError] = useState<string | null>(null);
  const [reservSuccess, setReservSuccess] = useState(false);

  // Form Zapytanie Indywidualne
  const [indUsluga, setIndUsluga] = useState(USLUGI_INDYWIDUALNE[0] ?? "");
  const [indKlient, setIndKlient] = useState("");
  const [indLokalizacja, setIndLokalizacja] = useState("");
  const [indDodatkowe, setIndDodatkowe] = useState("");
  const [indError, setIndError] = useState<string | null>(null);
  const [mailtoLink, setMailtoLink] = useState<string | null>(null);

  const limits = LIMIT_DZIENNY;

  const addMultiDate = () => {
    if (multiDateInput && !multiDates.includes(multiDateInput)) {
      setMultiDates((prev) => [...prev, multiDateInput].sort());
    }
  };

  const removeMultiDate = (d: string) => {
    setMultiDates((prev) => prev.filter((x) => x !== d));
  };

  // Zaktualizuj selectedDates ręcznie dla multi (używa multiDates)
  const effectiveSelectedDates =
    dateSelectionType === "Wiele pojedynczych dat"
      ? multiDates
      : dateSelectionType === "Pojedynczy dzień"
        ? singleDate
          ? [singleDate]
          : []
        : rangeStart && rangeEnd
          ? (() => {
              const start = parseISO(rangeStart);
              const end = parseISO(rangeEnd);
              if (isBefore(end, start)) return [];
              const days = eachDayOfInterval({ start, end });
              return days.map((d) => format(d, "yyyy-MM-dd"));
            })()
          : [];

  // Ujednolicenie daty z bazy (YYYY-MM-DD) – obcięcie czasu np. '2026-03-10T00:00:00'
  const toDateOnly = (val: unknown): string => {
    if (!val) return "";
    const s = String(val);
    return s.includes("T") ? s.split("T")[0]! : s;
  };

  // Dostępność: dla każdej daty i usługi – suma zablokowanych zespołów (dateStr w 'yyyy-MM-dd').
  // Kolumna usluga może zawierać wiele usług po przecinku (np. "USG, Badania Lab").
  const getZajeteForDate = (dateStr: string, usluga: string): number => {
    return reservationsDb
      .filter((r: any) => {
        const dbDate = toDateOnly(r.data_akcji);
        const dbUsluga = String(r.usluga || r.Usluga || "");
        const isServiceMatch =
          dbUsluga &&
          dbUsluga.toLowerCase().includes(usluga.toLowerCase());
        return dbDate === dateStr && isServiceMatch;
      })
      .reduce((s: number, r: any) => s + (Number(r.liczba_zespolow ?? r.Liczba_zespolow) ?? 0), 0);
  };

  const availabilityData = useMemo(() => {
    const uslugi = Object.keys(limits);
    return effectiveSelectedDates.map((dateStr) => {
      const row: Record<string, string | number> = { date: dateStr };
      uslugi.forEach((u) => {
        const limit = limits[u];
        const zajete = getZajeteForDate(dateStr, u);
        row[u] = Math.max(0, limit - zajete);
      });
      return row;
    });
  }, [effectiveSelectedDates, reservationsDb, limits]);

  const handleZablokuj = async () => {
    setReservError(null);
    setReservSuccess(false);
    if (!reservKlient.trim() || !reservLokalizacja.trim()) {
      setReservError("Podaj nazwę klienta i lokalizację akcji!");
      toast.error("Podaj nazwę klienta i lokalizację akcji!");
      return;
    }
    const limit = limits[reservUsluga] ?? 0;
    for (const d of effectiveSelectedDates) {
      const zajete = getZajeteForDate(d, reservUsluga);
      if (zajete + reservTeams > limit) {
        const msg = `Brak zasobów w dniu ${format(parseISO(d), "dd.MM.yyyy", { locale: pl })}! Próbujesz zarezerwować ${reservTeams} zesp., ale zostało tylko ${limit - zajete}.`;
        setReservError(msg);
        toast.error(msg);
        return;
      }
    }
    setReservSaving(true);
    try {
      const handlowiec = user?.imie ?? "Nieznany";
      for (const d of effectiveSelectedDates) {
        const dataAkcjiNorm = String(d).split("T")[0] ?? String(d);
        const { error } = await supabase.from("zajetosc_terminow").insert({
          data_akcji: dataAkcjiNorm,
          usluga: reservUsluga,
          liczba_zespolow: reservTeams,
          klient: reservKlient,
          handlowiec,
          lokalizacja: reservLokalizacja,
        });
        if (error) throw error;
      }
      setReservSuccess(true);
      toast.success(`Rezerwacja potwierdzona dla ${reservKlient} (${effectiveSelectedDates.length} dni)!`);
      await fetchReservations();
    } catch (err: any) {
      const msg = err?.message ?? "Błąd zapisu rezerwacji. Spróbuj ponownie.";
      setReservError(msg);
      toast.error(msg);
    } finally {
      setReservSaving(false);
    }
  };

  const handleGenerujZapytanie = () => {
    setIndError(null);
    setMailtoLink(null);
    if (!indKlient.trim() || !indLokalizacja.trim()) {
      setIndError("Podaj nazwę klienta oraz lokalizację.");
      toast.error("Podaj nazwę klienta oraz lokalizację.");
      return;
    }
    const datyStr = effectiveSelectedDates
      .map((d) => format(parseISO(d), "dd.MM.yyyy", { locale: pl }))
      .join(", ");
    const temat = `ZAPYTANIE O DOSTĘPNOŚĆ - ${indUsluga} - ${indKlient}`;
    const tresc = `Cześć,

Proszę o sprawdzenie dostępności personelu dla poniższej akcji:

Klient: ${indKlient}
Lokalizacja: ${indLokalizacja}
Proponowane Daty: ${datyStr || "(nie wybrano dat)"}
Usługa: ${indUsluga}
Handlowiec: ${user?.imie ?? "Nieznany"}

Notatki:
${indDodatkowe}

Proszę o szybkie potwierdzenie.
Pozdrawiam.`;
    const link = `mailto:${EMAIL_KOORDYNATORA}?subject=${encodeURIComponent(temat)}&body=${encodeURIComponent(tresc)}`;
    setMailtoLink(link);
  };

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
        <Calendar className="h-6 w-6 text-blue-600" />
        Dostępność Zasobów i Rezerwacje
      </h1>
      <p className="text-slate-600">
        Sprawdź dostępność zespołów na dany dzień w całej Polsce lub wyślij
        zapytanie do koordynatora o zasoby specjalistyczne.
      </p>

      {/* KROK 1: Wybór dat */}
      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
          <CardTitle>KROK 1: Wybierz termin(y) akcji</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="mb-4 flex flex-wrap gap-4">
          {DATE_SELECTION_TYPES.map((t) => (
            <label
              key={t}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 transition-colors hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
            >
              <input
                type="radio"
                name="dateSelectionType"
                value={t}
                checked={dateSelectionType === t}
                onChange={() => setDateSelectionType(t)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-700">{t}</span>
            </label>
          ))}
        </div>

        {dateSelectionType === "Pojedynczy dzień" && (
          <div className="space-y-2">
            <Label>Wybierz datę</Label>
            <Input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="max-w-xs"
            />
          </div>
        )}

        {dateSelectionType === "Zakres dat (od - do)" && (
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <Label>Data początkowa</Label>
              <Input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data końcowa</Label>
              <Input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        {dateSelectionType === "Wiele pojedynczych dat" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="date"
                value={multiDateInput}
                onChange={(e) => setMultiDateInput(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={addMultiDate}>
                <Plus className="size-4" />
                Dodaj datę
              </Button>
            </div>
            {multiDates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {multiDates.map((d) => (
                  <span
                    key={d}
                    className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm"
                  >
                    {format(parseISO(d), "dd.MM.yyyy", { locale: pl })}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeMultiDate(d)}
                      className="h-6 w-6 text-slate-400 hover:bg-red-100 hover:text-red-600"
                      aria-label="Usuń"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {effectiveSelectedDates.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-600">
              Wybrane daty ({effectiveSelectedDates.length}):
            </p>
            <div className="flex flex-wrap gap-2">
              {effectiveSelectedDates.map((d) => (
                <span
                  key={d}
                  className="rounded-lg bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                >
                  {format(parseISO(d), "dd.MM.yyyy", { locale: pl })}
                </span>
              ))}
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {effectiveSelectedDates.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Wybierz przynajmniej jedną datę powyżej, aby zobaczyć kalendarz
          dostępności.
        </div>
      )}

      {effectiveSelectedDates.length > 0 && (
        <Card className="shadow-sm transition-all duration-200">
          <CardHeader>
            <CardTitle>KROK 2: Rezerwacja lub zapytanie</CardTitle>
          </CardHeader>
          <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="mb-6 flex flex-wrap gap-1">
              <TabsTrigger value="Szybka Rezerwacja" className="force-wrap text-left">
                Szybka Rezerwacja
              </TabsTrigger>
              <TabsTrigger value="Zapytanie Indywidualne" className="force-wrap text-left">
                Zapytanie Indywidualne
              </TabsTrigger>
            </TabsList>

          <TabsContent value="Szybka Rezerwacja" className="space-y-6 mt-0">
            <div className="space-y-6">
              {reservationsLoading && (
                <p className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600">
                  Ładowanie dostępności...
                </p>
              )}
              <div>
                <h3 className="mb-3 font-medium text-slate-800">
                  {effectiveSelectedDates.length === 1
                    ? `Dostępność na dzień: ${format(parseISO(effectiveSelectedDates[0]), "dd.MM.yyyy", { locale: pl })}`
                    : `Tabela dostępności dla wybranego zakresu (${effectiveSelectedDates.length} dni)`}
                </h3>
                {effectiveSelectedDates.length === 1 ? (
                  <div className="space-y-4">
                    {Object.entries(limits).map(([usluga, limit]) => {
                      const zajete = getZajeteForDate(
                        effectiveSelectedDates[0],
                        usluga
                      );
                      const wolne = Math.max(0, limit - zajete);
                      const pct = limit > 0 ? zajete / limit : 0;
                      return (
                        <div key={usluga}>
                          <div className="mb-1 flex flex-wrap justify-between gap-2 text-sm">
                            <span className="force-wrap min-w-0 font-medium text-slate-700">
                              {usluga}
                            </span>
                            <span className="text-slate-600">
                              Zarezerwowano: {zajete}/{limit} | Dostępne: {wolne}
                            </span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{
                                width: `${Math.min(100, pct * 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-2 text-left font-medium text-slate-700">
                            Data akcji
                          </th>
                          {Object.keys(limits).map((u) => (
                            <th
                              key={u}
                              className="force-wrap min-w-[120px] max-w-[200px] px-4 py-2 text-left font-medium text-slate-700"
                            >
                              {u}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {availabilityData.map((row) => (
                          <tr
                            key={row.date}
                            className="border-b border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-4 py-2 font-medium text-slate-800">
                              {format(parseISO(String(row.date)), "dd.MM.yyyy", {
                                locale: pl,
                              })}
                            </td>
                            {Object.keys(limits).map((u) => (
                              <td key={u} className="px-4 py-2 text-slate-600">
                                {row[u] ?? 0} wolnych
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <hr className="border-slate-200" />
              <div>
                <h3 className="mb-3 font-medium text-slate-800">
                  Zablokuj zespoły w kalendarzu
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Usługa</Label>
                    <Select value={reservUsluga} onValueChange={setReservUsluga}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(limits).map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Liczba zespołów</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={reservTeams}
                      onChange={(e) =>
                        setReservTeams(
                          Math.min(5, Math.max(1, parseInt(e.target.value) || 1))
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nazwa Klienta (Firmy)</Label>
                    <Input
                      value={reservKlient}
                      onChange={(e) => setReservKlient(e.target.value)}
                      placeholder="np. Firma XYZ"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Lokalizacja</Label>
                    <Input
                      value={reservLokalizacja}
                      onChange={(e) => setReservLokalizacja(e.target.value)}
                      placeholder="np. Fabryka Wrocław"
                    />
                  </div>
                </div>
                {reservError && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                    <AlertCircle className="size-4 shrink-0" />
                    {reservError}
                  </div>
                )}
                {reservSuccess && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">
                    <CheckCircle2 className="size-4 shrink-0" />
                    Rezerwacja potwierdzona dla klienta {reservKlient} (
                    {effectiveSelectedDates.length} dni)!
                  </div>
                )}
                <Button
                  onClick={handleZablokuj}
                  disabled={reservSaving}
                  size="lg"
                  className="mt-4 w-full"
                >
                  {reservSaving ? "Zapisywanie..." : "Zablokuj zespoły na wybrane daty"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="Zapytanie Indywidualne" className="mt-0">
            <div className="space-y-4">
              <h3 className="font-medium text-slate-800">
                Wymagane ustalenia z koordynatorem (Specjaliści / USG)
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Usługa specjalistyczna</Label>
                  <Select value={indUsluga} onValueChange={setIndUsluga}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USLUGI_INDYWIDUALNE.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nazwa Klienta</Label>
                  <Input
                    value={indKlient}
                    onChange={(e) => setIndKlient(e.target.value)}
                    placeholder="np. Firma ABC"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Lokalizacja (Miasto / Oddział)</Label>
                <Input
                  value={indLokalizacja}
                  onChange={(e) => setIndLokalizacja(e.target.value)}
                  placeholder="np. Warszawa - Mokotów"
                />
              </div>
              <div className="space-y-2">
                <Label>Dodatkowe informacje</Label>
                <Textarea
                  value={indDodatkowe}
                  onChange={(e) => setIndDodatkowe(e.target.value)}
                  rows={3}
                  placeholder="np. Klient zgadza się też na dzień wcześniej"
                />
              </div>
              {indError && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
                  <AlertCircle className="size-4 shrink-0" />
                  {indError}
                </div>
              )}
              {mailtoLink && (
                <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
                  Wiadomość gotowa! Kliknij poniższy przycisk.
                </div>
              )}
              <Button onClick={handleGenerujZapytanie} size="lg" className="w-full">
                Generuj Zapytanie (E-mail)
              </Button>
              {mailtoLink && (
                <Button variant="outline" size="lg" asChild className="mt-3 w-full">
                  <a
                    href={mailtoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    <Mail className="size-4" />
                    Otwórz E-mail i wyślij
                  </a>
                </Button>
              )}
            </div>
          </TabsContent>
          </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
