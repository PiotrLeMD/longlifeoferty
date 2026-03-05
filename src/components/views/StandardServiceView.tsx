"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PARAMETRY_USLUG, KOSZT_NOCLEGU, STAWKA_KM } from "@/src/lib/constants";
import {
  straznikRentownosci,
  generujLogistykeOpis,
  symulacjaCzasu,
} from "@/src/lib/calculations";
import { useStore } from "@/src/store/useStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StandardServiceViewProps {
  serviceName: string;
}

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

/** Mapuje nazwę usługi z menu na klucz w PARAMETRY_USLUG oraz max zespołów */
function getServiceConfig(serviceName: string) {
  const configs: Record<string, { paramKey: string; maxTeams: number }> = {
    "USG w Firmie": { paramKey: "USG", maxTeams: 2 },
    Kardiologia: { paramKey: "Profilaktyka Serca", maxTeams: 3 },
    Spirometria: { paramKey: "Spirometria", maxTeams: 2 },
    Dermatoskopia: { paramKey: "Dermatoskopia", maxTeams: 3 },
    "Cukrzyca BASIC": { paramKey: "Cukrzyca BASIC", maxTeams: 5 },
    "Cukrzyca PREMIUM": { paramKey: "Cukrzyca PREMIUM", maxTeams: 5 },
  };
  return (
    configs[serviceName] ?? {
      paramKey: serviceName,
      maxTeams: 3,
    }
  );
}

