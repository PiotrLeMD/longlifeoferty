"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Trash2, FlaskConical } from "lucide-react";
import { KOSZT_NOCLEGU, STAWKA_KM } from "@/src/lib/constants";
import {
  straznikRentownosci,
  generujLogistykeOpis,
  symulacjaCzasu,
} from "@/src/lib/calculations";
import { useStore } from "@/src/store/useStore";
import { supabase } from "@/src/lib/supabase";
import { LabConfiguratorPanel } from "@/src/components/lab/LabConfiguratorPanel";
import {
  EMPTY_LAB_SNAPSHOT,
  type LabConfiguratorSnapshot,
} from "@/src/components/lab/useLabPackageSelection";
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

export default function LabView() {
  const { addToCart } = useStore();
  const [packagesDb, setPackagesDb] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoucher, setIsVoucher] = useState(false);
  const [hasDiscountInfo, setHasDiscountInfo] = useState(false);

  const [labSnapshot, setLabSnapshot] = useState<LabConfiguratorSnapshot>(
    EMPTY_LAB_SNAPSHOT
  );
  const onLabSnapshot = useCallback((s: LabConfiguratorSnapshot) => {
    setLabSnapshot(s);
  }, []);

  const [idCounter, setIdCounter] = useState(1);
  const [locations, setLocations] = useState<Location[]>([
    { ...DEFAULT_LOCATION, id: 0 },
  ]);
  const [finalPrice, setFinalPrice] = useState(0);

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

  const sumaKosztow = labSnapshot.sumaKosztow;
  const sumaCen = labSnapshot.sumaCen;
  const sumaRynkowa = labSnapshot.sumaRynkowa;
  const szczegolyPakietow = labSnapshot.szczegolyPakietow;

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
    const detal = labSnapshot.labCartDetal;
    const etykietaBazowa = detal?.etykietaBazowa ?? "";
    const nazwaUslugi = `Badania Laboratoryjne: ${etykietaBazowa}`;

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
      ...(detal ? { labCartDetal: detal } : {}),
    });
    toast.success(`Dodano ${nazwaUslugi} do zestawienia!`);
  };

  const konfiguracjaPoprawna = labSnapshot.konfiguracjaPoprawna;

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

          <LabConfiguratorPanel
            packagesDb={packagesDb}
            isLoading={isLoading}
            onSnapshot={onLabSnapshot}
          />
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
