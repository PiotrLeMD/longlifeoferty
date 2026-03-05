"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { WEBINARY_TEMATY } from "@/src/lib/constants";
import { dynamicznyKalkulatorProgramu } from "@/src/lib/calculations";
import { useStore } from "@/src/store/useStore";
import { supabase } from "@/src/lib/supabase";
import { normalizePackageFields } from "@/src/lib/normalizePackage";
import type { Harmonogram } from "@/src/store/useStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Location {
  id: number;
  city: string;
  patients: number;
  km: number;
}

const OPCJE_CUSTOM = [
  "Brak",
  "Badania Lab",
  "Dermatoskopia",
  "USG",
  "Spirometria",
  "Cukrzyca BASIC",
  "Cukrzyca PREMIUM",
  "Profilaktyka Serca",
  "Zarządzanie stresem (Bez krwi)",
  "Zarządzanie stresem (Z krwią)",
];

const PRIORYTETY = [
  "Choroby krążenia",
  "Profilaktyka otyłości / cukrzycy",
  "Kondycja psychiczna / Stres",
  "Ogólny Screening Zdrowia",
];

const DEFAULT_LOCATION: Omit<Location, "id"> = {
  city: "",
  patients: 0,
  km: 0,
};

function zbudujNazweAkcji(
  bazowaAkcja: string,
  wybraneLaby: string[] | string | null
): string {
  if (
    (bazowaAkcja === "Badania Lab" ||
      bazowaAkcja === "Zarządzanie stresem (Z krwią)") &&
    wybraneLaby
  ) {
    const arr = Array.isArray(wybraneLaby) ? wybraneLaby : [wybraneLaby];
    return arr.length ? `${bazowaAkcja} (Pakiet: ${arr.join(", ")})` : bazowaAkcja;
  }
  return bazowaAkcja;
}

