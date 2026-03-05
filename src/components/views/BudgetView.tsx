"use client";

import { useState, useEffect, useMemo } from "react";
import { Target } from "lucide-react";
import {
  PARAMETRY_USLUG,
  KOSZT_NOCLEGU,
  STAWKA_KM,
} from "@/src/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TypBudzetu = "Całkowity" | "Na osobę";

interface WynikSymulacji {
  usluga: string;
  koszt: number;
  marza: number;
  czas: number;
  status: "zielony" | "zolty" | "czerwony";
}

export default function BudgetView() {
  const [pacjenci, setPacjenci] = useState(100);
  const [km, setKm] = useState(50);
  const [nZesp, setNZesp] = useState(1);
  const [typBudzetu, setTypBudzetu] = useState<TypBudzetu>("Całkowity");
  const [wartoscBudzetu, setWartoscBudzetu] = useState(10000);
  const [wyniki, setWyniki] = useState<WynikSymulacji[]>([]);

  const budzetCalkowity = useMemo(() => {
    if (typBudzetu === "Całkowity") return wartoscBudzetu;
    return wartoscBudzetu * pacjenci;
  }, [typBudzetu, wartoscBudzetu, pacjenci]);

  useEffect(() => {
    if (budzetCalkowity <= 0) {
      setWyniki([]);
      return;
    }

    const noweWyniki: WynikSymulacji[] = [];

    for (const [usluga, p] of Object.entries(PARAMETRY_USLUG)) {
      if (usluga === "Brak") continue;
      const wydajnosc = p.wydajnosc;
      if (wydajnosc <= 0) continue;

      const dni = Math.ceil(pacjenci / (wydajnosc * nZesp));
      const isRemote = km > 150;
      const stawka = isRemote ? p.stawka_remote : p.stawka_local;
      const kPers = dni * stawka * nZesp;
      const kDojazd = km * 2 * STAWKA_KM * nZesp;
      const kHotel =
        isRemote || dni > 1 ? dni * KOSZT_NOCLEGU * nZesp : 0;
      const kMat =
        pacjenci * p.koszt_mat + dni * p.koszt_mat_dzien * nZesp;
      const kosztBazy = kPers + kDojazd + kHotel + kMat;

      if (kosztBazy <= 0) continue;

      const marza = ((budzetCalkowity - kosztBazy) / kosztBazy) * 100;

      let status: "zielony" | "zolty" | "czerwony" = "czerwony";
      if (marza >= 40) status = "zielony";
      else if (marza >= 20) status = "zolty";

      noweWyniki.push({
        usluga,
        koszt: kosztBazy,
        marza,
        czas: dni,
        status,
      });
    }

    setWyniki(noweWyniki);
  }, [pacjenci, km, nZesp, budzetCalkowity]);

  const wynikiZielone = wyniki
    .filter((w) => w.status === "zielony")
    .sort((a, b) => b.marza - a.marza);
  const wynikiZolte = wyniki
    .filter((w) => w.status === "zolty")
    .sort((a, b) => b.marza - a.marza);
  const wynikiCzerwone = wyniki
    .filter((w) => w.status === "czerwony")
    .sort((a, b) => b.marza - a.marza);

  const SekcjaWynikow = ({
    tytul,
    items,
    kolor,
  }: {
    tytul: string;
    items: WynikSymulacji[];
    kolor: "green" | "yellow" | "red";
  }) => {
    const borderClass =
      kolor === "green"
        ? "border-l-green-500"
        : kolor === "yellow"
          ? "border-l-yellow-500"
          : "border-l-red-500";

    if (items.length === 0) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-slate-800">{tytul}</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((w) => (
            <Card
              key={w.usluga}
              className={`shadow-sm transition-all duration-200 border-l-4 ${borderClass}`}
            >
              <CardContent className="p-4">
                <p className="force-wrap font-medium text-slate-800">{w.usluga}</p>
                <p className="mt-1 text-sm text-slate-600">
                  ⏱️ {w.czas} {w.czas === 1 ? "dzień" : "dni"}
                </p>
                <Badge
                  variant={
                    kolor === "green"
                      ? "default"
                      : kolor === "yellow"
                        ? "secondary"
                        : "destructive"
                  }
                  className={
                    kolor === "green"
                      ? "bg-green-500 hover:bg-green-600 mt-2"
                      : kolor === "yellow"
                        ? "bg-amber-500 hover:bg-amber-600 mt-2"
                        : "mt-2"
                  }
                >
                  Marża: {w.marza.toFixed(1)}%
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
        <Target className="h-6 w-6 text-blue-600" />
        Odwrócone Ofertowanie: Dopasowanie do Budżetu
      </h1>

      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
          <CardTitle>Parametry wejściowe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Szacowana liczba uczestników</Label>
            <Input
              type="number"
              min={1}
              value={pacjenci}
              onChange={(e) => setPacjenci(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          <div className="space-y-2">
            <Label>Odległość od Warszawy (km)</Label>
            <Input
              type="number"
              min={0}
              value={km}
              onChange={(e) => setKm(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>
          <div className="space-y-2">
            <Label>Preferowana liczba zespołów (dojazd)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={nZesp}
              onChange={(e) =>
                setNZesp(Math.min(5, Math.max(1, parseInt(e.target.value) || 1)))
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Sposób określenia budżetu</Label>
            <div className="flex gap-4 pt-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="typBudzetu"
                  checked={typBudzetu === "Całkowity"}
                  onChange={() => setTypBudzetu("Całkowity")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Kwota całkowita (PLN)</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="typBudzetu"
                  checked={typBudzetu === "Na osobę"}
                  onChange={() => setTypBudzetu("Na osobę")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">Kwota na osobę (PLN)</span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Wartość budżetu (PLN)</Label>
            <Input
              type="number"
              min={0}
              step={500}
              value={wartoscBudzetu}
              onChange={(e) =>
                setWartoscBudzetu(Math.max(0, parseFloat(e.target.value) || 0))
              }
            />
          </div>
        </div>

        {budzetCalkowity > 0 && (
          <div className="rounded-lg bg-blue-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-700">
              Całkowity Budżet Klienta:{" "}
              <span className="font-semibold text-blue-700">
                {budzetCalkowity.toFixed(2)} PLN
              </span>
            </p>
          </div>
        )}
        </CardContent>
      </Card>

      <div className="space-y-8">
        <SekcjaWynikow
          tytul="🟢 Zdecydowanie Polecane (Marża ≥ 40%)"
          items={wynikiZielone}
          kolor="green"
        />
        <SekcjaWynikow
          tytul="🟡 Akceptowalne (Marża 20% – 39.9%)"
          items={wynikiZolte}
          kolor="yellow"
        />
        <SekcjaWynikow
          tytul="🔴 Odrzucone (Marża < 20%)"
          items={wynikiCzerwone}
          kolor="red"
        />
      </div>
    </div>
  );
}
