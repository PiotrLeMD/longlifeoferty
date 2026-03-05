"use client";

import { useState, useEffect } from "react";
import { Video } from "lucide-react";
import { WEBINARY_TEMATY } from "@/src/lib/constants";
import { useStore } from "@/src/store/useStore";
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

const OPTION_INNY = "Inny (wpisz poniżej)";

interface TopicItem {
  id: number;
  selected: string;
  custom: string;
}

function createTopicItem(id: number, selected?: string): TopicItem {
  return {
    id,
    selected: selected ?? WEBINARY_TEMATY[0] ?? "",
    custom: "",
  };
}

export default function WebinarsView() {
  const { addToCart } = useStore();
  const [numberOfMeetings, setNumberOfMeetings] = useState(1);
  const [pricePerMeeting, setPricePerMeeting] = useState(2500);
  const [topics, setTopics] = useState<TopicItem[]>([
    createTopicItem(0),
  ]);

  useEffect(() => {
    setTopics((prev) => {
      const next: TopicItem[] = [];
      for (let i = 0; i < numberOfMeetings; i++) {
        if (i < prev.length) {
          next.push(prev[i]);
        } else {
          next.push(createTopicItem(i));
        }
      }
      return next;
    });
  }, [numberOfMeetings]);

  const updateTopic = (index: number, field: "selected" | "custom", value: string) => {
    setTopics((prev) =>
      prev.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      )
    );
  };

  const resolvedTopics = topics.map((t) =>
    t.selected === OPTION_INNY ? t.custom : t.selected
  );

  const hasEmptyCustom = topics.some(
    (t) => t.selected === OPTION_INNY && !t.custom.trim()
  );

  const totalCena = numberOfMeetings * pricePerMeeting;
  const suggestedPrice = numberOfMeetings * 2500;

  const listaTematowStr = resolvedTopics
    .map((t, i) => `${i + 1}. ${t}`)
    .join("\n");

  const logistyka = `Forma: Online (Zdalnie)\nLiczba zaplanowanych spotkań: ${numberOfMeetings}\n\n**Harmonogram tematów:**\n${listaTematowStr}`;

  const tytulKoszyk =
    numberOfMeetings > 1
      ? `Pakiet Webinarów (${numberOfMeetings} spotkań)`
      : `Webinar: ${resolvedTopics[0] || ""}`;

  const handleAddToCart = () => {
    if (hasEmptyCustom) return;
    addToCart({
      usluga: tytulKoszyk,
      cenaBrutto: totalCena,
      cenaPerCapita: 0,
      cenaRynkowaOsoba: 0,
      marzaProcent: "100.0%",
      logistyka,
      abonament: false,
      harmonogram: null,
    });
    toast.success(`Dodano ${tytulKoszyk} do zestawienia!`);
  };

  const selectOptions = [...WEBINARY_TEMATY, OPTION_INNY];

  return (
    <div className="space-y-6">
      <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-800">
        <Video className="h-6 w-6 text-blue-600" />
        Webinary Edukacyjne i Szkolenia
      </h1>

      {/* Krok 1: Parametry ogólne */}
      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
          <CardTitle>Parametry ogólne</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Liczba zaplanowanych spotkań / godzin</Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={numberOfMeetings}
              onChange={(e) =>
                setNumberOfMeetings(
                  Math.min(20, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Cena za 1 spotkanie (PLN Brutto)</Label>
            <Input
              type="number"
              min={0}
              step={100}
              value={pricePerMeeting}
              onChange={(e) =>
                setPricePerMeeting(Math.max(0, parseFloat(e.target.value) || 0))
              }
            />
          </div>
        </div>
        </CardContent>
      </Card>

      {/* Krok 2: Wybór tematów */}
      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
          <CardTitle>📝 Przypisz tematy dla poszczególnych spotkań</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="space-y-4">
          {topics.map((topic, index) => (
            <div
              key={topic.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-start"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <Label className="shrink-0">Spotkanie {index + 1}:</Label>
                <Select
                  value={topic.selected}
                  onValueChange={(v) => updateTopic(index, "selected", v)}
                >
                  <SelectTrigger className="w-full sm:max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {topic.selected === OPTION_INNY && (
                <div className="w-full sm:max-w-xs space-y-2">
                  <Label>Własny temat</Label>
                  <Input
                    value={topic.custom}
                    onChange={(e) =>
                      updateTopic(index, "custom", e.target.value)
                    }
                    placeholder={`Wpisz własny temat dla spotkania ${index + 1}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        </CardContent>
      </Card>

      {/* Podsumowanie i metryki */}
      <Card className="shadow-sm transition-all duration-200">
        <CardHeader>
          <CardTitle>Podsumowanie</CardTitle>
        </CardHeader>
        <CardContent>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">
              Koszty Logistyki
            </p>
            <p className="text-xl font-semibold text-slate-800">
              0.00 PLN
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-amber-50/50 p-4">
            <p className="text-sm font-medium text-slate-600">
              Sugerowana Cena
            </p>
            <p className="text-xl font-semibold text-slate-800">
              {suggestedPrice.toFixed(2)} PLN
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-green-50/50 p-4">
            <p className="text-sm font-medium text-slate-600">
              Twoja Cena Końcowa
            </p>
            <p className="text-xl font-semibold text-slate-800">
              {totalCena.toFixed(2)} PLN
            </p>
          </div>
        </div>

        {hasEmptyCustom && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
            Wpisz brakujące tematy niestandardowe, aby kontynuować.
          </p>
        )}

        <Button
          onClick={handleAddToCart}
          disabled={hasEmptyCustom}
          size="lg"
          className="mt-6 w-full"
        >
          ➕ Dodaj Webinary do Oferty
        </Button>
        </CardContent>
      </Card>
    </div>
  );
}
