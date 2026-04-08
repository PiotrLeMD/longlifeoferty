"use client";

import { useState, useMemo } from "react";
import { ClipboardList, Trash2, Copy } from "lucide-react";
import { useStore } from "@/src/store/useStore";
import {
  cenaPoRabacieProcentowym,
  straznikRentownosci,
} from "@/src/lib/calculations";
import { OPISY_MARKETINGOWE } from "@/src/lib/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PDFDownloadButton } from "@/src/components/PDFDownloadButton";
import { PPTXDownloadButton } from "@/src/components/PPTXDownloadButton";

function marzaToneClass(
  status: "success" | "warning" | "error"
): string {
  if (status === "success") return "font-semibold text-green-600";
  if (status === "warning") return "font-semibold text-amber-600";
  return "font-semibold text-red-600";
}

function getOpisMarketingowy(nazwa: string): string {
  if (nazwa.includes("Badania Lab")) return OPISY_MARKETINGOWE["Badania Laboratoryjne"];
  if (nazwa.includes("Zarządzanie stresem")) return OPISY_MARKETINGOWE["Zarządzanie stresem"];
  if (
    nazwa.includes("Roczny Program") ||
    nazwa.includes("Abonament") ||
    nazwa.includes("Indywidualny Program")
  ) {
    return OPISY_MARKETINGOWE["Program Roczny"];
  }
  return (
    OPISY_MARKETINGOWE[nazwa] ??
    "### Szczegóły usługi\nIndywidualnie dopasowany zakres badań."
  );
}

