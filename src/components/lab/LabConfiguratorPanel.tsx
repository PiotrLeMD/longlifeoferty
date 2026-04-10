"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizePackageFields } from "@/src/lib/normalizePackage";
import { LabItemInfo } from "@/src/components/lab/LabItemInfo";
import {
  useLabPackageSelection,
  getStableKey,
  type LabConfiguratorSnapshot,
} from "@/src/components/lab/useLabPackageSelection";

const TILE_BTN =
  "!flex !h-auto !whitespace-normal min-h-0 min-w-0 flex-1 shrink flex-col items-start justify-start gap-2 break-words px-3 py-3 text-left text-sm leading-snug";

export interface LabConfiguratorPanelProps {
  packagesDb: any[];
  isLoading: boolean;
  onSnapshot: (snapshot: LabConfiguratorSnapshot) => void;
}

export function LabConfiguratorPanel({
  packagesDb,
  isLoading,
  onSnapshot,
}: LabConfiguratorPanelProps) {
  const lab = useLabPackageSelection(packagesDb);
  const [extraSearch, setExtraSearch] = useState("");

  useEffect(() => {
    onSnapshot(lab.snapshot);
  }, [lab.snapshot, onSnapshot]);

  const filteredBadaniaPojedyncze = useMemo(() => {
    const q = extraSearch.trim().toLowerCase();
    if (!q) return lab.badaniaPojedyncze;
    return lab.badaniaPojedyncze.filter((pkg: any, idx: number) => {
      const { nazwa, skladniki } = normalizePackageFields(pkg);
      const displayNazwa = (nazwa || `Badanie ${idx + 1}`).toLowerCase();
      return (
        displayNazwa.includes(q) ||
        String(skladniki).toLowerCase().includes(q)
      );
    });
  }, [lab.badaniaPojedyncze, extraSearch]);

  if (isLoading) {
    return (
      <p className="rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
        Ładowanie pakietów...
      </p>
    );
  }

  if (packagesDb.length === 0) {
    return (
      <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Brak pakietów w bazie. Skontaktuj się z administratorem.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          className={`flex min-w-0 gap-2 rounded-xl border-2 p-3 text-left transition-all duration-200 ${
            lab.baseCustom
              ? "border-violet-500 bg-violet-50 ring-2 ring-violet-400"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <Button
            type="button"
            variant={lab.baseCustom ? "default" : "outline"}
            className={TILE_BTN}
            onClick={lab.selectCustomBase}
          >
            <span className="flex w-full min-w-0 items-start gap-2 font-bold">
              <Boxes className="mt-0.5 size-5 shrink-0" />
              <span className="min-w-0 flex-1">
                Zbuduj własny pakiet (Custom)
              </span>
            </span>
            <span className="w-full text-sm font-normal text-slate-600">
              Koszt bazowy 0 PLN — dobierz tylko badania pojedyncze poniżej.
            </span>
          </Button>
        </div>
      </div>

      <p className="mb-2 mt-6 text-sm font-medium text-slate-700">
        Gotowe pakiety
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {lab.pakietyDoSiatki.map((pkg: any, idx: number) => {
          const norm = normalizePackageFields(pkg);
          const { nazwa, cena, koszt, skladniki, description } = norm;
          const displayNazwa = nazwa || `Pakiet ${idx + 1}`;
          const isSelected =
            !lab.baseCustom && lab.selectedPackages.includes(displayNazwa);
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
                onClick={() => lab.togglePackage(displayNazwa)}
                className={TILE_BTN}
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
                  includeInOffer={!!lab.dolaczOpisDoOferty[sKey]}
                  onIncludeChange={(v) => lab.setIncludeOffer(sKey, v)}
                />
              </div>
            </div>
          );
        })}
      </div>
      {lab.pakietyDoSiatki.length === 0 && packagesDb.length > 0 ? (
        <p className="mt-2 text-xs text-amber-800">
          Brak pozycji z rodzajem „pakiet”. Oznacz w bazie kolumnę{" "}
          <code className="rounded bg-amber-100 px-1">rodzaj</code> jako{" "}
          <code className="rounded bg-amber-100 px-1">pakiet</code> dla
          gotowych pakietów.
        </p>
      ) : null}

      <p className="mb-2 mt-8 text-sm font-medium text-slate-700">
        Wybierz dodatkowe badania
      </p>
      <p className="mb-3 text-xs text-slate-500">
        Tylko pozycje z rodzajem „badanie” (np.{" "}
        <code className="rounded bg-slate-100 px-1">badanie</code> lub{" "}
        <code className="rounded bg-slate-100 px-1">badania</code>). Działa z
        pakietami gotowymi i z Pakietem Własnym.
      </p>
      {lab.badaniaPojedyncze.length > 0 ? (
        <div className="mb-3">
          <Input
            type="search"
            placeholder="Szukaj po nazwie lub składnikach…"
            value={extraSearch}
            onChange={(e) => setExtraSearch(e.target.value)}
            className="max-w-md"
            aria-label="Filtruj dodatkowe badania"
          />
        </div>
      ) : null}
      <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-3">
        {lab.badaniaPojedyncze.length === 0 ? (
          <p className="text-sm text-slate-600">
            Brak badań pojedynczych — ustaw w bazie{" "}
            <code className="rounded bg-slate-100 px-1">rodzaj</code> na
            badanie pojedyncze dla wybranych wierszy.
          </p>
        ) : filteredBadaniaPojedyncze.length === 0 ? (
          <p className="text-sm text-slate-600">
            Brak wyników dla „{extraSearch.trim()}”.
          </p>
        ) : (
          filteredBadaniaPojedyncze.map((pkg: any, idx: number) => {
            const norm = normalizePackageFields(pkg);
            const { nazwa, cena, koszt, skladniki, description } = norm;
            const displayNazwa = nazwa || `Badanie ${idx + 1}`;
            const sKey = getStableKey(pkg);
            const checked = lab.extraBadania.includes(displayNazwa);
            return (
              <label
                key={pkg.id ?? sKey}
                className="flex min-w-0 cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => lab.toggleExtra(displayNazwa)}
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
                    includeInOffer={!!lab.dolaczOpisDoOferty[sKey]}
                    onIncludeChange={(v) => lab.setIncludeOffer(sKey, v)}
                  />
                </div>
              </label>
            );
          })
        )}
      </div>

      {lab.konfiguracjaPoprawna ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">
              Suma kosztów (hurt) / osoba
            </p>
            <p className="text-lg font-semibold text-slate-800">
              {lab.sumaKosztow.toFixed(2)} PLN
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">
              Nasza cena detaliczna / osoba
            </p>
            <p className="text-lg font-semibold text-slate-800">
              {lab.sumaCen.toFixed(2)} PLN
            </p>
          </div>
          {lab.sumaRynkowa > 0 && (
            <div className="rounded-lg bg-slate-50 p-4 sm:col-span-2">
              <p className="text-sm font-medium text-slate-600">
                Sugerowana cena rynkowa / osoba
              </p>
              <p className="text-lg font-semibold text-slate-800">
                {lab.sumaRynkowa.toFixed(2)} PLN
              </p>
            </div>
          )}
        </div>
      ) : null}
    </>
  );
}
