"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { LabCartDetal, LabOpisDoOferty } from "@/src/store/useStore";
import { normalizePackageFields } from "@/src/lib/normalizePackage";

export function getStableKey(pkg: any): string {
  const { nazwa } = normalizePackageFields(pkg);
  return String(pkg?.id ?? nazwa ?? "unknown");
}

export interface LabConfiguratorSnapshot {
  sumaKosztow: number;
  sumaCen: number;
  sumaRynkowa: number;
  konfiguracjaPoprawna: boolean;
  labCartDetal: LabCartDetal | null;
  /** Fragment markdown do logistyki (jak w LabView) */
  szczegolyPakietow: string;
}

export const EMPTY_LAB_SNAPSHOT: LabConfiguratorSnapshot = {
  sumaKosztow: 0,
  sumaCen: 0,
  sumaRynkowa: 0,
  konfiguracjaPoprawna: false,
  labCartDetal: null,
  szczegolyPakietow: "",
};

export function useLabPackageSelection(packagesDb: any[]) {
  const [baseCustom, setBaseCustom] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [extraBadania, setExtraBadania] = useState<string[]>([]);
  const [dolaczOpisDoOferty, setDolaczOpisDoOferty] = useState<
    Record<string, boolean>
  >({});

  const setIncludeOffer = useCallback((key: string, value: boolean) => {
    setDolaczOpisDoOferty((prev) => ({ ...prev, [key]: value }));
  }, []);

  const pakietyDoSiatki = useMemo(
    () =>
      packagesDb.filter(
        (p) => normalizePackageFields(p).rodzaj === "pakiet"
      ),
    [packagesDb]
  );

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
      linie.push(
        "- **Baza:** Pakiet własny (brak gotowego pakietu – koszt bazowy 0)"
      );
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

  const collectOpisyDoOferty = useCallback((): LabOpisDoOferty[] => {
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
  }, [
    baseCustom,
    selectedPakietObjs,
    extraBadaniaObjs,
    dolaczOpisDoOferty,
  ]);

  const konfiguracjaPoprawna =
    extraBadania.length > 0 ||
    (!baseCustom && selectedPackages.length > 0);

  const labCartDetal: LabCartDetal | null = useMemo(() => {
    if (!konfiguracjaPoprawna) return null;
    const etykietaBazowa = baseCustom
      ? "Pakiet Własny"
      : selectedPackages.length > 0
        ? selectedPackages.join(", ")
        : extraBadania.length > 0
          ? `Tylko badania: ${extraBadania.join(", ")}`
          : "";
    return {
      bazowyTryb: baseCustom ? "custom" : "pakiety",
      etykietaBazowa,
      nazwyPakietowBazowych: baseCustom ? [] : [...selectedPackages],
      nazwyDodatkowychBadan: [...extraBadania],
      opisyDoOferty: collectOpisyDoOferty(),
    };
  }, [
    konfiguracjaPoprawna,
    baseCustom,
    selectedPackages,
    extraBadania,
    collectOpisyDoOferty,
  ]);

  const snapshot: LabConfiguratorSnapshot = useMemo(
    () => ({
      sumaKosztow,
      sumaCen,
      sumaRynkowa,
      konfiguracjaPoprawna,
      labCartDetal,
      szczegolyPakietow,
    }),
    [
      sumaKosztow,
      sumaCen,
      sumaRynkowa,
      konfiguracjaPoprawna,
      labCartDetal,
      szczegolyPakietow,
    ]
  );

  const togglePackage = useCallback((displayNazwa: string) => {
    setBaseCustom(false);
    setSelectedPackages((prev) =>
      prev.includes(displayNazwa)
        ? prev.filter((p) => p !== displayNazwa)
        : [...prev, displayNazwa]
    );
  }, []);

  const selectCustomBase = useCallback(() => {
    setBaseCustom(true);
    setSelectedPackages([]);
  }, []);

  const toggleExtra = useCallback((displayNazwa: string) => {
    setExtraBadania((prev) =>
      prev.includes(displayNazwa)
        ? prev.filter((x) => x !== displayNazwa)
        : [...prev, displayNazwa]
    );
  }, []);

  return {
    snapshot,
    pakietyDoSiatki,
    badaniaPojedyncze,
    baseCustom,
    selectedPackages,
    extraBadania,
    dolaczOpisDoOferty,
    setIncludeOffer,
    togglePackage,
    selectCustomBase,
    toggleExtra,
    sumaKosztow,
    sumaCen,
    sumaRynkowa,
    konfiguracjaPoprawna,
    szczegolyPakietow,
  };
}
