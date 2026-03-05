"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Brain } from "lucide-react";
import { KOSZT_NOCLEGU, STAWKA_KM } from "@/src/lib/constants";
import { straznikRentownosci, generujLogistykeOpis } from "@/src/lib/calculations";
import { useStore } from "@/src/store/useStore";
import { supabase } from "@/src/lib/supabase";
import { normalizePackageFields } from "@/src/lib/normalizePackage";
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

const VARIANT_BEZ_KRWI = "Bez krwi (Testy psychologiczne + Webinar)";
const VARIANT_Z_KRWIA = "Z krwią (Testy + Webinar + Pakiety Lab)";

export default function StressView() {
  const { addToCart } = useStore();
  const [packagesDb, setPackagesDb] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [variant, setVariant] = useState(VARIANT_BEZ_KRWI);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [idCounter, setIdCounter] = useState(1);
  const [locations, setLocations] = useState<Location[]>([
    { ...DEFAULT_LOCATION, id: 0 },
  ]);
  const [finalPrice, setFinalPrice] = useState(0);

  const isZKrwi = variant === VARIANT_Z_KRWIA;

  const togglePackage = (nazwa: string) => {
    setSelectedPackages((prev) =>
      prev.includes(nazwa) ? prev.filter((p) => p !== nazwa) : [...prev, nazwa]
    );
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

  useEffect(() => {
    let cancelled = false;
    async function fetchPackages() {
      setIsLoading(true);
      try {
        const { data } = await supabase.from("badania").select("*");
        console.log("Otrzymane dane z bazy:", data);
        if (!cancelled && data) setPackagesDb(data);
      } catch {
        if (!cancelled) setPackagesDb([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchPackages();
    return () => { cancelled = true; };
  }, []);

  const selectedPakietObjs = useMemo(
    () =>
      packagesDb.filter((p: any, idx: number) => {
        const { nazwa } = normalizePackageFields(p);
        const displayNazwa = nazwa || `Pakiet ${idx + 1}`;
        return selectedPackages.includes(displayNazwa);
      }),
    [packagesDb, selectedPackages]
  );

  const sumaKosztowLab = selectedPakietObjs.reduce(
    (s, p) => s + normalizePackageFields(p).koszt,
    0
  );
  const sumaCenLab = selectedPakietObjs.reduce(
    (s, p) => s + normalizePackageFields(p).cena,
    0
  );

  const {
    totalKosztOps,
    kosztUslugiStres,
    kosztLab,
    przychodLab,
    totalPacjenci,
    opisLok,
    razemKoszt,
    preferredPrice,
  } = useMemo(() => {
    let ops = 0;
    let pacjenci = 0;
    let opis = "";

    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      const { patients, km, teams, city } = loc;
      const nazwaLok = city || `Lokalizacja ${i + 1}`;

      if (patients <= 0) continue;

      if (isZKrwi) {
        const dni = Math.ceil(patients / (100 * teams));
        const kPieleg = (patients / 12.5) * 80;
        const kDojazd = km * 2 * STAWKA_KM * teams;
        const kHotel =
          km > 150 || dni > 1 ? dni * KOSZT_NOCLEGU * teams : 0;
        ops += kPieleg + kDojazd + kHotel;
      }

      pacjenci += patients;
      opis += `- ${nazwaLok}: ${patients} os. (${teams} zesp.)\n`;
    }

    const kosztStres = pacjenci * 100;
    const kLab = isZKrwi ? pacjenci * sumaKosztowLab : 0;
    const pLab = isZKrwi ? pacjenci * sumaCenLab : 0;
    const razem = kosztStres + kLab + ops;
    const sPref = pLab + kosztStres * 1.8 + ops * 2;

    return {
      totalKosztOps: ops,
      kosztUslugiStres: kosztStres,
      kosztLab: kLab,
      przychodLab: pLab,
      totalPacjenci: pacjenci,
      opisLok: opis,
      razemKoszt: razem,
      preferredPrice: sPref,
    };
  }, [locations, isZKrwi, sumaKosztowLab, sumaCenLab]);

  useEffect(() => {
    if (totalPacjenci === 0) {
      setFinalPrice(0);
    } else if (
      !isLoading &&
      (finalPrice === 0 || finalPrice < preferredPrice * 0.2)
    ) {
      setFinalPrice(Math.round(preferredPrice * 100) / 100);
    }
  }, [totalPacjenci, preferredPrice, isLoading]);

  const rentownosc = useMemo(
    () => straznikRentownosci(razemKoszt, 0, finalPrice),
    [razemKoszt, finalPrice]
  );

  const cenaPerCapita =
    totalPacjenci > 0 ? finalPrice / totalPacjenci : 0;

  const logistykaBase = `Wariant: ${variant}\n${generujLogistykeOpis(totalPacjenci, opisLok)}`;
  const logistykaFull =
    logistykaBase +
    (selectedPackages.length > 0
      ? `\nWybrane Pakiety Lab: ${selectedPackages.join(", ")}\n`
      : "");

  const handleAddToCart = () => {
    addToCart({
      usluga: "Zarządzanie stresem",
      cenaBrutto: finalPrice,
      cenaPerCapita,
      cenaRynkowaOsoba: 0,
      marzaProcent: `${rentownosc.marza.toFixed(1)}%`,
      logistyka: logistykaFull,
      abonament: false,
      harmonogram: null,
    });
    toast.success("Dodano Zarządzanie stresem do zestawienia!");
  };

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
        <Brain className="h-6 w-6 text-blue-600" />
        Zarządzanie stresem – strategia psychologiczna
      </h1>

      {/* Krok 1: Wybór wariantu */}
      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
          <CardTitle>Wybierz wariant</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
            <input
              type="radio"
              name="variant"
              checked={variant === VARIANT_BEZ_KRWI}
              onChange={() => setVariant(VARIANT_BEZ_KRWI)}
              className="mt-0.5 shrink-0 text-blue-600 focus:ring-blue-500"
            />
            <span className="force-wrap text-slate-700">{VARIANT_BEZ_KRWI}</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition-colors hover:bg-slate-50">
            <input
              type="radio"
              name="variant"
              checked={variant === VARIANT_Z_KRWIA}
              onChange={() => setVariant(VARIANT_Z_KRWIA)}
              className="mt-0.5 shrink-0 text-blue-600 focus:ring-blue-500"
            />
            <span className="force-wrap text-slate-700">{VARIANT_Z_KRWIA}</span>
          </label>
        </div>

        {isZKrwi && (
          <>
            <h3 className="mb-3 mt-6 text-sm font-semibold text-slate-800">
              Wybierz pakiety laboratoryjne do akcji
            </h3>
            {isLoading ? (
              <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
                Ładowanie pakietów...
              </p>
            ) : packagesDb.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Brak pakietów w bazie. Skontaktuj się z administratorem.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {packagesDb.map((pkg: any, idx: number) => {
                  const { nazwa, cena, skladniki } = normalizePackageFields(pkg);
                  const displayNazwa = nazwa || `Pakiet ${idx + 1}`;
                  const isSelected = selectedPackages.includes(displayNazwa);
                  return (
                    <Button
                      key={pkg.id ?? idx}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => togglePackage(displayNazwa)}
                      className={`force-wrap h-auto min-w-0 flex-col items-start gap-1 p-4 text-left transition-all duration-200 ${
                        isSelected ? "border-green-500 bg-green-50 ring-2 ring-green-500 hover:bg-green-100" : ""
                      }`}
                    >
                      <p className="font-bold text-slate-800">{displayNazwa}</p>
                      <p className="mt-1 text-sm font-normal text-slate-600">{skladniki}</p>
                      <p className="mt-2 text-sm font-bold text-slate-700">
                        Cena: {cena} PLN / osoba
                      </p>
                    </Button>
                  );
                })}
              </div>
            )}
            {selectedPackages.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm font-medium text-slate-600">
                    Cena detaliczna wybranego labu
                  </p>
                  <p className="text-lg font-semibold text-slate-800">
                    {sumaCenLab.toFixed(2)} PLN / os.
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-600">
                    (Koszt hurtowy w kalkulatorze)
                  </p>
                  <p className="text-lg font-semibold text-slate-800">
                    {sumaKosztowLab.toFixed(2)} PLN / os.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
        </CardContent>
      </Card>

      {/* Krok 2: Lokalizacje */}
      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
          <CardTitle>Lokalizacje</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="space-y-4">
          {locations.map((loc) => {
            const patients = loc.patients;
            const dni =
              patients > 0 && isZKrwi
                ? Math.ceil(patients / (100 * loc.teams))
                : 0;

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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isZKrwi ? "Liczba Zespołów Lab" : "Liczba Zespołów"}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={loc.teams}
                      onChange={(e) =>
                        updateLocation(
                          loc.id,
                          "teams",
                          Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Uczestnicy</Label>
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
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Odległość od Warszawy (km)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={loc.km}
                      onChange={(e) =>
                        updateLocation(loc.id, "km", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
                {patients > 0 && isZKrwi && (
                  <div className="mt-4 rounded-lg border-l-4 border-blue-400 bg-blue-50/50 px-4 py-2 text-sm text-slate-700">
                    ⏱️ Logistyka Lab: {loc.teams} Zesp. ➡{" "}
                    <strong>{dni} dni</strong> pracy.
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Button variant="outline" onClick={addLocation} className="mt-4">
          <Plus className="size-4" />
          Dodaj lokalizację
        </Button>
        </CardContent>
      </Card>

      {/* Podsumowanie i koszyk */}
      {totalPacjenci > 0 && (
        <Card className="overflow-hidden border-blue-200/50 bg-blue-50/50 shadow-sm transition-all duration-200">
          <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">
                1. Koszt BAZOWY (z logistyką)
              </p>
              <p className="text-xl font-semibold text-slate-800">
                {razemKoszt.toFixed(2)} PLN
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-amber-50/50 p-4">
              <p className="text-sm font-medium text-slate-600">2. Min</p>
              <p className="text-xl font-semibold text-slate-800">
                {(
                  przychodLab +
                  kosztUslugiStres * 1.5 +
                  totalKosztOps * 1.5
                ).toFixed(2)}{" "}
                PLN
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-green-50/50 p-4">
              <p className="text-sm font-medium text-slate-600">3. Pref</p>
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
              />
              <p className="text-sm text-slate-600">
                Wychodzi: <strong>{cenaPerCapita.toFixed(2)} PLN</strong> za osobę
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
                  rentownosc.status === "success" ? "bg-green-500 hover:bg-green-600" :
                  rentownosc.status === "warning" ? "bg-amber-500 hover:bg-amber-600" : ""
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
            className="mt-6 w-full"
          >
            ➕ Dodaj do Oferty
          </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
