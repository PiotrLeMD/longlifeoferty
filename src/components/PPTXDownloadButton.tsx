"use client";

import { useState } from "react";
import { Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generatePPTX, type PPTXHandlowiecData, type PPTXSelectedPackage } from "@/src/lib/pptxGenerator";

interface PPTXDownloadButtonProps {
  clientName: string;
  selectedPackages: PPTXSelectedPackage[];
  totalPrice: number;
  handlowiec: PPTXHandlowiecData;
  fileName?: string;
  className?: string;
  disabled?: boolean;
}

export function PPTXDownloadButton({
  clientName,
  selectedPackages,
  totalPrice,
  handlowiec,
  fileName = "oferta.pptx",
  className = "",
  disabled = false,
}: PPTXDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!selectedPackages.length || disabled) return;
    setLoading(true);
    try {
      const logoUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/long_logo.png`
          : "";
      await generatePPTX(
        selectedPackages,
        clientName,
        totalPrice,
        handlowiec,
        logoUrl,
        fileName
      );
      toast.success("Oferta PPTX pobrana pomyślnie!");
    } catch (err) {
      console.error(err);
      toast.error("Nie udało się wygenerować oferty PPTX.");
    } finally {
      setLoading(false);
    }
  };

  if (disabled) {
    return (
      <Button
        type="button"
        disabled
        variant="outline"
        className={`inline-flex items-center gap-2 opacity-50 ${className}`}
      >
        <Presentation className="size-4" />
        Pobierz Ofertę PPTX
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownload}
      disabled={loading}
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <Presentation className="size-4" />
      {loading ? "Generowanie..." : "Pobierz Ofertę PPTX"}
    </Button>
  );
}