export default function SummaryView() {
  const {
    cart,
    user,
    removeFromCart,
    klientNip,
    klientLogoUrl,
    setKlientNip,
    setKlientLogoUrl,
    globalRabatProcent,
    setGlobalRabatProcent,
  } = useStore();

  const [klientFirma, setKlientFirma] = useState("");
  const [klientAdres, setKlientAdres] = useState("");
  const [klientKontakt, setKlientKontakt] = useState("");
  const [klientEmail, setKlientEmail] = useState("");

  const [handlowiecImie, setHandlowiecImie] = useState(user?.imie ?? "");
  const [handlowiecStanowisko, setHandlowiecStanowisko] = useState(
    user?.stanowisko ?? ""
  );
  const [handlowiecEmail, setHandlowiecEmail] = useState(user?.email ?? "");
  const [handlowiecTelefon, setHandlowiecTelefon] = useState(
    user?.telefon ?? ""
  );

  const [generatedMarkdown, setGeneratedMarkdown] = useState("");
  const [copied, setCopied] = useState(false);

  const today = useMemo(() => new Date().toLocaleDateString(), []);

  const rabatClamped = Math.max(0, Math.min(100, globalRabatProcent));

  const sumyKoszyka = useMemo(() => {
    const sumaPrzed = cart.reduce((s, i) => s + i.cenaBrutto, 0);
    const sumaPo = cart.reduce(
      (s, i) => s + cenaPoRabacieProcentowym(i.cenaBrutto, rabatClamped),
      0
    );
    return {
      sumaPrzed,
      sumaPo,
      rabatAktywny: rabatClamped > 0 && cart.length > 0,
    };
  }, [cart, rabatClamped]);

  const generateMarkdown = () => {
    if (!cart.length) {
      setGeneratedMarkdown("");
      return;
    }

    let md = `# Oferta Współpracy Medycznej\n### Dla: ${
      klientFirma || "Naszego Klienta"
    }\n`;
    if (klientAdres) md += `**Adres:** ${klientAdres}\n`;
    if (klientKontakt) md += `**Osoba kontaktowa:** ${klientKontakt}\n`;
    if (klientEmail) md += `**Email:** ${klientEmail}\n`;
    md += `**Data:** ${today}\n`;
    md += `\n---\n`;

    md +=
      "# Strefa Zdrowia w Twojej Firmie\n" +
      "### Profilaktyka bez wychodzenia z biura\n\n" +
      "Organizujemy profesjonalne badania i konsultacje medyczne bezpośrednio w siedzibie Twojej firmy. Nasz mobilny zespół medyczny tworzy szybkie i doskonale zorganizowane stanowiska diagnostyczne.\n\n" +
      "### Proces Realizacji\n" +
      "1. **Analiza:** Dobieramy odpowiednie moduły.\n" +
      "2. **Realizacja:** Przyjeżdżamy z pełnym sprzętem. Potrzebujemy tylko sali.\n" +
      "3. **Raport:** Indywidualne wyniki dla pracowników i anonimowy raport zbiorczy dla firmy.\n\n" +
      "> **Bezpieczeństwo:** Działamy zgodnie z RODO i tajemnicą medyczną.\n\n---\n";

    md += "\n## Warunki cenowe i rabat\n\n";
    if (rabatClamped > 0) {
      md +=
        `Do niniejszej oferty przyjęto **globalny rabat w wysokości ${rabatClamped}%** od łącznej wartości modułów (ceny katalogowe przed rabatem).\n\n` +
        `| | Kwota (PLN brutto / zw. z VAT) |\n` +
        `| --- | ---: |\n` +
        `| Wartość przed rabatem | ${sumyKoszyka.sumaPrzed.toFixed(2)} |\n` +
        `| **Wartość do zapłaty po rabacie** | **${sumyKoszyka.sumaPo.toFixed(2)}** |\n\n` +
        `> **Prezentacja i kolejne slajdy:** kwoty przy poszczególnych opcjach i w podsumowaniu tabelarycznym są **już po uwzględnieniu rabatu** ${rabatClamped}%.\n\n` +
        `---\n\n`;
    } else {
      md +=
        "W tej wersji oferty **nie zastosowano globalnego rabatu procentowego** — przyjęto ceny modułów zgodnie z ustaleniami w kreatorach (bez dodatkowego rabatu od sumy koszyka).\n\n" +
        `| | Kwota (PLN brutto / zw. z VAT) |\n` +
        `| --- | ---: |\n` +
        `| **Łączna wartość oferty** | **${sumyKoszyka.sumaPrzed.toFixed(2)}** |\n\n` +
        "---\n\n";
    }

    cart.forEach((item, index) => {
      const nazwa = item.usluga;
      const opisMarketingowy = getOpisMarketingowy(nazwa);
      const cleanLogistyka = item.logistyka.replace(/\n/g, "  \n");
      const bruttoWiersz = cenaPoRabacieProcentowym(
        item.cenaBrutto,
        rabatClamped
      );
      const perCapPo =
        item.cenaPerCapita > 0
          ? cenaPoRabacieProcentowym(item.cenaPerCapita, rabatClamped)
          : 0;

      md += `# Opcja ${index + 1}: ${nazwa}\n${opisMarketingowy}\n\n### Parametry Finansowe\n`;

      if (item.abonament) {
        const mies = perCapPo / 12;
        md += `> **Miesięczna inwestycja: ${mies.toFixed(
          2
        )} PLN / pracownika**\n`;
        md += `> *(Całkowity koszt roczny dla firmy: ${bruttoWiersz.toFixed(
          2
        )} PLN)*\n\n`;
      } else {
        md += `> **Inwestycja Całkowita: ${bruttoWiersz.toFixed(
          2
        )} PLN (zw. z VAT)**\n`;
        if (item.cenaRynkowaOsoba > 0) {
          md += `> *Sugerowana cena rynkowa: ~~${item.cenaRynkowaOsoba.toFixed(
            2
          )} PLN / osobę~~*\n`;
        }
        if (item.cenaPerCapita > 0) {
          md += `> *Nasza cena w pakiecie: **${perCapPo.toFixed(
            2
          )} PLN / osobę***\n\n`;
        }
      }

      md += `### Parametry Realizacji\n${cleanLogistyka}\n\n`;

      if (
        item.labCartDetal?.opisyDoOferty &&
        item.labCartDetal.opisyDoOferty.length > 0
      ) {
        md += `### Opisy badań (do oferty dla klienta)\n\n`;
        item.labCartDetal.opisyDoOferty.forEach((o) => {
          md += `#### ${o.nazwa}\n${o.tekst}\n\n`;
        });
      }

      if (item.harmonogram) {
        const harm = item.harmonogram;
        md += "---\n\n## 📅 Twój Roczny Plan Zdrowia (Oś Czasu)\n";
        md +=
          "> **Elastyczność to podstawa:** Poniższy układ na osi czasu to nasza propozycja.\n\n";

        const kwartaly = [
          "Kwartał 1",
          "Kwartał 2",
          "Kwartał 3",
          "Kwartał 4",
        ] as const;

        kwartaly.forEach((kw) => {
          const data = harm[kw];
          if (data) {
            md += `### ${kw}\n- **Główne wydarzenie w firmie:** ${
              data.akcja
            }\n- **Edukacja:** Webinar: ${data.webinar}\n\n`;
          }
        });

        md += "---\n\n## 🧩 Co dokładnie wchodzi w skład Twojego Programu?\n\n";
        const unikalneAkcje: string[] = [];
        (Object.entries(harm) as [string, any][]).forEach(([k, dane]) => {
          if (
            k.startsWith("Kwartał") &&
            dane.akcja !== "Brak" &&
            !unikalneAkcje.includes(dane.akcja)
          ) {
            unikalneAkcje.push(dane.akcja);
          }
        });
        unikalneAkcje.forEach((akcja) => {
          const opisModulu = getOpisMarketingowy(akcja);
          md += `${opisModulu}\n\n`;
        });
        if (harm.dietetyk) {
          md += `### Konsultacje Dietetyczne w Miejscu Pracy\nPlan obejmuje ${
            harm.dni_dietetyk
          } dni roboczych stacjonarnych konsultacji w firmie.\n\n`;
        }
        md += `${OPISY_MARKETINGOWE["Webinary Edukacyjne"]}\n\n`;
      }

      md += "\n---\n";
    });

    md +=
      "# Podsumowanie Opcji do Wyboru\n\n" +
      "| Wariant / Opcja | Inwestycja Całkowita | Koszt na pracownika |\n" +
      "|---|---|---|\n";

    cart.forEach((item) => {
      let perCapitaStr = "-";
      const bruttoPod = cenaPoRabacieProcentowym(
        item.cenaBrutto,
        rabatClamped
      );
      if (item.abonament) {
        const mies =
          cenaPoRabacieProcentowym(item.cenaPerCapita, rabatClamped) / 12;
        perCapitaStr = `${mies.toFixed(2)} PLN / msc`;
      } else if (item.cenaPerCapita > 0) {
        perCapitaStr = `${cenaPoRabacieProcentowym(
          item.cenaPerCapita,
          rabatClamped
        ).toFixed(2)} PLN`;
      }
      md += `| ${item.usluga} | ${bruttoPod.toFixed(
        2
      )} PLN | ${perCapitaStr} |\n`;
    });

    md += "\n---\n";

    const podpisImie = handlowiecImie || "Twój Opiekun";
    const podpisEmail = handlowiecEmail || "oferta@longlife.pl";

    md += "# Zapraszamy do współpracy\n### Skontaktuj się z nami\n\n";
    md += `**${podpisImie}** \n`;
    if (handlowiecStanowisko) md += `${handlowiecStanowisko}  \n`;
    md += `📧 ${podpisEmail}  \n`;
    if (handlowiecTelefon) md += `📞 ${handlowiecTelefon}  \n`;
    md +=
      "\n**Nota prawna:** Podane ceny są cenami końcowymi do zapłaty (Brutto). Usługi medyczne zwolnione z VAT.\n";

    setGeneratedMarkdown(md);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!generatedMarkdown) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedMarkdown);
        setCopied(true);
        toast.success("Skopiowano do schowka!");
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = generatedMarkdown;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        toast.success("Skopiowano do schowka!");
      }
    } catch {
      setCopied(false);
      toast.error("Nie udało się skopiować");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
        <ClipboardList className="h-6 w-6 text-blue-600" />
        Zestawienie Oferty
      </h1>

      {/* KARTA 1: Dane klienta i handlowca */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm transition-all duration-200">
          <CardHeader>
            <CardTitle>Klient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Firma</Label>
              <Input
                value={klientFirma}
                onChange={(e) => setKlientFirma(e.target.value)}
                placeholder="Firma XYZ Sp. z o.o."
              />
            </div>
            <div className="space-y-2">
              <Label>Adres</Label>
              <Input
                value={klientAdres}
                onChange={(e) => setKlientAdres(e.target.value)}
                placeholder="ul. Prosta 1, Warszawa"
              />
            </div>
            <div className="space-y-2">
              <Label>Osoba kontaktowa</Label>
              <Input
                value={klientKontakt}
                onChange={(e) => setKlientKontakt(e.target.value)}
                placeholder="Jan Kowalski, HR"
              />
            </div>
            <div className="space-y-2">
              <Label>Email (Klient)</Label>
              <Input
                type="email"
                value={klientEmail}
                onChange={(e) => setKlientEmail(e.target.value)}
                placeholder="jan@firma.pl"
              />
            </div>
            <div className="space-y-2">
              <Label>NIP klienta</Label>
              <Input
                value={klientNip}
                onChange={(e) => setKlientNip(e.target.value)}
                placeholder="np. 1234567890"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo klienta (URL)</Label>
              <Input
                type="url"
                value={klientLogoUrl}
                onChange={(e) => setKlientLogoUrl(e.target.value)}
                placeholder="https://…"
                autoComplete="off"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm transition-all duration-200">
          <CardHeader>
            <CardTitle>Handlowiec (Ty)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Imię i Nazwisko</Label>
              <Input
                value={handlowiecImie}
                onChange={(e) => setHandlowiecImie(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Stanowisko</Label>
              <Input
                value={handlowiecStanowisko}
                onChange={(e) => setHandlowiecStanowisko(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (Ty)</Label>
              <Input
                type="email"
                value={handlowiecEmail}
                onChange={(e) => setHandlowiecEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input
                type="tel"
                value={handlowiecTelefon}
                onChange={(e) => setHandlowiecTelefon(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KARTA 2: Koszyk */}
      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Elementy w koszyku</CardTitle>
          <span className="text-sm text-slate-500">Łącznie: {cart.length}</span>
        </div>
        </CardHeader>
        <CardContent>
        {!cart.length ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            Twój koszyk jest pusty. Przejdź do usług, aby dodać pierwsze moduły.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-[34%] px-4 py-2 text-left font-medium text-slate-600">
                      Usługa
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-slate-600">
                      Cena (Brutto)
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-slate-600">
                      Cena za osobę
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-slate-600">
                      Marża
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-slate-600">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {cart.map((item, index) => {
                    const cenaPo = cenaPoRabacieProcentowym(
                      item.cenaBrutto,
                      rabatClamped
                    );
                    const capPo =
                      item.cenaPerCapita > 0
                        ? cenaPoRabacieProcentowym(
                            item.cenaPerCapita,
                            rabatClamped
                          )
                        : 0;
                    const mozeMarza = item.kosztOperacyjny != null;
                    const rentPo =
                      sumyKoszyka.rabatAktywny && mozeMarza
                        ? straznikRentownosci(
                            item.kosztOperacyjny!,
                            item.przychodSztywnyLab ?? 0,
                            cenaPo
                          )
                        : null;

                    return (
                      <tr key={`${item.usluga}-${index}`}>
                        <td className="force-wrap w-[34%] px-4 py-2 align-top text-slate-800">
                          <span className="block">{item.usluga}</span>
                          {item.usgRodzajeBadan &&
                            item.usgRodzajeBadan.length > 0 && (
                              <span className="mt-1 block text-xs text-slate-500">
                                USG: {item.usgRodzajeBadan.join(", ")}
                              </span>
                            )}
                          {item.labCartDetal && (
                            <span className="mt-2 block border-l-2 border-blue-200 pl-2 text-xs text-slate-600">
                              <span className="font-medium text-slate-700">
                                {item.labCartDetal.etykietaBazowa}
                              </span>
                              {item.labCartDetal.nazwyDodatkowychBadan.length >
                                0 && (
                                <span className="mt-1 block text-slate-500">
                                  Dodatki:{" "}
                                  {item.labCartDetal.nazwyDodatkowychBadan.join(
                                    ", "
                                  )}
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 align-top text-right text-slate-800">
                          {sumyKoszyka.rabatAktywny ? (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-muted-foreground line-through">
                                {item.cenaBrutto.toFixed(2)} PLN
                              </span>
                              <span className="font-semibold">
                                {cenaPo.toFixed(2)} PLN
                              </span>
                            </div>
                          ) : (
                            `${item.cenaBrutto.toFixed(2)} PLN`
                          )}
                        </td>
                        <td className="px-4 py-2 align-top text-right text-slate-800">
                          {item.cenaPerCapita > 0 ? (
                            sumyKoszyka.rabatAktywny ? (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-muted-foreground line-through">
                                  {item.cenaPerCapita.toFixed(2)} PLN
                                </span>
                                <span className="font-semibold">
                                  {capPo.toFixed(2)} PLN
                                </span>
                              </div>
                            ) : (
                              `${item.cenaPerCapita.toFixed(2)} PLN`
                            )
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-2 align-top text-right">
                          {sumyKoszyka.rabatAktywny && rentPo ? (
                            <div className="flex flex-col items-end gap-0.5 text-xs">
                              <span className="text-muted-foreground line-through">
                                {item.marzaProcent}
                              </span>
                              <span
                                className={marzaToneClass(rentPo.status)}
                                title={rentPo.msg}
                              >
                                {rentPo.marza.toFixed(1)}%
                              </span>
                            </div>
                          ) : sumyKoszyka.rabatAktywny && !mozeMarza ? (
                            <div className="flex flex-col items-end gap-0.5 text-xs">
                              <span className="text-muted-foreground line-through">
                                {item.marzaProcent}
                              </span>
                              <span
                                className="text-amber-700"
                                title="Brak zapisanej bazy kosztowej dla tej pozycji — nie przeliczono marży po rabacie."
                              >
                                —
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-800">
                              {item.marzaProcent}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 align-top text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(index)}
                            className="text-xs"
                          >
                            <Trash2 className="h-3 w-3" /> Usuń
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="border-t border-slate-200 bg-slate-50/80">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-right font-medium text-slate-700"
                    >
                      Razem
                    </td>
                    <td colSpan={2} className="px-4 py-3 text-right">
                      {sumyKoszyka.rabatAktywny ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-muted-foreground line-through">
                            {sumyKoszyka.sumaPrzed.toFixed(2)} PLN
                          </span>
                          <span className="text-lg font-semibold text-slate-900">
                            {sumyKoszyka.sumaPo.toFixed(2)} PLN
                          </span>
                          <span className="text-xs font-normal text-slate-500">
                            do zapłaty po rabacie {rabatClamped}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-semibold text-slate-900">
                          {sumyKoszyka.sumaPrzed.toFixed(2)} PLN
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2 sm:max-w-xs">
                <Label htmlFor="global-rabat">Globalny rabat (%)</Label>
                <Input
                  id="global-rabat"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={globalRabatProcent || ""}
                  onChange={(e) =>
                    setGlobalRabatProcent(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-slate-500 sm:max-w-md sm:text-right">
                Rabat obniża cenę końcową każdej pozycji proporcjonalnie.
                Marża po rabacie jest liczona od zapisanych kosztów operacyjnych
                pozycji (nowe wpisy z kreatorów).
              </p>
            </div>
          </div>
        )}
        </CardContent>
      </Card>

      {/* Generowanie prezentacji */}
      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>🚀 Generowanie Prezentacji (Markdown)</CardTitle>
          <span className="text-xs text-slate-500">{today}</span>
        </div>
        </CardHeader>
        <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={generateMarkdown}
            disabled={!cart.length}
          >
            Generuj Prezentację (Markdown)
          </Button>
          <PDFDownloadButton
            offerData={{
              client: {
                firma: klientFirma,
                adres: klientAdres,
                kontakt: klientKontakt,
                email: klientEmail,
                nip: klientNip.trim() || undefined,
                logoKlientaUrl: klientLogoUrl.trim() || undefined,
              },
              handlowiec: {
                imie: handlowiecImie,
                stanowisko: handlowiecStanowisko,
                email: handlowiecEmail,
                telefon: handlowiecTelefon,
              },
              items: cart.map((item) => ({
                usluga: item.usluga,
                cenaBrutto: cenaPoRabacieProcentowym(
                  item.cenaBrutto,
                  rabatClamped
                ),
                cenaPerCapita:
                  item.cenaPerCapita > 0
                    ? cenaPoRabacieProcentowym(
                        item.cenaPerCapita,
                        rabatClamped
                      )
                    : item.cenaPerCapita,
                ilosc: 1,
                opis: item.logistyka,
              })),
              totalBrutto: sumyKoszyka.sumaPo,
              dataWystawienia: today,
            }}
            fileName={`oferta-${(klientFirma || "klient").replace(/\s+/g, "-").slice(0, 30)}-${today.replace(/\./g, "-")}.pdf`}
            disabled={!cart.length}
          />
          <PPTXDownloadButton
            clientName={klientFirma || "Klient"}
            selectedPackages={cart.map((item) => {
              const bruttoPo = cenaPoRabacieProcentowym(
                item.cenaBrutto,
                rabatClamped
              );
              const capPo =
                item.cenaPerCapita > 0
                  ? cenaPoRabacieProcentowym(
                      item.cenaPerCapita,
                      rabatClamped
                    )
                  : 0;
              const count =
                item.cenaPerCapita > 0
                  ? Math.round(item.cenaBrutto / item.cenaPerCapita)
                  : 1;
              return {
                usluga: item.usluga,
                count,
                cena: item.cenaPerCapita > 0 ? capPo : bruttoPo,
                wartosc: bruttoPo,
              };
            })}
            totalPrice={sumyKoszyka.sumaPo}
            handlowiec={{
              imie: handlowiecImie,
              stanowisko: handlowiecStanowisko,
              email: handlowiecEmail,
              telefon: handlowiecTelefon,
            }}
            fileName={`oferta-${(klientFirma || "klient").replace(/\s+/g, "-").slice(0, 30)}-${today.replace(/\./g, "-")}.pptx`}
            disabled={!cart.length}
          />
        </div>

        {generatedMarkdown && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Wygenerowany Markdown</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                <Copy className="h-3 w-3" />
                {copied ? "Skopiowano" : "📋 Kopiuj do schowka"}
              </Button>
            </div>
            <Textarea
              value={generatedMarkdown}
              readOnly
              rows={18}
              className="w-full resize-y font-mono text-xs"
            />
          </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
