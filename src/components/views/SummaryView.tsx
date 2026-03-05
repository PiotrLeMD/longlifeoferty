"use client";

import { useState, useMemo } from "react";
import { ClipboardList, Trash2, Copy } from "lucide-react";
import { useStore } from "@/src/store/useStore";
import { OPISY_MARKETINGOWE } from "@/src/lib/constants";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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
  const { cart, user, removeFromCart } = useStore();

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
    md += `**Data:** ${today}\n\n---\n`;

    md +=
      "# Strefa Zdrowia w Twojej Firmie\n" +
      "### Profilaktyka bez wychodzenia z biura\n\n" +
      "Organizujemy profesjonalne badania i konsultacje medyczne bezpośrednio w siedzibie Twojej firmy. Nasz mobilny zespół medyczny tworzy szybkie i doskonale zorganizowane stanowiska diagnostyczne.\n\n" +
      "### Proces Realizacji\n" +
      "1. **Analiza:** Dobieramy odpowiednie moduły.\n" +
      "2. **Realizacja:** Przyjeżdżamy z pełnym sprzętem. Potrzebujemy tylko sali.\n" +
      "3. **Raport:** Indywidualne wyniki dla pracowników i anonimowy raport zbiorczy dla firmy.\n\n" +
      "> **Bezpieczeństwo:** Działamy zgodnie z RODO i tajemnicą medyczną.\n\n---\n";

    cart.forEach((item, index) => {
      const nazwa = item.usluga;
      const opisMarketingowy = getOpisMarketingowy(nazwa);
      const cleanLogistyka = item.logistyka.replace(/\n/g, "  \n");

      md += `# Opcja ${index + 1}: ${nazwa}\n${opisMarketingowy}\n\n### Parametry Finansowe\n`;

      if (item.abonament) {
        const mies = item.cenaPerCapita / 12;
        md += `> **Miesięczna inwestycja: ${mies.toFixed(
          2
        )} PLN / pracownika**\n`;
        md += `> *(Całkowity koszt roczny dla firmy: ${item.cenaBrutto.toFixed(
          2
        )} PLN)*\n\n`;
      } else {
        md += `> **Inwestycja Całkowita: ${item.cenaBrutto.toFixed(
          2
        )} PLN (zw. z VAT)**\n`;
        if (item.cenaRynkowaOsoba > 0) {
          md += `> *Sugerowana cena rynkowa: ~~${item.cenaRynkowaOsoba.toFixed(
            2
          )} PLN / osobę~~*\n`;
        }
        if (item.cenaPerCapita > 0) {
          md += `> *Nasza cena w pakiecie: **${item.cenaPerCapita.toFixed(
            2
          )} PLN / osobę***\n\n`;
        }
      }

      md += `### Parametry Realizacji\n${cleanLogistyka}\n\n`;

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
      if (item.abonament) {
        const mies = item.cenaPerCapita / 12;
        perCapitaStr = `${mies.toFixed(2)} PLN / msc`;
      } else if (item.cenaPerCapita > 0) {
        perCapitaStr = `${item.cenaPerCapita.toFixed(2)} PLN`;
      }
      md += `| ${item.usluga} | ${item.cenaBrutto.toFixed(
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
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="w-[40%] px-4 py-2 text-left font-medium text-slate-600">
                    Usługa
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600">
                    Cena (Brutto)
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600">
                    Cena za osobę
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600">
                    Marża %
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-slate-600">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {cart.map((item, index) => (
                  <tr key={`${item.usluga}-${index}`}>
                    <td className="force-wrap w-[40%] px-4 py-2 align-top text-slate-800">
                      {item.usluga}
                    </td>
                    <td className="px-4 py-2 align-top text-right text-slate-800">
                      {item.cenaBrutto.toFixed(2)} PLN
                    </td>
                    <td className="px-4 py-2 align-top text-right text-slate-800">
                      {item.cenaPerCapita > 0
                        ? `${item.cenaPerCapita.toFixed(2)} PLN`
                        : "-"}
                    </td>
                    <td className="px-4 py-2 align-top text-right text-slate-800">
                      {item.marzaProcent}
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
                ))}
              </tbody>
            </table>
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
        <CardContent>
        <Button
          onClick={generateMarkdown}
          disabled={!cart.length}
        >
          Generuj Prezentację (Markdown)
        </Button>

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