export default function StandardServiceView({ serviceName }: StandardServiceViewProps) {
  const { addToCart } = useStore();
  const { paramKey, maxTeams } = getServiceConfig(serviceName);
  const params = PARAMETRY_USLUG[paramKey] ?? PARAMETRY_USLUG["Brak"];
  const [idCounter, setIdCounter] = useState(1);

  const [locations, setLocations] = useState<Location[]>([
    { ...DEFAULT_LOCATION, id: 0 },
  ]);
  const [finalPrice, setFinalPrice] = useState(0);

  const addLocation = () => {
    const newId = idCounter;
    setIdCounter((c) => c + 1);
    setLocations((prev) => [
      ...prev,
      { ...DEFAULT_LOCATION, id: newId },
    ]);
  };

  const removeLocation = (id: number) => {
    if (locations.length <= 1) return;
    setLocations((prev) => prev.filter((loc) => loc.id !== id));
  };

  const updateLocation = (id: number, field: keyof Location, value: string | number) => {
    setLocations((prev) =>
      prev.map((loc) => (loc.id === id ? { ...loc, [field]: value } : loc))
    );
  };

  const {
    totalKoszt,
    totalPacjenci,
    opisLok,
    preferredPrice,
  } = useMemo(() => {
    let total = 0;
    let pacjenci = 0;
    let opis = "";

    for (const loc of locations) {
      const { patients, km, teams, city } = loc;
      const idx = locations.indexOf(loc) + 1;
      const nazwaLok = city || `Lokalizacja ${idx}`;

      if (patients <= 0) continue;

      const dni = Math.ceil(patients / (params.wydajnosc * teams));
      const isRemote = km > 150;
      const stawka = isRemote ? params.stawka_remote : params.stawka_local;

      const kPers = dni * stawka * teams;
      const kMat = patients * params.koszt_mat + dni * params.koszt_mat_dzien * teams;
      const kDojazd = km * 2 * STAWKA_KM * teams;
      const kHotel =
        isRemote || dni > 1 ? dni * KOSZT_NOCLEGU * teams : 0;

      total += kPers + kMat + kDojazd + kHotel;
      pacjenci += patients;
      opis += `- ${nazwaLok}: ${patients} os. (${teams} zesp., ${dni} dni)\n`;
    }

    const pref = total * 2.0;
    return {
      totalKoszt: total,
      totalPacjenci: pacjenci,
      opisLok: opis,
      preferredPrice: pref,
    };
  }, [locations, params]);

  const rentownosc = useMemo(
    () => straznikRentownosci(totalKoszt, 0, finalPrice),
    [totalKoszt, finalPrice]
  );

  const cenaPerCapita = totalPacjenci > 0 ? finalPrice / totalPacjenci : 0;
  const logistyka = generujLogistykeOpis(totalPacjenci, opisLok);

  const handleAddToCart = () => {
    addToCart({
      usluga: serviceName,
      cenaBrutto: finalPrice,
      cenaPerCapita,
      cenaRynkowaOsoba: 0,
      marzaProcent: `${rentownosc.marza.toFixed(1)}%`,
      logistyka,
      abonament: false,
      harmonogram: null,
    });
    toast.success(`Dodano ${serviceName} do zestawienia!`);
  };

  useEffect(() => {
    if (totalPacjenci === 0) {
      setFinalPrice(0);
    } else if (finalPrice === 0) {
      setFinalPrice(Math.round(totalKoszt * 1.8 * 100) / 100);
    }
  }, [totalPacjenci, totalKoszt]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">
        🩺 {serviceName}
      </h1>

      <div className="space-y-4">
        {locations.map((loc, locIdx) => {
          const patients = loc.patients;
          const dni =
            patients > 0
              ? Math.ceil(patients / (params.wydajnosc * loc.teams))
              : 0;
          const symulacja =
            patients > 0 ? symulacjaCzasu(patients, params.wydajnosc, maxTeams) : "";

          return (
            <Card key={loc.id} className="shadow-sm transition-all duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="force-wrap min-w-0 text-base">
                    {loc.city || `Lokalizacja ${locIdx + 1}`}
                  </CardTitle>
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
              </CardHeader>
              <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Miejscowość / Oddział</Label>
                  <Input
                    value={loc.city}
                    onChange={(e) =>
                      updateLocation(loc.id, "city", e.target.value)
                    }
                    placeholder="np. Fabryka Poznań"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Liczba Zespołów (Max {maxTeams})</Label>
                  <Input
                    type="number"
                    min={1}
                    max={maxTeams}
                    value={loc.teams}
                    onChange={(e) =>
                      updateLocation(loc.id, "teams", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Uczestnicy (Norma 1 zesp: {params.wydajnosc}/dzień)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={loc.patients}
                    onChange={(e) =>
                      updateLocation(loc.id, "patients", parseInt(e.target.value) || 0)
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
              {patients > 0 && (
                <div className="mt-4 rounded-lg border-l-4 border-blue-400 bg-blue-50/50 px-4 py-2 text-sm text-slate-700">
                  <p>
                    ⏱️ {loc.teams} Zesp. ➡ <strong>{dni} dni</strong> pracy.
                  </p>
                  {symulacja && (
                    <p
                      className="mt-1 text-slate-600"
                      dangerouslySetInnerHTML={{
                        __html: `💡 ${symulacja}`,
                      }}
                    />
                  )}
                </div>
              )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button variant="outline" onClick={addLocation}>
        <Plus className="size-4" />
        Dodaj lokalizację
      </Button>

      {totalPacjenci > 0 && (
        <>
          <hr className="border-slate-200" />
          <Card className="border-blue-200 bg-blue-50/50 shadow-sm transition-all duration-200">
            <CardHeader>
              <CardTitle>Podsumowanie rentowności</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-600">
                1. Koszt BAZOWY
              </p>
              <p className="text-xl font-semibold text-slate-800">
                {totalKoszt.toFixed(2)} PLN
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-amber-50/50 p-4">
              <p className="text-sm font-medium text-slate-600">
                2. Min (×1.5)
              </p>
              <p className="text-xl font-semibold text-slate-800">
                {(totalKoszt * 1.5).toFixed(2)} PLN
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-green-50/50 p-4">
              <p className="text-sm font-medium text-slate-600">
                3. Pref (×2.0)
              </p>
              <p className="text-xl font-semibold text-slate-800">
                {(totalKoszt * 2.0).toFixed(2)} PLN
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                className="h-12"
              />
              <p className="text-sm text-slate-600">
                Wychodzi: <strong>{cenaPerCapita.toFixed(2)} PLN</strong> za osobę
              </p>
            </div>
            <div className="flex flex-col justify-end">
              <Label>Status:</Label>
              <Badge
                variant={
                  rentownosc.status === "success"
                    ? "default"
                    : rentownosc.status === "warning"
                      ? "secondary"
                      : "destructive"
                }
                className={
                  rentownosc.status === "success"
                    ? "bg-green-500 hover:bg-green-600"
                    : rentownosc.status === "warning"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : ""
                }
              >
                {rentownosc.msg}
              </Badge>
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={rentownosc.status === "error"}
            size="lg"
            className="w-full"
          >
            ➕ Dodaj do Oferty
          </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