export default function YearlyProgramView() {
  const { addToCart } = useStore();
  const [packagesDb, setPackagesDb] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [idCounter, setIdCounter] = useState(1);
  const [locations, setLocations] = useState<Location[]>([
    { ...DEFAULT_LOCATION, id: 0 },
  ]);
  const [activeTab, setActiveTab] = useState<"szablony" | "custom">("szablony");
  const [finalYearlyPrice, setFinalYearlyPrice] = useState(0);

  // Szablony
  const [profile, setProfile] = useState("Biuro / IT");
  const [dietitian, setDietitian] = useState(false);
  const [dietitianDays, setDietitianDays] = useState(1);
  const [webinars, setWebinars] = useState({
    q1: WEBINARY_TEMATY[0] ?? "",
    q2: WEBINARY_TEMATY[3] ?? "",
    q3: WEBINARY_TEMATY[2] ?? "",
    q4: WEBINARY_TEMATY[1] ?? "",
  });
  const [q4LabPackage, setQ4LabPackage] = useState("");

  // Custom
  const [priority, setPriority] = useState(PRIORYTETY[0]);
  const [customDietitian, setCustomDietitian] = useState(false);
  const [customDietitianDays, setCustomDietitianDays] = useState(1);
  const [customActions, setCustomActions] = useState({
    q1: OPCJE_CUSTOM[1],
    q2: OPCJE_CUSTOM[2],
    q3: OPCJE_CUSTOM[8],
    q4: OPCJE_CUSTOM[4],
  });
  const [customWebinars, setCustomWebinars] = useState({
    q1: WEBINARY_TEMATY[0] ?? "",
    q2: WEBINARY_TEMATY[1] ?? "",
    q3: WEBINARY_TEMATY[2] ?? "",
    q4: WEBINARY_TEMATY[3] ?? "",
  });
  const [customLabPackages, setCustomLabPackages] = useState<string[]>([]);

  const totalPatients = useMemo(
    () => locations.reduce((s, l) => s + l.patients, 0),
    [locations]
  );

  const opisLokProg = useMemo(
    () =>
      locations
        .map((l, i) => `- ${l.city || `Lok ${i + 1}`}: ${l.patients} os.\n`)
        .join(""),
    [locations]
  );

  const lokalizacjeForKalk = useMemo(
    () =>
      locations
        .filter((l) => l.patients > 0)
        .map((l) => ({ pacjenci: l.patients, km: l.km, miasto: l.city })),
    [locations]
  );

  useEffect(() => {
    let cancelled = false;
    async function fetchPackages() {
      setIsLoading(true);
      try {
        const { data } = await supabase.from("badania").select("*");
        console.log("Otrzymane dane z bazy:", data);
        if (!cancelled && data) {
          setPackagesDb(data);
          setQ4LabPackage((prev) =>
            prev === "" && data.length > 0
              ? (normalizePackageFields(data[0]).nazwa || "Pakiet 1")
              : prev
          );
        }
      } catch {
        if (!cancelled) setPackagesDb([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchPackages();
    return () => { cancelled = true; };
  }, []);

  const addLocation = () => {
    const newId = idCounter;
    setIdCounter((c) => c + 1);
    setLocations((prev) => [...prev, { ...DEFAULT_LOCATION, id: newId }]);
  };

  const removeLocation = (id: number) => {
    if (locations.length <= 1) return;
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };

  const updateLocation = (
    id: number,
    field: keyof Location,
    value: string | number
  ) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const suggestedPrice = useMemo(() => {
    if (totalPatients <= 0 || lokalizacjeForKalk.length === 0) return 0;

    if (activeTab === "szablony") {
      if (profile === "Biuro / IT") {
        const akcje = [
          "Cukrzyca PREMIUM",
          "Dermatoskopia",
          "Zarządzanie stresem (Bez krwi)",
          "Profilaktyka Serca",
        ];
        const [ops, matStd, , pLab] = dynamicznyKalkulatorProgramu(
          akcje,
          lokalizacjeForKalk,
          0,
          0
        );
        return pLab + (ops + matStd) * 1.8 + 9500 + (dietitian ? dietitianDays * 4000 : 0);
      } else {
        const akcje = [
          "Cukrzyca BASIC",
          "Spirometria",
          "Profilaktyka Serca",
          "Badania Lab",
        ];
        const pkg = packagesDb.find((p: any) => {
          const { nazwa } = normalizePackageFields(p);
          return nazwa === q4LabPackage;
        });
        const { koszt: labKoszt, cena: labCena } = pkg
          ? normalizePackageFields(pkg)
          : { koszt: 0, cena: 0 };
        const [ops, matStd, , pLab] = dynamicznyKalkulatorProgramu(
          akcje,
          lokalizacjeForKalk,
          labKoszt,
          labCena
        );
        return pLab + (ops + matStd) * 1.8 + 9500 + (dietitian ? dietitianDays * 4000 : 0);
      }
    } else {
      const akcje = [
        customActions.q1,
        customActions.q2,
        customActions.q3,
        customActions.q4,
      ];
      let labKoszt = 0,
        labCena = 0;
      if (customLabPackages.length > 0) {
        const selected = packagesDb.filter((p: any, idx: number) => {
          const { nazwa } = normalizePackageFields(p);
          const displayNazwa = nazwa || `Pakiet ${idx + 1}`;
          return customLabPackages.includes(displayNazwa);
        });
        labKoszt = selected.reduce((s, p) => s + normalizePackageFields(p).koszt, 0);
        labCena = selected.reduce((s, p) => s + normalizePackageFields(p).cena, 0);
      }
      const [ops, matStd, , pLab] = dynamicznyKalkulatorProgramu(
        akcje,
        lokalizacjeForKalk,
        labKoszt,
        labCena
      );
      return (
        pLab +
        (ops + matStd) * 1.8 +
        9500 +
        (customDietitian ? customDietitianDays * 4000 : 0)
      );
    }
  }, [
    activeTab,
    profile,
    dietitian,
    dietitianDays,
    packagesDb,
    q4LabPackage,
    customActions,
    customDietitian,
    customDietitianDays,
    customLabPackages,
    totalPatients,
    lokalizacjeForKalk,
  ]);

  useEffect(() => {
    if (totalPatients === 0) {
      setFinalYearlyPrice(0);
    } else {
      setFinalYearlyPrice(Math.round(suggestedPrice * 100) / 100);
    }
  }, [totalPatients, suggestedPrice]);

  const miesiecznaInwestycja =
    totalPatients > 0 ? finalYearlyPrice / totalPatients / 12 : 0;

  const cenaPerCapita = totalPatients > 0 ? finalYearlyPrice / totalPatients : 0;

  const needsLabPackages =
    activeTab === "custom" &&
    (customActions.q1 === "Badania Lab" ||
      customActions.q2 === "Badania Lab" ||
      customActions.q3 === "Badania Lab" ||
      customActions.q4 === "Badania Lab" ||
      customActions.q1 === "Zarządzanie stresem (Z krwią)" ||
      customActions.q2 === "Zarządzanie stresem (Z krwią)" ||
      customActions.q3 === "Zarządzanie stresem (Z krwią)" ||
      customActions.q4 === "Zarządzanie stresem (Z krwią)");

  const toggleCustomLabPackage = (nazwa: string) => {
    setCustomLabPackages((prev) =>
      prev.includes(nazwa) ? prev.filter((p) => p !== nazwa) : [...prev, nazwa]
    );
  };

  const handleAddSzablony = () => {
    const harmonogramDict: Harmonogram = {
      "Kwartał 1": {
        akcja:
          profile === "Biuro / IT"
            ? "Cukrzyca PREMIUM"
            : "Cukrzyca BASIC",
        webinar: webinars.q1,
      },
      "Kwartał 2": {
        akcja:
          profile === "Biuro / IT" ? "Dermatoskopia" : "Spirometria",
        webinar: webinars.q2,
      },
      "Kwartał 3": {
        akcja:
          profile === "Biuro / IT"
            ? "Zarządzanie stresem (Bez krwi)"
            : "Profilaktyka Serca",
        webinar: webinars.q3,
      },
      "Kwartał 4": {
        akcja:
          profile === "Biuro / IT"
            ? "Profilaktyka Serca"
            : zbudujNazweAkcji("Badania Lab", q4LabPackage),
        webinar: webinars.q4,
      },
      dietetyk: dietitian,
      dni_dietetyk: dietitian ? dietitianDays : 0,
    };

    let log = `Profil: ${profile}\nObjętych programem: ${totalPatients} os.\nLokalizacje:\n${opisLokProg}`;
    if (dietitian) log += `\nDodatkowo: ${dietitianDays} dni konsultacji dietetycznych.`;

    addToCart({
      usluga: `Roczny Program: ${profile}`,
      cenaBrutto: finalYearlyPrice,
      cenaPerCapita,
      cenaRynkowaOsoba: 0,
      marzaProcent: "100.0%",
      logistyka: log,
      abonament: true,
      harmonogram: harmonogramDict,
    });
    toast.success(`Dodano Roczny Program: ${profile} do zestawienia!`);
  };

  const handleAddCustom = () => {
    const harmonogramDict: Harmonogram = {
      "Kwartał 1": {
        akcja: zbudujNazweAkcji(customActions.q1, customLabPackages),
        webinar: customWebinars.q1,
      },
      "Kwartał 2": {
        akcja: zbudujNazweAkcji(customActions.q2, customLabPackages),
        webinar: customWebinars.q2,
      },
      "Kwartał 3": {
        akcja: zbudujNazweAkcji(customActions.q3, customLabPackages),
        webinar: customWebinars.q3,
      },
      "Kwartał 4": {
        akcja: zbudujNazweAkcji(customActions.q4, customLabPackages),
        webinar: customWebinars.q4,
      },
      dietetyk: customDietitian,
      dni_dietetyk: customDietitian ? customDietitianDays : 0,
    };

    let log = `Priorytet: ${priority}\nPacjenci: ${totalPatients}\nLokalizacje:\n${opisLokProg}`;
    if (customDietitian)
      log += `\nDodatkowo: ${customDietitianDays} dni konsultacji dietetycznych.`;

    addToCart({
      usluga: "Indywidualny Program Zdrowotny",
      cenaBrutto: finalYearlyPrice,
      cenaPerCapita,
      cenaRynkowaOsoba: 0,
      marzaProcent: "100.0%",
      logistyka: log,
      abonament: true,
      harmonogram: harmonogramDict,
    });
    toast.success("Dodano Indywidualny Program Zdrowotny do zestawienia!");
  };

  const prioritySuggestion =
    priority === "Choroby krążenia"
      ? "Polecamy: Profilaktyka Serca, Cukrzyca, Lab (Lipidogram), Webinar Żywieniowy"
      : priority === "Kondycja psychiczna / Stres"
        ? "Polecamy: Zarządzanie stresem, Dietetyk, Webinar o śnie"
        : priority === "Profilaktyka otyłości / cukrzycy"
          ? "Polecamy: Cukrzyca, Profilaktyka Serca, Dietetyk, Badania Lab, USG jamy brzusznej"
          : "Polecamy: Cukrzyca, Profilaktyka Serca, Badania Lab, Dermatoskopia";

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
        <CalendarDays className="h-6 w-6 text-blue-600" />
        Tworzenie Rocznego Programu Zdrowotnego
      </h1>

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
        Wprowadź parametry logistyczne, a system w czasie rzeczywistym przeliczy
        koszt wybranego harmonogramu na podstawie unikalnej wydajności każdej
        usługi.
      </div>

      {/* KROK 1: Lokalizacje */}
      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
          <CardTitle>KROK 1: Gdzie jedziemy? (Parametry Logistyczne)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {locations.map((loc, i) => (
            <div
              key={loc.id}
              className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 p-4 transition-all duration-200"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Label>Miejscowość</Label>
                <Input
                  value={loc.city}
                  onChange={(e) =>
                    updateLocation(loc.id, "city", e.target.value)
                  }
                  placeholder={`Lok ${i + 1}`}
                />
              </div>
              <div className="w-32 space-y-2">
                <Label>Uczestnicy</Label>
                <Input
                  type="number"
                  min={0}
                  value={loc.patients}
                  onChange={(e) =>
                    updateLocation(loc.id, "patients", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="w-32 space-y-2">
                <Label>Km od Wawy</Label>
                <Input
                  type="number"
                  min={0}
                  value={loc.km}
                  onChange={(e) =>
                    updateLocation(loc.id, "km", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              {locations.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  onClick={() => removeLocation(loc.id)}
                  aria-label="Usuń lokalizację"
                  className="shrink-0"
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" onClick={addLocation} className="mt-4">
            <Plus className="size-4" />
            Dodaj lokalizację
          </Button>
        {totalPatients > 0 && (
          <p className="mt-3 text-sm text-slate-600">
            Łącznie uczestników: <strong>{totalPatients}</strong>
          </p>
        )}
        </CardContent>
      </Card>

      {/* KROK 2: Zakładki */}
      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
          <CardTitle>KROK 2: Dobór Planu i Kalkulacja</CardTitle>
        </CardHeader>
        <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="mb-6 flex h-auto min-h-9 w-full min-w-0 flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="szablony" className="force-wrap min-w-0 overflow-hidden py-2 text-left text-sm">
              1. Szablony Firm (Rekomendowane)
            </TabsTrigger>
            <TabsTrigger value="custom" className="force-wrap min-w-0 overflow-hidden py-2 text-left text-sm">
              2. Priorytety (Ankieta i Custom)
            </TabsTrigger>
          </TabsList>

        <TabsContent value="szablony" className="mt-0">
            <div className="space-y-4">
              <div className="space-y-2 max-w-xs">
                <Label>Wybierz profil firmy</Label>
                <Select value={profile} onValueChange={setProfile}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Biuro / IT">Biuro / IT</SelectItem>
                    <SelectItem value="Zakład Produkcyjny / Praca fizyczna">
                      Zakład Produkcyjny / Praca fizyczna
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={dietitian}
                  onChange={(e) => setDietitian(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm text-slate-700">
                  ➕ Dodaj Dni Konsultacji Dietetycznych (4000 PLN / dzień)
                </span>
              </label>
              {dietitian && (
                <div className="ml-6 space-y-2 max-w-[8rem]">
                  <Label>Ilość dni z dietetykiem (max 24 os/dzień)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={dietitianDays}
                    onChange={(e) =>
                      setDietitianDays(Math.max(1, parseInt(e.target.value) || 1))
                    }
                  />
                </div>
              )}

              <h3 className="pt-2 text-sm font-semibold text-slate-800">
                Harmonogram ({profile}):
              </h3>
              <div className="grid min-w-0 gap-4 overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
                {/* Q1 */}
                <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all duration-200">
                  <p className="force-wrap mb-2 font-medium text-slate-800">
                    Q1 –{" "}
                    {profile === "Biuro / IT"
                      ? "Cukrzyca PREMIUM"
                      : "Cukrzyca BASIC"}
                  </p>
                  <Select value={webinars.q1} onValueChange={(v) => setWebinars((w) => ({ ...w, q1: v }))}>
                    <SelectTrigger className="h-9 w-full min-w-0 max-w-full overflow-hidden [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:justify-start">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBINARY_TEMATY.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Q2 */}
                <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all duration-200">
                  <p className="force-wrap mb-2 font-medium text-slate-800">
                    Q2 – {profile === "Biuro / IT" ? "Dermatoskopia" : "Spirometria"}
                  </p>
                  <Select value={webinars.q2} onValueChange={(v) => setWebinars((w) => ({ ...w, q2: v }))}>
                    <SelectTrigger className="h-9 w-full min-w-0 max-w-full overflow-hidden [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:justify-start">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBINARY_TEMATY.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Q3 */}
                <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all duration-200">
                  <p className="force-wrap mb-2 font-medium text-slate-800">
                    Q3 –{" "}
                    {profile === "Biuro / IT"
                      ? "Zarządzanie stresem"
                      : "Profilaktyka Serca"}
                  </p>
                  <Select value={webinars.q3} onValueChange={(v) => setWebinars((w) => ({ ...w, q3: v }))}>
                    <SelectTrigger className="h-9 w-full min-w-0 max-w-full overflow-hidden [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:justify-start">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBINARY_TEMATY.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Q4 */}
                <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all duration-200">
                  <p className="force-wrap mb-2 font-medium text-slate-800">
                    Q4 – {profile === "Biuro / IT" ? "Profilaktyka Serca" : "Badania Lab"}
                  </p>
                  {profile === "Zakład Produkcyjny / Praca fizyczna" && (
                    <Select
                      value={q4LabPackage}
                      onValueChange={setQ4LabPackage}
                      disabled={isLoading || packagesDb.length === 0}
                    >
                      <SelectTrigger className="mb-2 h-9 w-full min-w-0 max-w-full overflow-hidden [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:justify-start">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {packagesDb.map((pkg: any, idx: number) => {
                          const { nazwa } = normalizePackageFields(pkg);
                          const displayNazwa = nazwa || `Pakiet ${idx + 1}`;
                          return (
                            <SelectItem key={pkg.id ?? idx} value={displayNazwa}>
                              {displayNazwa}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                  <Select value={webinars.q4} onValueChange={(v) => setWebinars((w) => ({ ...w, q4: v }))}>
                    <SelectTrigger className="h-9 w-full min-w-0 max-w-full overflow-hidden [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:justify-start">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBINARY_TEMATY.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
        </TabsContent>

        <TabsContent value="custom" className="mt-0">
            <div className="space-y-4">
              <div className="space-y-2 max-w-md">
                <Label>Główny cel klienta</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORYTETY.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-800">
                Sugerowane działania dla tego celu: {prioritySuggestion}
              </div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={customDietitian}
                  onChange={(e) => setCustomDietitian(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600"
                />
                <span className="text-sm text-slate-700">
                  ➕ Dodaj Dni Konsultacji Dietetycznych (4000 PLN / dzień)
                </span>
              </label>
              {customDietitian && (
                <div className="ml-6 space-y-2 max-w-[8rem]">
                  <Label>Ilość dni z dietetykiem</Label>
                  <Input
                    type="number"
                    min={1}
                    value={customDietitianDays}
                    onChange={(e) =>
                      setCustomDietitianDays(
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                  />
                </div>
              )}

              <h3 className="pt-2 text-sm font-semibold text-slate-800">
                Zbuduj własny harmonogram:
              </h3>
              <div className="grid min-w-0 gap-4 overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
                {(["q1", "q2", "q3", "q4"] as const).map((q, i) => (
                  <div
                    key={q}
                    className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all duration-200"
                  >
                    <p className="force-wrap mb-2 font-medium text-slate-800">Q{i + 1}</p>
                    <Select
                      value={customActions[q]}
                      onValueChange={(v) =>
                        setCustomActions((a) => ({ ...a, [q]: v }))
                      }
                    >
                      <SelectTrigger className="mb-2 h-9 w-full min-w-0 max-w-full overflow-hidden [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:justify-start">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPCJE_CUSTOM.map((o) => (
                          <SelectItem key={o} value={o}>{o}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={customWebinars[q]}
                      onValueChange={(v) =>
                        setCustomWebinars((w) => ({ ...w, [q]: v }))
                      }
                    >
                      <SelectTrigger className="h-9 w-full min-w-0 max-w-full overflow-hidden [&_[data-slot=select-value]]:min-w-0 [&_[data-slot=select-value]]:truncate [&_[data-slot=select-value]]:justify-start">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEBINARY_TEMATY.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
              {needsLabPackages && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-slate-600">
                    Wybrałeś akcję wymagającą laboratorium. Zaznacz pakiety:
                  </p>
                  {isLoading ? (
                    <p className="text-sm text-slate-600">Ładowanie pakietów...</p>
                  ) : packagesDb.length === 0 ? (
                    <p className="text-sm text-amber-700">
                      Brak pakietów w bazie.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {packagesDb.map((pkg: any, idx: number) => {
                        const { nazwa } = normalizePackageFields(pkg);
                        const displayNazwa = nazwa || `Pakiet ${idx + 1}`;
                        return (
                          <label
                            key={pkg.id ?? idx}
                            className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={customLabPackages.includes(displayNazwa)}
                              onChange={() => toggleCustomLabPackage(displayNazwa)}
                              className="mt-0.5 shrink-0 rounded border-slate-300 text-blue-600"
                            />
                            <span className="force-wrap">{displayNazwa}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
        </TabsContent>
        </Tabs>

        {/* Podsumowanie */}
        {totalPatients > 0 && (
          <>
            <hr className="my-6 border-slate-200" />
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 shadow-sm transition-all duration-200">
              <div className="space-y-4">
                <div>
                  <Label>Sugerowana Cena Roczna</Label>
                  <p className="text-xl font-semibold text-slate-800">
                    {suggestedPrice.toFixed(2)} PLN
                  </p>
                </div>
                <div className="space-y-2 max-w-xs">
                  <Label>Ostateczna cena roczna za program (PLN)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={finalYearlyPrice || ""}
                    onChange={(e) =>
                      setFinalYearlyPrice(
                        Math.max(0, parseFloat(e.target.value) || 0)
                      )
                    }
                  />
                </div>
                <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
                  Miesięczna inwestycja:{" "}
                  <strong>{miesiecznaInwestycja.toFixed(2)} PLN</strong> /
                  pracownika
                </div>
                <Button
                  onClick={activeTab === "szablony" ? handleAddSzablony : handleAddCustom}
                  size="lg"
                  className="w-full"
                >
                  ➕ Dodaj Program do Oferty
                </Button>
              </div>
            </div>
          </>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
