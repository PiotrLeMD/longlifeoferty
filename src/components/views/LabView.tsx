"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Trash2, FlaskConical, Boxes } from "lucide-react";
import { KOSZT_NOCLEGU, STAWKA_KM } from "@/src/lib/constants";
import {
  straznikRentownosci,
  generujLogistykeOpis,
  symulacjaCzasu,
} from "@/src/lib/calculations";
import { useStore } from "@/src/store/useStore";
import type { LabOpisDoOferty } from "@/src/store/useStore";
import { supabase } from "@/src/lib/supabase";
import { normalizePackageFields } from "@/src/lib/normalizePackage";
import { LabItemInfo } from "@/src/components/lab/LabItemInfo";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Location {
  id: number;
  city: string;
  teams: number;
  patients: number;
  km: number;
}

const DEFAULT_LOCATION: Omit<Location, "id"> = {
  city: "",
  teams: 1,
  patients: 0,
  km: 0,
};

function getStableKey(pkg: any): string {
  const { nazwa } = normalizePackageFields(pkg);
  return String(pkg?.id ?? nazwa ?? "unknown");
}

export default function LabView() {
  const { addToCart } = useStore();
  const [packagesDb, setPackagesDb] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoucher, setIsVoucher] = useState(false);
  const [hasDiscountInfo, setHasDiscountInfo] = useState(false);

  /** true = „Pakiet Własny”, koszt bazowy 0; false = gotowe pakiety z siatki */
  const [baseCustom, setBaseCustom] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  /** Nazwy pozycji z bazy (dodatkowe badania pojedyncze) */
  const [extraBadania, setExtraBadania] = useState<string[]>([]);
  /** Dołącz opis do oferty – klucz = getStableKey */
  const [dolaczOpisDoOferty, setDolaczOpisDoOferty] = useState<
    Record<string, boolean>
  >({});

  const [idCounter, setIdCounter] = useState(1);
  const [locations, setLocations] = useState<Location[]>([
    { ...DEFAULT_LOCATION, id: 0 },
  ]);
  const [finalPrice, setFinalPrice] = useState(0);

  const setIncludeOffer = useCallback((key: string, value: boolean) => {
    setDolaczOpisDoOferty((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchPackages() {
      setIsLoading(true);
      try {
        const { data } = await supabase.from("badania").select("*");
        if (!cancelled && data) setPackagesDb(data);
      } catch {
        if (!cancelled) setPackagesDb([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchPackages();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Gotowe pakiety – tylko pozycje z rodzajem „pakiet” (w bazie / po normalizacji). */
  const pakietyDoSiatki = useMemo(
    () =>
      packagesDb.filter(
        (p) => normalizePackageFields(p).rodzaj === "pakiet"
      ),
    [packagesDb]
  );

  /** Dodatkowe badania – tylko pozycje z rodzajem „badanie” (np. badanie / badania w bazie). */
  const badaniaPojedyncze = useMemo(
    () =>
      packagesDb.filter(
        (p) => normalizePackageFields(p).rodzaj === "badanie"
      ),
    [packagesDb]
  );

  useEffect(() => {
    if (baseCustom) return;
    setExtraBadania((prev) =>
      prev.filter((n) => !selectedPackages.includes(n))
    );
  }, [selectedPackages, baseCustom]);

  const pkgByName = useMemo(() => {
    const m = new Map<string, any>();
    packagesDb.forEach((p, idx) => {
      const { nazwa } = normalizePackageFields(p);
      const name = nazwa || `Pakiet ${idx + 1}`;
      m.set(name, p);
    });
    return m;
  }, [packagesDb]);

  const selectedPakietObjs = useMemo(() => {
    if (baseCustom) return [];
    return selectedPackages
      .map((n) => pkgByName.get(n))
      .filter(Boolean) as any[];
  }, [baseCustom, selectedPackages, pkgByName]);

  const extraBadaniaObjs = useMemo(
    () =>
      extraBadania
        .map((n) => pkgByName.get(n))
        .filter(Boolean) as any[],
    [extraBadania, pkgByName]
  );

  const sumaKosztow = useMemo(() => {
    const base = baseCustom
      ? 0
      : selectedPakietObjs.reduce(
          (s, p) => s + normalizePackageFields(p).koszt,
          0
        );
    const dodatki = extraBadaniaObjs.reduce(
      (s, p) => s + normalizePackageFields(p).koszt,
      0
    );
    return base + dodatki;
  }, [baseCustom, selectedPakietObjs, extraBadaniaObjs]);

  const sumaCen = useMemo(() => {
    const base = baseCustom
      ? 0
      : selectedPakietObjs.reduce(
          (s, p) => s + normalizePackageFields(p).cena,
          0
        );
    const dodatki = extraBadaniaObjs.reduce(
      (s, p) => s + normalizePackageFields(p).cena,
      0
    );
    return base + dodatki;
  }, [baseCustom, selectedPakietObjs, extraBadaniaObjs]);

  const sumaRynkowa = useMemo(() => {
    const base = baseCustom
      ? 0
      : selectedPakietObjs.reduce(
          (s, p) => s + normalizePackageFields(p).cenaRynkowa,
          0
        );
    const dodatki = extraBadaniaObjs.reduce(
      (s, p) => s + normalizePackageFields(p).cenaRynkowa,
      0
    );
    return base + dodatki;
  }, [baseCustom, selectedPakietObjs, extraBadaniaObjs]);

  const szczegolyPakietow = useMemo(() => {
    const linie: string[] = [];
    if (baseCustom) {
      linie.push("- **Baza:** Pakiet własny (brak gotowego pakietu – koszt bazowy 0)");
    } else {
      selectedPakietObjs.forEach((p) => {
        const { nazwa, skladniki } = normalizePackageFields(p);
        linie.push(`- **${nazwa || "Pakiet"}**: ${skladniki}`);
      });
    }
    extraBadaniaObjs.forEach((p) => {
      const { nazwa, skladniki } = normalizePackageFields(p);
      linie.push(`- **+ dodatek: ${nazwa || "Badanie"}**: ${skladniki}`);
    });
    return linie.join("\n");
  }, [baseCustom, selectedPakietObjs, extraBadaniaObjs]);

  const {
    totalKosztOps,
    totalKosztLab,
    totalPrzychodLab,
    totalPacjenci,
    opisLok,
    preferredPrice,
    razemKoszt,
  } = useMemo(() => {
    let ops = 0;
    let kosztLab = 0;
    let przychodLab = 0;
    let pacjenci = 0;
    let opis = "";

    const kosztOsoba = sumaKosztow;
    const cenaOsoba = sumaCen;

    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      const { patients, km, teams, city } = loc;
      const nazwaLok = city || `Lokalizacja ${i + 1}`;

      if (patients <= 0) continue;

      if (isVoucher) {
        kosztLab += patients * kosztOsoba;
        przychodLab += patients * cenaOsoba;
        pacjenci += patients;
        opis += `- ${nazwaLok}: ${patients} os. (Vouchery)\n`;
      } else {
        const dni = Math.ceil(patients / (100 * teams));
        const kPieleg = (patients / 12.5) * 80;
        const kDojazd = km * 2 * STAWKA_KM * teams;
        const kHotel =
          km > 150 || dni > 1 ? dni * KOSZT_NOCLEGU * teams : 0;
        ops += kPieleg + kDojazd + kHotel;
        kosztLab += patients * kosztOsoba;
        przychodLab += patients * cenaOsoba;
        pacjenci += patients;
        opis += `- ${nazwaLok}: ${patients} os. (${teams} zesp. lab)\n`;
      }
    }

    const razemKosztCalc = ops + kosztLab;
    const pref = isVoucher
      ? przychodLab + pacjenci * 10
      : przychodLab + ops * 2;

    return {
      totalKosztOps: ops,
      totalKosztLab: kosztLab,
      totalPrzychodLab: przychodLab,
      totalPacjenci: pacjenci,
      opisLok: opis,
      preferredPrice: pref,
      razemKoszt: razemKosztCalc,
    };
  }, [locations, isVoucher, sumaKosztow, sumaCen]);

  useEffect(() => {
    if (totalPacjenci === 0) {
      setFinalPrice(0);
    } else if (!isLoading) {
      setFinalPrice(Math.round(preferredPrice * 100) / 100);
    }
  }, [totalPacjenci, preferredPrice, isLoading]);

  const rentownosc = useMemo(
    () => straznikRentownosci(razemKoszt, 0, finalPrice),
    [razemKoszt, finalPrice]
  );

  const cenaPerCapita =
    totalPacjenci > 0 ? finalPrice / totalPacjenci : 0;

  const logistykaBase = `**Wybrane Pakiety i ich skład:**\n${szczegolyPakietow}\n\n${generujLogistykeOpis(totalPacjenci, opisLok)}`;
  const logistykaFull =
    logistykaBase +
    (isVoucher ? "\n\n> **Forma realizacji:** Vouchery dla pracowników." : "") +
    (hasDiscountInfo
      ? "\n\n> **Badania Dodatkowe:** Możliwość badań 30% taniej."
      : "");

  const togglePackage = (displayNazwa: string) => {
    setBaseCustom(false);
    setSelectedPackages((prev) =>
      prev.includes(displayNazwa)
        ? prev.filter((p) => p !== displayNazwa)
        : [...prev, displayNazwa]
    );
  };

  const selectCustomBase = () => {
    setBaseCustom(true);
    setSelectedPackages([]);
  };

  const toggleExtra = (displayNazwa: string) => {
    setExtraBadania((prev) =>
      prev.includes(displayNazwa)
        ? prev.filter((x) => x !== displayNazwa)
        : [...prev, displayNazwa]
    );
  };

  const collectOpisyDoOferty = (): LabOpisDoOferty[] => {
    const out: LabOpisDoOferty[] = [];
    const seen = new Set<string>();

    const consider = (pkg: any) => {
      const key = getStableKey(pkg);
      const { nazwa, description } = normalizePackageFields(pkg);
      const label = nazwa || "Badanie";
      if (!dolaczOpisDoOferty[key] || !description.trim()) return;
      if (seen.has(label)) return;
      seen.add(label);
      out.push({ nazwa: label, tekst: description.trim() });
    };

    if (!baseCustom) {
      selectedPakietObjs.forEach((p) => consider(p));
    }
    extraBadaniaObjs.forEach((p) => consider(p));

    return out;
  };

  const addLocation = () => {
    const newId = idCounter;
    setIdCounter((c) => c + 1);
    setLocations((prev) => [...prev, { ...DEFAULT_LOCATION, id: newId }]);
  };

  const removeLocation = (id: number) => {
    if (locations.length <= 1) return;
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  };

  const updateLocation = (
    id: number,
    field: keyof Location,
    value: string | number
  ) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, [field]: value } : loc))
    );
  };

  const handleAddToCart = () => {
    const etykietaBazowa = baseCustom
      ? "Pakiet Własny"
      : selectedPackages.length > 0
        ? selectedPackages.join(", ")
        : extraBadania.length > 0
          ? `Tylko badania: ${extraBadania.join(", ")}`
          : "";
    const nazwaUslugi = `Badania Laboratoryjne: ${etykietaBazowa}`;
    const opisy = collectOpisyDoOferty();

    addToCart({
      usluga: nazwaUslugi,
      cenaBrutto: finalPrice,
      cenaPerCapita,
      cenaRynkowaOsoba: sumaRynkowa,
      marzaProcent: `${rentownosc.marza.toFixed(1)}%`,
      logistyka: logistykaFull,
      abonament: false,
      harmonogram: null,
      kosztOperacyjny: razemKoszt,
      przychodSztywnyLab: 0,
      labCartDetal: {
        bazowyTryb: baseCustom ? "custom" : "pakiety",
        etykietaBazowa,
        nazwyPakietowBazowych: baseCustom ? [] : [...selectedPackages],
        nazwyDodatkowychBadan: [...extraBadania],
        opisyDoOferty: opisy,
      },
    });
    toast.success(`Dodano ${nazwaUslugi} do zestawienia!`);
  };

  /** Suma/cena i podsumowanie: wybrany pakiet, albo wyłącznie badania pojedyncze, albo Custom z dodatkami. */
  const konfiguracjaPoprawna =
    extraBadania.length > 0 ||
    (!baseCustom && selectedPackages.length > 0);

  const pokazPodsumowanie = totalPacjenci > 0 && konfiguracjaPoprawna;

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
        <FlaskConical className="h-6 w-6 text-blue-600" />
        Kreator Pakietu Badań
      </h1>

      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
          <CardTitle>Wybór pakietu bazowego</CardTitle>
          <p className="text-sm font-normal text-slate-600">
            Wybierz gotowe pakiety albo{" "}
            <strong>Pakiet Własny (Custom)</strong>, a następnie dopisz
            dodatkowe badania pojedyncze. Koszty i ceny detaliczne sumują się
            automatycznie.
          </p>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isVoucher}
                onChange={(e) => setIsVoucher(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                🎫 Wyceń w formie voucherów (+10 PLN / os. do sug. ceny)
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={hasDiscountInfo}
                onChange={(e) => setHasDiscountInfo(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                🩸 Dodaj adnotację o bad. dodatkowych dla prac. (-30%)
              </span>
            </label>
          </div>

          {isLoading ? (
            <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
              Ładowanie pakietów...
            </p>
          ) : packagesDb.length === 0 ? (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Brak pakietów w bazie. Skontaktuj się z administratorem.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div
                  className={`flex min-w-0 gap-2 rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                    baseCustom
                      ? "border-violet-500 bg-violet-50 ring-2 ring-violet-400"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <Button
                    type="button"
                    variant={baseCustom ? "default" : "outline"}
                    className="!flex !h-auto !whitespace-normal min-h-0 min-w-0 flex-1 shrink flex-col items-start justify-start gap-2 break-words px-3 py-3 text-left text-sm leading-snug"
                    onClick={selectCustomBase}
                  >
                    <span className="flex w-full min-w-0 items-start gap-2 font-bold">
                      <Boxes className="mt-0.5 size-5 shrink-0" />
                      <span className="min-w-0 flex-1">
                        Zbuduj własny pakiet (Custom)
                      </span>
                    </span>
                    <span className="w-full text-sm font-normal text-slate-600">
                      Koszt bazowy 0 PLN — dobierz tylko badania pojedyncze
                      poniżej.
                    </span>
                  </Button>
                </div>
              </div>

              <p className="mb-2 mt-6 text-sm font-medium text-slate-700">
                Gotowe pakiety
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {pakietyDoSiatki.map((pkg: any, idx: number) => {
                  const norm = normalizePackageFields(pkg);
                  const { nazwa, cena, koszt, skladniki, description } = norm;
                  const displayNazwa = nazwa || `Pakiet ${idx + 1}`;
                  const isSelected =
                    !baseCustom && selectedPackages.includes(displayNazwa);
                  const sKey = getStableKey(pkg);
                  return (
                    <div
                      key={pkg.id ?? sKey}
                      className={`flex min-h-0 min-w-0 gap-2 rounded-xl border-2 p-3 transition-all duration-200 ${
                        isSelected
                          ? "border-green-500 bg-green-50 ring-2 ring-green-500"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => togglePackage(displayNazwa)}
                        className="!flex !h-auto !whitespace-normal min-h-0 min-w-0 flex-1 shrink flex-col items-start justify-start gap-2 break-words px-3 py-3 text-left text-sm leading-snug"
                      >
                        <span className="w-full min-w-0 font-semibold leading-snug text-balance">
                          {displayNazwa}
                        </span>
                        <span className="w-full text-xs text-slate-600">
                          Koszt: {koszt} PLN / os.
                        </span>
                        <span className="w-full text-sm font-bold leading-snug">
                          Nasza cena: {cena} PLN / os.
                        </span>
                      </Button>
                      <div className="shrink-0 self-start pt-1">
                        <LabItemInfo
                          title={displayNazwa}
                          skladniki={skladniki}
                          description={description}
                          includeInOffer={!!dolaczOpisDoOferty[sKey]}
                          onIncludeChange={(v) => setIncludeOffer(sKey, v)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              {pakietyDoSiatki.length === 0 && packagesDb.length > 0 ? (
                <p className="mt-2 text-xs text-amber-800">
                  Brak pozycji z rodzajem „pakiet”. Oznacz w bazie kolumnę{" "}
                  <code className="rounded bg-amber-100 px-1">rodzaj</code> jako{" "}
                  <code className="rounded bg-amber-100 px-1">pakiet</code> dla
                  gotowych pakietów.
                </p>
              ) : null}

              <p className="mb-2 mt-8 text-sm font-medium text-slate-700">
                Dodatkowe badania (pojedyncze)
              </p>
              <p className="mb-3 text-xs text-slate-500">
                Tylko pozycje z rodzajem „badanie” (w bazie np.{" "}
                <code className="rounded bg-slate-100 px-1">badanie</code> lub{" "}
                <code className="rounded bg-slate-100 px-1">badania</code>). Możesz
                je łączyć z gotowymi pakietami lub z Pakietem Własnym.
              </p>
              <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                {badaniaPojedyncze.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    Brak badań pojedynczych — ustaw w bazie{" "}
                    <code className="rounded bg-slate-100 px-1">rodzaj</code> na
                    badanie pojedyncze dla wybranych wierszy.
                  </p>
                ) : (
                  badaniaPojedyncze.map((pkg: any, idx: number) => {
                    const norm = normalizePackageFields(pkg);
                    const { nazwa, cena, koszt, skladniki, description } = norm;
                    const displayNazwa = nazwa || `Badanie ${idx + 1}`;
                    const sKey = getStableKey(pkg);
                    const checked = extraBadania.includes(displayNazwa);
                    return (
                      <label
                        key={pkg.id ?? sKey}
                        className="flex min-w-0 cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleExtra(displayNazwa)}
                          className="mt-1 size-4 shrink-0 rounded border-slate-300 text-blue-600"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="block font-medium leading-snug text-balance text-slate-800 break-words">
                            {displayNazwa}
                          </span>
                          <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                            Koszt: {koszt} PLN / os. · Cena: {cena} PLN / os.
                          </span>
                        </div>
                        <div
                          className="shrink-0 self-start pt-0.5"
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <LabItemInfo
                            title={displayNazwa}
                            skladniki={skladniki}
                            description={description}
                            includeInOffer={!!dolaczOpisDoOferty[sKey]}
                            onIncludeChange={(v) => setIncludeOffer(sKey, v)}
                          />
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </>
          )}

          {konfiguracjaPoprawna && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-600">
                  Suma kosztów (hurt) / osoba
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {sumaKosztow.toFixed(2)} PLN
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-600">
                  Nasza cena detaliczna / osoba
                </p>
                <p className="text-lg font-semibold text-slate-800">
                  {sumaCen.toFixed(2)} PLN
                </p>
              </div>
              {sumaRynkowa > 0 && (
                <div className="rounded-lg bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm font-medium text-slate-600">
                    Sugerowana cena rynkowa / osoba
                  </p>
                  <p className="text-lg font-semibold text-slate-800">
                    {sumaRynkowa.toFixed(2)} PLN
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
          <CardTitle>Lokalizacje i kalkulacja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locations.map((loc) => {
              const patients = loc.patients;
              const dni =
                patients > 0 && !isVoucher
                  ? Math.ceil(patients / (100 * loc.teams))
                  : 0;
              const symulacja =
                patients > 0 && !isVoucher
                  ? symulacjaCzasu(patients, 100, 5)
                  : "";

              return (
                <div
                  key={loc.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <h3 className="force-wrap min-w-0 font-medium text-slate-700">
                      {loc.city || `Lokalizacja ${locations.indexOf(loc) + 1}`}
                    </h3>
                    {locations.length > 1 && (
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => removeLocation(loc.id)}
                        className="transition-all duration-200"
                        aria-label="Usuń lokalizację"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Miejscowość</Label>
                      <Input
                        value={loc.city}
                        onChange={(e) =>
                          updateLocation(loc.id, "city", e.target.value)
                        }
                        placeholder="np. Centrala"
                        className="transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Liczba Zespołów</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={loc.teams}
                        onChange={(e) =>
                          updateLocation(
                            loc.id,
                            "teams",
                            Math.min(
                              10,
                              Math.max(1, parseInt(e.target.value) || 1)
                            )
                          )
                        }
                        className="transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Uczestnicy (Norma ~100/dzień)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={loc.patients}
                        onChange={(e) =>
                          updateLocation(
                            loc.id,
                            "patients",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Odległość od Warszawy (km)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={loc.km}
                        onChange={(e) =>
                          updateLocation(
                            loc.id,
                            "km",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="transition-all duration-200"
                      />
                    </div>
                  </div>
                  {patients > 0 && (
                    <div className="mt-4 rounded-lg border-l-4 border-blue-400 bg-blue-50/50 px-4 py-2 text-sm text-slate-700">
                      {isVoucher ? (
                        <p>
                          🎫 <strong>Vouchery</strong> – obsługa w placówce.
                          Brak kosztów logistyki.
                        </p>
                      ) : (
                        <>
                          <p>
                            ⏱️ {loc.teams} Zesp. Lab ➡{" "}
                            <strong>{dni} dni</strong> pracy.
                          </p>
                          {symulacja && (
                            <p
                              className="mt-1 text-slate-600"
                              dangerouslySetInnerHTML={{
                                __html: `💡 ${symulacja}`,
                              }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Button
            variant="outline"
            onClick={addLocation}
            className="mt-4 transition-all duration-200"
          >
            <Plus className="size-4" />
            Dodaj lokalizację
          </Button>
        </CardContent>
      </Card>

      {pokazPodsumowanie && (
        <Card className="overflow-hidden border-blue-200/50 bg-blue-50/50 shadow-sm transition-all duration-200">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white/80 p-4">
                <p className="text-sm font-medium text-slate-600">
                  1. Koszt BAZOWY (z lab)
                </p>
                <p className="text-xl font-semibold text-slate-800">
                  {razemKoszt.toFixed(2)} PLN
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-amber-50/80 p-4">
                <p className="text-sm font-medium text-slate-600">2. Min</p>
                <p className="text-xl font-semibold text-slate-800">
                  {(totalPrzychodLab + totalKosztOps * 1.5).toFixed(2)} PLN
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-green-50/80 p-4">
                <p className="text-sm font-medium text-slate-600">
                  3. Cena preferowana
                </p>
                <p className="text-xl font-semibold text-slate-800">
                  {preferredPrice.toFixed(2)} PLN
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>CENA KOŃCOWA (BRUTTO/ZW)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={finalPrice || ""}
                  onChange={(e) =>
                    setFinalPrice(parseFloat(e.target.value) || 0)
                  }
                  className="transition-all duration-200"
                />
                <p className="text-sm text-slate-600">
                  Wychodzi: <strong>{cenaPerCapita.toFixed(2)} PLN</strong> za
                  osobę
                </p>
              </div>
              <div className="flex flex-col justify-end space-y-2">
                <Label>Status:</Label>
                <Badge
                  variant={
                    rentownosc.status === "success"
                      ? "default"
                      : rentownosc.status === "warning"
                        ? "secondary"
                        : "destructive"
                  }
                  className={`w-fit ${
                    rentownosc.status === "success"
                      ? "bg-green-500 hover:bg-green-600"
                      : rentownosc.status === "warning"
                        ? "bg-amber-500 hover:bg-amber-600"
                        : ""
                  }`}
                >
                  {rentownosc.msg}
                </Badge>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={rentownosc.status === "error"}
              size="lg"
              className="mt-6 w-full transition-all duration-200"
            >
              ➕ Dodaj Pakiet Lab do Oferty
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
